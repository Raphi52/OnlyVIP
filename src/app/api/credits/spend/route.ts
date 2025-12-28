import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  spendCredits,
  getCreditBalance,
  hasEnoughCredits,
  CreditTransactionType,
} from "@/lib/credits";
import { recordCreatorEarning } from "@/lib/commission";
import prisma from "@/lib/prisma";

// POST /api/credits/spend - Spend credits on media, PPV, or tips
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    let { amount, type, mediaId, messageId, description } = body;

    // Validate type
    const validTypes: CreditTransactionType[] = [
      "MEDIA_UNLOCK",
      "PPV",
      "TIP",
    ];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // For MEDIA_UNLOCK, get the price from the media if not provided
    if (type === "MEDIA_UNLOCK" && mediaId && !amount) {
      const media = await prisma.mediaContent.findUnique({
        where: { id: mediaId },
        select: { ppvPriceCredits: true, tagPPV: true },
      });

      if (!media) {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        );
      }

      if (!media.tagPPV) {
        return NextResponse.json(
          { error: "Media is not PPV" },
          { status: 400 }
        );
      }

      amount = media.ppvPriceCredits || 1000; // Default to 1000 if not set
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check balance
    const currentBalance = await getCreditBalance(userId);
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: currentBalance,
          required: amount,
        },
        { status: 400 }
      );
    }

    // For media unlock, verify media exists and create purchase record
    if (type === "MEDIA_UNLOCK" && mediaId) {
      const media = await prisma.mediaContent.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        return NextResponse.json(
          { error: "Media not found" },
          { status: 404 }
        );
      }

      // Check if already purchased
      const existingPurchase = await prisma.mediaPurchase.findUnique({
        where: {
          userId_mediaId: {
            userId,
            mediaId,
          },
        },
      });

      if (existingPurchase) {
        return NextResponse.json(
          { error: "Media already unlocked" },
          { status: 400 }
        );
      }
    }

    // Spend credits
    const result = await spendCredits(userId, amount, type, {
      description: description || `${type}: ${amount} credits`,
      mediaId,
      messageId,
    });

    // Create additional records based on type
    if (type === "MEDIA_UNLOCK" && mediaId) {
      // Get media with creatorSlug for earning tracking
      const mediaForEarning = await prisma.mediaContent.findUnique({
        where: { id: mediaId },
        select: { creatorSlug: true },
      });

      await prisma.mediaPurchase.create({
        data: {
          userId,
          mediaId,
          amount: 0, // Credits, not dollars
          currency: "CREDITS",
          provider: "CREDITS",
          status: "COMPLETED",
        },
      });

      // Increment purchase count
      await prisma.mediaContent.update({
        where: { id: mediaId },
        data: {
          purchaseCount: { increment: 1 },
        },
      });

      // Record creator earning (commission applied)
      if (mediaForEarning?.creatorSlug) {
        try {
          await recordCreatorEarning(
            mediaForEarning.creatorSlug,
            userId,
            amount,
            "MEDIA_UNLOCK",
            mediaId
          );
        } catch (earningError) {
          console.error("Failed to record creator earning:", earningError);
          // Don't fail the transaction, just log the error
        }
      }
    }

    return NextResponse.json({
      success: true,
      spent: amount,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error("Error spending credits:", error);

    if (error.message === "Insufficient credits") {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to spend credits" },
      { status: 500 }
    );
  }
}
