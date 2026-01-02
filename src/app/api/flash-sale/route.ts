/**
 * API: Flash Sales
 *
 * POST /api/flash-sale - Create flash sale
 * GET /api/flash-sale - Get active sales for fan
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFlashSale, getActiveSalesForFan } from "@/lib/bundle-manager";

// Create a flash sale for a fan
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      conversationId,
      fanUserId,
      creatorSlug,
      bundleId,
      mediaId,
      discountPercent,
      expiresInHours,
    } = body;

    // Validate required fields
    if (!conversationId || !fanUserId || !creatorSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!bundleId && !mediaId) {
      return NextResponse.json(
        { error: "Either bundleId or mediaId required" },
        { status: 400 }
      );
    }

    // Create the flash sale
    const flashSale = await createFlashSale(
      conversationId,
      fanUserId,
      creatorSlug,
      {
        bundleId,
        mediaId,
        discountPercent: discountPercent || 20,
        expiresInHours: expiresInHours || 2,
      }
    );

    if (!flashSale) {
      return NextResponse.json(
        { error: "Failed to create flash sale" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flashSale: {
        id: flashSale.id,
        discountCode: flashSale.discountCode,
        originalPrice: flashSale.originalPrice,
        salePrice: flashSale.salePrice,
        expiresAt: flashSale.expiresAt,
        discountPercent: flashSale.discountPercent,
      },
    });
  } catch (error) {
    console.error("Create flash sale error:", error);
    return NextResponse.json(
      { error: "Failed to create flash sale" },
      { status: 500 }
    );
  }
}

// Get active flash sales for current user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const creatorSlug = searchParams.get("creatorSlug");

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "creatorSlug required" },
        { status: 400 }
      );
    }

    const activeSales = await getActiveSalesForFan(session.user.id, creatorSlug);

    return NextResponse.json({
      sales: activeSales.map((sale) => ({
        id: sale.id,
        discountCode: sale.discountCode,
        originalPrice: sale.originalPrice,
        salePrice: sale.salePrice,
        discountPercent: sale.discountPercent,
        expiresAt: sale.expiresAt,
        bundleId: sale.bundleId,
        mediaId: sale.mediaId,
      })),
    });
  } catch (error) {
    console.error("Get flash sales error:", error);
    return NextResponse.json(
      { error: "Failed to get flash sales" },
      { status: 500 }
    );
  }
}
