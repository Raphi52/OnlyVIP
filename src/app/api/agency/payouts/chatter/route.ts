import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/payouts/chatter?agencyId=xxx - Get chatters with their balances
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Get agency and verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, ownerId: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get all chatters under this agency with their balances
    const chatters = await prisma.chatter.findMany({
      where: { agencyId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        pendingBalance: true,
        totalPaid: true,
        totalEarnings: true,
        commissionRate: true,
        walletEth: true,
        walletBtc: true,
        isActive: true,
      },
      orderBy: { pendingBalance: "desc" },
    });

    // Get pending payouts for these chatters
    const pendingPayouts = await prisma.chatterPayoutRequest.findMany({
      where: {
        agencyId,
        status: "PENDING",
      },
    });

    const pendingPayoutsByChatter = new Map(
      pendingPayouts.map((p) => [p.chatterId, p])
    );

    // Get payout history
    const payoutHistory = await prisma.chatterPayoutRequest.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        chatter: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      chatters: chatters.map((c) => ({
        ...c,
        hasWallet: !!(c.walletEth || c.walletBtc),
        pendingPayout: pendingPayoutsByChatter.get(c.id) || null,
      })),
      payoutHistory: payoutHistory.map((p) => ({
        id: p.id,
        chatterId: p.chatterId,
        chatterName: p.chatter.name,
        amount: p.amount,
        walletType: p.walletType,
        walletAddress: p.walletAddress,
        status: p.status,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        txHash: p.txHash,
      })),
    });
  } catch (error) {
    console.error("Error fetching chatter payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatter payouts" },
      { status: 500 }
    );
  }
}

// POST /api/agency/payouts/chatter - Initiate a payout to a chatter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, chatterId, walletType } = body;

    if (!agencyId || !chatterId) {
      return NextResponse.json(
        { error: "Agency ID and chatter ID required" },
        { status: 400 }
      );
    }

    // Get agency and verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, ownerId: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get chatter and verify it belongs to this agency
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        id: true,
        name: true,
        agencyId: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    if (chatter.agencyId !== agencyId) {
      return NextResponse.json(
        { error: "Chatter does not belong to this agency" },
        { status: 403 }
      );
    }

    // Determine wallet to use
    const selectedWalletType = walletType || (chatter.walletEth ? "ETH" : "BTC");
    const walletAddress =
      selectedWalletType === "ETH" ? chatter.walletEth : chatter.walletBtc;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Chatter has no wallet configured" },
        { status: 400 }
      );
    }

    if (chatter.pendingBalance <= 0) {
      return NextResponse.json(
        { error: "Chatter has no pending balance" },
        { status: 400 }
      );
    }

    // Check for existing pending payout
    const existingPayout = await prisma.chatterPayoutRequest.findFirst({
      where: {
        chatterId,
        status: "PENDING",
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: "Chatter already has a pending payout" },
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prisma.chatterPayoutRequest.create({
      data: {
        agencyId,
        chatterId,
        amount: chatter.pendingBalance,
        walletType: selectedWalletType,
        walletAddress,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        chatterId: payout.chatterId,
        chatterName: chatter.name,
        amount: payout.amount,
        walletType: payout.walletType,
        walletAddress: payout.walletAddress,
        status: payout.status,
        createdAt: payout.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating chatter payout:", error);
    return NextResponse.json(
      { error: "Failed to create chatter payout" },
      { status: 500 }
    );
  }
}
