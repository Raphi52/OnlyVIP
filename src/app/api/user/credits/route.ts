import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCreditBalance,
  getCreditTransactions,
  getNextExpiration,
  CREDITS_PER_DOLLAR,
  CREDITS_PER_MEDIA,
} from "@/lib/credits";

// GET /api/user/credits - Get current user's credit balance and transactions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get balance, transactions, and next expiration in parallel
    const [balance, transactions, nextExpiration] = await Promise.all([
      getCreditBalance(userId),
      getCreditTransactions(userId, limit, offset),
      getNextExpiration(userId),
    ]);

    // Transform transactions for frontend
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      balance: tx.balance,
      type: tx.type,
      description: tx.description,
      createdAt: tx.createdAt,
      expiresAt: tx.expiresAt,
    }));

    return NextResponse.json({
      balance,
      transactions: formattedTransactions,
      nextExpiration,
      // Useful constants for frontend
      creditsPerDollar: CREDITS_PER_DOLLAR,
      creditsPerMedia: CREDITS_PER_MEDIA,
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
