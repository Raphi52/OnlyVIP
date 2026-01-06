import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { matchScript, ConversationMatchContext } from "@/lib/scripts/script-matcher";

/**
 * POST /api/agency/scripts/match
 * Match scripts based on conversation context
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate (chatter or agency owner)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const isChatter = user.role === "CHATTER";

    if (!isChatter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chatter's agency ID
    const chatter = await prisma.chatter.findUnique({
      where: { id: user.chatterId },
      select: { agencyId: true },
    });

    if (!chatter?.agencyId) {
      return NextResponse.json({ error: "Chatter not linked to agency" }, { status: 401 });
    }

    const agencyId = chatter.agencyId;

    const body = await request.json();
    const {
      message,
      creatorSlug,
      fanName,
      fanCredits,
      fanStage,
      creatorName,
      language,
      conversationHistory,
      ppvPrice,
    } = body;

    if (!message || !creatorSlug) {
      return NextResponse.json(
        { error: "message and creatorSlug are required" },
        { status: 400 }
      );
    }

    // Build match context
    const context: ConversationMatchContext = {
      message,
      creatorSlug,
      agencyId,
      fanName,
      fanCredits,
      fanStage,
      creatorName,
      language: language || "fr",
      conversationHistory,
      ppvPrice,
    };

    // Find matching script
    const matchedScript = await matchScript(context);

    if (!matchedScript) {
      return NextResponse.json({
        matched: false,
        message: "No matching script found",
      });
    }

    return NextResponse.json({
      matched: true,
      script: matchedScript.script,
      confidence: matchedScript.confidence,
      intent: matchedScript.intent,
      strategy: matchedScript.strategy,
      parsedContent: matchedScript.parsedContent,
      matchReason: matchedScript.matchReason,
    });
  } catch (error) {
    console.error("Error matching script:", error);
    return NextResponse.json(
      { error: "Failed to match script" },
      { status: 500 }
    );
  }
}
