import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateAiResponse,
  AiPersonality,
  DEFAULT_PERSONALITY,
  ConversationContext,
} from "@/lib/ai-girlfriend";

// POST /api/ai/test - Test AI response generation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { personality, testMessage } = body;

    if (!testMessage) {
      return NextResponse.json(
        { error: "testMessage is required" },
        { status: 400 }
      );
    }

    // Merge provided personality with defaults
    const aiPersonality: AiPersonality = {
      ...DEFAULT_PERSONALITY,
      ...personality,
    };

    // Create a simple conversation context with just the test message
    const context: ConversationContext = {
      messages: [
        {
          role: "user",
          content: testMessage,
        },
      ],
      userName: "Fan",
    };

    // Generate response (no media suggestion for test)
    const response = await generateAiResponse(context, aiPersonality, null);

    return NextResponse.json({
      response,
      personality: aiPersonality,
    });
  } catch (error) {
    console.error("[AI Test] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate test response" },
      { status: 500 }
    );
  }
}
