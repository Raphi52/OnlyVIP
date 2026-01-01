import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCreditBalances, spendCredits } from "@/lib/credits";
import { recordEarningDistribution } from "@/lib/commission";

// POST /api/subscription/purchase-with-credits - Purchase VIP with credits
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { creatorSlug, tier, credits } = body;

    if (!creatorSlug || !credits) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Get user's PAID credits - subscriptions require paid credits only
    const balances = await getCreditBalances(userId);

    if (balances.paid < credits) {
      return NextResponse.json(
        { error: "Insufficient paid credits", required: credits, available: balances.paid },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription for this creator
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorSlug,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription for this creator" },
        { status: 400 }
      );
    }

    // Get VIP plan
    const vipPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { accessTier: "VIP" },
          { name: { contains: "VIP", mode: "insensitive" } },
        ],
      },
    });

    if (!vipPlan) {
      return NextResponse.json(
        { error: "VIP plan not found" },
        { status: 500 }
      );
    }

    // Calculate subscription period (1 month from now)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Create subscription first
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: vipPlan.id,
        creatorSlug,
        status: "ACTIVE",
        paymentProvider: "CREDITS",
        billingInterval: "MONTHLY",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Spend PAID credits only - subscriptions cannot use bonus credits
    const spendResult = await spendCredits(
      userId,
      credits,
      "SUBSCRIPTION",
      {
        allowBonus: false, // Subscriptions = paid credits only
        description: `VIP subscription for ${creator.displayName}`,
      }
    );

    // Record earning distribution (creator + agency, no chatter for subscriptions)
    if (spendResult.paidSpent > 0) {
      try {
        await recordEarningDistribution({
          creatorSlug,
          userId,
          paidCreditsSpent: spendResult.paidSpent,
          type: "SUBSCRIPTION",
          sourceId: subscription.id,
          // No chatter attribution for subscriptions (per business rule)
          chatterId: null,
          aiPersonalityId: null,
          attributedMessageId: null,
        });
      } catch (earningError) {
        console.error("Failed to record earning distribution:", earningError);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        creatorSlug: subscription.creatorSlug,
        periodEnd: subscription.currentPeriodEnd,
      },
      remainingCredits: spendResult.newBalance,
    });
  } catch (error) {
    console.error("Error purchasing subscription:", error);
    return NextResponse.json(
      { error: "Failed to purchase subscription" },
      { status: 500 }
    );
  }
}
