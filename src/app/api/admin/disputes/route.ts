import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

// GET: List all disputes (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const disputes = await prisma.paymentDispute.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Get user info for each dispute
    const userIds = [...new Set(disputes.map(d => d.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, creditBalance: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const disputesWithUsers = disputes.map(d => ({
      ...d,
      user: userMap[d.userId] || null,
    }));

    return NextResponse.json({ disputes: disputesWithUsers });
  } catch (error) {
    console.error("Dispute fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

// POST: Resolve a dispute (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { disputeId, action, creditAmount, resolution } = body;

    if (!disputeId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the dispute
    const dispute = await prisma.paymentDispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "PENDING" && dispute.status !== "INVESTIGATING") {
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    // Handle action
    if (action === "approve") {
      if (!creditAmount || creditAmount <= 0) {
        return NextResponse.json({ error: "Credit amount required for approval" }, { status: 400 });
      }

      // Add credits to user
      const result = await addCredits(
        dispute.userId,
        creditAmount,
        "ADMIN_GRANT",
        {
          creditType: "PAID",
          description: `Dispute resolution - ${creditAmount} credits for $${dispute.amount}`,
        }
      );

      // Update user balance
      await prisma.user.update({
        where: { id: dispute.userId },
        data: { creditBalance: result.newBalance },
      });

      // Update dispute
      await prisma.paymentDispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          creditAmount,
          resolution: resolution || `Approved: ${creditAmount} credits added`,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
        },
      });

      console.log(`[DISPUTE] Resolved ${disputeId}: ${creditAmount} credits added to user ${dispute.userId}`);

      return NextResponse.json({
        success: true,
        message: `Dispute resolved. ${creditAmount} credits added to user.`,
      });
    } else if (action === "reject") {
      await prisma.paymentDispute.update({
        where: { id: disputeId },
        data: {
          status: "REJECTED",
          resolution: resolution || "Rejected: Unable to verify payment",
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
        },
      });

      console.log(`[DISPUTE] Rejected ${disputeId}`);

      return NextResponse.json({
        success: true,
        message: "Dispute rejected.",
      });
    } else if (action === "investigate") {
      await prisma.paymentDispute.update({
        where: { id: disputeId },
        data: {
          status: "INVESTIGATING",
          resolution: resolution || "Under investigation",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Dispute marked for investigation.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Dispute resolution error:", error);
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}
