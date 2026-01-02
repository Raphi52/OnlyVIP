import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/agency-payouts - List all agency payout requests
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

    // Get all agency payout requests
    const requests = await prisma.agencyPayoutRequest.findMany({
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "asc" }, // Oldest first
      ],
      include: {
        agency: {
          select: {
            name: true,
            slug: true,
            logo: true,
            pendingBalance: true,
            totalEarned: true,
            totalPaid: true,
            walletEth: true,
            walletBtc: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Enrich data
    const enrichedRequests = requests.map((request) => ({
      id: request.id,
      agencyId: request.agencyId,
      amount: request.amount,
      walletType: request.walletType,
      walletAddress: request.walletAddress,
      status: request.status,
      createdAt: request.createdAt,
      paidAt: request.paidAt,
      paidBy: request.paidBy,
      txHash: request.txHash,
      agency: {
        name: request.agency.name,
        slug: request.agency.slug,
        logo: request.agency.logo,
        pendingBalance: request.agency.pendingBalance,
        totalEarned: request.agency.totalEarned,
        totalPaid: request.agency.totalPaid,
        walletEth: request.agency.walletEth,
        walletBtc: request.agency.walletBtc,
        ownerName: request.agency.owner.name,
        ownerEmail: request.agency.owner.email,
      },
    }));

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
    console.error("Error fetching agency payout requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency payout requests" },
      { status: 500 }
    );
  }
}
