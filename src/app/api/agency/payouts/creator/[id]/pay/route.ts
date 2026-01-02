import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/agency/payouts/creator/[id]/pay - Mark creator payout as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { txHash } = body;

    // Get the payout request
    const payout = await prisma.agencyCreatorPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Verify agency ownership
    const agency = await prisma.agency.findUnique({
      where: { id: payout.agencyId },
      select: { id: true, ownerId: true },
    });

    if (!agency || agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (payout.status === "PAID") {
      return NextResponse.json(
        { error: "Payout already marked as paid" },
        { status: 400 }
      );
    }

    // Update payout status and creator balance in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark payout as paid
      await tx.agencyCreatorPayout.update({
        where: { id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidBy: session.user!.id,
          txHash: txHash || null,
        },
      });

      // Update creator balance
      await tx.creator.update({
        where: { slug: payout.creatorSlug },
        data: {
          pendingBalance: { decrement: payout.amount },
          totalPaid: { increment: payout.amount },
        },
      });

      // Mark related creator earnings as paid
      await tx.creatorEarning.updateMany({
        where: {
          creatorSlug: payout.creatorSlug,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payout marked as paid",
    });
  } catch (error) {
    console.error("Error marking creator payout as paid:", error);
    return NextResponse.json(
      { error: "Failed to mark payout as paid" },
      { status: 500 }
    );
  }
}
