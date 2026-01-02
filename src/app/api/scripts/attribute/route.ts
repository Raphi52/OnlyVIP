import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attributeSaleToScript } from "@/lib/scripts/attribution";

// POST /api/scripts/attribute - Attribute a sale to a script
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      conversationId,
      saleAmount,
      saleType, // "PPV" | "TIP" | "SUBSCRIPTION"
      purchaseTime,
    } = body;

    if (!conversationId || !saleAmount || !saleType) {
      return NextResponse.json(
        { error: "conversationId, saleAmount, and saleType are required" },
        { status: 400 }
      );
    }

    // Validate sale type
    const validSaleTypes = ["PPV", "TIP", "SUBSCRIPTION"];
    if (!validSaleTypes.includes(saleType)) {
      return NextResponse.json(
        { error: "Invalid sale type" },
        { status: 400 }
      );
    }

    const result = await attributeSaleToScript(
      conversationId,
      parseFloat(saleAmount),
      saleType,
      purchaseTime ? new Date(purchaseTime) : new Date()
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error attributing sale:", error);
    return NextResponse.json(
      { error: "Failed to attribute sale" },
      { status: 500 }
    );
  }
}
