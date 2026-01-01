import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency-reviews - Get reviews for an agency or model
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");
    const targetType = searchParams.get("targetType"); // "AGENCY" or "MODEL"

    if (!targetId || !targetType) {
      return NextResponse.json({ error: "targetId and targetType required" }, { status: 400 });
    }

    const reviews = await prisma.agencyReview.findMany({
      where: {
        targetId,
        targetType,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get reviewer info
    const reviewerIds = reviews.map(r => r.reviewerId);
    const users = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Calculate stats
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
    for (const review of reviews) {
      ratingDistribution[review.rating - 1]++;
    }

    const transformedReviews = reviews.map(review => ({
      ...review,
      reviewer: userMap.get(review.reviewerId) || null,
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      stats: {
        averageRating,
        reviewCount: reviews.length,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/agency-reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetId, targetType, rating, comment } = body;

    if (!targetId || !targetType || !rating) {
      return NextResponse.json({ error: "targetId, targetType, and rating required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!["AGENCY", "MODEL"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }

    // Determine reviewer type based on what they're reviewing
    let reviewerType: string;
    let collaborationStartedAt: Date | null = null;

    if (targetType === "AGENCY") {
      // Model reviewing an agency
      reviewerType = "MODEL";

      // Find accepted application to verify collaboration
      const creator = await prisma.creator.findFirst({
        where: { userId: session.user.id },
        include: { modelListing: true },
      });

      if (!creator?.modelListing) {
        return NextResponse.json({ error: "You must have a listing to review agencies" }, { status: 403 });
      }

      const application = await prisma.agencyApplication.findFirst({
        where: {
          modelListingId: creator.modelListing.id,
          agencyId: targetId,
          status: "ACCEPTED",
        },
      });

      if (!application) {
        return NextResponse.json({ error: "No accepted application found with this agency" }, { status: 403 });
      }

      collaborationStartedAt = application.updatedAt;
    } else {
      // Agency reviewing a model
      reviewerType = "AGENCY";

      // Find accepted application to verify collaboration
      const agency = await prisma.agency.findFirst({
        where: { ownerId: session.user.id },
      });

      if (!agency) {
        return NextResponse.json({ error: "You must have an agency to review models" }, { status: 403 });
      }

      // Find the model listing for this creator
      const targetCreator = await prisma.creator.findUnique({
        where: { id: targetId },
        include: { modelListing: true },
      });

      if (!targetCreator?.modelListing) {
        return NextResponse.json({ error: "Model listing not found" }, { status: 404 });
      }

      const application = await prisma.agencyApplication.findFirst({
        where: {
          modelListingId: targetCreator.modelListing.id,
          agencyId: agency.id,
          status: "ACCEPTED",
        },
      });

      if (!application) {
        return NextResponse.json({ error: "No accepted application found with this model" }, { status: 403 });
      }

      collaborationStartedAt = application.updatedAt;
    }

    // Check 1 month requirement
    if (!collaborationStartedAt) {
      return NextResponse.json({ error: "Cannot determine collaboration date" }, { status: 400 });
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (collaborationStartedAt > oneMonthAgo) {
      const daysRemaining = Math.ceil(
        (collaborationStartedAt.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return NextResponse.json({
        error: `You can review after 1 month of collaboration. ${daysRemaining} days remaining.`,
      }, { status: 400 });
    }

    // Check if already reviewed
    const existingReview = await prisma.agencyReview.findUnique({
      where: {
        reviewerId_targetId: {
          reviewerId: session.user.id,
          targetId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this" }, { status: 400 });
    }

    // Create review
    const review = await prisma.agencyReview.create({
      data: {
        reviewerId: session.user.id,
        reviewerType,
        targetId,
        targetType,
        rating,
        comment: comment || null,
        collaborationStartedAt,
      },
    });

    // Update target's cached rating
    const allReviews = await prisma.agencyReview.findMany({
      where: { targetId, targetType },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    if (targetType === "AGENCY") {
      await prisma.agency.update({
        where: { id: targetId },
        data: {
          averageRating: avgRating,
          reviewCount: allReviews.length,
        },
      });
    } else {
      // Update model listing rating
      const listing = await prisma.modelListing.findFirst({
        where: { creatorId: targetId },
      });
      if (listing) {
        await prisma.modelListing.update({
          where: { id: listing.id },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });
      }
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
