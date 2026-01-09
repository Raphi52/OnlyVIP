import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get global PPV analytics for creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, all

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized for this creator" }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
    }

    // Get all PPV links for this creator
    const links = await prisma.pPVLink.findMany({
      where: { creatorSlug },
      select: {
        id: true,
        shortCode: true,
        name: true,
        source: true,
        campaign: true,
        mediaId: true,
        totalClicks: true,
        uniqueClicks: true,
        totalPurchases: true,
        totalRevenue: true,
        conversionRate: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { totalRevenue: "desc" },
    });

    // Get media info for all links
    const mediaIds = [...new Set(links.map((l) => l.mediaId))];
    const mediaList = await prisma.mediaContent.findMany({
      where: { id: { in: mediaIds } },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        type: true,
        ppvPriceCredits: true,
      },
    });
    const mediaMap = new Map(mediaList.map((m) => [m.id, m]));

    // Calculate totals
    const totals = {
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.isActive).length,
      totalClicks: links.reduce((sum, l) => sum + l.totalClicks, 0),
      uniqueClicks: links.reduce((sum, l) => sum + l.uniqueClicks, 0),
      totalPurchases: links.reduce((sum, l) => sum + l.totalPurchases, 0),
      totalRevenue: links.reduce((sum, l) => sum + l.totalRevenue, 0),
      avgConversionRate:
        links.length > 0
          ? links.reduce((sum, l) => sum + l.conversionRate, 0) / links.length
          : 0,
    };

    // Get clicks over time (for chart)
    const clicksOverTime = await prisma.pPVLinkClick.groupBy({
      by: ["createdAt"],
      where: {
        ppvLink: { creatorSlug },
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      _count: true,
    });

    // Group by source
    const bySource = await prisma.pPVLink.groupBy({
      by: ["source"],
      where: { creatorSlug },
      _sum: {
        totalClicks: true,
        uniqueClicks: true,
        totalPurchases: true,
        totalRevenue: true,
      },
    });

    // Group by campaign
    const byCampaign = await prisma.pPVLink.groupBy({
      by: ["campaign"],
      where: { creatorSlug },
      _sum: {
        totalClicks: true,
        uniqueClicks: true,
        totalPurchases: true,
        totalRevenue: true,
      },
    });

    // Top performing links
    const topLinks = links.slice(0, 10).map((link) => ({
      ...link,
      media: mediaMap.get(link.mediaId) || null,
    }));

    // Group clicks by device
    const byDevice = await prisma.pPVLinkClick.groupBy({
      by: ["device"],
      where: {
        ppvLink: { creatorSlug },
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      _count: true,
    });

    // Group clicks by country
    const byCountry = await prisma.pPVLinkClick.groupBy({
      by: ["country"],
      where: {
        ppvLink: { creatorSlug },
        ...(startDate && { createdAt: { gte: startDate } }),
        country: { not: null },
      },
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      totals,
      topLinks,
      breakdown: {
        bySource,
        byCampaign,
        byDevice,
        byCountry,
      },
      clicksOverTime,
    });
  } catch (error) {
    console.error("Error fetching PPV analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
