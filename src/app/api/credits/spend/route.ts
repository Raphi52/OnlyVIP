import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  spendCredits,
  getCreditBalances,
  CreditTransactionType,
} from "@/lib/credits";
import { recordEarningDistribution } from "@/lib/commission";
import prisma from "@/lib/prisma";
import { rateLimit, rateLimitResponse, PAYMENT_LIMIT } from "@/lib/ratelimit";

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

    // Rate limiting: 10 transactions per minute per user
    const rateLimitResult = rateLimit(`credits-spend:${userId}`, PAYMENT_LIMIT);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

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

    // Check balance - MEDIA_UNLOCK can use bonus credits, others cannot
    const balances = await getCreditBalances(userId);
    const allowBonus = type === "MEDIA_UNLOCK";
    const availableBalance = allowBonus ? balances.total : balances.paid;

    if (availableBalance < amount) {
      return NextResponse.json(
        {
          error: allowBonus ? "Insufficient credits" : "Insufficient paid credits",
          balance: availableBalance,
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

    // Spend credits - MEDIA_UNLOCK can use bonus credits (bonus first, then paid)
    const result = await spendCredits(userId, amount, type, {
      allowBonus: type === "MEDIA_UNLOCK", // PPV catalog media can use bonus
      description: description || `${type}: ${amount} credits`,
      mediaId,
      messageId,
    });

    // Create additional records based on type
    let mediaUrl: string | null = null;

    if (type === "MEDIA_UNLOCK" && mediaId) {
      // Get media with creatorSlug and URL for earning tracking
      const mediaForEarning = await prisma.mediaContent.findUnique({
        where: { id: mediaId },
        select: { creatorSlug: true, contentUrl: true, type: true },
      });

      // Set the media URL to return to client
      mediaUrl = mediaForEarning?.contentUrl || null;

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

      // Record earning distribution (creator + agency, no chatter for catalog media)
      if (mediaForEarning?.creatorSlug && result.paidSpent > 0) {
        try {
          await recordEarningDistribution({
            creatorSlug: mediaForEarning.creatorSlug,
            userId,
            paidCreditsSpent: result.paidSpent,
            type: "MEDIA_UNLOCK",
            sourceId: mediaId,
            // No chatter/AI attribution for catalog media purchases
            chatterId: null,
            aiPersonalityId: null,
            attributedMessageId: null,
          });
        } catch (earningError) {
          console.error("Failed to record earning distribution:", earningError);
          // Don't fail the transaction, just log the error
        }
      }
    }

    return NextResponse.json({
      success: true,
      spent: amount,
      paidSpent: result.paidSpent,
      bonusSpent: result.bonusSpent,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      mediaUrl, // URL to view the unlocked content
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
