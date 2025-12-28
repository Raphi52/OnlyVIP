import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Check admin auth (cookie or session)
async function isAdmin(): Promise<boolean> {
  // Check cookie first
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (token?.value) return true;

  // Check session role
  const session = await auth();
  return (session?.user as any)?.role === "ADMIN";
}

// Check creator auth
async function getCreatorAccess(): Promise<{ isCreator: boolean; userId?: string; isAdmin?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { isCreator: false };
  }

  const isSessionAdmin = (session.user as any)?.role === "ADMIN";
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isCreator: true, role: true },
  });

  return {
    isCreator: user?.isCreator === true,
    userId: session.user.id,
    isAdmin: isSessionAdmin || user?.role === "ADMIN",
  };
}

// GET /api/analytics/stats - Get analytics stats (admin or creator)
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    const creator = await getCreatorAccess();

    if (!admin && !creator.isCreator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d
    const creatorSlug = searchParams.get("creator"); // Filter by creator slug

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
      },
    };

    // If creator is requesting, verify they own the profile and filter by their pages
    if (!admin && creator.isCreator && creatorSlug) {
      // Verify creator owns this profile
      const creatorProfile = await prisma.creator.findFirst({
        where: { slug: creatorSlug, userId: creator.userId },
      });
      if (!creatorProfile) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      // Filter by paths that start with the creator's slug
      whereClause.path = { startsWith: `/${creatorSlug}` };
    } else if (creatorSlug) {
      // Admin can view any creator's stats
      whereClause.path = { startsWith: `/${creatorSlug}` };
    }

    // Get all page views in period
    const pageViews = await prisma.pageView.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const totalViews = pageViews.length;
    const uniqueVisitors = new Set(pageViews.map((pv) => pv.visitorId)).size;
    const uniqueSessions = new Set(pageViews.map((pv) => pv.sessionId)).size;

    // Page views by page
    const pageStats: Record<string, number> = {};
    pageViews.forEach((pv) => {
      pageStats[pv.path] = (pageStats[pv.path] || 0) + 1;
    });
    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // Device stats
    const deviceStats: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const device = pv.device || "unknown";
      deviceStats[device] = (deviceStats[device] || 0) + 1;
    });

    // Browser stats
    const browserStats: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const browser = pv.browser || "unknown";
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    });

    // Referrer stats
    const referrerStats: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.referrer) {
        try {
          const url = new URL(pv.referrer);
          const domain = url.hostname;
          referrerStats[domain] = (referrerStats[domain] || 0) + 1;
        } catch {
          referrerStats["Direct"] = (referrerStats["Direct"] || 0) + 1;
        }
      } else {
        referrerStats["Direct"] = (referrerStats["Direct"] || 0) + 1;
      }
    });
    const topReferrers = Object.entries(referrerStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, views]) => ({ source, views }));

    // Views by day (for chart)
    const viewsByDay: Record<string, { views: number; visitors: Set<string> }> = {};
    pageViews.forEach((pv) => {
      const day = pv.createdAt.toISOString().split("T")[0];
      if (!viewsByDay[day]) {
        viewsByDay[day] = { views: 0, visitors: new Set() };
      }
      viewsByDay[day].views++;
      viewsByDay[day].visitors.add(pv.visitorId);
    });

    const chartData = Object.entries(viewsByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }));

    // Recent views (last 20)
    const recentViews = pageViews.slice(0, 20).map((pv) => ({
      id: pv.id,
      path: pv.path,
      device: pv.device,
      browser: pv.browser,
      referrer: pv.referrer,
      createdAt: pv.createdAt,
    }));

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueVisitors,
        uniqueSessions,
        avgViewsPerVisitor: uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(1) : 0,
      },
      topPages,
      topReferrers,
      deviceStats,
      browserStats,
      chartData,
      recentViews,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
