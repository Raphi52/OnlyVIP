import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/earnings - Get agency earnings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get agency owned by user
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const creatorSlug = searchParams.get("creatorSlug");

    // Build where clause
    const where: any = { agencyId: agency.id };
    if (type) where.type = type;
    if (creatorSlug) {
      where.creatorEarning = { creatorSlug };
    }

    // Get total count
    const total = await prisma.agencyEarning.count({ where });

    // Get earnings with pagination
    const earnings = await prisma.agencyEarning.findMany({
      where,
      include: {
        creatorEarning: {
          select: {
            creatorSlug: true,
            type: true,
            userId: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get summary stats
    const [pendingSum, totalSum, paidSum, earningsCount] = await Promise.all([
      prisma.agencyEarning.aggregate({
        where: { agencyId: agency.id, status: "PENDING" },
        _sum: { netAmount: true },
      }),
      prisma.agencyEarning.aggregate({
        where: { agencyId: agency.id },
        _sum: { netAmount: true },
      }),
      prisma.agencyEarning.aggregate({
        where: { agencyId: agency.id, status: "PAID" },
        _sum: { netAmount: true },
      }),
      prisma.agencyEarning.count({
        where: { agencyId: agency.id },
      }),
    ]);

    // Get earnings by creator
    const creatorBreakdown = await prisma.agencyEarning.groupBy({
      by: ["creatorEarningId"],
      where: { agencyId: agency.id },
      _sum: { netAmount: true },
      _count: true,
    });

    // Get unique creator slugs with their totals
    let creatorStats: any[] = [];
    try {
      const rawStats = await prisma.$queryRaw`
        SELECT
          ce."creatorSlug",
          SUM(ae."netAmount")::float as total,
          COUNT(ae.id)::int as count
        FROM "AgencyEarning" ae
        JOIN "CreatorEarning" ce ON ae."creatorEarningId" = ce.id
        WHERE ae."agencyId" = ${agency.id}
        GROUP BY ce."creatorSlug"
        ORDER BY total DESC
        LIMIT 10
      ` as any[];
      // Convert BigInt to Number for JSON serialization
      creatorStats = rawStats.map((s: any) => ({
        creatorSlug: s.creatorSlug,
        total: Number(s.total) || 0,
        count: Number(s.count) || 0,
      }));
    } catch (queryError) {
      console.error("Error fetching creator stats:", queryError);
    }

    // Transform earnings for response
    const transformedEarnings = earnings.map((e) => ({
      id: e.id,
      type: e.type,
      grossAmount: e.grossAmount,
      agencyShare: e.agencyShare,
      agencyGross: e.agencyGross,
      chatterAmount: e.chatterAmount,
      netAmount: e.netAmount,
      status: e.status,
      createdAt: e.createdAt,
      paidAt: e.paidAt,
      creatorSlug: e.creatorEarning?.creatorSlug || "unknown",
      user: e.creatorEarning?.user || null,
    }));

    return NextResponse.json({
      earnings: transformedEarnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        pendingBalance: pendingSum._sum.netAmount || 0,
        totalEarned: totalSum._sum.netAmount || 0,
        totalPaid: paidSum._sum.netAmount || 0,
        earningsCount,
      },
      creatorBreakdown: creatorStats,
    });
  } catch (error) {
    console.error("Error fetching agency earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
