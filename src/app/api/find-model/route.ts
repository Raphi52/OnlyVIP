import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const transformedListings = listings.map(listing => ({
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
    }));

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
