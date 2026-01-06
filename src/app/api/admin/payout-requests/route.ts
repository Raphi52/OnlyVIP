import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/payout-requests - Get all payout requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as { role?: string })?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    // Get payout requests with creator info
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "asc" }, // Oldest first
      include: {
        creator: {
          select: {
            slug: true,
            displayName: true,
            avatar: true,
            pendingBalance: true,
            walletEth: true,
            walletBtc: true,
            idDocument: true,
            idDocumentAt: true,
          },
        },
      },
    });

    // Count by status
    const counts = await prisma.payoutRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusCounts = {
      PENDING: 0,
      PAID: 0,
    };
    for (const c of counts) {
      if (c.status === "PENDING" || c.status === "PAID") {
        statusCounts[c.status] = c._count.id;
      }
    }

    return NextResponse.json({
      payoutRequests,
      counts: statusCounts,
    });
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout requests" },
      { status: 500 }
    );
  }
}
