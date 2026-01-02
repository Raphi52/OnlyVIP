/**
 * API: Bundle by ID
 *
 * GET /api/agency/bundles/[id] - Get bundle
 * PATCH /api/agency/bundles/[id] - Update bundle
 * DELETE /api/agency/bundles/[id] - Delete bundle
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// Get single bundle
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const bundle = await prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, bundle.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get flash sale stats
    const flashSales = await prisma.flashSale.findMany({
      where: { bundleId: id },
    });

    const stats = {
      totalFlashSales: flashSales.length,
      redeemed: flashSales.filter((s) => s.status === "REDEEMED").length,
      expired: flashSales.filter((s) => s.status === "EXPIRED").length,
    };

    return NextResponse.json({
      bundle: {
        ...bundle,
        mediaIds: JSON.parse(bundle.mediaIds),
        stats,
      },
    });
  } catch (error) {
    console.error("Get bundle error:", error);
    return NextResponse.json(
      { error: "Failed to get bundle" },
      { status: 500 }
    );
  }
}

// Update bundle
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const bundle = await prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, bundle.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.mediaIds !== undefined)
      updateData.mediaIds = JSON.stringify(body.mediaIds);
    if (body.originalPrice !== undefined)
      updateData.originalPrice = body.originalPrice;
    if (body.bundlePrice !== undefined)
      updateData.bundlePrice = body.bundlePrice;
    if (body.availableFor !== undefined)
      updateData.availableFor = body.availableFor;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Recalculate discount percent if prices changed
    if (body.originalPrice !== undefined || body.bundlePrice !== undefined) {
      const origPrice = body.originalPrice ?? bundle.originalPrice;
      const bundPrice = body.bundlePrice ?? bundle.bundlePrice;
      updateData.discountPercent = Math.round(
        ((origPrice - bundPrice) / origPrice) * 100
      );
    }

    const updated = await prisma.bundle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      bundle: {
        ...updated,
        mediaIds: JSON.parse(updated.mediaIds),
      },
    });
  } catch (error) {
    console.error("Update bundle error:", error);
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500 }
    );
  }
}

// Delete bundle
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const bundle = await prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, bundle.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete - mark as inactive
    await prisma.bundle.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bundle error:", error);
    return NextResponse.json(
      { error: "Failed to delete bundle" },
      { status: 500 }
    );
  }
}
