import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { spendCredits, getCreditBalance, hasEnoughCredits } from "@/lib/credits";

// Platform takes 5% commission
const PLATFORM_FEE_RATE = 0.05;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    // Fetch media
    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (!media.tagPPV) {
      return NextResponse.json({ error: "This content is not available for purchase" }, { status: 400 });
    }

    // Check if already purchased
    const existingPurchase = await prisma.mediaPurchase.findFirst({
      where: {
        userId: session.user.id,
        mediaId: mediaId,
      },
    });

    if (existingPurchase) {
      // Return current balance
      const balance = await getCreditBalance(session.user.id);
      return NextResponse.json({
        success: true,
        alreadyPurchased: true,
        newBalance: balance,
      });
    }

    const price = media.ppvPriceCredits || 100;

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(session.user.id, price);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Deduct credits from buyer using spendCredits
    let spendResult;
    try {
      spendResult = await spendCredits(
        session.user.id,
        price,
        "PPV",
        {
          description: `PPV unlock: ${media.title}`,
          mediaId,
        }
      );
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 400 }
      );
    }

    // Create purchase record
    await prisma.mediaPurchase.create({
      data: {
        userId: session.user.id,
        mediaId: mediaId,
        amount: price,
        provider: "CREDITS",
        status: "COMPLETED",
      },
    });

    // Credit the creator (minus platform fee)
    const creator = await prisma.creator.findUnique({
      where: { slug: media.creatorSlug },
      select: { userId: true },
    });

    if (creator?.userId) {
      const creatorShare = Math.floor(price * (1 - PLATFORM_FEE_RATE));

      // Add credits to creator's balance
      const updatedCreator = await prisma.user.update({
        where: { id: creator.userId },
        data: {
          creditBalance: { increment: creatorShare },
          paidCredits: { increment: creatorShare },
        },
        select: { creditBalance: true },
      });

      // Record creator earnings transaction
      await prisma.creditTransaction.create({
        data: {
          userId: creator.userId,
          amount: creatorShare,
          balance: updatedCreator.creditBalance || 0,
          type: "PURCHASE",
          description: `PPV sale: ${media.title}`,
          mediaId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      newBalance: spendResult.newBalance,
    });
  } catch (error) {
    console.error("Error unlocking PPV:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
