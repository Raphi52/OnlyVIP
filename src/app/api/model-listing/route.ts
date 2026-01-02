import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/model-listing - Get model listing for a specific creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creatorSlug from query params
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    // Find creator - either by slug or first owned by user
    let creator;
    if (creatorSlug) {
      creator = await prisma.creator.findUnique({
        where: { slug: creatorSlug },
        include: { modelListing: true },
      });

      // Verify ownership
      if (creator && creator.userId !== session.user.id) {
        return NextResponse.json({ error: "You can only access your own creators" }, { status: 403 });
      }
    } else {
      // Fallback to first creator (backwards compatibility)
      creator = await prisma.creator.findFirst({
        where: { userId: session.user.id },
        include: { modelListing: true },
      });
    }

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      listing: creator.modelListing,
      creator: {
        id: creator.id,
        slug: creator.slug,
        name: creator.name,
        displayName: creator.displayName,
        avatar: creator.avatar,
        categories: JSON.parse(creator.categories || "[]"),
      },
    });
  } catch (error) {
    console.error("Error fetching model listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch model listing" },
      { status: 500 }
    );
  }
}

// POST /api/model-listing - Create model listing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { creatorSlug, bio, photos, socialLinks, tags, revenueShare, chattingEnabled } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Get the specific creator profile
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { modelListing: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only create listings for your own creators" }, { status: 403 });
    }

    if (creator.modelListing) {
      return NextResponse.json({ error: "This creator already has a listing" }, { status: 400 });
    }

    // Validate photos (max 5)
    if (photos && photos.length > 5) {
      return NextResponse.json({ error: "Maximum 5 photos allowed" }, { status: 400 });
    }

    // Validate revenue share (5-95%)
    const share = revenueShare || 70;
    if (share < 5 || share > 95) {
      return NextResponse.json({ error: "Revenue share must be between 5% and 95%" }, { status: 400 });
    }

    const listing = await prisma.modelListing.create({
      data: {
        creatorId: creator.id,
        bio: bio || null,
        photos: photos || [],
        socialLinks: JSON.stringify(socialLinks || {}),
        tags: tags || [],
        revenueShare: share,
        chattingEnabled: chattingEnabled !== false,
        isActive: true,
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error("Error creating model listing:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create model listing", details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/model-listing - Update model listing
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { creatorSlug } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Get the specific creator profile with listing
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { modelListing: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own creators" }, { status: 403 });
    }

    if (!creator.modelListing) {
      return NextResponse.json({ error: "No listing found for this creator" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.photos !== undefined) {
      if (body.photos.length > 5) {
        return NextResponse.json({ error: "Maximum 5 photos allowed" }, { status: 400 });
      }
      updateData.photos = body.photos;
    }
    if (body.socialLinks !== undefined) updateData.socialLinks = JSON.stringify(body.socialLinks);
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.revenueShare !== undefined) {
      if (body.revenueShare < 5 || body.revenueShare > 95) {
        return NextResponse.json({ error: "Revenue share must be between 5% and 95%" }, { status: 400 });
      }
      updateData.revenueShare = body.revenueShare;
    }
    if (body.chattingEnabled !== undefined) updateData.chattingEnabled = body.chattingEnabled;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const listing = await prisma.modelListing.update({
      where: { id: creator.modelListing.id },
      data: updateData,
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Error updating model listing:", error);
    return NextResponse.json(
      { error: "Failed to update model listing" },
      { status: 500 }
    );
  }
}

// DELETE /api/model-listing - Delete model listing
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creatorSlug from query params
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Get the specific creator profile with listing
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { modelListing: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own listings" }, { status: 403 });
    }

    if (!creator.modelListing) {
      return NextResponse.json({ error: "No listing found for this creator" }, { status: 404 });
    }

    await prisma.modelListing.delete({
      where: { id: creator.modelListing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model listing:", error);
    return NextResponse.json(
      { error: "Failed to delete model listing" },
      { status: 500 }
    );
  }
}
