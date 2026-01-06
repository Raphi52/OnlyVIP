import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/chatter/analytics
 * Get performance analytics for a chatter
 *
 * Query params:
 * - period: "7d" | "30d" | "90d" | "all" (default: "30d")
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get previous period for comparison
    const periodLength = now.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = startDate;

    // Current period stats
    const [
      currentMessages,
      currentEarnings,
      currentSales,
      currentAiMessages,
      prevMessages,
      prevEarnings,
      topScripts,
      scriptUsages,
    ] = await Promise.all([
      // Current period messages
      prisma.message.count({
        where: {
          chatterId,
          createdAt: { gte: startDate },
        },
      }),

      // Current period earnings
      prisma.chatterEarning.aggregate({
        where: {
          chatterId,
          createdAt: { gte: startDate },
        },
        _sum: {
          commissionAmount: true,
          grossAmount: true,
        },
        _count: true,
      }),

      // Current period sales
      prisma.chatterEarning.count({
        where: {
          chatterId,
          createdAt: { gte: startDate },
          type: { in: ["PPV_UNLOCK", "MEDIA_UNLOCK", "TIP"] },
        },
      }),

      // AI-generated messages
      prisma.message.count({
        where: {
          chatterId,
          createdAt: { gte: startDate },
          isAiGenerated: true,
        },
      }),

      // Previous period messages
      prisma.message.count({
        where: {
          chatterId,
          createdAt: { gte: prevStartDate, lt: prevEndDate },
        },
      }),

      // Previous period earnings
      prisma.chatterEarning.aggregate({
        where: {
          chatterId,
          createdAt: { gte: prevStartDate, lt: prevEndDate },
        },
        _sum: {
          commissionAmount: true,
        },
      }),

      // Top performing scripts
      prisma.scriptUsage.groupBy({
        by: ["scriptId"],
        where: {
          chatterId,
          usedAt: { gte: startDate },
        },
        _count: true,
        _sum: {
          saleAmount: true,
        },
        orderBy: {
          _sum: {
            saleAmount: "desc",
          },
        },
        take: 10,
      }),

      // Script usage stats
      prisma.scriptUsage.findMany({
        where: {
          chatterId,
          usedAt: { gte: startDate },
        },
        select: {
          action: true,
          resultedInSale: true,
          saleAmount: true,
        },
      }),
    ]);

    // Get script details
    const scriptIds = topScripts.map((s) => s.scriptId);
    const scriptDetails = await prisma.script.findMany({
      where: { id: { in: scriptIds } },
      select: { id: true, name: true, category: true, conversionRate: true },
    });

    // Calculate trends
    const messagesTrend =
      prevMessages > 0
        ? ((currentMessages - prevMessages) / prevMessages) * 100
        : currentMessages > 0
        ? 100
        : 0;

    const currentRevenue = currentEarnings._sum.commissionAmount || 0;
    const prevRevenue = prevEarnings._sum.commissionAmount || 0;
    const revenueTrend =
      prevRevenue > 0
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
        : currentRevenue > 0
        ? 100
        : 0;

    // Calculate conversion rate
    const conversionRate =
      currentMessages > 0 ? (currentSales / currentMessages) * 100 : 0;

    // Calculate AI vs Manual stats
    const manualMessages = currentMessages - currentAiMessages;

    // Calculate average response time (placeholder - would need actual timing data)
    const avgResponseTime = 2.5; // minutes

    // Script effectiveness calculations
    const scriptsSent = scriptUsages.filter(
      (s) => s.action === "SENT" || s.action === "SENT_MODIFIED"
    ).length;
    const scriptsConverted = scriptUsages.filter((s) => s.resultedInSale).length;
    const scriptConversionRate =
      scriptsSent > 0 ? (scriptsConverted / scriptsSent) * 100 : 0;

    // AI message conversion (simplified)
    const aiRevenue = currentEarnings._sum.grossAmount
      ? (currentEarnings._sum.grossAmount * currentAiMessages) / currentMessages
      : 0;
    const manualRevenue = (currentEarnings._sum.grossAmount || 0) - aiRevenue;

    return NextResponse.json({
      summary: {
        messagesSent: currentMessages,
        revenue: currentRevenue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgResponseTime,
        sales: currentSales,
      },
      trends: {
        messages: Math.round(messagesTrend),
        revenue: Math.round(revenueTrend),
      },
      aiVsManual: {
        ai: {
          messages: currentAiMessages,
          revenue: Math.round(aiRevenue * 100) / 100,
          conversion:
            currentAiMessages > 0
              ? Math.round((scriptsConverted / currentAiMessages) * 1000) / 10
              : 0,
        },
        manual: {
          messages: manualMessages,
          revenue: Math.round(manualRevenue * 100) / 100,
          conversion:
            manualMessages > 0
              ? Math.round(((currentSales - scriptsConverted) / manualMessages) * 1000) / 10
              : 0,
        },
      },
      topScripts: topScripts.map((s) => {
        const details = scriptDetails.find((d) => d.id === s.scriptId);
        return {
          id: s.scriptId,
          name: details?.name || "Unknown Script",
          category: details?.category || "CUSTOM",
          uses: s._count,
          revenue: s._sum.saleAmount || 0,
          conversion: details?.conversionRate || 0,
        };
      }),
      scriptStats: {
        totalUsed: scriptsSent,
        conversions: scriptsConverted,
        conversionRate: Math.round(scriptConversionRate * 10) / 10,
      },
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
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
