import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CREATOR_BADGES } from "@/lib/stats/calculate-creator-stats";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/creators/[slug]/public-stats - Get public stats for a creator
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Get creator basic info
    const creator = await prisma.creator.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        categories: true,
        socialLinks: true,
        isListed: true,
        lookingForAgency: true,
        createdAt: true,
        agencyId: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Get stats
    const stats = await prisma.creatorPublicStats.findUnique({
      where: { creatorId: creator.id },
    });

    // Check visibility
    if (stats && !stats.isPublic) {
      return NextResponse.json(
        { error: "Creator stats are not public" },
        { status: 403 }
      );
    }

    // Get recent reviews
    const reviews = await prisma.verifiedReview.findMany({
      where: {
        targetType: "CREATOR",
        targetId: creator.id,
        isPublished: true,
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        communicationRating: true,
        professionalismRating: true,
        contentQualityRating: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Parse stats with visibility settings
    const parsedStats = stats
      ? {
          overview: {
            // Revenue (if visible)
            ...(stats.showRevenue
              ? {
                  revenueLast30d: stats.revenueLast30d,
                  revenueAvg3m: stats.revenueAvg3m,
                  revenueTrend: stats.revenueTrend,
                  revenueBreakdown: {
                    subscriptions: stats.revenueFromSubs,
                    ppv: stats.revenueFromPPV,
                    tips: stats.revenueFromTips,
                    messages: stats.revenueFromMessages,
                  },
                }
              : {
                  revenueLast30d: null,
                  revenueAvg3m: null,
                  revenueTrend: null,
                  revenueBreakdown: null,
                }),

            // Subscribers (if visible)
            ...(stats.showSubscribers
              ? {
                  activeSubscribers: stats.activeSubscribers,
                  subscriberRetention: stats.subscriberRetention,
                  avgSubscriptionMonths: stats.avgSubscriptionMonths,
                  subscriberGrowth30d: stats.subscriberGrowth30d,
                }
              : {
                  activeSubscribers: null,
                  subscriberRetention: null,
                  avgSubscriptionMonths: null,
                  subscriberGrowth30d: null,
                }),

            // Activity (if visible)
            ...(stats.showActivity
              ? {
                  activityRate: stats.activityRate,
                  avgResponseMinutes: stats.avgResponseMinutes,
                  lastActiveAt: stats.lastActiveAt,
                }
              : {
                  activityRate: null,
                  avgResponseMinutes: null,
                  lastActiveAt: null,
                }),

            // Conversion (always visible as it's important for agencies)
            messageToSaleRate: stats.messageToSaleRate,
            ppvUnlockRate: stats.ppvUnlockRate,

            // Content (always visible)
            totalPosts: stats.totalPosts,
            postsLast30d: stats.postsLast30d,
            avgPostsPerWeek: stats.avgPostsPerWeek,
            totalMedia: stats.totalMedia,
          },
          badges: stats.badges
            ? JSON.parse(stats.badges).map((badgeId: string) => {
                const badge = CREATOR_BADGES[badgeId as keyof typeof CREATOR_BADGES];
                return badge ? { id: badge.id, label: badge.label, icon: badge.icon, emoji: badge.emoji } : null;
              }).filter(Boolean)
            : [],
          monthlyHistory: stats.showRevenue && stats.monthlyHistory
            ? JSON.parse(stats.monthlyHistory)
            : [],
          visibility: {
            showRevenue: stats.showRevenue,
            showSubscribers: stats.showSubscribers,
            showActivity: stats.showActivity,
          },
          calculatedAt: stats.calculatedAt,
        }
      : null;

    // Calculate rating distribution
    const ratingCounts = await prisma.verifiedReview.groupBy({
      by: ["rating"],
      where: {
        targetType: "CREATOR",
        targetId: creator.id,
        isPublished: true,
        isHidden: false,
      },
      _count: true,
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingCounts.find((r) => r.rating === rating)?._count || 0,
    }));

    return NextResponse.json({
      creator: {
        id: creator.id,
        slug: creator.slug,
        name: creator.name,
        displayName: creator.displayName,
        avatar: creator.avatar,
        coverImage: creator.coverImage,
        bio: creator.bio,
        categories: creator.categories ? JSON.parse(creator.categories) : [],
        socialLinks: creator.socialLinks ? JSON.parse(creator.socialLinks) : {},
        lookingForAgency: creator.lookingForAgency,
        hasAgency: !!creator.agencyId,
        memberSince: creator.createdAt,
      },
      stats: parsedStats,
      reviews: {
        avgRating: stats?.avgRating || 0,
        totalReviews: stats?.totalReviews || 0,
        distribution: ratingDistribution,
        recent: reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching creator public stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator stats" },
      { status: 500 }
    );
  }
}
