/**
 * Cron Job: Send Retargeting Campaigns
 *
 * Call every hour to:
 * - Create dormant campaigns
 * - Send pending emails
 * - Check for birthdays
 *
 * GET /api/cron/retargeting?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createDormantCampaigns,
  createBirthdayCampaigns,
  sendPendingCampaigns,
} from "@/lib/retargeting";
import { sendFlashSaleReminders, expireFlashSales } from "@/lib/bundle-manager";
import { cleanExpiredMemories } from "@/lib/memory-extractor";
import { expireOldHandoffs } from "@/lib/handoff-manager";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = {
      dormantCampaigns: 0,
      birthdayCampaigns: 0,
      emailsSent: 0,
      flashSaleReminders: 0,
      flashSalesExpired: 0,
      memoriesCleaned: 0,
      handoffsExpired: 0,
    };

    // Get all active creators
    const creators = await prisma.creator.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    // Create dormant campaigns (7-day)
    for (const creator of creators) {
      stats.dormantCampaigns += await createDormantCampaigns(creator.slug, {
        dormantDays: 7,
        limit: 50,
      });
    }

    // Check for birthdays (once per day at midnight)
    const now = new Date();
    if (now.getHours() === 0) {
      stats.birthdayCampaigns = await createBirthdayCampaigns();
    }

    // Send pending email campaigns
    stats.emailsSent = await sendPendingCampaigns(50);

    // Send flash sale reminders
    stats.flashSaleReminders = await sendFlashSaleReminders();

    // Expire old flash sales
    stats.flashSalesExpired = await expireFlashSales();

    // Clean expired memories
    stats.memoriesCleaned = await cleanExpiredMemories();

    // Expire old handoffs
    stats.handoffsExpired = await expireOldHandoffs();

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Retargeting cron error:", error);
    return NextResponse.json(
      { error: "Failed to process retargeting" },
      { status: 500 }
    );
  }
}
