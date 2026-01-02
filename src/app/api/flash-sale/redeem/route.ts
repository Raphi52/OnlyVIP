/**
 * API: Redeem Flash Sale
 *
 * POST /api/flash-sale/redeem - Use a flash sale discount code
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redeemFlashSale } from "@/lib/bundle-manager";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { discountCode } = body;

    if (!discountCode) {
      return NextResponse.json(
        { error: "discountCode required" },
        { status: 400 }
      );
    }

    const result = await redeemFlashSale(discountCode, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to redeem" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      originalPrice: result.originalPrice,
      discountedPrice: result.discountedPrice,
      savings: result.savings,
      bundleId: result.bundleId,
      mediaId: result.mediaId,
    });
  } catch (error) {
    console.error("Redeem flash sale error:", error);
    return NextResponse.json(
      { error: "Failed to redeem flash sale" },
      { status: 500 }
    );
  }
}
