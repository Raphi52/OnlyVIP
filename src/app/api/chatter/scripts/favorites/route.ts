import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/scripts/favorites - Get favorites list
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    const favorites = await prisma.chatterScriptFavorite.findMany({
      where: { chatterId },
      orderBy: { order: "asc" },
      include: {
        script: {
          include: {
            folder: {
              select: { id: true, name: true, icon: true },
            },
            mediaItems: {
              include: {
                media: {
                  select: { id: true, contentUrl: true, type: true, thumbnailUrl: true },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    // Filter out deleted/inactive scripts
    const activeFavorites = favorites
      .filter((f) => f.script.isActive && f.script.status === "APPROVED")
      .map((f) => ({
        ...f.script,
        favoriteId: f.id,
        favoriteOrder: f.order,
      }));

    return NextResponse.json({ favorites: activeFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST /api/chatter/scripts/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const body = await request.json();
    const { scriptId } = body;

    if (!scriptId) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Check if script exists and is approved
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { id: true, isActive: true, status: true },
    });

    if (!script || !script.isActive || script.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Script not found or not available" },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await prisma.chatterScriptFavorite.findFirst({
      where: { chatterId, scriptId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already in favorites" },
        { status: 400 }
      );
    }

    // Get max order
    const maxOrder = await prisma.chatterScriptFavorite.findFirst({
      where: { chatterId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    // Create favorite
    const favorite = await prisma.chatterScriptFavorite.create({
      data: {
        chatterId,
        scriptId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/chatter/scripts/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("scriptId");

    if (!scriptId) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Find and delete favorite
    const favorite = await prisma.chatterScriptFavorite.findFirst({
      where: { chatterId, scriptId },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    await prisma.chatterScriptFavorite.delete({
      where: { id: favorite.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}

// PUT /api/chatter/scripts/favorites - Reorder favorites
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const body = await request.json();
    const { scriptIds } = body; // Array of script IDs in desired order

    if (!scriptIds || !Array.isArray(scriptIds)) {
      return NextResponse.json(
        { error: "Script IDs array is required" },
        { status: 400 }
      );
    }

    // Update order for each favorite
    await Promise.all(
      scriptIds.map((scriptId: string, index: number) =>
        prisma.chatterScriptFavorite.updateMany({
          where: { chatterId, scriptId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering favorites:", error);
    return NextResponse.json(
      { error: "Failed to reorder favorites" },
      { status: 500 }
    );
  }
}
