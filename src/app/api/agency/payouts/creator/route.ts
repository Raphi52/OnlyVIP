import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/payouts/creator?agencyId=xxx - Get creators with their balances
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

    // Get all creators under this agency with their balances
    const creators = await prisma.creator.findMany({
      where: { agencyId },
      select: {
        slug: true,
        name: true,
        displayName: true,
        avatar: true,
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
        walletEth: true,
        walletBtc: true,
      },
      orderBy: { pendingBalance: "desc" },
    });

    // Get pending payouts for these creators
    const pendingPayouts = await prisma.agencyCreatorPayout.findMany({
      where: {
        agencyId,
        status: "PENDING",
      },
    });

    const pendingPayoutsByCreator = new Map(
      pendingPayouts.map((p) => [p.creatorSlug, p])
    );

    // Get payout history
    const payoutHistory = await prisma.agencyCreatorPayout.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      creators: creators.map((c) => ({
        ...c,
        hasWallet: !!(c.walletEth || c.walletBtc),
        pendingPayout: pendingPayoutsByCreator.get(c.slug) || null,
      })),
      payoutHistory: payoutHistory.map((p) => ({
        id: p.id,
        creatorSlug: p.creatorSlug,
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
    console.error("Error fetching creator payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator payouts" },
      { status: 500 }
    );
  }
}

// POST /api/agency/payouts/creator - Initiate a payout to a creator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, creatorSlug, walletType } = body;

    if (!agencyId || !creatorSlug) {
      return NextResponse.json(
        { error: "Agency ID and creator slug required" },
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

    // Get creator and verify it belongs to this agency
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: {
        slug: true,
        agencyId: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (creator.agencyId !== agencyId) {
      return NextResponse.json(
        { error: "Creator does not belong to this agency" },
        { status: 403 }
      );
    }

    // Determine wallet to use
    const selectedWalletType = walletType || (creator.walletEth ? "ETH" : "BTC");
    const walletAddress =
      selectedWalletType === "ETH" ? creator.walletEth : creator.walletBtc;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Creator has no wallet configured" },
        { status: 400 }
      );
    }

    if (creator.pendingBalance <= 0) {
      return NextResponse.json(
        { error: "Creator has no pending balance" },
        { status: 400 }
      );
    }

    // Check for existing pending payout
    const existingPayout = await prisma.agencyCreatorPayout.findFirst({
      where: {
        agencyId,
        creatorSlug,
        status: "PENDING",
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: "Creator already has a pending payout" },
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prisma.agencyCreatorPayout.create({
      data: {
        agencyId,
        creatorSlug,
        amount: creator.pendingBalance,
        walletType: selectedWalletType,
        walletAddress,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        creatorSlug: payout.creatorSlug,
        amount: payout.amount,
        walletType: payout.walletType,
        walletAddress: payout.walletAddress,
        status: payout.status,
        createdAt: payout.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating creator payout:", error);
    return NextResponse.json(
      { error: "Failed to create creator payout" },
      { status: 500 }
    );
  }
}
