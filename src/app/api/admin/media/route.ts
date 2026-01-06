import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/media - Get all media for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const creatorSlug = searchParams.get("creator") || "";
    const type = searchParams.get("type") || "";
    const tag = searchParams.get("tag") || "";

    // Build where clause
    const where: any = {};

    if (creatorSlug) {
      where.creatorSlug = creatorSlug;
    }

    if (type) {
      where.type = type;
    }

    if (tag) {
      switch (tag) {
        case "gallery":
          where.tagGallery = true;
          break;
        case "ppv":
          where.tagPPV = true;
          break;
        case "ai":
          where.tagAI = true;
          break;
        case "free":
          where.tagFree = true;
          break;
        case "vip":
          where.tagVIP = true;
          break;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { creatorSlug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [media, total, creators] = await Promise.all([
      prisma.mediaContent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mediaContent.count({ where }),
      // Get list of creators for filter dropdown
      prisma.creator.findMany({
        select: { slug: true, displayName: true, avatar: true },
        orderBy: { displayName: "asc" },
      }),
    ]);

    // Map creators by slug for lookup
    const creatorsMap = new Map(
      creators.map((c) => [c.slug, c])
    );

    // Stats
    const stats = await prisma.mediaContent.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    const statsMap = Object.fromEntries(
      stats.map((s) => [s.type, s._count.type])
    );

    return NextResponse.json({
      media: media.map((m) => {
        const creator = creatorsMap.get(m.creatorSlug);
        return {
          id: m.id,
          title: m.title,
          slug: m.slug,
          description: m.description,
          type: m.type,
          accessTier: m.accessTier,
          thumbnailUrl: m.thumbnailUrl,
          previewUrl: m.previewUrl,
          contentUrl: m.contentUrl,
          isPurchaseable: m.isPurchaseable,
          price: m.price,
          tagGallery: m.tagGallery,
          tagPPV: m.tagPPV,
          tagAI: m.tagAI,
          tagFree: m.tagFree,
          tagVIP: m.tagVIP,
          ppvPriceCredits: m.ppvPriceCredits,
          viewCount: m.viewCount,
          purchaseCount: m.purchaseCount,
          isFeatured: m.isFeatured,
          creator: creator
            ? { slug: creator.slug, displayName: creator.displayName, avatar: creator.avatar }
            : { slug: m.creatorSlug, displayName: m.creatorSlug, avatar: null },
          createdAt: m.createdAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        photos: statsMap["PHOTO"] || 0,
        videos: statsMap["VIDEO"] || 0,
        audio: statsMap["AUDIO"] || 0,
        packs: statsMap["PACK"] || 0,
      },
      creators,
    });
  } catch (error) {
    console.error("Error fetching admin media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media - Delete media (for moderation)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    await prisma.mediaContent.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
