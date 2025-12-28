import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to determine if a string is a cuid (id) or slug
function isCuid(str: string): boolean {
  // cuids are typically 25 characters and start with 'c'
  return str.length === 25 && str.startsWith("c") && /^[a-z0-9]+$/.test(str);
}

// GET /api/admin/creators/[id] - Get a specific creator (supports both ID and slug)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try to find by id first if it looks like a cuid, otherwise by slug
    const creator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id } })
      : await prisma.creator.findUnique({ where: { slug: id } });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership - only allow viewing creators the user owns
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only view your own creators" }, { status: 403 });
    }

    return NextResponse.json({
      ...creator,
      socialLinks: JSON.parse(creator.socialLinks || "{}"),
      theme: JSON.parse(creator.theme || "{}"),
      stats: {
        photos: creator.photoCount,
        videos: creator.videoCount,
        subscribers: creator.subscriberCount,
      },
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/creators/[id] - Update a specific creator (supports both ID and slug)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Find creator by id or slug
    const existingCreator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id }, select: { id: true, userId: true } })
      : await prisma.creator.findUnique({ where: { slug: id }, select: { id: true, userId: true } });

    if (!existingCreator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingCreator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own creators" }, { status: 403 });
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.cardImage !== undefined) updateData.cardImage = body.cardImage;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.socialLinks !== undefined) {
      updateData.socialLinks = JSON.stringify(body.socialLinks);
    }

    // AI Girlfriend Mode fields
    if (body.aiEnabled !== undefined) updateData.aiEnabled = body.aiEnabled;
    if (body.aiResponseDelay !== undefined) updateData.aiResponseDelay = body.aiResponseDelay;
    if (body.aiPersonality !== undefined) updateData.aiPersonality = body.aiPersonality;

    const creator = await prisma.creator.update({
      where: { id: existingCreator.id },
      data: updateData,
    });

    return NextResponse.json({
      creator: {
        ...creator,
        socialLinks: JSON.parse(creator.socialLinks || "{}"),
        theme: JSON.parse(creator.theme || "{}"),
        stats: {
          photos: creator.photoCount,
          videos: creator.videoCount,
          subscribers: creator.subscriberCount,
        },
      },
    });
  } catch (error) {
    console.error("Error updating creator:", error);
    return NextResponse.json(
      { error: "Failed to update creator" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/creators/[id] - Delete a specific creator (supports both ID and slug)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteMedia = searchParams.get("deleteMedia") === "true";

    // Find the creator by id or slug
    const creator = isCuid(id)
      ? await prisma.creator.findUnique({ where: { id } })
      : await prisma.creator.findUnique({ where: { slug: id } });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Verify ownership
    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own creators" }, { status: 403 });
    }

    if (deleteMedia) {
      // Delete all associated data
      await prisma.$transaction([
        prisma.mediaContent.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.conversation.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.payment.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.subscription.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.creator.delete({ where: { id: creator.id } }),
      ]);
    } else {
      await prisma.creator.delete({ where: { id: creator.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting creator:", error);
    return NextResponse.json(
      { error: "Failed to delete creator" },
      { status: 500 }
    );
  }
}
