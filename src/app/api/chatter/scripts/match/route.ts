import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { detectIntent } from "@/lib/scripts/intent-detector";
import { matchScript } from "@/lib/scripts/script-matcher";
import { parseScriptVariables } from "@/lib/scripts/variables";

/**
 * GET /api/chatter/scripts/match
 * Find the best matching script for a message in a conversation
 *
 * Query params:
 * - conversationId: string (required)
 * - message: string (required) - The fan message to match against
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const message = searchParams.get("message");

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Conversation ID and message are required" },
        { status: 400 }
      );
    }

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        creator: {
          select: {
            slug: true,
            displayName: true,
            agencyId: true,
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

    // Verify chatter has access
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

    // Find fan participant
    const fanParticipant = conversation.participants.find(
      (p) => p.userId !== conversation.creatorSlug
    );

    // Get fan profile for additional context
    const fanProfile = fanParticipant
      ? await prisma.fanProfile.findUnique({
          where: {
            fanUserId_creatorSlug: {
              fanUserId: fanParticipant.userId,
              creatorSlug: conversation.creatorSlug,
            },
          },
          select: {
            spendingTier: true,
            language: true,
            totalSpent: true,
          },
        })
      : null;

    // Detect intent
    const detected = detectIntent(message);

    // Match script
    const matched = await matchScript({
      message,
      creatorSlug: conversation.creatorSlug,
      agencyId: conversation.creator?.agencyId || "",
      fanName: fanParticipant?.user?.name || undefined,
      fanStage: fanProfile?.spendingTier as any || undefined,
      language: fanProfile?.language || "fr",
    });

    if (!matched) {
      return NextResponse.json({
        script: null,
        intent: detected.intent,
        confidence: 0,
      });
    }

    // Parse variables in the content
    const parsedContent = parseScriptVariables(matched.script.content, {
      fanName: fanParticipant?.user?.name || "babe",
      creatorName: conversation.creator?.displayName || "me",
      ppvPrice: matched.script.suggestedPrice || 15,
    });

    // Check if script has follow-up scripts
    const hasNextScript = !!(
      matched.script.nextScriptOnSuccess ||
      matched.script.nextScriptOnReject
    );

    return NextResponse.json({
      script: {
        id: matched.script.id,
        name: matched.script.name,
        content: matched.script.content,
        category: matched.script.category,
        intent: matched.script.intent,
        suggestedPrice: matched.script.suggestedPrice,
        hasNextScript,
      },
      parsedContent,
      intent: matched.intent,
      confidence: matched.confidence,
      matchReason: matched.matchReason,
      strategy: matched.strategy,
    });
  } catch (error) {
    console.error("Error matching script:", error);
    return NextResponse.json(
      { error: "Failed to match script" },
      { status: 500 }
    );
  }
}
