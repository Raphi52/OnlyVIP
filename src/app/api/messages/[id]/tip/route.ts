import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { spendCredits, getCreditBalance } from "@/lib/credits";
import { recordCreatorEarning } from "@/lib/commission";

// POST /api/messages/[id]/tip - Send a tip on a message using credits
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { amount } = body; // Amount in credits

    // Minimum tip is 100 credits ($1)
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Invalid tip amount (minimum 100 credits)" },
        { status: 400 }
      );
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            creatorSlug: true,
            participants: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is part of the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === userId
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can't tip your own message
    if (message.senderId === userId) {
      return NextResponse.json(
        { error: "Cannot tip your own message" },
        { status: 400 }
      );
    }

    // Check credit balance
    const balance = await getCreditBalance(userId);
    if (balance < amount) {
      return NextResponse.json(
        { error: "Insufficient credits", balance, required: amount },
        { status: 400 }
      );
    }

    // Spend credits
    const creditResult = await spendCredits(userId, amount, "TIP", {
      messageId,
      description: `Tip for message`,
    });

    // Create message payment record for tracking
    const [tipPayment, updatedMessage] = await prisma.$transaction([
      prisma.messagePayment.create({
        data: {
          messageId,
          userId,
          amount,
          type: "TIP",
          provider: "CREDITS",
          status: "COMPLETED",
        },
      }),
      // Increment the totalTips on the message (in credits now)
      prisma.message.update({
        where: { id: messageId },
        data: { totalTips: { increment: amount } },
      }),
    ]);

    // Record creator earning (commission applied)
    if (message.conversation.creatorSlug) {
      try {
        await recordCreatorEarning(
          message.conversation.creatorSlug,
          userId,
          amount,
          "TIP",
          messageId
        );
      } catch (earningError) {
        console.error("Failed to record creator earning:", earningError);
      }
    }

    return NextResponse.json({
      success: true,
      amount,
      newBalance: creditResult.newBalance,
    });
  } catch (error: any) {
    console.error("Error sending tip:", error);
    if (error.message === "Insufficient credits") {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to send tip" }, { status: 500 });
  }
}
