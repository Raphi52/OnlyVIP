import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { shouldChargeForAi, hasCreditsForAi, chargeAiSuggestion } from "@/lib/chatter/billing";
import { generateHumanResponse, type GeneratorResult } from "@/lib/ai/generator";
import { matchScript, type MatchedScript } from "@/lib/scripts/script-matcher";
import { detectIntent } from "@/lib/scripts/intent-detector";

/**
 * POST /api/chatter/ai-suggest
 * Generate an AI suggestion for a conversation
 *
 * Body:
 * - conversationId: string (required)
 * - tone?: string (optional) - "flirty" | "romantic" | "playful" | "explicit" | "casual"
 * - regenerate?: boolean (optional) - Force regeneration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { conversationId, tone, regenerate } = body as {
      conversationId: string;
      tone?: string;
      regenerate?: boolean;
    };

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Get conversation with recent messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            text: true,
            senderId: true,
            createdAt: true,
          },
        },
        aiPersonality: {
          select: {
            id: true,
            name: true,
            agencyId: true,
          },
        },
        creator: {
          select: {
            slug: true,
            displayName: true,
            aiProvider: true,
            aiModel: true,
            aiApiKey: true,
            aiUseCustomKey: true,
            agencyId: true,
            agency: {
              select: {
                id: true,
                aiProvider: true,
                aiModel: true,
                aiApiKey: true,
                aiUseCustomKey: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify chatter has access to this creator
    const hasAccess = await prisma.chatterCreatorAssignment.findFirst({
      where: {
        chatterId,
        creatorSlug: conversation.creatorSlug,
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Check billing status
    const billingCheck = await hasCreditsForAi(conversation.creatorSlug);

    if (!billingCheck.hasCredits) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          needsCredits: true,
          billing: billingCheck.billing,
        },
        { status: 402 }
      );
    }

    // Get last fan message
    const lastFanMessage = conversation.messages.find(
      (m) => m.senderId !== conversation.creatorSlug && m.text
    );

    if (!lastFanMessage?.text) {
      return NextResponse.json(
        { error: "No fan message to respond to" },
        { status: 400 }
      );
    }

    // Find fan participant
    const fanParticipant = conversation.participants.find(
      (p) => p.userId !== conversation.creatorSlug
    );

    // Detect intent and match script
    const detected = detectIntent(lastFanMessage.text);
    let matchedScript: MatchedScript | null = null;

    if (conversation.creator?.agencyId) {
      matchedScript = await matchScript({
        message: lastFanMessage.text,
        creatorSlug: conversation.creatorSlug,
        agencyId: conversation.creator.agencyId,
        fanName: fanParticipant?.user?.name || undefined,
        language: "fr", // TODO: detect language
      });
    }

    // Determine AI provider settings
    const creator = conversation.creator;
    const agency = creator?.agency;

    const useCustomKey =
      (creator?.aiUseCustomKey && creator?.aiApiKey) ||
      (agency?.aiUseCustomKey && agency?.aiApiKey);

    const provider = creator?.aiProvider || agency?.aiProvider || "anthropic";
    const model = creator?.aiModel || agency?.aiModel || "claude-3-5-haiku-20241022";
    const apiKey = useCustomKey
      ? (creator?.aiApiKey || agency?.aiApiKey)
      : null;

    // Generate suggestion using AI
    let generatorResult: GeneratorResult;
    try {
      generatorResult = await generateHumanResponse({
        conversationId,
        fanUserId: fanParticipant?.userId || "",
        creatorSlug: conversation.creatorSlug,
        currentMessage: lastFanMessage.text,
        personalityId: conversation.aiPersonalityId || undefined,
        language: "fr",
        provider: provider as any,
        model,
        apiKey,
        agencyId: conversation.creator?.agencyId || undefined,
      });
    } catch (genError) {
      console.error("Error generating AI response:", genError);
      return NextResponse.json(
        { error: "Failed to generate AI suggestion" },
        { status: 500 }
      );
    }

    // Get or create AI personality for suggestion
    let personalityId = conversation.aiPersonalityId;

    if (!personalityId) {
      // Try to get default personality for this creator
      const defaultPersonality = await prisma.creatorAiPersonality.findFirst({
        where: {
          creatorSlug: conversation.creatorSlug,
          isActive: true,
        },
        select: { id: true },
      });
      personalityId = defaultPersonality?.id || null;
    }

    if (!personalityId) {
      return NextResponse.json(
        { error: "No AI personality configured for this creator" },
        { status: 400 }
      );
    }

    // Create pending suggestion
    const suggestion = await prisma.aiSuggestion.create({
      data: {
        conversationId,
        content: generatorResult.text,
        mediaDecision: generatorResult.shouldSendMedia
          ? (generatorResult.selectedMedia?.isFree === false ? "PPV" : "FREE")
          : "NONE",
        mediaId: generatorResult.selectedMedia?.id || null,
        personalityId,
        status: "pending",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
      },
      include: {
        personality: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      suggestion: {
        id: suggestion.id,
        content: suggestion.content,
        mediaDecision: suggestion.mediaDecision,
        mediaId: suggestion.mediaId,
        expiresAt: suggestion.expiresAt,
        personality: suggestion.personality,
      },
      matchedScript: matchedScript
        ? {
            id: matchedScript.script.id,
            name: matchedScript.script.name,
            confidence: matchedScript.confidence,
            intent: matchedScript.intent,
          }
        : null,
      intent: detected.intent,
      billing: {
        willCharge: billingCheck.billing.shouldCharge,
        usingCustomKey: billingCheck.billing.hasCustomKey,
        balance: billingCheck.billing.balance,
        costPerSuggestion: billingCheck.billing.costPerSuggestion,
      },
    });
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chatter/ai-suggest
 * Send or reject a suggestion
 *
 * Body:
 * - suggestionId: string (required)
 * - action: "send" | "edit" | "reject" (required)
 * - editedContent?: string (required if action is "edit")
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { suggestionId, action, editedContent } = body as {
      suggestionId: string;
      action: "send" | "edit" | "reject";
      editedContent?: string;
    };

    if (!suggestionId || !action) {
      return NextResponse.json(
        { error: "Suggestion ID and action are required" },
        { status: 400 }
      );
    }

    // Get suggestion
    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        conversation: {
          include: {
            participants: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (suggestion.status !== "pending") {
      return NextResponse.json(
        { error: "Suggestion already processed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > suggestion.expiresAt) {
      await prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Suggestion has expired" },
        { status: 400 }
      );
    }

    // Verify chatter has access
    const hasAccess = await prisma.chatterCreatorAssignment.findFirst({
      where: {
        chatterId,
        creatorSlug: suggestion.conversation.creatorSlug,
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Handle action
    if (action === "reject") {
      await prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: { status: "rejected" },
      });

      return NextResponse.json({ success: true, status: "rejected" });
    }

    // For send or edit, charge credits if needed
    const chargeResult = await chargeAiSuggestion(
      suggestion.conversation.creatorSlug,
      {
        chatterId,
        suggestionId,
        conversationId: suggestion.conversationId,
      }
    );

    if (!chargeResult.success) {
      return NextResponse.json(
        {
          error: chargeResult.error || "Failed to charge credits",
          needsCredits: true,
        },
        { status: 402 }
      );
    }

    // Determine final content
    const finalContent = action === "edit" && editedContent
      ? editedContent
      : suggestion.content;

    // Find the fan (receiver) from participants
    const fanParticipant = suggestion.conversation.participants.find(
      (p) => p.userId !== suggestion.conversation.creatorSlug
    );

    if (!fanParticipant) {
      return NextResponse.json(
        { error: "Fan not found in conversation" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: suggestion.conversationId,
        senderId: suggestion.conversation.creatorSlug,
        receiverId: fanParticipant.userId,
        text: finalContent,
        isAiGenerated: true,
        chatterId,
      },
    });

    // Update suggestion
    await prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action === "edit" ? "edited" : "sent",
        editedContent: action === "edit" ? editedContent : null,
        sentById: chatterId,
        sentAt: new Date(),
        messageId: message.id,
        chargedCredits: chargeResult.charged ? 1 : 0,
        chargedAt: chargeResult.charged ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      status: action === "edit" ? "edited" : "sent",
      message: {
        id: message.id,
        text: message.text,
      },
      charged: chargeResult.charged,
      newBalance: chargeResult.newBalance,
    });
  } catch (error) {
    console.error("Error processing suggestion:", error);
    return NextResponse.json(
      { error: "Failed to process suggestion" },
      { status: 500 }
    );
  }
}
