import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getCreatorEarnings,
  getCreatorEarningsSummary,
  getCreatorCommissionRate,
  isFirstMonth,
  EarningType,
} from "@/lib/commission";

// GET /api/creator/earnings - Get creator earnings and stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator profile
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: {
        slug: true,
        createdAt: true,
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Get URL params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const typeParam = searchParams.get("type");
    const type = typeParam as EarningType | undefined;

    // Get earnings data
    const [earningsResult, summary, commissionInfo] = await Promise.all([
      getCreatorEarnings(creator.slug, {
        page,
        limit,
        type,
      }),
      getCreatorEarningsSummary(creator.slug),
      getCreatorCommissionRate(creator.slug),
    ]);

    // Check if in first month
    const inFirstMonth = isFirstMonth(creator.createdAt);

    return NextResponse.json({
      earnings: earningsResult.earnings,
      pagination: {
        page,
        limit,
        total: earningsResult.total,
        totalPages: Math.ceil(earningsResult.total / limit),
      },
      summary: {
        pendingBalance: summary.pendingBalance,
        totalEarned: summary.totalEarned,
        totalPaid: summary.totalPaid,
        earningsCount: summary.earningsCount,
      },
      commission: {
        currentRate: commissionInfo.commissionRate,
        inFirstMonth,
        firstMonthFree: commissionInfo.firstMonthFree,
        createdAt: creator.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching creator earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
