import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

// GET /api/admin/analytics - Comprehensive admin analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date ranges
    const now = new Date();
    let periodDays = 30;
    switch (period) {
      case "7d":
        periodDays = 7;
        break;
      case "30d":
        periodDays = 30;
        break;
      case "90d":
        periodDays = 90;
        break;
      case "1y":
        periodDays = 365;
        break;
    }

    const startDate = startOfDay(subDays(now, periodDays));
    const previousStartDate = startOfDay(subDays(startDate, periodDays));

    // === KPI CALCULATIONS ===
    const [
      // Current period
      currentRevenue,
      currentUsers,
      currentCreators,
      currentSubscriptions,
      currentSpenders,
      // Previous period
      previousRevenue,
      previousUsers,
      previousCreators,
      previousSubscriptions,
      // Totals
      totalUsers,
      totalCreators,
    ] = await Promise.all([
      // Current period revenue
      prisma.creatorEarning.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { grossAmount: true },
      }),
      // Current period new users
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Current period new creators
      prisma.creator.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Current active subscriptions
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      // Current period unique spenders
      prisma.creatorEarning.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: startDate } },
      }),
      // Previous period revenue
      prisma.creatorEarning.aggregate({
        where: {
          createdAt: { gte: previousStartDate, lt: startDate },
        },
        _sum: { grossAmount: true },
      }),
      // Previous period new users
      prisma.user.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
      }),
      // Previous period new creators
      prisma.creator.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
      }),
      // Previous active subscriptions (approximate)
      prisma.subscription.count({
        where: { createdAt: { lt: startDate }, status: "ACTIVE" },
      }),
      // Total users
      prisma.user.count(),
      // Total creators
      prisma.creator.count(),
    ]);

    const totalRevenueValue = currentRevenue._sum.grossAmount || 0;
    const previousRevenueValue = previousRevenue._sum.grossAmount || 0;
    const revenueChange = previousRevenueValue > 0
      ? ((totalRevenueValue - previousRevenueValue) / previousRevenueValue) * 100
      : 0;

    const usersChange = previousUsers > 0
      ? ((currentUsers - previousUsers) / previousUsers) * 100
      : 0;

    const creatorsChange = previousCreators > 0
      ? ((currentCreators - previousCreators) / previousCreators) * 100
      : 0;

    const subscriptionsChange = previousSubscriptions > 0
      ? ((currentSubscriptions - previousSubscriptions) / previousSubscriptions) * 100
      : 0;

    const conversionRate = totalUsers > 0
      ? (currentSpenders.length / totalUsers) * 100
      : 0;

    const avgRevenuePerUser = currentSpenders.length > 0
      ? totalRevenueValue / currentSpenders.length
      : 0;

    // === REVENUE CHART DATA ===
    const revenueByDay = await prisma.creatorEarning.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
      _sum: { grossAmount: true },
    });

    // Aggregate by type for each day
    const earningsWithType = await prisma.creatorEarning.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, grossAmount: true, type: true },
    });

    // Group by day and type
    const dailyRevenue: Record<string, { revenue: number; subscriptions: number; ppv: number; tips: number; media: number }> = {};

    // Initialize all days in the period
    for (let i = 0; i < periodDays; i++) {
      const day = format(subDays(now, periodDays - 1 - i), "yyyy-MM-dd");
      dailyRevenue[day] = { revenue: 0, subscriptions: 0, ppv: 0, tips: 0, media: 0 };
    }

    // Fill in actual data
    earningsWithType.forEach((earning) => {
      const day = format(earning.createdAt, "yyyy-MM-dd");
      if (dailyRevenue[day]) {
        dailyRevenue[day].revenue += earning.grossAmount;
        switch (earning.type) {
          case "SUBSCRIPTION":
            dailyRevenue[day].subscriptions += earning.grossAmount;
            break;
          case "PPV":
            dailyRevenue[day].ppv += earning.grossAmount;
            break;
          case "TIP":
            dailyRevenue[day].tips += earning.grossAmount;
            break;
          case "MEDIA_UNLOCK":
            dailyRevenue[day].media += earning.grossAmount;
            break;
        }
      }
    });

    const revenueChart = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        subscriptions: Math.round(data.subscriptions * 100) / 100,
        ppv: Math.round(data.ppv * 100) / 100,
        tips: Math.round(data.tips * 100) / 100,
        media: Math.round(data.media * 100) / 100,
      }));

    // === REVENUE BREAKDOWN ===
    const revenueByType = await prisma.creatorEarning.groupBy({
      by: ["type"],
      where: { createdAt: { gte: startDate } },
      _sum: { grossAmount: true },
    });

    const totalBreakdown = revenueByType.reduce((sum, t) => sum + (t._sum.grossAmount || 0), 0);
    const revenueBreakdown = revenueByType.map((t) => ({
      type: t.type.toLowerCase(),
      amount: Math.round((t._sum.grossAmount || 0) * 100) / 100,
      percentage: totalBreakdown > 0 ? Math.round(((t._sum.grossAmount || 0) / totalBreakdown) * 1000) / 10 : 0,
    }));

    // === USER GROWTH ===
    const usersByDay = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
    });

    const creatorsByDay = await prisma.creator.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
    });

    // Aggregate by day
    const dailyUsers: Record<string, { newUsers: number; newCreators: number }> = {};
    for (let i = 0; i < periodDays; i++) {
      const day = format(subDays(now, periodDays - 1 - i), "yyyy-MM-dd");
      dailyUsers[day] = { newUsers: 0, newCreators: 0 };
    }

    usersByDay.forEach((u) => {
      const day = format(u.createdAt, "yyyy-MM-dd");
      if (dailyUsers[day]) {
        dailyUsers[day].newUsers++;
      }
    });

    creatorsByDay.forEach((c) => {
      const day = format(c.createdAt, "yyyy-MM-dd");
      if (dailyUsers[day]) {
        dailyUsers[day].newCreators++;
      }
    });

    // Calculate cumulative totals
    const usersBeforePeriod = await prisma.user.count({
      where: { createdAt: { lt: startDate } },
    });

    let runningTotal = usersBeforePeriod;
    const userGrowth = Object.entries(dailyUsers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        runningTotal += data.newUsers;
        return {
          date,
          newUsers: data.newUsers,
          totalUsers: runningTotal,
          newCreators: data.newCreators,
        };
      });

    // === AI PERFORMANCE ===
    const aiPerformanceData = await prisma.aiPerformanceSummary.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    const aiPerformance = aiPerformanceData.map((p) => ({
      date: format(p.date, "yyyy-MM-dd"),
      aiRevenue: p.aiRevenue,
      aiMessages: p.aiMessages,
      chatterRevenue: p.chatterRevenue,
      chatterMessages: p.chatterMessages,
    }));

    const aiSummary = {
      totalAiRevenue: aiPerformanceData.reduce((sum, p) => sum + p.aiRevenue, 0),
      totalChatterRevenue: aiPerformanceData.reduce((sum, p) => sum + p.chatterRevenue, 0),
      aiConversionRate: aiPerformanceData.length > 0
        ? aiPerformanceData.reduce((sum, p) => sum + p.aiConversionRate, 0) / aiPerformanceData.length
        : 0,
      chatterConversionRate: aiPerformanceData.length > 0
        ? aiPerformanceData.reduce((sum, p) => sum + p.chatterConversionRate, 0) / aiPerformanceData.length
        : 0,
    };

    // === TOP CREATORS ===
    const topCreatorsData = await prisma.creatorEarning.groupBy({
      by: ["creatorSlug"],
      where: { createdAt: { gte: startDate } },
      _sum: { grossAmount: true },
      orderBy: { _sum: { grossAmount: "desc" } },
      take: 5,
    });

    const creatorDetails = await prisma.creator.findMany({
      where: { slug: { in: topCreatorsData.map((c) => c.creatorSlug) } },
      select: { slug: true, displayName: true, avatar: true, subscriberCount: true },
    });

    const topCreators = topCreatorsData.map((c) => {
      const details = creatorDetails.find((d) => d.slug === c.creatorSlug);
      return {
        slug: c.creatorSlug,
        name: details?.displayName || c.creatorSlug,
        avatar: details?.avatar || null,
        revenue: Math.round((c._sum.grossAmount || 0) * 100) / 100,
        subscribers: details?.subscriberCount || 0,
      };
    });

    // === CONVERSION FUNNEL ===
    const [visitors, signups, subscribers, spenders] = await Promise.all([
      // Unique visitors (from page views)
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: { createdAt: { gte: startDate } },
      }),
      // Signups
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Subscribers
      prisma.subscription.count({
        where: { createdAt: { gte: startDate }, status: "ACTIVE" },
      }),
      // Spenders (users who made a purchase)
      prisma.creatorEarning.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    const funnel = {
      visitors: visitors.length,
      signups,
      subscribers,
      spenders: spenders.length,
    };

    // === RECENT PAYMENTS ===
    const recentPaymentsData = await prisma.creatorEarning.findMany({
      where: { createdAt: { gte: subDays(now, 1) } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, image: true } },
        creator: { select: { displayName: true } },
      },
    });

    const recentPayments = recentPaymentsData.map((p) => ({
      id: p.id,
      type: p.type,
      amount: Math.round(p.grossAmount * 100) / 100,
      user: p.user?.name || "Anonymous",
      userImage: p.user?.image || null,
      creator: p.creator?.displayName || p.creatorSlug,
      createdAt: p.createdAt.toISOString(),
    }));

    // === PAGE VIEWS ANALYTICS ===
    // Top pages
    const topPagesData = await prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: startDate } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    });

    const topPages = topPagesData.map((p) => ({
      path: p.path,
      views: p._count.path,
    }));

    // Referrer sources
    const referrerData = await prisma.pageView.groupBy({
      by: ["referrer"],
      where: {
        createdAt: { gte: startDate },
        referrer: { not: null },
      },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    });

    const referrerSources = referrerData
      .map((r) => {
        const referrer = r.referrer || "Direct";
        // Extract domain from referrer URL
        let source = "Direct";
        try {
          if (referrer && referrer !== "Direct") {
            const url = new URL(referrer);
            source = url.hostname.replace("www.", "");
          }
        } catch {
          source = referrer.slice(0, 30);
        }
        return {
          source,
          visits: r._count.referrer || 0,
        };
      })
      // Filter out self-referrals (visits from our own site)
      .filter((r) => !r.source.includes("viponly.fun") && !r.source.includes("viponly."));

    // Add direct visits
    const directVisits = await prisma.pageView.count({
      where: {
        createdAt: { gte: startDate },
        referrer: null,
      },
    });

    if (directVisits > 0) {
      referrerSources.unshift({ source: "Direct", visits: directVisits });
    }

    // Device breakdown
    const deviceData = await prisma.pageView.groupBy({
      by: ["device"],
      where: { createdAt: { gte: startDate } },
      _count: { device: true },
    });

    const deviceBreakdown = deviceData.map((d) => ({
      device: d.device || "Unknown",
      count: d._count.device,
    }));

    // Country breakdown
    const countryData = await prisma.pageView.groupBy({
      by: ["country"],
      where: {
        createdAt: { gte: startDate },
        country: { not: null },
      },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    });

    const countryBreakdown = countryData.map((c) => ({
      country: c.country || "Unknown",
      visits: c._count.country || 0,
    }));

    // Total page views
    const totalPageViews = await prisma.pageView.count({
      where: { createdAt: { gte: startDate } },
    });

    // Unique visitors
    const uniqueVisitors = visitors.length;

    const trafficAnalytics = {
      totalPageViews,
      uniqueVisitors,
      topPages,
      referrerSources: referrerSources.slice(0, 8),
      deviceBreakdown,
      countryBreakdown,
    };

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenueValue * 100) / 100,
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalUsers,
        usersChange: Math.round(usersChange * 10) / 10,
        totalCreators,
        creatorsChange: Math.round(creatorsChange * 10) / 10,
        activeSubscriptions: currentSubscriptions,
        subscriptionsChange: Math.round(subscriptionsChange * 10) / 10,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      revenueChart,
      revenueBreakdown,
      userGrowth,
      aiPerformance,
      aiSummary,
      topCreators,
      funnel,
      recentPayments,
      trafficAnalytics,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
