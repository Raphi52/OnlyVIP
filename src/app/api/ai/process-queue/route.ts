import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";
import {
  generateAiResponse,
  selectRelevantMedia,
  parsePersonality,
  ConversationContext,
} from "@/lib/ai-girlfriend";

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

        // Get creator info
        const creator = await prisma.creator.findUnique({
          where: { slug: queueItem.creatorSlug },
          select: {
            userId: true,
            aiPersonality: true,
            displayName: true,
          },
        });

        if (!creator || !creator.userId) {
          throw new Error("Creator not found or has no user account");
        }

        // Parse personality
        const personality = parsePersonality(creator.aiPersonality);

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

        // Select relevant media to suggest
        const suggestedMedia = await selectRelevantMedia(
          queueItem.creatorSlug,
          originalMessage.text || "",
          personality
        );

        // Generate AI response
        const responseText = await generateAiResponse(context, personality, suggestedMedia);

        // Create the response message as the creator
        const aiMessage = await prisma.message.create({
          data: {
            conversationId: queueItem.conversationId,
            senderId: creator.userId,
            receiverId: originalMessage.senderId,
            text: responseText,
            // If we have media to suggest, make it a PPV message
            isPPV: suggestedMedia !== null,
            ppvPrice: suggestedMedia?.price || null,
            ppvUnlockedBy: "[]",
            media: suggestedMedia
              ? {
                  create: {
                    type: suggestedMedia.type,
                    url: suggestedMedia.thumbnailUrl || "/placeholder-ppv.jpg",
                    previewUrl: suggestedMedia.thumbnailUrl,
                    mediaId: suggestedMedia.id,
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

        // Mark as completed
        await prisma.aiResponseQueue.update({
          where: { id: queueItem.id },
          data: {
            status: "COMPLETED",
            response: responseText,
            mediaId: suggestedMedia?.id || null,
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
