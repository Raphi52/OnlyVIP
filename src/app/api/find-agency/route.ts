import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AGENCY_BADGES } from "@/lib/stats/calculate-agency-stats";

// GET /api/find-agency - List all public agencies for creators to browse
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator's listing to check for existing applications
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      include: { modelListing: true },
    });

    // Get all agencies that have an active listing (looking for models)
    const agencies = await prisma.agency.findMany({
      where: {
        status: "ACTIVE",
        // Must have an active listing to appear
        listing: {
          isActive: true,
        },
      },
      include: {
        listing: true,
        publicStats: true, // Include verified stats
        creators: {
          where: { isActive: true },
          select: {
            id: true,
            slug: true,
            name: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: { creators: true },
        },
      },
      orderBy: [
        { averageRating: "desc" },
        { totalRevenue: "desc" },
      ],
    });

    // Get existing applications for this model
    let applicationStatuses: Record<string, string> = {};
    if (creator?.modelListing) {
      const applications = await prisma.agencyApplication.findMany({
        where: { modelListingId: creator.modelListing.id },
        select: { agencyId: true, status: true },
      });
      applicationStatuses = applications.reduce((acc, app) => {
        acc[app.agencyId] = app.status;
        return acc;
      }, {} as Record<string, string>);
    }

    // Get reviews for agencies
    const agencyIds = agencies.map(a => a.id);
    const reviews = await prisma.agencyReview.findMany({
      where: {
        targetId: { in: agencyIds },
        targetType: "AGENCY",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Group reviews by agency
    const reviewsByAgency: Record<string, any[]> = {};
    for (const review of reviews) {
      if (!reviewsByAgency[review.targetId]) {
        reviewsByAgency[review.targetId] = [];
      }
      reviewsByAgency[review.targetId].push(review);
    }

    // Filter out agency if creator is already part of it
    const filteredAgencies = creator?.agencyId
      ? agencies.filter(agency => agency.id !== creator.agencyId)
      : agencies;

    // Transform agencies
    const transformedAgencies = filteredAgencies.map(agency => {
      const listing = agency.listing!;
      const stats = agency.publicStats;

      // Parse badges if stats exist and are public
      const badges = stats?.isPublic && stats?.badges
        ? JSON.parse(stats.badges).slice(0, 3).map((badgeId: string) => {
            const badge = AGENCY_BADGES[badgeId as keyof typeof AGENCY_BADGES];
            return badge ? { id: badge.id, label: badge.label, icon: badge.icon, emoji: badge.emoji } : null;
          }).filter(Boolean)
        : [];

      return {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        logo: agency.logo,
        website: agency.website,
        // Listing data (the public "looking for models" info)
        listingId: listing.id,
        headline: listing.headline,
        description: listing.description,
        lookingFor: listing.lookingFor ? JSON.parse(listing.lookingFor) : [],
        contentTypes: listing.contentTypes ? JSON.parse(listing.contentTypes) : [],
        requirements: listing.requirements,
        minRevenueShare: listing.minRevenueShare,
        maxRevenueShare: listing.maxRevenueShare,
        providesContent: listing.providesContent,
        providesChatting: listing.providesChatting,
        providesMarketing: listing.providesMarketing,
        location: listing.location,
        acceptsRemote: listing.acceptsRemote,
        // Agency stats (original)
        creatorCount: agency._count.creators,
        creators: agency.creators.slice(0, 5),
        averageRating: listing.averageRating,
        reviewCount: listing.reviewCount,
        reviews: (reviewsByAgency[agency.id] || []).slice(0, 3),
        applicationStatus: applicationStatuses[agency.id] || null,
        createdAt: listing.createdAt,

        // Verified Stats (if public and available)
        verifiedStats: stats?.isPublic ? {
          activeCreators: stats.activeCreators,
          avgRevenuePerCreator: stats.avgRevenuePerCreator,
          revenueGrowth3m: stats.revenueGrowth3m,
          payoutSuccessRate: stats.payoutSuccessRate,
          avgPayoutDelayDays: stats.avgPayoutDelayDays,
          retention12m: stats.retention12m,
          avgResponseTimeHours: stats.avgResponseTimeHours,
          commissionRange: {
            min: stats.minCommissionRate,
            max: stats.maxCommissionRate,
            avg: stats.avgCommissionRate,
          },
          avgRating: stats.avgRating,
          totalReviews: stats.totalReviews,
          badges,
          calculatedAt: stats.calculatedAt,
        } : null,
      };
    });

    return NextResponse.json({
      agencies: transformedAgencies,
      hasListing: !!creator?.modelListing,
    });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}
