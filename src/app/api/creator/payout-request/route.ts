import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isCreatorAgencyManaged } from "@/lib/agency-permissions";

const MINIMUM_PAYOUT = 100; // Minimum 100€ to request payout
const COOLDOWN_HOURS = 24; // 1 request per 24 hours

// GET /api/creator/payout-request - Get latest payout request status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator for this user
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: {
        slug: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Check if creator is agency-managed
    const isManaged = await isCreatorAgencyManaged(creator.slug);

    // Get latest payout request
    const latestRequest = await prisma.payoutRequest.findFirst({
      where: { creatorSlug: creator.slug },
      orderBy: { createdAt: "desc" },
    });

    // Check if can request (no pending request and cooldown passed)
    const canRequest = !latestRequest ||
      (latestRequest.status === "PAID" &&
       new Date().getTime() - latestRequest.createdAt.getTime() > COOLDOWN_HOURS * 60 * 60 * 1000);

    // Check cooldown for pending requests too
    const cooldownPassed = !latestRequest ||
      new Date().getTime() - latestRequest.createdAt.getTime() > COOLDOWN_HOURS * 60 * 60 * 1000;

    const hasWallet = !!(creator.walletEth || creator.walletBtc);

    return NextResponse.json({
      pendingBalance: creator.pendingBalance,
      minimumPayout: MINIMUM_PAYOUT,
      walletEth: creator.walletEth,
      walletBtc: creator.walletBtc,
      hasWallet,
      latestRequest: latestRequest ? {
        id: latestRequest.id,
        amount: latestRequest.amount,
        walletType: latestRequest.walletType,
        walletAddress: latestRequest.walletAddress,
        status: latestRequest.status,
        createdAt: latestRequest.createdAt,
        paidAt: latestRequest.paidAt,
      } : null,
      // Agency-managed creators cannot request payouts
      canRequest: !isManaged && canRequest && cooldownPassed && creator.pendingBalance >= MINIMUM_PAYOUT,
      cooldownPassed,
      hasEnoughBalance: creator.pendingBalance >= MINIMUM_PAYOUT,
      isAgencyManaged: isManaged,
    });
  } catch (error) {
    console.error("Error fetching payout request:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout request" },
      { status: 500 }
    );
  }
}

// POST /api/creator/payout-request - Create a new payout request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletType, walletAddress, businessNumber } = body;

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

    // Validate business number
    if (!businessNumber || !businessNumber.trim()) {
      return NextResponse.json(
        { error: "Business registration number required" },
        { status: 400 }
      );
    }

    // Get creator for this user
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
      select: {
        slug: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Check if creator is agency-managed (restricted from requesting payouts)
    const isManaged = await isCreatorAgencyManaged(creator.slug);
    if (isManaged) {
      return NextResponse.json(
        { error: "Payout requests are handled by your agency. Contact your agency manager." },
        { status: 403 }
      );
    }

    // Check minimum balance
    if (creator.pendingBalance < MINIMUM_PAYOUT) {
      return NextResponse.json(
        { error: `Minimum balance of ${MINIMUM_PAYOUT}€ required` },
        { status: 400 }
      );
    }

    // Check for existing pending request or cooldown
    const latestRequest = await prisma.payoutRequest.findFirst({
      where: { creatorSlug: creator.slug },
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
        (new Date().getTime() - latestRequest.createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastRequest < COOLDOWN_HOURS) {
        const hoursRemaining = Math.ceil(COOLDOWN_HOURS - hoursSinceLastRequest);
        return NextResponse.json(
          { error: `Please wait ${hoursRemaining} more hour(s) before requesting another payout` },
          { status: 400 }
        );
      }
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        creatorSlug: creator.slug,
        amount: creator.pendingBalance,
        walletType,
        walletAddress,
        businessNumber: businessNumber.trim(),
        status: "PENDING",
      },
    });

    // Update creator's wallet if different
    const walletUpdate: Record<string, string> = {};
    if (walletType === "ETH" && creator.walletEth !== walletAddress) {
      walletUpdate.walletEth = walletAddress;
    } else if (walletType === "BTC" && creator.walletBtc !== walletAddress) {
      walletUpdate.walletBtc = walletAddress;
    }

    if (Object.keys(walletUpdate).length > 0) {
      await prisma.creator.update({
        where: { slug: creator.slug },
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
    console.error("Error creating payout request:", error);
    return NextResponse.json(
      { error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}
