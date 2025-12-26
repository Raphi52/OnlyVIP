import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/billing - Get user billing history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Filter by type
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = { userId };
    if (type && type !== "all") {
      where.type = type;
    }

    // Get payments and subscription info
    const [payments, totalCount, subscription, totalSpent] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.payment.count({ where }),

      prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          userId,
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Format transactions
    const transactions = payments.map((p) => ({
      id: p.id,
      type: p.type,
      description: p.description || getDefaultDescription(p.type),
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalSpent: totalSpent._sum.amount ? Number(totalSpent._sum.amount) : 0,
        transactionCount: totalCount,
        currentPlan: subscription?.plan?.name || "Free",
        nextBillingDate: subscription?.currentPeriodEnd?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}

function getDefaultDescription(type: string): string {
  switch (type) {
    case "SUBSCRIPTION":
      return "Subscription Payment";
    case "MEDIA_PURCHASE":
      return "Media Purchase";
    case "PPV_UNLOCK":
      return "PPV Content Unlock";
    case "TIP":
      return "Tip";
    default:
      return "Payment";
  }
}
