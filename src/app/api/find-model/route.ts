import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CREATOR_BADGES } from "@/lib/stats/calculate-creator-stats";

// GET /api/find-model - List all active model listings for agencies to browse
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an agency owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAgencyOwner) {
      return NextResponse.json({ error: "You must be an agency owner" }, { status: 403 });
    }

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Parse query params for filters
    const { searchParams } = new URL(request.url);
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const maxShare = parseInt(searchParams.get("maxShare") || "100");
    const minShare = parseInt(searchParams.get("minShare") || "0");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const chattingOnly = searchParams.get("chattingOnly") === "true";

    // Build where clause
    const where: any = {
      isActive: true,
      revenueShare: {
        gte: minShare,
        lte: maxShare,
      },
    };

    if (minRating > 0) {
      where.averageRating = { gte: minRating };
    }

    if (chattingOnly) {
      where.chattingEnabled = true;
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Get all active model listings
    const allListings = await prisma.modelListing.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            slug: true,
            name: true,
            displayName: true,
            avatar: true,
            categories: true,
            agencyId: true,
            publicStats: true, // Include verified stats
          },
        },
      },
      orderBy: [
        { averageRating: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Filter out creators that are already part of this agency
    const listings = allListings.filter(listing => listing.creator.agencyId !== agency.id);

    // Get existing applications from this agency
    const listingIds = listings.map(l => l.id);
    const applications = await prisma.agencyApplication.findMany({
      where: {
        agencyId: agency.id,
        modelListingId: { in: listingIds },
      },
      select: { modelListingId: true, status: true },
    });

    const applicationStatuses: Record<string, string> = {};
    for (const app of applications) {
      if (app.modelListingId) {
        applicationStatuses[app.modelListingId] = app.status;
      }
    }

    // Get reviews for models
    const creatorIds = listings.map(l => l.creatorId);
    const reviews = await prisma.agencyReview.findMany({
      where: {
        targetId: { in: creatorIds },
        targetType: "MODEL",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Group reviews by creator
    const reviewsByCreator: Record<string, any[]> = {};
    for (const review of reviews) {
      if (!reviewsByCreator[review.targetId]) {
        reviewsByCreator[review.targetId] = [];
      }
      reviewsByCreator[review.targetId].push(review);
    }

    // Transform listings
    const transformedListings = listings.map(listing => {
      const stats = listing.creator.publicStats;

      // Parse badges if stats exist and are public
      const badges = stats?.isPublic && stats?.badges
        ? JSON.parse(stats.badges).slice(0, 3).map((badgeId: string) => {
            const badge = CREATOR_BADGES[badgeId as keyof typeof CREATOR_BADGES];
            return badge ? { id: badge.id, label: badge.label, icon: badge.icon, emoji: badge.emoji } : null;
          }).filter(Boolean)
        : [];

      return {
        id: listing.id,
        bio: listing.bio,
        photos: listing.photos,
        socialLinks: JSON.parse(listing.socialLinks || "{}"),
        tags: listing.tags,
        revenueShare: listing.revenueShare,
        chattingEnabled: listing.chattingEnabled,
        averageRating: listing.averageRating,
        reviewCount: listing.reviewCount,
        creator: {
          id: listing.creator.id,
          slug: listing.creator.slug,
          name: listing.creator.name,
          displayName: listing.creator.displayName,
          avatar: listing.creator.avatar,
          categories: JSON.parse(listing.creator.categories || "[]"),
        },
        reviews: (reviewsByCreator[listing.creatorId] || []).slice(0, 3),
        applicationStatus: applicationStatuses[listing.id] || null,
        createdAt: listing.createdAt,

        // Verified Stats (if public and available, respecting visibility settings)
        verifiedStats: stats?.isPublic ? {
          // Revenue (if creator allows)
          revenueLast30d: stats.showRevenue ? stats.revenueLast30d : null,
          revenueAvg3m: stats.showRevenue ? stats.revenueAvg3m : null,
          revenueTrend: stats.showRevenue ? stats.revenueTrend : null,

          // Subscribers (if creator allows)
          activeSubscribers: stats.showSubscribers ? stats.activeSubscribers : null,
          subscriberRetention: stats.showSubscribers ? stats.subscriberRetention : null,
          subscriberGrowth30d: stats.showSubscribers ? stats.subscriberGrowth30d : null,

          // Activity (if creator allows)
          activityRate: stats.showActivity ? stats.activityRate : null,
          avgResponseMinutes: stats.showActivity ? stats.avgResponseMinutes : null,

          // Always visible (important for agencies)
          messageToSaleRate: stats.messageToSaleRate,
          ppvUnlockRate: stats.ppvUnlockRate,
          totalPosts: stats.totalPosts,
          avgPostsPerWeek: stats.avgPostsPerWeek,

          avgRating: stats.avgRating,
          totalReviews: stats.totalReviews,
          badges,

          // Visibility flags
          visibility: {
            showRevenue: stats.showRevenue,
            showSubscribers: stats.showSubscribers,
            showActivity: stats.showActivity,
          },
          calculatedAt: stats.calculatedAt,
        } : null,
      };
    });

    // Get all unique tags for filter options
    const allTags = new Set<string>();
    for (const listing of listings) {
      for (const tag of listing.tags) {
        allTags.add(tag);
      }
    }

    return NextResponse.json({
      listings: transformedListings,
      filterOptions: {
        tags: Array.from(allTags).sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching model listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch model listings" },
      { status: 500 }
    );
  }
}
