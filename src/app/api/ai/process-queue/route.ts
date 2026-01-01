import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";
import {
  generateAiResponse,
  parsePersonality,
  ConversationContext,
  makeMediaDecision,
  CreatorAiMediaSettings,
  MediaDecision,
} from "@/lib/ai-girlfriend";
import {
  checkForToneSwitch,
  switchPersonality,
} from "@/lib/ai-personality-selector";

// This endpoint should be called by a cron job every 30 seconds
// or can be triggered manually for testing

export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret key check for cron jobs
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, verify it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find pending responses that are ready to be sent
    const pendingResponses = await prisma.aiResponseQueue.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
      take: 10, // Process max 10 at a time
      orderBy: { scheduledAt: "asc" },
    });

    if (pendingResponses.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending responses" });
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const queueItem of pendingResponses) {
      try {
        // Mark as processing
        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: { status: "PROCESSING", attempts: { increment: 1 } },
        });

        // Get the original message
        const originalMessage = await prisma.message.findUnique({
          where: { id: queueItem.messageId },
          include: {
            sender: { select: { id: true, name: true } },
          },
        });

        if (!originalMessage) {
          throw new Error("Original message not found");
        }

        // Get conversation with AI personality assignment (including media settings)
        const conversation = await prisma.conversation.findUnique({
          where: { id: queueItem.conversationId },
          select: {
            id: true,
            aiPersonalityId: true,
            autoToneSwitch: true,
            aiMode: true,
            assignedChatterId: true,
            aiPersonality: {
              select: {
                id: true,
                name: true,
                personality: true,
                // Media settings from personality
                aiMediaEnabled: true,
                aiMediaFrequency: true,
                aiPPVRatio: true,
                aiTeasingEnabled: true,
              },
            },
          },
        });

        // Check if AI is disabled for this conversation
        if (conversation?.aiMode === "disabled") {
          console.log(`[AI] AI disabled for conversation ${queueItem.conversationId}`);
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "FAILED",
              error: "AI disabled for this conversation",
              processedAt: new Date(),
            },
          });
          results.push({ id: queueItem.id, status: "SKIPPED", error: "AI disabled" });
          continue;
        }

        // Check if AI is enabled for this conversation
        if (!conversation?.aiPersonalityId) {
          console.log(`[AI] No personality assigned to conversation ${queueItem.conversationId} - AI disabled`);
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "FAILED",
              error: "AI disabled - no personality assigned",
              processedAt: new Date(),
            },
          });
          results.push({ id: queueItem.id, status: "SKIPPED", error: "AI disabled" });
          continue;
        }

        // Check if mode is "assisted" - create suggestion instead of sending directly
        const isAssistedMode = conversation.aiMode === "assisted";

        // Get conversation context (last 20 messages for better coherence)
        const conversationMessages = await prisma.message.findMany({
          where: {
            conversationId: queueItem.conversationId,
            isDeleted: false,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: { select: { id: true, isCreator: true } },
          },
        });

        // Check for auto tone switch
        if (conversation.autoToneSwitch) {
          const messagesForTone = conversationMessages.map((m) => ({
            text: m.text,
            senderId: m.senderId,
          }));
          const newPersonalityId = await checkForToneSwitch(
            queueItem.conversationId,
            messagesForTone,
            originalMessage.senderId
          );

          if (newPersonalityId && newPersonalityId !== conversation.aiPersonalityId) {
            console.log(`[AI] Auto-switching personality from ${conversation.aiPersonalityId} to ${newPersonalityId}`);
            await switchPersonality(
              queueItem.conversationId,
              newPersonalityId,
              "auto_tone",
              { detectedTone: conversation.aiPersonality?.name }
            );
            // Refresh conversation personality (including media settings)
            const updatedConv = await prisma.conversation.findUnique({
              where: { id: queueItem.conversationId },
              select: {
                aiPersonality: {
                  select: {
                    id: true,
                    name: true,
                    personality: true,
                    aiMediaEnabled: true,
                    aiMediaFrequency: true,
                    aiPPVRatio: true,
                    aiTeasingEnabled: true,
                  },
                },
              },
            });
            if (updatedConv?.aiPersonality) {
              conversation.aiPersonality = updatedConv.aiPersonality;
            }
          }
        }

        // Get creator info
        const creator = await prisma.creator.findUnique({
          where: { slug: queueItem.creatorSlug },
          select: {
            userId: true,
            displayName: true,
          },
        });

        if (!creator || !creator.userId) {
          throw new Error("Creator not found or has no user account");
        }

        // Parse personality from AgencyAiPersonality
        const personality = parsePersonality(conversation.aiPersonality?.personality || null);
        console.log(`[AI] Using personality: ${conversation.aiPersonality?.name || "default"}`);

        // Build AI media settings from personality (with fallback defaults)
        const aiPersonality = conversation.aiPersonality;
        const mediaSettings: CreatorAiMediaSettings = {
          aiMediaEnabled: aiPersonality?.aiMediaEnabled ?? true,
          aiMediaFrequency: aiPersonality?.aiMediaFrequency ?? 4,
          aiPPVRatio: aiPersonality?.aiPPVRatio ?? 30,
          aiTeasingEnabled: aiPersonality?.aiTeasingEnabled ?? true,
        };
        console.log(`[AI] Media settings for ${conversation.aiPersonality?.name}:`, mediaSettings);

        // Build conversation context for AI
        const context: ConversationContext = {
          messages: conversationMessages
            .reverse()
            .map((msg) => ({
              role: msg.sender.isCreator ? "assistant" : "user",
              content: msg.text || "[media]",
            })) as ConversationContext["messages"],
          userName: originalMessage.sender.name || undefined,
        };

        // Make intelligent media decision
        const mediaDecision: MediaDecision = await makeMediaDecision(
          queueItem.creatorSlug,
          creator.userId,
          queueItem.conversationId,
          originalMessage.text || "",
          mediaSettings,
          personality
        );

        console.log(`[AI] Media decision for ${queueItem.messageId}:`, {
          shouldSend: mediaDecision.shouldSend,
          type: mediaDecision.type,
          mediaId: mediaDecision.media?.id,
        });

        // Build media context for AI response generation
        let suggestedMediaForAI = null;
        if (mediaDecision.shouldSend && mediaDecision.media && mediaDecision.type !== "TEASE") {
          // For FREE and PPV, pass media info to AI
          suggestedMediaForAI = {
            id: mediaDecision.media.id,
            title: mediaDecision.media.title,
            type: mediaDecision.media.type,
            price: mediaDecision.media.ppvPriceCredits ? mediaDecision.media.ppvPriceCredits / 100 : null,
            thumbnailUrl: mediaDecision.media.thumbnailUrl,
            tagPPV: mediaDecision.media.tagPPV,
            ppvPriceCredits: mediaDecision.media.ppvPriceCredits,
          };
        }

        // Generate AI response
        // If TEASE, we'll use the teaser text as part of the response
        let responseText: string;
        if (mediaDecision.type === "TEASE" && mediaDecision.teaseText) {
          // For teasing, generate a response that incorporates the tease
          responseText = mediaDecision.teaseText;
        } else {
          responseText = await generateAiResponse(context, personality, suggestedMediaForAI);
        }

        // Determine if this message should be PPV and the price
        const shouldBePPV = mediaDecision.type === "PPV" && mediaDecision.media !== null;
        const ppvPrice = shouldBePPV && mediaDecision.media?.ppvPriceCredits
          ? mediaDecision.media.ppvPriceCredits / 100 // Convert credits to price
          : null;

        // ===== ASSISTED MODE: Create suggestion instead of sending =====
        if (isAssistedMode) {
          // Create an AI suggestion that waits for chatter approval
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

          await prisma.aiSuggestion.create({
            data: {
              conversationId: queueItem.conversationId,
              content: responseText,
              mediaDecision: mediaDecision.type,
              mediaId: mediaDecision.media?.id || null,
              personalityId: conversation.aiPersonalityId!,
              status: "pending",
              expiresAt,
            },
          });

          // Mark queue as completed (suggestion created)
          await prisma.aiResponseQueue.update({
            where: { id: queueItem.id },
            data: {
              status: "COMPLETED",
              response: responseText,
              mediaId: mediaDecision.media?.id || null,
              shouldSendMedia: mediaDecision.shouldSend,
              mediaDecision: mediaDecision.type,
              teaseText: mediaDecision.teaseText,
              processedAt: new Date(),
            },
          });

          results.push({ id: queueItem.id, status: "SUGGESTION_CREATED" });
          console.log(`[AI] Created suggestion for message ${queueItem.messageId} (assisted mode)`);
          continue;
        }

        // ===== AUTO MODE: Send message directly =====
        // Create the response message as the creator
        const aiMessage = await prisma.message.create({
          data: {
            conversationId: queueItem.conversationId,
            senderId: creator.userId,
            receiverId: originalMessage.senderId,
            text: responseText,
            // AI personality attribution
            aiPersonalityId: conversation.aiPersonalityId,
            isAiGenerated: true,
            // Only set PPV for actual PPV media, not for free or tease
            isPPV: shouldBePPV,
            ppvPrice: ppvPrice,
            ppvUnlockedBy: "[]",
            // Attach media for FREE and PPV (not TEASE)
            media: (mediaDecision.type === "FREE" || mediaDecision.type === "PPV") && mediaDecision.media
              ? {
                  create: {
                    type: mediaDecision.media.type,
                    url: shouldBePPV
                      ? (mediaDecision.media.previewUrl || mediaDecision.media.thumbnailUrl || "/placeholder-ppv.jpg")
                      : mediaDecision.media.contentUrl,
                    previewUrl: mediaDecision.media.previewUrl || mediaDecision.media.thumbnailUrl,
                    mediaId: mediaDecision.media.id,
                  },
                }
              : undefined,
          },
          include: {
            media: true,
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: queueItem.conversationId },
          data: { updatedAt: new Date() },
        });

        // Update creator's last active time
        await prisma.creator.update({
          where: { slug: queueItem.creatorSlug },
          data: { aiLastActive: new Date() },
        });

        // Trigger real-time notification
        const transformedMessage = {
          id: aiMessage.id,
          text: aiMessage.text,
          senderId: aiMessage.senderId,
          receiverId: aiMessage.receiverId,
          isPPV: aiMessage.isPPV,
          ppvPrice: aiMessage.ppvPrice ? Number(aiMessage.ppvPrice) : null,
          isUnlocked: false,
          ppvUnlockedBy: [],
          totalTips: 0,
          isRead: false,
          media: aiMessage.media.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            previewUrl: m.previewUrl,
          })),
          createdAt: aiMessage.createdAt,
        };

        await triggerNewMessage(queueItem.conversationId, transformedMessage);

        // Mark as completed with media decision info
        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: {
            status: "COMPLETED",
            response: responseText,
            mediaId: mediaDecision.media?.id || null,
            shouldSendMedia: mediaDecision.shouldSend,
            mediaDecision: mediaDecision.type,
            teaseText: mediaDecision.teaseText,
            processedAt: new Date(),
          },
        });

        results.push({ id: queueItem.id, status: "COMPLETED" });
        console.log(`[AI] Sent response for message ${queueItem.messageId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[AI] Error processing queue item ${queueItem.id}:`, error);

        // Check if we should retry or fail
        const shouldRetry = queueItem.attempts < queueItem.maxAttempts;

        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: {
            status: shouldRetry ? "PENDING" : "FAILED",
            error: errorMessage,
            // If retrying, schedule for 1 minute later
            scheduledAt: shouldRetry ? new Date(Date.now() + 60000) : undefined,
          },
        });

        results.push({
          id: queueItem.id,
          status: shouldRetry ? "RETRY" : "FAILED",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[AI] Queue processing error:", error);
    return NextResponse.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}

// POST endpoint for testing with a specific message
export async function POST(request: NextRequest) {
  try {
    const { messageId, creatorSlug, conversationId } = await request.json();

    if (!messageId || !creatorSlug || !conversationId) {
      return NextResponse.json(
        { error: "messageId, creatorSlug, and conversationId are required" },
        { status: 400 }
      );
    }

    // Create a queue entry with immediate execution
    await prisma.aiResponseQueue.create({
      data: {
        messageId,
        conversationId,
        creatorSlug,
        scheduledAt: new Date(), // Execute immediately
        status: "PENDING",
      },
    });

    // Process immediately
    const result = await fetch(request.url, { method: "GET" });
    return result;
  } catch (error) {
    console.error("[AI] Test trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger test" },
      { status: 500 }
    );
  }
}
