import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/wallet?agencyId=xxx - Get agency wallet addresses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Get agency and verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        ownerId: true,
        walletEth: true,
        walletBtc: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({
      walletEth: agency.walletEth || "",
      walletBtc: agency.walletBtc || "",
    });
  } catch (error) {
    console.error("Error fetching agency wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency wallet" },
      { status: 500 }
    );
  }
}

// PUT /api/agency/wallet - Update agency wallet addresses
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, walletEth, walletBtc } = body;

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Get agency and verify ownership
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update wallet addresses
    await prisma.agency.update({
      where: { id: agencyId },
      data: {
        walletEth: walletEth || null,
        walletBtc: walletBtc || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating agency wallet:", error);
    return NextResponse.json(
      { error: "Failed to update agency wallet" },
      { status: 500 }
    );
  }
}
