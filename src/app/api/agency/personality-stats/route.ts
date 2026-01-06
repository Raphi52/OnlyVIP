import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/personality-stats - Get personality switch statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");
    const period = searchParams.get("period") || "7d"; // 7d, 30d, all

    // Get user's agency
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        creators: {
          select: { slug: true },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const agencyCreatorSlugs = agency.creators.map((c) => c.slug);

    // Validate creatorSlug if provided
    if (creatorSlug && !agencyCreatorSlugs.includes(creatorSlug)) {
      return NextResponse.json(
        { error: "Creator not in your agency" },
        { status: 403 }
      );
    }

    // Calculate date range
    let startDate: Date | undefined;
    if (period === "7d") {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const whereClause: any = {
      toPersonality: {
        creatorSlug: creatorSlug || { in: agencyCreatorSlugs },
      },
    };
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    // Get switches with personality details
    const switches = await prisma.personalitySwitch.findMany({
      where: whereClause,
      include: {
        fromPersonality: { select: { id: true, name: true } },
        toPersonality: { select: { id: true, name: true, creatorSlug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate stats
    const switchesByPersonality: Record<string, number> = {};
    const switchesByReason: Record<string, number> = {};
    const switchesByTone: Record<string, number> = {};
    const switchesByDay: Record<string, number> = {};
    const switchesByCreator: Record<string, number> = {};

    for (const s of switches) {
      // By personality
      const name = s.toPersonality?.name || "Unknown";
      switchesByPersonality[name] = (switchesByPersonality[name] || 0) + 1;

      // By reason
      const reasonLabel =
        s.reason === "initial_assignment"
          ? "Initial"
          : s.reason === "auto_tone"
          ? "Auto (Tone)"
          : "Manual";
      switchesByReason[reasonLabel] = (switchesByReason[reasonLabel] || 0) + 1;

      // By tone (if auto_tone)
      if (s.detectedTone) {
        switchesByTone[s.detectedTone] =
          (switchesByTone[s.detectedTone] || 0) + 1;
      }

      // By day
      const day = s.createdAt.toISOString().split("T")[0];
      switchesByDay[day] = (switchesByDay[day] || 0) + 1;

      // By creator
      const creatorName = s.toPersonality?.creatorSlug || "Unknown";
      switchesByCreator[creatorName] =
        (switchesByCreator[creatorName] || 0) + 1;
    }

    // Get personality usage stats (conversations per personality)
    const conversationStats = await prisma.conversation.groupBy({
      by: ["aiPersonalityId"],
      where: {
        aiPersonalityId: { not: null },
        creatorSlug: creatorSlug || { in: agencyCreatorSlugs },
      },
      _count: { id: true },
    });

    // Get personality names for conversation stats
    const personalityIds = conversationStats
      .map((s) => s.aiPersonalityId)
      .filter((id): id is string => id !== null);

    const personalities = await prisma.creatorAiPersonality.findMany({
      where: { id: { in: personalityIds } },
      select: { id: true, name: true },
    });

    const personalityNameMap = new Map(personalities.map((p) => [p.id, p.name]));

    const conversationsByPersonality = Object.fromEntries(
      conversationStats.map((s) => [
        personalityNameMap.get(s.aiPersonalityId!) || "Unknown",
        s._count.id,
      ])
    );

    // Get recent switches for activity log
    const recentSwitches = switches.slice(0, 20).map((s) => ({
      id: s.id,
      fromPersonality: s.fromPersonality?.name || null,
      toPersonality: s.toPersonality?.name || "Unknown",
      reason: s.reason,
      detectedTone: s.detectedTone,
      createdAt: s.createdAt,
      creatorSlug: s.toPersonality?.creatorSlug,
    }));

    return NextResponse.json({
      totalSwitches: switches.length,
      switchesByPersonality,
      switchesByReason,
      switchesByTone,
      switchesByDay,
      switchesByCreator,
      conversationsByPersonality,
      recentSwitches,
      period,
    });
  } catch (error) {
    console.error("Error getting personality stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
