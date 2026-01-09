import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get single PPV link with analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const link = await prisma.pPVLink.findUnique({
      where: { id },
      include: {
        clicks: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: link.creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get media info
    const media = await prisma.mediaContent.findUnique({
      where: { id: link.mediaId },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        type: true,
        ppvPriceCredits: true,
      },
    });

    // Calculate analytics
    const clicksByDay = await prisma.pPVLinkClick.groupBy({
      by: ["createdAt"],
      where: {
        ppvLinkId: id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: true,
    });

    // Group by device
    const clicksByDevice = await prisma.pPVLinkClick.groupBy({
      by: ["device"],
      where: { ppvLinkId: id },
      _count: true,
    });

    // Group by country
    const clicksByCountry = await prisma.pPVLinkClick.groupBy({
      by: ["country"],
      where: { ppvLinkId: id },
      _count: true,
    });

    // Get conversion stats
    const conversions = await prisma.pPVLinkClick.findMany({
      where: {
        ppvLinkId: id,
        converted: true,
      },
      select: {
        purchaseAmount: true,
        convertedAt: true,
      },
    });

    return NextResponse.json({
      link: {
        ...link,
        media,
      },
      analytics: {
        clicksByDay,
        clicksByDevice,
        clicksByCountry,
        conversions,
        totalRevenue: conversions.reduce((sum, c) => sum + (c.purchaseAmount || 0), 0),
      },
    });
  } catch (error) {
    console.error("Error fetching PPV link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update PPV link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, source, campaign, isActive } = body;

    const link = await prisma.pPVLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: link.creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updatedLink = await prisma.pPVLink.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        source: source !== undefined ? source : undefined,
        campaign: campaign !== undefined ? campaign : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json({ success: true, link: updatedLink });
  } catch (error) {
    console.error("Error updating PPV link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete PPV link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const link = await prisma.pPVLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Verify user has access to this creator
    const creator = await prisma.creator.findFirst({
      where: {
        slug: link.creatorSlug,
        OR: [
          { userId: session.user.id },
          { agency: { ownerId: session.user.id } },
        ],
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.pPVLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting PPV link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
