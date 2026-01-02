import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/creator/stats-visibility - Get current visibility settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's creator profile
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      include: { publicStats: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({
      isPublic: creator.publicStats?.isPublic ?? true,
      showRevenue: creator.publicStats?.showRevenue ?? true,
      showSubscribers: creator.publicStats?.showSubscribers ?? true,
      showActivity: creator.publicStats?.showActivity ?? true,
      isListed: creator.isListed,
      lookingForAgency: creator.lookingForAgency,
    });
  } catch (error) {
    console.error("Error fetching stats visibility:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats visibility" },
      { status: 500 }
    );
  }
}

// PATCH /api/creator/stats-visibility - Update visibility settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isPublic,
      showRevenue,
      showSubscribers,
      showActivity,
      isListed,
      lookingForAgency,
    } = body;

    // Get user's creator profile
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Update creator listing visibility
    const creatorUpdates: any = {};
    if (typeof isListed === "boolean") {
      creatorUpdates.isListed = isListed;
    }
    if (typeof lookingForAgency === "boolean") {
      creatorUpdates.lookingForAgency = lookingForAgency;
    }

    if (Object.keys(creatorUpdates).length > 0) {
      await prisma.creator.update({
        where: { id: creator.id },
        data: creatorUpdates,
      });
    }

    // Update stats visibility
    const statsUpdates: any = {};
    if (typeof isPublic === "boolean") statsUpdates.isPublic = isPublic;
    if (typeof showRevenue === "boolean") statsUpdates.showRevenue = showRevenue;
    if (typeof showSubscribers === "boolean") statsUpdates.showSubscribers = showSubscribers;
    if (typeof showActivity === "boolean") statsUpdates.showActivity = showActivity;

    if (Object.keys(statsUpdates).length > 0) {
      await prisma.creatorPublicStats.upsert({
        where: { creatorId: creator.id },
        create: {
          creatorId: creator.id,
          ...statsUpdates,
        },
        update: statsUpdates,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating stats visibility:", error);
    return NextResponse.json(
      { error: "Failed to update stats visibility" },
      { status: 500 }
    );
  }
}
