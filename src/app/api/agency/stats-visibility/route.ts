import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/stats-visibility - Get current visibility settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: { publicStats: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({
      isPublic: agency.publicStats?.isPublic ?? true,
      isListed: agency.isListed,
    });
  } catch (error) {
    console.error("Error fetching stats visibility:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats visibility" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/stats-visibility - Update visibility settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isPublic, isListed } = body;

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Update agency listing visibility
    if (typeof isListed === "boolean") {
      await prisma.agency.update({
        where: { id: agency.id },
        data: { isListed },
      });
    }

    // Update stats visibility
    if (typeof isPublic === "boolean") {
      await prisma.agencyPublicStats.upsert({
        where: { agencyId: agency.id },
        create: {
          agencyId: agency.id,
          isPublic,
        },
        update: {
          isPublic,
        },
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
