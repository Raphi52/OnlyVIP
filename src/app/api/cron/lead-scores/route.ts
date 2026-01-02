/**
 * Cron Job: Calculate Lead Scores
 *
 * Call daily to update fan lead scores
 * GET /api/cron/lead-scores?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { batchUpdateLeadScores } from "@/lib/lead-scoring";
import { batchUpdateQualifications } from "@/lib/fan-qualifier";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all creators with AI enabled
    const creators = await prisma.creator.findMany({
      where: { aiEnabled: true },
      select: { slug: true },
    });

    let totalScoresUpdated = 0;
    let totalQualificationsUpdated = 0;

    for (const creator of creators) {
      // Update lead scores
      const scoresUpdated = await batchUpdateLeadScores(creator.slug, 100);
      totalScoresUpdated += scoresUpdated;

      // Update qualifications
      const qualUpdated = await batchUpdateQualifications(creator.slug, 100);
      totalQualificationsUpdated += qualUpdated;
    }

    return NextResponse.json({
      success: true,
      creatorsProcessed: creators.length,
      leadScoresUpdated: totalScoresUpdated,
      qualificationsUpdated: totalQualificationsUpdated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lead scores cron error:", error);
    return NextResponse.json(
      { error: "Failed to update lead scores" },
      { status: 500 }
    );
  }
}
