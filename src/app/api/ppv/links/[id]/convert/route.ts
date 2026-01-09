import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST - Track a conversion (purchase) on a PPV link
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
    const { visitorId, purchaseAmount } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID required" }, { status: 400 });
    }

    // Find the PPV link
    const link = await prisma.pPVLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Find the most recent click from this visitor that hasn't converted
    const click = await prisma.pPVLinkClick.findFirst({
      where: {
        ppvLinkId: id,
        visitorId,
        converted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (click) {
      // Update the click as converted
      await prisma.pPVLinkClick.update({
        where: { id: click.id },
        data: {
          converted: true,
          convertedAt: new Date(),
          purchaseAmount: purchaseAmount || 0,
          userId: session.user.id,
        },
      });
    }

    // Update link stats
    const conversionRate =
      link.uniqueClicks > 0
        ? ((link.totalPurchases + 1) / link.uniqueClicks) * 100
        : 0;

    await prisma.pPVLink.update({
      where: { id },
      data: {
        totalPurchases: { increment: 1 },
        totalRevenue: { increment: purchaseAmount || 0 },
        conversionRate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking PPV link conversion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
