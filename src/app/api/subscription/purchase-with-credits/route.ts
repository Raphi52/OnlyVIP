import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCreditBalance, spendCredits } from "@/lib/credits";

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

    // Get user's current credits
    const userCredits = await getCreditBalance(userId);

    if (userCredits < credits) {
      return NextResponse.json(
        { error: "Insufficient credits", required: credits, available: userCredits },
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

    // Spend credits using the credits library
    const spendResult = await spendCredits(
      userId,
      credits,
      "SUBSCRIPTION",
      {
        description: `VIP subscription for ${creator.displayName}`,
      }
    );

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
