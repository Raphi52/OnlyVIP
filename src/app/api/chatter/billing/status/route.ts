import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shouldChargeForAi, getChatterBillingSummary } from "@/lib/chatter/billing";

/**
 * GET /api/chatter/billing/status
 * Get billing status for AI suggestions
 *
 * Query params:
 * - creatorSlug: Get billing for specific creator
 * - (no params): Get summary across all assigned creators
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    // If specific creator requested
    if (creatorSlug) {
      const billing = await shouldChargeForAi(creatorSlug);

      return NextResponse.json({
        creatorSlug,
        usingCustomKey: billing.hasCustomKey,
        shouldCharge: billing.shouldCharge,
        balance: billing.balance,
        costPerSuggestion: billing.costPerSuggestion,
        canGenerateSuggestions: billing.hasCustomKey || billing.balance >= billing.costPerSuggestion,
      });
    }

    // Otherwise, get summary for all assigned creators
    const summary = await getChatterBillingSummary(chatterId);

    return NextResponse.json({
      creators: summary.creators.map((c) => ({
        creatorSlug: c.creatorSlug,
        creatorName: c.creatorName,
        usingCustomKey: c.hasCustomKey,
        balance: c.balance,
        canGenerateSuggestions: c.hasCustomKey || c.balance >= 1,
      })),
      hasAnyCustomKey: summary.hasAnyCustomKey,
      maxBalance: summary.totalBalance,
    });
  } catch (error) {
    console.error("Error fetching billing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing status" },
      { status: 500 }
    );
  }
}
