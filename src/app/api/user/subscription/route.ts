import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/subscription - Get current user's subscription
// Optional query param: ?creatorSlug=xxx to filter by creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get optional creatorSlug filter
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
      status: { in: ["ACTIVE", "TRIALING"] },
    };

    // If creatorSlug provided, filter by it
    if (creatorSlug) {
      whereClause.creatorSlug = creatorSlug;
    }

    // Get active subscription (ACTIVE or TRIALING)
    const subscription = await prisma.subscription.findFirst({
      where: whereClause,
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also get user's credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditBalance: true },
    });

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            billingInterval: subscription.billingInterval,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            creatorSlug: subscription.creatorSlug,
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              accessTier: subscription.plan.accessTier,
              canMessage: subscription.plan.canMessage,
              features: subscription.plan.features,
            },
          }
        : null,
      credits: user?.creditBalance || 0,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
