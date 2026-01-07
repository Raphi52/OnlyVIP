import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/user/favorites - Toggle favorite status for a media
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    // Check if media exists
    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_mediaId: {
          userId,
          mediaId,
        },
      },
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.userFavorite.delete({
        where: {
          userId_mediaId: {
            userId,
            mediaId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        isFavorite: false,
        message: "Removed from favorites",
      });
    } else {
      // Add to favorites
      await prisma.userFavorite.create({
        data: {
          userId,
          mediaId,
        },
      });

      return NextResponse.json({
        success: true,
        isFavorite: true,
        message: "Added to favorites",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}

// GET /api/user/favorites - Get user's favorite media IDs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      select: { mediaId: true },
    });

    return NextResponse.json({
      favoriteIds: favorites.map((f) => f.mediaId),
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
