import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/payout-count - Get pending payout request counts
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

    // Count pending creator payout requests
    const creatorPendingCount = await prisma.payoutRequest.count({
      where: { status: "PENDING" },
    });

    // Count pending agency payout requests
    const agencyPendingCount = await prisma.agencyPayoutRequest.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      creatorPending: creatorPendingCount,
      agencyPending: agencyPendingCount,
      totalPending: creatorPendingCount + agencyPendingCount,
    });
  } catch (error) {
    console.error("Error fetching payout counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout counts" },
      { status: 500 }
    );
  }
}
