import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { spendCredits, getCreditBalances } from "@/lib/credits";
import { recordEarningDistribution } from "@/lib/commission";

// POST /api/messages/[id]/unlock - Unlock PPV message content using credits
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

    // Get the message with media and source content
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            creatorSlug: true,
            participants: true,
          },
        },
        media: {
          include: {
            media: {
              select: {
                contentUrl: true,
              },
            },
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

    // Check if message has PPV content
    if (!message.isPPV || !message.ppvPrice) {
      return NextResponse.json(
        { error: "This message is not pay-per-view" },
        { status: 400 }
      );
    }

    // Check if already unlocked
    const existingPayment = await prisma.messagePayment.findFirst({
      where: {
        messageId,
        userId,
        status: "COMPLETED",
      },
    });

    if (existingPayment) {
      // Return unlocked media
      const unlockedMedia = message.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.media?.contentUrl || m.url,
        previewUrl: m.previewUrl,
      }));
      return NextResponse.json({
        success: true,
        unlocked: true,
        alreadyUnlocked: true,
        media: unlockedMedia,
      });
    }

    // ppvPrice is now in credits
    const priceInCredits = message.ppvPrice;

    // Check PAID credit balance - PPV messages require paid credits only
    const balances = await getCreditBalances(userId);
    if (balances.paid < priceInCredits) {
      return NextResponse.json(
        { error: "Insufficient paid credits", balance: balances.paid, required: priceInCredits },
        { status: 400 }
      );
    }

    // Spend PAID credits only - PPV messages cannot use bonus credits
    const creditResult = await spendCredits(userId, priceInCredits, "PPV", {
      allowBonus: false, // Chat PPV messages = paid credits only
      messageId,
      description: `PPV unlock for message`,
    });

    // Parse current unlocked users
    const currentUnlockedBy: string[] = JSON.parse(message.ppvUnlockedBy || "[]");

    // Add user to unlocked list if not already there
    if (!currentUnlockedBy.includes(userId)) {
      currentUnlockedBy.push(userId);
    }

    // Create message payment record and update unlock list
    const [messagePayment, updatedMessage] = await prisma.$transaction([
      prisma.messagePayment.create({
        data: {
          messageId,
          userId,
          amount: priceInCredits,
          type: "PPV_UNLOCK",
          provider: "CREDITS",
          status: "COMPLETED",
        },
      }),
      // Update the message's ppvUnlockedBy array
      prisma.message.update({
        where: { id: messageId },
        data: { ppvUnlockedBy: JSON.stringify(currentUnlockedBy) },
      }),
    ]);

    // Record earning distribution (creator, agency, chatter)
    // Attribution: the PPV message itself has the chatter/AI info
    if (message.conversation.creatorSlug && creditResult.paidSpent > 0) {
      try {
        await recordEarningDistribution({
          creatorSlug: message.conversation.creatorSlug,
          userId,
          paidCreditsSpent: creditResult.paidSpent,
          type: "PPV",
          sourceId: messageId,
          chatterId: message.chatterId,
          aiPersonalityId: message.aiPersonalityId,
          attributedMessageId: messageId,
        });
      } catch (earningError) {
        console.error("Failed to record earning distribution:", earningError);
      }
    }

    // Return unlocked media with actual content URLs
    const unlockedMedia = message.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.media?.contentUrl || m.url,
      previewUrl: m.previewUrl,
    }));

    return NextResponse.json({
      success: true,
      unlocked: true,
      newBalance: creditResult.newBalance,
      media: unlockedMedia,
    });
  } catch (error: any) {
    console.error("Error unlocking PPV:", error);
    if (error.message === "Insufficient credits") {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to unlock content" },
      { status: 500 }
    );
  }
}
