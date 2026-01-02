import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/admin/payout-requests/[id]/pay - Mark payout as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { txHash } = body;

    // Get the payout request
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id },
    });

    if (!payoutRequest) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    if (payoutRequest.status === "PAID") {
      return NextResponse.json({ error: "Payout already processed" }, { status: 400 });
    }

    // Use transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark payout request as paid
      const updatedRequest = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidBy: session.user!.id,
          txHash: txHash || null,
        },
      });

      // 2. Update creator balances
      const creator = await tx.creator.findUnique({
        where: { slug: payoutRequest.creatorSlug },
        select: { pendingBalance: true, totalPaid: true },
      });

      if (creator) {
        await tx.creator.update({
          where: { slug: payoutRequest.creatorSlug },
          data: {
            pendingBalance: Math.max(0, creator.pendingBalance - payoutRequest.amount),
            totalPaid: creator.totalPaid + payoutRequest.amount,
          },
        });
      }

      // 3. Mark all PENDING CreatorEarnings as PAID (up to the payout amount)
      // This marks earnings that were accumulated up to this payout
      await tx.creatorEarning.updateMany({
        where: {
          creatorSlug: payoutRequest.creatorSlug,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          payoutTxId: txHash || updatedRequest.id,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json({
      success: true,
      request: {
        id: result.id,
        status: result.status,
        paidAt: result.paidAt,
        txHash: result.txHash,
      },
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
