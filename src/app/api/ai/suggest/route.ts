import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateFlirtyResponse, getRandomFallback } from "@/lib/ai-chat";
import prisma from "@/lib/prisma";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return !!token?.value;
}

// POST /api/ai/suggest - Get AI suggestion for a response
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, userMessage } = body;

    if (!userMessage) {
      return NextResponse.json(
        { error: "User message required" },
        { status: 400 }
      );
    }

    // Get conversation history for context
    let chatHistory: { id: string; text: string; isFromUser: boolean }[] = [];

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 20,
        select: {
          id: true,
          text: true,
          senderId: true,
        },
      });

      // Get the user ID from conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            where: {
              userId: { not: "admin" },
            },
          },
        },
      });

      const fanUserId = conversation?.participants[0]?.userId;

      chatHistory = messages
        .filter((m) => m.text)
        .map((m) => ({
          id: m.id,
          text: m.text!,
          isFromUser: m.senderId === fanUserId,
        }));
    }

    try {
      const suggestion = await generateFlirtyResponse(userMessage, chatHistory);
      return NextResponse.json({ suggestion });
    } catch (error) {
      // Return fallback if AI fails
      console.error("AI error, using fallback:", error);
      return NextResponse.json({ suggestion: getRandomFallback() });
    }
  } catch (error) {
    console.error("Suggest API error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
