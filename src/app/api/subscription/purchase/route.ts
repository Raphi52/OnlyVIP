import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { spendCredits, getCreditBalances, addCredits } from "@/lib/credits";
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
      basic: { monthlyCredits: 999, annualCredits: 9588 },
      vip: { monthlyCredits: 2999, annualCredits: 28788 },
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
            };
          }
          if (vipPlan) {
            pricing.vip = {
              monthlyCredits: vipPlan.monthlyCredits || defaultPricing.vip.monthlyCredits,
              annualCredits: vipPlan.annualCredits || defaultPricing.vip.annualCredits,
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

    // Check if user has enough PAID credits - subscriptions require paid credits only
    const balances = await getCreditBalances(userId);
    if (balances.paid < creditsRequired) {
      return NextResponse.json(
        {
          error: "Insufficient paid credits",
          balance: balances.paid,
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

    // Get the actual plan from database
    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { slug: planId },
          { accessTier: planId.toUpperCase() },
        ],
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Spend PAID credits only - subscriptions cannot use bonus credits
    const spendResult = await spendCredits(userId, creditsRequired, "SUBSCRIPTION", {
      allowBonus: false, // Subscriptions = paid credits only
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
        planId: plan.id,
        creatorSlug,
        status: "ACTIVE",
        paymentProvider: "CREDITS",
        billingInterval: interval.toUpperCase(),
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        nextCreditGrant: endDate, // Next grant at end of period
      },
    });

    // Record creator earning - all spent credits are paid since allowBonus=false
    if (spendResult.paidSpent > 0) {
      try {
        await recordCreatorEarning(
          creatorSlug,
          userId,
          spendResult.paidSpent, // Always equals creditsRequired since allowBonus=false
          "SUBSCRIPTION"
        );
      } catch (earningError) {
        console.error("Failed to record creator earning:", earningError);
      }
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
      newBalance: spendResult.newBalance,
    });
  } catch (error: any) {
    console.error("Error purchasing subscription:", error);

    return NextResponse.json(
      { error: error.message || "Failed to purchase subscription" },
      { status: 500 }
    );
  }
}
