import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/creators/[id] - Get a specific creator
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

    const creator = await prisma.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
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

// PATCH /api/admin/creators/[id] - Update a specific creator
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

    const creator = await prisma.creator.update({
      where: { id },
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

// DELETE /api/admin/creators/[id] - Delete a specific creator
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

    // Find the creator first
    const creator = await prisma.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (deleteMedia) {
      // Delete all associated data
      await prisma.$transaction([
        prisma.mediaContent.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.conversation.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.payment.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.subscription.deleteMany({ where: { creatorSlug: creator.slug } }),
        prisma.creator.delete({ where: { id } }),
      ]);
    } else {
      await prisma.creator.delete({ where: { id } });
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
