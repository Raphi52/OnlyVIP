import { NextRequest, NextResponse } from "next/server";
import { expireCredits, grantRecurringCredits } from "@/lib/credits";

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/credits - Run credit maintenance tasks
// Should be called daily by a cron job (e.g., Vercel Cron)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("[CRON] Starting credit maintenance...");

    // 1. Expire old credits
    const expirationResult = await expireCredits();
    console.log(
      `[CRON] Expired ${expirationResult.creditsExpired} credits for ${expirationResult.usersAffected} users`
    );

    // 2. Grant recurring credits to VIP subscribers
    const grantResult = await grantRecurringCredits();
    console.log(
      `[CRON] Granted ${grantResult.creditsGranted} recurring credits to ${grantResult.usersGranted} users`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expiration: {
        usersAffected: expirationResult.usersAffected,
        creditsExpired: expirationResult.creditsExpired,
      },
      recurring: {
        usersGranted: grantResult.usersGranted,
        creditsGranted: grantResult.creditsGranted,
      },
    });
  } catch (error) {
    console.error("[CRON] Credit maintenance error:", error);
    return NextResponse.json(
      { error: "Credit maintenance failed" },
      { status: 500 }
    );
  }
}

// POST - Same as GET for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
