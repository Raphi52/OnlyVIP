import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MINIMUM_PAYOUT = 100; // Minimum 100€ to request payout
const COOLDOWN_HOURS = 24; // 1 request per 24 hours

// GET /api/agency/payout-request?agencyId=xxx - Get agency payout request status
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
      select: {
        id: true,
        ownerId: true,
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get latest payout request
    const latestRequest = await prisma.agencyPayoutRequest.findFirst({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    });

    // Check if can request (no pending request and cooldown passed)
    const canRequest =
      !latestRequest ||
      (latestRequest.status === "PAID" &&
        new Date().getTime() - latestRequest.createdAt.getTime() >
          COOLDOWN_HOURS * 60 * 60 * 1000);

    // Check cooldown for pending requests too
    const cooldownPassed =
      !latestRequest ||
      new Date().getTime() - latestRequest.createdAt.getTime() >
        COOLDOWN_HOURS * 60 * 60 * 1000;

    // Get payout history
    const payoutHistory = await prisma.agencyPayoutRequest.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      pendingBalance: agency.pendingBalance,
      totalEarned: agency.totalEarned,
      totalPaid: agency.totalPaid,
      minimumPayout: MINIMUM_PAYOUT,
      walletEth: agency.walletEth,
      walletBtc: agency.walletBtc,
      latestRequest: latestRequest
        ? {
            id: latestRequest.id,
            amount: latestRequest.amount,
            walletType: latestRequest.walletType,
            walletAddress: latestRequest.walletAddress,
            status: latestRequest.status,
            createdAt: latestRequest.createdAt,
            paidAt: latestRequest.paidAt,
            txHash: latestRequest.txHash,
          }
        : null,
      canRequest:
        canRequest && cooldownPassed && agency.pendingBalance >= MINIMUM_PAYOUT,
      cooldownPassed,
      hasEnoughBalance: agency.pendingBalance >= MINIMUM_PAYOUT,
      payoutHistory: payoutHistory.map((r) => ({
        id: r.id,
        amount: r.amount,
        walletType: r.walletType,
        walletAddress: r.walletAddress,
        status: r.status,
        createdAt: r.createdAt,
        paidAt: r.paidAt,
        txHash: r.txHash,
      })),
    });
  } catch (error) {
    console.error("Error fetching agency payout request:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout request" },
      { status: 500 }
    );
  }
}

// POST /api/agency/payout-request - Create a new agency payout request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, walletType, walletAddress } = body;

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Validate wallet info
    if (!walletType || !walletAddress) {
      return NextResponse.json(
        { error: "Wallet type and address required" },
        { status: 400 }
      );
    }

    if (!["ETH", "BTC"].includes(walletType)) {
      return NextResponse.json(
        { error: "Invalid wallet type. Use ETH or BTC" },
        { status: 400 }
      );
    }

    // Get agency and verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        ownerId: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check minimum balance
    if (agency.pendingBalance < MINIMUM_PAYOUT) {
      return NextResponse.json(
        { error: `Minimum balance of ${MINIMUM_PAYOUT}€ required` },
        { status: 400 }
      );
    }

    // Check for existing pending request or cooldown
    const latestRequest = await prisma.agencyPayoutRequest.findFirst({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    });

    if (latestRequest) {
      // Check if there's a pending request
      if (latestRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "You already have a pending payout request" },
          { status: 400 }
        );
      }

      // Check cooldown (24 hours)
      const hoursSinceLastRequest =
        (new Date().getTime() - latestRequest.createdAt.getTime()) /
        (1000 * 60 * 60);

      if (hoursSinceLastRequest < COOLDOWN_HOURS) {
        const hoursRemaining = Math.ceil(COOLDOWN_HOURS - hoursSinceLastRequest);
        return NextResponse.json(
          {
            error: `Please wait ${hoursRemaining} more hour(s) before requesting another payout`,
          },
          { status: 400 }
        );
      }
    }

    // Create payout request
    const payoutRequest = await prisma.agencyPayoutRequest.create({
      data: {
        agencyId,
        amount: agency.pendingBalance,
        walletType,
        walletAddress,
        status: "PENDING",
      },
    });

    // Update agency's wallet if different
    const walletUpdate: Record<string, string> = {};
    if (walletType === "ETH" && agency.walletEth !== walletAddress) {
      walletUpdate.walletEth = walletAddress;
    } else if (walletType === "BTC" && agency.walletBtc !== walletAddress) {
      walletUpdate.walletBtc = walletAddress;
    }

    if (Object.keys(walletUpdate).length > 0) {
      await prisma.agency.update({
        where: { id: agencyId },
        data: walletUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      request: {
        id: payoutRequest.id,
        amount: payoutRequest.amount,
        walletType: payoutRequest.walletType,
        walletAddress: payoutRequest.walletAddress,
        status: payoutRequest.status,
        createdAt: payoutRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating agency payout request:", error);
    return NextResponse.json(
      { error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}
