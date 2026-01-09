import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPayoutCompletedEmail } from "@/lib/email";

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

    const isAdmin = (session.user as { role?: string })?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { txHash } = body;

    // Get the payout request
    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            slug: true,
            pendingBalance: true,
            totalPaid: true,
          },
        },
      },
    });

    if (!payoutRequest) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    if (payoutRequest.status === "PAID") {
      return NextResponse.json({ error: "Payout already marked as paid" }, { status: 400 });
    }

    // Use transaction to update payout and creator balance
    const result = await prisma.$transaction(async (tx) => {
      // Mark payout as paid
      const updatedPayout = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidBy: session.user!.id,
          txHash: txHash || null,
        },
      });

      // Deduct from creator's pending balance and add to totalPaid
      await tx.creator.update({
        where: { slug: payoutRequest.creatorSlug },
        data: {
          pendingBalance: {
            decrement: payoutRequest.amount,
          },
          totalPaid: {
            increment: payoutRequest.amount,
          },
        },
      });

      // Mark all PENDING creator earnings as PAID
      await tx.creatorEarning.updateMany({
        where: {
          creatorSlug: payoutRequest.creatorSlug,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
          payoutTxId: txHash || updatedPayout.id,
        },
      });

      return updatedPayout;
    });

    // Send completion email to creator
    const creatorWithUser = await prisma.creator.findUnique({
      where: { slug: payoutRequest.creatorSlug },
      include: { user: { select: { email: true, name: true } } },
    });

    if (creatorWithUser?.user?.email) {
      await sendPayoutCompletedEmail(
        creatorWithUser.user.email,
        creatorWithUser.user.name || creatorWithUser.displayName || "",
        {
          amount: payoutRequest.amount,
          walletType: payoutRequest.walletType,
          walletAddress: payoutRequest.walletAddress,
          txHash: txHash || null,
        }
      );
    }

    return NextResponse.json({
      success: true,
      payoutRequest: result,
    });
  } catch (error) {
    console.error("Error marking payout as paid:", error);
    return NextResponse.json(
      { error: "Failed to mark payout as paid" },
      { status: 500 }
    );
  }
}
