import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/wallet - Get chatter wallet addresses
export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        id: true,
        walletEth: true,
        walletBtc: true,
        pendingBalance: true,
        totalPaid: true,
      },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    return NextResponse.json({
      walletEth: chatter.walletEth || "",
      walletBtc: chatter.walletBtc || "",
      pendingBalance: chatter.pendingBalance,
      totalPaid: chatter.totalPaid,
    });
  } catch (error) {
    console.error("Error fetching chatter wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatter wallet" },
      { status: 500 }
    );
  }
}

// PUT /api/chatter/wallet - Update chatter wallet addresses
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const body = await request.json();
    const { walletEth, walletBtc } = body;

    // Update wallet addresses
    await prisma.chatter.update({
      where: { id: chatterId },
      data: {
        walletEth: walletEth || null,
        walletBtc: walletBtc || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating chatter wallet:", error);
    return NextResponse.json(
      { error: "Failed to update chatter wallet" },
      { status: 500 }
    );
  }
}
