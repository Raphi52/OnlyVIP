import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// GET /api/agency/scripts/analytics - Get script analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, all
    const creatorSlug = searchParams.get("creatorSlug");
    const chatterId = searchParams.get("chatterId");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate date range
    let startDate: Date | null = null;
    const endDate = new Date();

    switch (period) {
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null;
    }

    // Build script filter
    const scriptFilter: any = { agencyId, isActive: true };
    if (creatorSlug) {
      scriptFilter.OR = [{ creatorSlug }, { creatorSlug: null }];
    }

    // Build usage filter
    const usageFilter: any = {
      script: { agencyId },
    };
    if (startDate) {
      usageFilter.usedAt = { gte: startDate, lte: endDate };
    }
    if (creatorSlug) {
      usageFilter.creatorSlug = creatorSlug;
    }
    if (chatterId) {
      usageFilter.chatterId = chatterId;
    }

    // Get overview stats
    const [
      totalScripts,
      activeScripts,
      scriptsWithSales,
      totalUsages,
      totalSales,
      revenueSum,
    ] = await Promise.all([
      prisma.script.count({ where: { agencyId } }),
      prisma.script.count({ where: { ...scriptFilter, status: "APPROVED" } }),
      prisma.script.count({
        where: { ...scriptFilter, salesGenerated: { gt: 0 } },
      }),
      prisma.scriptUsage.count({ where: usageFilter }),
      prisma.scriptUsage.count({
        where: { ...usageFilter, resultedInSale: true },
      }),
      prisma.scriptUsage.aggregate({
        where: { ...usageFilter, resultedInSale: true },
        _sum: { saleAmount: true },
      }),
    ]);

    const totalRevenue = revenueSum._sum.saleAmount || 0;
    const conversionRate = totalUsages > 0
      ? ((totalSales / totalUsages) * 100).toFixed(2)
      : "0.00";

    // Get top performing scripts
    const topScripts = await prisma.script.findMany({
      where: scriptFilter,
      orderBy: { revenueGenerated: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        usageCount: true,
        messagesSent: true,
        salesGenerated: true,
        revenueGenerated: true,
        conversionRate: true,
        creatorSlug: true,
      },
    });

    // Get usage by category
    const categoryStats = await prisma.script.groupBy({
      by: ["category"],
      where: scriptFilter,
      _sum: {
        usageCount: true,
        salesGenerated: true,
        revenueGenerated: true,
      },
      _count: true,
    });

    // Get daily usage for chart (last 30 days or period)
    const chartStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyUsages = await prisma.scriptUsage.groupBy({
      by: ["usedAt"],
      where: {
        ...usageFilter,
        usedAt: { gte: chartStartDate },
      },
      _count: true,
    });

    // Aggregate by day
    const dailyMap = new Map<string, { usages: number; sales: number; revenue: number }>();
    const days = Math.ceil((endDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000));

    for (let i = 0; i < days; i++) {
      const date = new Date(chartStartDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split("T")[0];
      dailyMap.set(key, { usages: 0, sales: 0, revenue: 0 });
    }

    // Get sales by day
    const dailySales = await prisma.scriptUsage.findMany({
      where: {
        ...usageFilter,
        usedAt: { gte: chartStartDate },
        resultedInSale: true,
      },
      select: {
        usedAt: true,
        saleAmount: true,
      },
    });

    for (const sale of dailySales) {
      const key = sale.usedAt.toISOString().split("T")[0];
      const day = dailyMap.get(key);
      if (day) {
        day.sales += 1;
        day.revenue += sale.saleAmount || 0;
      }
    }

    // Count usages per day
    for (const usage of dailyUsages) {
      const key = usage.usedAt.toISOString().split("T")[0];
      const day = dailyMap.get(key);
      if (day) {
        day.usages += usage._count;
      }
    }

    const chartData = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get performance by chatter
    const chatterPerformance = await prisma.scriptUsage.groupBy({
      by: ["chatterId"],
      where: usageFilter,
      _count: true,
      _sum: { saleAmount: true },
    });

    // Enrich with chatter names
    const chatterIds = chatterPerformance.map((c) => c.chatterId);
    const chatters = await prisma.chatter.findMany({
      where: { id: { in: chatterIds } },
      select: { id: true, name: true },
    });
    const chatterMap = new Map(chatters.map((c) => [c.id, c.name]));

    const chatterStats = chatterPerformance
      .map((c) => ({
        chatterId: c.chatterId,
        chatterName: chatterMap.get(c.chatterId) || "Unknown",
        scriptsUsed: c._count,
        revenue: c._sum.saleAmount || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Get most used scripts (by category for pie chart)
    const usageByCategory = categoryStats.map((c) => ({
      category: c.category,
      label: c.category.replace(/_/g, " "),
      count: c._count,
      usages: c._sum.usageCount || 0,
      sales: c._sum.salesGenerated || 0,
      revenue: c._sum.revenueGenerated || 0,
    }));

    // Get recent activity
    const recentActivity = await prisma.scriptUsage.findMany({
      where: usageFilter,
      orderBy: { usedAt: "desc" },
      take: 20,
      include: {
        script: {
          select: { id: true, name: true, category: true },
        },
        chatter: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalScripts,
        activeScripts,
        scriptsWithSales,
        totalUsages,
        totalSales,
        totalRevenue,
        conversionRate: parseFloat(conversionRate),
      },
      topScripts,
      categoryStats: usageByCategory,
      chartData,
      chatterStats,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        scriptId: a.script.id,
        scriptName: a.script.name,
        category: a.script.category,
        chatterName: a.chatter.name,
        action: a.action,
        resultedInSale: a.resultedInSale,
        saleAmount: a.saleAmount,
        usedAt: a.usedAt,
      })),
      period,
      dateRange: {
        start: startDate?.toISOString() || null,
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts/analytics - Recalculate stats
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Recalculate all script stats
    const scripts = await prisma.script.findMany({
      where: { agencyId, isActive: true },
      select: { id: true },
    });

    for (const script of scripts) {
      // Get usage stats
      const usageCount = await prisma.scriptUsage.count({
        where: { scriptId: script.id },
      });

      const sentCount = await prisma.scriptUsage.count({
        where: {
          scriptId: script.id,
          action: { in: ["SENT", "SENT_MODIFIED"] },
        },
      });

      const salesStats = await prisma.scriptUsage.aggregate({
        where: {
          scriptId: script.id,
          resultedInSale: true,
        },
        _count: true,
        _sum: { saleAmount: true },
      });

      const responseTimeStats = await prisma.scriptUsage.aggregate({
        where: {
          scriptId: script.id,
          responseTime: { not: null },
        },
        _avg: { responseTime: true },
      });

      const salesGenerated = salesStats._count;
      const conversionRate = sentCount > 0
        ? (salesGenerated / sentCount) * 100
        : 0;

      await prisma.script.update({
        where: { id: script.id },
        data: {
          usageCount,
          messagesSent: sentCount,
          salesGenerated,
          revenueGenerated: salesStats._sum.saleAmount || 0,
          conversionRate,
          avgResponseTime: responseTimeStats._avg.responseTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      scriptsUpdated: scripts.length,
    });
  } catch (error) {
    console.error("Error recalculating stats:", error);
    return NextResponse.json(
      { error: "Failed to recalculate stats" },
      { status: 500 }
    );
  }
}
