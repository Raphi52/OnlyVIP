import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateFlirtyResponse, getRandomFallback } from "@/lib/ai-chat";

// POST /api/conversations/[id]/ai-suggest - Get AI suggestion for reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const isCreator = (session.user as any)?.isCreator;

    // Only creators can use AI suggestions
    if (!isCreator) {
      return NextResponse.json(
        { error: "Only creators can use AI suggestions" },
        { status: 403 }
      );
    }

    // Get creator info
    const creator = await prisma.creator.findFirst({
      where: { userId },
      select: { displayName: true },
    });

    const creatorName = creator?.displayName || "Creator";

    // Get conversation and verify user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized for this conversation" },
        { status: 403 }
      );
    }

    // Get recent messages for context
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        text: true,
        senderId: true,
        createdAt: true,
      },
    });

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    // Format for AI
    const chatHistory = chronologicalMessages
      .filter((m) => m.text)
      .map((m) => ({
        id: m.id,
        text: m.text!,
        isFromUser: m.senderId !== userId, // From user's perspective (creator), user messages are from the other person
      }));

    // Get the last message from the other person
    const lastUserMessage = chatHistory.filter((m) => m.isFromUser).pop();

    if (!lastUserMessage) {
      return NextResponse.json({
        suggestion: getRandomFallback(),
      });
    }

    try {
      const suggestion = await generateFlirtyResponse(
        lastUserMessage.text,
        chatHistory,
        creatorName
      );

      return NextResponse.json({ suggestion });
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      // Return fallback response
      return NextResponse.json({
        suggestion: getRandomFallback(),
      });
    }
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
