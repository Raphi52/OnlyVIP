import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/transactions - Get all transactions (credit purchases + internal earnings)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type") || ""; // "CREDIT_PURCHASE" | "SUBSCRIPTION" | "PPV" | "TIP" | "MEDIA_UNLOCK" | ""
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
        startDate = new Date(0);
        break;
    }

    // Fetch credit purchases (external payments) from CreditTransaction
    const shouldFetchCredits = type === "" || type === "CREDIT_PURCHASE";

    // Build where clause for credit purchases
    const creditPurchasesWhere: any = {
      createdAt: { gte: startDate },
      type: "PURCHASE", // Credit purchases are type PURCHASE in CreditTransaction
      amount: { gt: 0 }, // Only positive amounts (purchases)
    };
    if (search) {
      creditPurchasesWhere.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    let creditPurchases: any[] = [];
    if (shouldFetchCredits) {
      creditPurchases = await prisma.creditTransaction.findMany({
        where: creditPurchasesWhere,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Fetch creator earnings (internal transactions)
    const earningsTypes: string[] = [];
    if (type === "" || type === "SUBSCRIPTION") earningsTypes.push("SUBSCRIPTION");
    if (type === "" || type === "PPV") earningsTypes.push("PPV");
    if (type === "" || type === "TIP") earningsTypes.push("TIP");
    if (type === "" || type === "MEDIA_UNLOCK") earningsTypes.push("MEDIA_UNLOCK");

    // Build where clause for creator earnings
    const creatorEarningsWhere: any = {
      createdAt: { gte: startDate },
      type: { in: earningsTypes },
    };
    if (search) {
      creatorEarningsWhere.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { creator: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    let creatorEarnings: any[] = [];
    if (earningsTypes.length > 0) {
      creatorEarnings = await prisma.creatorEarning.findMany({
        where: creatorEarningsWhere,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          creator: { select: { slug: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Transform and combine
    const transactions: any[] = [];

    // Add credit purchases
    for (const p of creditPurchases) {
      transactions.push({
        id: p.id,
        type: "CREDIT_PURCHASE",
        amount: p.amount, // CreditTransaction amount is in credits
        currency: "EUR", // 1 credit = 1 EUR
        status: "COMPLETED",
        provider: "CREDITS",
        user: {
          id: p.user?.id,
          name: p.user?.name || p.user?.email || "Unknown",
          image: p.user?.image,
        },
        creator: null,
        description: p.description || `${p.amount} credits purchased`,
        createdAt: p.createdAt,
      });
    }

    // Add creator earnings
    for (const e of creatorEarnings) {
      transactions.push({
        id: e.id,
        type: e.type,
        amount: e.grossAmount,
        currency: "EUR",
        status: "COMPLETED",
        provider: "CREDITS",
        user: {
          id: e.user?.id,
          name: e.user?.name || e.user?.email || "Unknown",
          image: e.user?.image,
        },
        creator: e.creator
          ? {
              slug: e.creator.slug,
              displayName: e.creator.displayName,
              avatar: e.creator.avatar,
            }
          : null,
        description: getEarningDescription(e.type, e.grossAmount),
        createdAt: e.createdAt,
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = transactions.length;
    const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

    // Stats
    const stats = {
      total,
      totalCreditPurchases: creditPurchases.length,
      totalCreditPurchaseAmount: creditPurchases.reduce((sum, p) => sum + p.amount, 0),
      totalSubscriptions: creatorEarnings.filter(e => e.type === "SUBSCRIPTION").length,
      totalSubscriptionAmount: creatorEarnings.filter(e => e.type === "SUBSCRIPTION").reduce((sum, e) => sum + e.grossAmount, 0),
      totalPPV: creatorEarnings.filter(e => e.type === "PPV").length,
      totalPPVAmount: creatorEarnings.filter(e => e.type === "PPV").reduce((sum, e) => sum + e.grossAmount, 0),
      totalTips: creatorEarnings.filter(e => e.type === "TIP").length,
      totalTipsAmount: creatorEarnings.filter(e => e.type === "TIP").reduce((sum, e) => sum + e.grossAmount, 0),
      totalMediaUnlocks: creatorEarnings.filter(e => e.type === "MEDIA_UNLOCK").length,
      totalMediaUnlockAmount: creatorEarnings.filter(e => e.type === "MEDIA_UNLOCK").reduce((sum, e) => sum + e.grossAmount, 0),
    };

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

function getEarningDescription(type: string, amount: number): string {
  switch (type) {
    case "SUBSCRIPTION":
      return `Subscription payment €${amount.toFixed(2)}`;
    case "PPV":
      return `PPV purchase €${amount.toFixed(2)}`;
    case "TIP":
      return `Tip received €${amount.toFixed(2)}`;
    case "MEDIA_UNLOCK":
      return `Media unlock €${amount.toFixed(2)}`;
    default:
      return `Transaction €${amount.toFixed(2)}`;
  }
}
