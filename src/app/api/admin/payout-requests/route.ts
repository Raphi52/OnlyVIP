import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/payout-requests - List all payout requests
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all payout requests with creator info and verification docs
    const requests = await prisma.payoutRequest.findMany({
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "asc" }, // Oldest first
      ],
    });

    // Get creator info for each request
    const creatorSlugs = [...new Set(requests.map((r) => r.creatorSlug))];

    const creators = await prisma.creator.findMany({
      where: { slug: { in: creatorSlugs } },
      select: {
        slug: true,
        displayName: true,
        avatar: true,
        pendingBalance: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    // Get verification docs for each creator
    const verifications = await prisma.creatorVerification.findMany({
      where: { creatorSlug: { in: creatorSlugs } },
      select: {
        creatorSlug: true,
        documentType: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        selfieUrl: true,
        fullName: true,
        status: true,
      },
    });

    const creatorsMap = new Map(creators.map((c) => [c.slug, c]));
    const verificationsMap = new Map(verifications.map((v) => [v.creatorSlug, v]));

    // Combine data
    const enrichedRequests = requests.map((request) => {
      const creator = creatorsMap.get(request.creatorSlug);
      const verification = verificationsMap.get(request.creatorSlug);

      return {
        id: request.id,
        creatorSlug: request.creatorSlug,
        amount: request.amount,
        walletType: request.walletType,
        walletAddress: request.walletAddress,
        status: request.status,
        createdAt: request.createdAt,
        paidAt: request.paidAt,
        paidBy: request.paidBy,
        txHash: request.txHash,
        creator: creator ? {
          displayName: creator.displayName,
          avatar: creator.avatar,
          pendingBalance: creator.pendingBalance,
          walletEth: creator.walletEth,
          walletBtc: creator.walletBtc,
        } : null,
        verification: verification ? {
          documentType: verification.documentType,
          documentFrontUrl: verification.documentFrontUrl,
          documentBackUrl: verification.documentBackUrl,
          selfieUrl: verification.selfieUrl,
          fullName: verification.fullName,
          status: verification.status,
        } : null,
      };
    });

    // Calculate totals
    const pendingRequests = enrichedRequests.filter((r) => r.status === "PENDING");
    const paidRequests = enrichedRequests.filter((r) => r.status === "PAID");

    return NextResponse.json({
      requests: enrichedRequests,
      totals: {
        pendingCount: pendingRequests.length,
        pendingAmount: pendingRequests.reduce((sum, r) => sum + r.amount, 0),
        paidCount: paidRequests.length,
        paidAmount: paidRequests.reduce((sum, r) => sum + r.amount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout requests" },
      { status: 500 }
    );
  }
}
