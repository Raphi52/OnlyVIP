import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { spendCredits, getCreditBalance } from "@/lib/credits";
import { recordCreatorEarning } from "@/lib/commission";
import prisma from "@/lib/prisma";

// POST /api/subscription/purchase - Purchase subscription with credits
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
    const { planId, interval, creatorSlug } = body;

    // Validate inputs
    if (!planId || !["basic", "vip"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (!interval || !["monthly", "annual"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval" },
        { status: 400 }
      );
    }

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "Creator slug required" },
        { status: 400 }
      );
    }

    // Get creator's custom pricing or use defaults
    const settings = await prisma.siteSettings.findUnique({
      where: { creatorSlug },
    });

    // Default pricing in credits
    const defaultPricing = {
      basic: { monthlyCredits: 999, annualCredits: 9588, bonusCredits: 500 },
      vip: { monthlyCredits: 2999, annualCredits: 28788, bonusCredits: 2000 },
    };

    let pricing = defaultPricing;

    // Try to get custom pricing from settings
    if (settings?.pricing) {
      try {
        const customPricing = JSON.parse(settings.pricing);
        if (customPricing.plans) {
          const basicPlan = customPricing.plans.find((p: any) => p.id === "basic");
          const vipPlan = customPricing.plans.find((p: any) => p.id === "vip");

          if (basicPlan) {
            pricing.basic = {
              monthlyCredits: basicPlan.monthlyCredits || defaultPricing.basic.monthlyCredits,
              annualCredits: basicPlan.annualCredits || defaultPricing.basic.annualCredits,
              bonusCredits: basicPlan.bonusCredits || defaultPricing.basic.bonusCredits,
            };
          }
          if (vipPlan) {
            pricing.vip = {
              monthlyCredits: vipPlan.monthlyCredits || defaultPricing.vip.monthlyCredits,
              annualCredits: vipPlan.annualCredits || defaultPricing.vip.annualCredits,
              bonusCredits: vipPlan.bonusCredits || defaultPricing.vip.bonusCredits,
            };
          }
        }
      } catch (e) {
        // Use default pricing if parsing fails
      }
    }

    const selectedPlan = pricing[planId as keyof typeof pricing];
    const creditsRequired = interval === "annual"
      ? selectedPlan.annualCredits
      : selectedPlan.monthlyCredits;
    const bonusCredits = selectedPlan.bonusCredits;

    // Check if user has enough credits
    const currentBalance = await getCreditBalance(userId);
    if (currentBalance < creditsRequired) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: currentBalance,
          required: creditsRequired,
        },
        { status: 400 }
      );
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorSlug,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription to this creator" },
        { status: 400 }
      );
    }

    // Spend credits
    const spendResult = await spendCredits(userId, creditsRequired, "SUBSCRIPTION", {
      description: `${planId.toUpperCase()} subscription (${interval}) for ${creatorSlug}`,
    });

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (interval === "annual") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: planId.toUpperCase(),
        creatorSlug,
        status: "ACTIVE",
        paymentProvider: "CREDITS",
        billingInterval: interval.toUpperCase(),
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        nextCreditGrant: endDate, // Next grant at end of period
      },
    });

    // Add bonus credits to user
    if (bonusCredits > 0) {
      // Get current balance for transaction record
      const newBalance = spendResult.newBalance + bonusCredits;

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: bonusCredits,
          balance: newBalance,
          type: "SUBSCRIPTION_BONUS",
          description: `Bonus credits for ${planId.toUpperCase()} subscription`,
          subscriptionId: subscription.id,
          expiresAt: endDate, // Bonus expires with subscription
        },
      });

      // Update user credit balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: newBalance,
        },
      });
    }

    // Record creator earning
    try {
      await recordCreatorEarning(
        creatorSlug,
        userId,
        creditsRequired,
        "SUBSCRIPTION"
      );
    } catch (earningError) {
      console.error("Failed to record creator earning:", earningError);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        endDate: endDate.toISOString(),
      },
      creditsSpent: creditsRequired,
      bonusCreditsAdded: bonusCredits,
      newBalance: spendResult.newBalance + bonusCredits,
    });
  } catch (error: any) {
    console.error("Error purchasing subscription:", error);

    return NextResponse.json(
      { error: error.message || "Failed to purchase subscription" },
      { status: 500 }
    );
  }
}
