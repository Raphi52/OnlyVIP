import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, subYears, startOfDay, format, eachDayOfInterval } from "date-fns";

type Period = "7d" | "30d" | "90d" | "1y";

function getPeriodDates(period: Period) {
  const now = new Date();
  const end = startOfDay(now);
  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case "7d":
      start = subDays(end, 7);
      previousEnd = subDays(start, 1);
      previousStart = subDays(previousEnd, 7);
      break;
    case "30d":
      start = subDays(end, 30);
      previousEnd = subDays(start, 1);
      previousStart = subDays(previousEnd, 30);
      break;
    case "90d":
      start = subDays(end, 90);
      previousEnd = subDays(start, 1);
      previousStart = subDays(previousEnd, 90);
      break;
    case "1y":
      start = subYears(end, 1);
      previousEnd = subDays(start, 1);
      previousStart = subYears(previousEnd, 1);
      break;
    default:
      start = subDays(end, 30);
      previousEnd = subDays(start, 1);
      previousStart = subDays(previousEnd, 30);
  }

  return { start, end: now, previousStart, previousEnd };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "30d") as Period;

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        creators: {
          select: { slug: true, displayName: true }
        }
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const { start, end, previousStart, previousEnd } = getPeriodDates(period);

    // Fetch current period agency earnings
    const currentEarnings = await prisma.agencyEarning.findMany({
      where: {
        agencyId: agency.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        netAmount: true,
        createdAt: true,
        creatorEarning: {
          select: {
            type: true,
            creatorSlug: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch previous period earnings
    const previousEarnings = await prisma.agencyEarning.findMany({
      where: {
        agencyId: agency.id,
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      select: {
        netAmount: true,
        createdAt: true,
      },
    });

    // Calculate totals
    const currentTotal = currentEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const previousTotal = previousEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const change = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : currentTotal > 0 ? 100 : 0;

    // Generate all days in the period
    const allDays = eachDayOfInterval({ start, end });

    // Aggregate by day
    const dailyMap = new Map<string, {
      revenue: number;
      subscriptions: number;
      ppv: number;
      tips: number;
      media: number;
    }>();

    // Initialize all days with zero
    allDays.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      dailyMap.set(dateKey, {
        revenue: 0,
        subscriptions: 0,
        ppv: 0,
        tips: 0,
        media: 0,
      });
    });

    // Fill in actual earnings
    currentEarnings.forEach(earning => {
      const dateKey = format(earning.createdAt, "yyyy-MM-dd");
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.revenue += earning.netAmount;
        const type = earning.creatorEarning?.type;
        switch (type) {
          case "SUBSCRIPTION":
            existing.subscriptions += earning.netAmount;
            break;
          case "PPV":
            existing.ppv += earning.netAmount;
            break;
          case "TIP":
            existing.tips += earning.netAmount;
            break;
          case "MEDIA_UNLOCK":
            existing.media += earning.netAmount;
            break;
        }
      }
    });

    // Convert to array
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Calculate breakdown by type
    const breakdownMap = new Map<string, number>();
    currentEarnings.forEach(earning => {
      const type = (earning.creatorEarning?.type || "other").toLowerCase();
      breakdownMap.set(type, (breakdownMap.get(type) || 0) + earning.netAmount);
    });

    const breakdown = Array.from(breakdownMap.entries()).map(([type, amount]) => ({
      type,
      amount,
      percentage: currentTotal > 0 ? (amount / currentTotal) * 100 : 0,
      change: 0,
    }));

    // Sort breakdown by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    // Breakdown by creator
    const creatorMap = new Map<string, number>();
    currentEarnings.forEach(earning => {
      const slug = earning.creatorEarning?.creatorSlug || "unknown";
      creatorMap.set(slug, (creatorMap.get(slug) || 0) + earning.netAmount);
    });

    const byCreator = Array.from(creatorMap.entries())
      .map(([slug, amount]) => {
        const creator = agency.creators.find(c => c.slug === slug);
        return {
          slug,
          name: creator?.displayName || slug,
          amount,
          percentage: currentTotal > 0 ? (amount / currentTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Previous period daily data for comparison
    const previousDailyMap = new Map<string, number>();
    previousEarnings.forEach(earning => {
      const dateKey = format(earning.createdAt, "yyyy-MM-dd");
      previousDailyMap.set(dateKey, (previousDailyMap.get(dateKey) || 0) + earning.netAmount);
    });

    const previousPeriod = Array.from(previousDailyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Calculate average daily
    const daysCount = daily.length || 1;
    const avgDaily = currentTotal / daysCount;

    return NextResponse.json({
      period,
      summary: {
        total: currentTotal,
        change,
        avgDaily,
      },
      daily,
      previousPeriod,
      breakdown,
      byCreator,
    });
  } catch (error) {
    console.error("Error fetching agency earnings chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
