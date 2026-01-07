import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/library - Get user's purchased and favorite content
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "all"; // all, purchased, favorites
    const search = searchParams.get("search") || "";

    // Build search filter
    const searchFilter = search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    // Get purchased media
    const purchases = await prisma.mediaPurchase.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        mediaId: true,
        createdAt: true,
      },
    });
    const purchasedIds = new Set(purchases.map((p) => p.mediaId));

    // Get favorite media
    const favorites = await prisma.userFavorite.findMany({
      where: {
        userId,
      },
      select: {
        mediaId: true,
        createdAt: true,
      },
    });
    const favoriteIds = new Set(favorites.map((f) => f.mediaId));

    let purchasedContent: any[] = [];
    let favoritesContent: any[] = [];

    // Get purchased content
    if (tab === "all" || tab === "purchased") {
      if (purchases.length > 0) {
        const purchasedMedia = await prisma.mediaContent.findMany({
          where: {
            id: {
              in: Array.from(purchasedIds),
            },
            ...searchFilter,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        purchasedContent = purchasedMedia.map((media) => ({
          id: media.id,
          title: media.title,
          type: media.type.toLowerCase(),
          thumbnail: media.thumbnailUrl || "/placeholder.jpg",
          contentUrl: media.contentUrl,
          accessTier: media.accessTier,
          purchasedAt: purchases.find((p) => p.mediaId === media.id)?.createdAt,
          source: "purchased",
          isFavorite: favoriteIds.has(media.id),
        }));
      }
    }

    // Get favorites content
    if (tab === "all" || tab === "favorites") {
      if (favorites.length > 0) {
        const favoriteMedia = await prisma.mediaContent.findMany({
          where: {
            id: {
              in: Array.from(favoriteIds),
            },
            ...searchFilter,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        favoritesContent = favoriteMedia.map((media) => ({
          id: media.id,
          title: media.title,
          type: media.type.toLowerCase(),
          thumbnail: media.thumbnailUrl || "/placeholder.jpg",
          contentUrl: media.contentUrl,
          accessTier: media.accessTier,
          favoritedAt: favorites.find((f) => f.mediaId === media.id)?.createdAt,
          source: "favorites",
          isFavorite: true,
          isPurchased: purchasedIds.has(media.id),
        }));
      }
    }

    return NextResponse.json({
      purchasedContent,
      favoritesContent,
      stats: {
        purchasedCount: purchasedContent.length,
        favoritesCount: favoritesContent.length,
        totalAccessible: purchasedContent.length + favoritesContent.length,
      },
    });
  } catch (error) {
    console.error("Error fetching library:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}
