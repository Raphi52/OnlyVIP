import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AGENCY_BADGES } from "@/lib/stats/calculate-agency-stats";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/agencies/[id]/public-stats - Get public stats for an agency
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: agencyId } = await context.params;

    // Get agency basic info
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        tagline: true,
        services: true,
        specialties: true,
        location: true,
        languages: true,
        yearsInBusiness: true,
        socialLinks: true,
        isListed: true,
        publicVisible: true,
        createdAt: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Check visibility
    if (!agency.isListed && !agency.publicVisible) {
      return NextResponse.json(
        { error: "Agency stats are not public" },
        { status: 403 }
      );
    }

    // Get stats
    const stats = await prisma.agencyPublicStats.findUnique({
      where: { agencyId },
    });

    // Get recent reviews
    const reviews = await prisma.verifiedReview.findMany({
      where: {
        targetType: "AGENCY",
        targetId: agencyId,
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
        paymentReliabilityRating: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Parse stats JSON fields
    const parsedStats = stats
      ? {
          overview: {
            activeCreators: stats.activeCreators,
            totalCreatorsEver: stats.totalCreatorsEver,
            avgRevenuePerCreator: stats.avgRevenuePerCreator,
            revenueGrowth3m: stats.revenueGrowth3m,
            payoutSuccessRate: stats.payoutSuccessRate,
            avgPayoutDelayDays: stats.avgPayoutDelayDays,
            avgCollaborationMonths: stats.avgCollaborationMonths,
            retention6m: stats.retention6m,
            retention12m: stats.retention12m,
            avgResponseTimeHours: stats.avgResponseTimeHours,
          },
          commissionRange: {
            min: stats.minCommissionRate,
            max: stats.maxCommissionRate,
            avg: stats.avgCommissionRate,
          },
          badges: stats.badges
            ? JSON.parse(stats.badges).map((badgeId: string) => {
                const badge = AGENCY_BADGES[badgeId as keyof typeof AGENCY_BADGES];
                return badge ? { id: badge.id, label: badge.label, icon: badge.icon, emoji: badge.emoji } : null;
              }).filter(Boolean)
            : [],
          monthlyHistory: stats.monthlyHistory
            ? JSON.parse(stats.monthlyHistory)
            : [],
          calculatedAt: stats.calculatedAt,
        }
      : null;

    // Calculate rating distribution
    const ratingCounts = await prisma.verifiedReview.groupBy({
      by: ["rating"],
      where: {
        targetType: "AGENCY",
        targetId: agencyId,
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
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        logo: agency.logo,
        description: agency.description,
        tagline: agency.tagline,
        services: agency.services ? JSON.parse(agency.services) : [],
        specialties: agency.specialties ? JSON.parse(agency.specialties) : [],
        location: agency.location,
        languages: agency.languages ? JSON.parse(agency.languages) : [],
        yearsInBusiness: agency.yearsInBusiness,
        socialLinks: agency.socialLinks ? JSON.parse(agency.socialLinks) : {},
        memberSince: agency.createdAt,
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
    console.error("Error fetching agency public stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency stats" },
      { status: 500 }
    );
  }
}
