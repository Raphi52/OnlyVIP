import { NextResponse } from "next/server";
import { processAccountingQueue } from "@/lib/crypto-accounting";

// This endpoint can be called by a cron job to process pending accounting transactions
export async function POST(request: Request) {
  // Simple API key check for cron security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.CRYPTO_ACCOUNTING_API_KEY;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processAccountingQueue();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
    });
  } catch (error) {
    console.error("[Accounting Queue API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing/manual trigger
export async function GET(request: Request) {
  return POST(request);
}
