/**
 * Cron Job: Process Auto-Bumps
 *
 * Call every 30 seconds to send pending bumps
 * GET /api/cron/process-bumps?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { processPendingBumps, scheduleDormantReactivations } from "@/lib/auto-bump";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Process pending bumps
    const sentCount = await processPendingBumps(10);

    // Once per hour, check for dormant fans (when minute = 0)
    const now = new Date();
    let dormantScheduled = 0;

    if (now.getMinutes() === 0) {
      // Get all active creators
      const creators = await prisma.creator.findMany({
        where: { isActive: true },
        select: { slug: true },
      });

      for (const creator of creators) {
        // Schedule 7-day dormant bumps
        dormantScheduled += await scheduleDormantReactivations(creator.slug, 7);
      }
    }

    return NextResponse.json({
      success: true,
      bumpsSent: sentCount,
      dormantScheduled,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Process bumps error:", error);
    return NextResponse.json(
      { error: "Failed to process bumps" },
      { status: 500 }
    );
  }
}
