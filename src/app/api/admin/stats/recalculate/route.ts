import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateAgencyStats, calculateAllAgencyStats } from "@/lib/stats/calculate-agency-stats";
import { calculateCreatorStats, calculateAllCreatorStats } from "@/lib/stats/calculate-creator-stats";

// POST /api/admin/stats/recalculate - Recalculate stats (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, entityId } = body;

    // type: "all" | "agencies" | "creators" | "agency" | "creator"
    // entityId: optional - specific agency or creator ID

    let result: { agencies?: number; creators?: number } = {};

    switch (type) {
      case "all":
        await calculateAllAgencyStats();
        await calculateAllCreatorStats();
        const agencyCount = await prisma.agency.count({ where: { status: "ACTIVE" } });
        const creatorCount = await prisma.creator.count({ where: { isActive: true } });
        result = { agencies: agencyCount, creators: creatorCount };
        break;

      case "agencies":
        await calculateAllAgencyStats();
        const agCount = await prisma.agency.count({ where: { status: "ACTIVE" } });
        result = { agencies: agCount };
        break;

      case "creators":
        await calculateAllCreatorStats();
        const crCount = await prisma.creator.count({ where: { isActive: true } });
        result = { creators: crCount };
        break;

      case "agency":
        if (!entityId) {
          return NextResponse.json({ error: "entityId required" }, { status: 400 });
        }
        await calculateAgencyStats(entityId);
        result = { agencies: 1 };
        break;

      case "creator":
        if (!entityId) {
          return NextResponse.json({ error: "entityId required" }, { status: 400 });
        }
        await calculateCreatorStats(entityId);
        result = { creators: 1 };
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Stats recalculated successfully`,
      ...result,
    });
  } catch (error) {
    console.error("Error recalculating stats:", error);
    return NextResponse.json(
      { error: "Failed to recalculate stats" },
      { status: 500 }
    );
  }
}
