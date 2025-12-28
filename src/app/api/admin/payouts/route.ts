import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/payouts - Get all creators with their pending earnings (READ ONLY)
// Actual payouts should be processed by a separate secure service
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all creators with their balances
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatar: true,
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
        walletEth: true,
        walletBtc: true,
        // Get pending earnings count
        earnings: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
      orderBy: { pendingBalance: "desc" },
    });

    // Get earnings details for creators with pending balance
    const creatorsWithDetails = await Promise.all(
      creators.map(async (creator) => {
        // Get recent earnings breakdown
        const earningsBreakdown = await prisma.creatorEarning.groupBy({
          by: ["type"],
          where: {
            creatorSlug: creator.slug,
            status: "PENDING",
          },
          _sum: {
            netAmount: true,
            grossAmount: true,
            commissionAmount: true,
          },
          _count: true,
        });

        // Format wallet info
        const walletAddress = creator.walletEth || creator.walletBtc || null;
        const walletType = creator.walletEth ? "ETH" : creator.walletBtc ? "BTC" : null;

        return {
          id: creator.id,
          slug: creator.slug,
          displayName: creator.displayName,
          avatar: creator.avatar,
          pendingBalance: creator.pendingBalance,
          totalEarned: creator.totalEarned,
          totalPaid: creator.totalPaid,
          walletAddress,
          walletType,
          walletEth: creator.walletEth,
          walletBtc: creator.walletBtc,
          pendingEarningsCount: creator.earnings.length,
          earningsBreakdown: earningsBreakdown.map((e) => ({
            type: e.type,
            count: e._count,
            netAmount: e._sum.netAmount || 0,
            grossAmount: e._sum.grossAmount || 0,
            commission: e._sum.commissionAmount || 0,
          })),
        };
      })
    );

    // Calculate platform totals
    const totals = await prisma.creatorEarning.aggregate({
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      where: { status: "PENDING" },
    });

    const paidTotals = await prisma.creatorEarning.aggregate({
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      where: { status: "PAID" },
    });

    return NextResponse.json({
      creators: creatorsWithDetails,
      totals: {
        pending: {
          gross: totals._sum.grossAmount || 0,
          commission: totals._sum.commissionAmount || 0,
          net: totals._sum.netAmount || 0,
        },
        paid: {
          gross: paidTotals._sum.grossAmount || 0,
          commission: paidTotals._sum.commissionAmount || 0,
          net: paidTotals._sum.netAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

// NOTE: No POST method - payouts should be processed by a separate secure service
// that has access to the wallet private keys and can verify transactions
