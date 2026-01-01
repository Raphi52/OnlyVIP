import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/earnings - Get earnings history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING | PAID | ALL
    const period = searchParams.get("period"); // 7d | 30d | 90d | all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verify chatter is active
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: {
        assignedCreators: {
          select: { creatorSlug: true },
        },
      },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    // Build date filter
    let dateFilter: any = {};
    if (period && period !== "all") {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter = { gte: startDate };
    }

    // Build where clause
    const whereClause: any = {
      chatterId,
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (dateFilter.gte) {
      whereClause.createdAt = dateFilter;
    }

    // Get earnings with pagination
    const [earnings, totalCount] = await Promise.all([
      prisma.chatterEarning.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creatorEarning: {
            select: {
              creatorSlug: true,
            },
          },
        },
      }),
      prisma.chatterEarning.count({ where: whereClause }),
    ]);

    // Get creator profiles for display
    const creatorSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);
    const creators = await prisma.creator.findMany({
      where: {
        slug: { in: creatorSlugs },
      },
      select: {
        slug: true,
        displayName: true,
        avatar: true,
      },
    });

    const creatorMap = new Map(creators.map((c) => [c.slug, c]));

    // Get summary stats
    const [pendingSum, paidSum, totalSum] = await Promise.all([
      prisma.chatterEarning.aggregate({
        where: { chatterId, status: "PENDING" },
        _sum: { commissionAmount: true },
      }),
      prisma.chatterEarning.aggregate({
        where: { chatterId, status: "PAID" },
        _sum: { commissionAmount: true },
      }),
      prisma.chatterEarning.aggregate({
        where: { chatterId },
        _sum: { commissionAmount: true },
      }),
    ]);

    // Get earnings by type for the current period
    const earningsByType = await prisma.chatterEarning.groupBy({
      by: ["type"],
      where: whereClause,
      _sum: { commissionAmount: true },
      _count: true,
    });

    // Format earnings
    const formattedEarnings = earnings.map((earning) => {
      const creator = creatorMap.get(earning.creatorEarning?.creatorSlug || "");
      return {
        id: earning.id,
        type: earning.type,
        grossAmount: earning.grossAmount,
        commissionRate: earning.commissionRate,
        commissionAmount: earning.commissionAmount,
        creatorSlug: earning.creatorEarning?.creatorSlug,
        creatorName: creator?.displayName || earning.creatorEarning?.creatorSlug,
        creatorAvatar: creator?.avatar,
        status: earning.status,
        paidAt: earning.paidAt?.toISOString() || null,
        createdAt: earning.createdAt.toISOString(),
        delayedAttribution: earning.delayedAttribution,
      };
    });

    return NextResponse.json({
      earnings: formattedEarnings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        total: totalSum._sum.commissionAmount || 0,
        pending: pendingSum._sum.commissionAmount || 0,
        paid: paidSum._sum.commissionAmount || 0,
        commissionRate: chatter.commissionRate,
      },
      byType: earningsByType.map((e) => ({
        type: e.type,
        amount: e._sum.commissionAmount || 0,
        count: e._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching chatter earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
