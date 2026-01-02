/**
 * API: Objection Pattern by ID
 *
 * GET /api/agency/objection-patterns/[id] - Get pattern
 * PATCH /api/agency/objection-patterns/[id] - Update pattern
 * DELETE /api/agency/objection-patterns/[id] - Delete pattern
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

// Get single pattern
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const pattern = await prisma.objectionPattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, pattern.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      pattern: {
        ...pattern,
        patterns: JSON.parse(pattern.patterns),
        conversionRate:
          pattern.timesTriggered > 0
            ? Math.round((pattern.timesConverted / pattern.timesTriggered) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Get objection pattern error:", error);
    return NextResponse.json(
      { error: "Failed to get pattern" },
      { status: 500 }
    );
  }
}

// Update pattern
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const pattern = await prisma.objectionPattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, pattern.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.patterns !== undefined)
      updateData.patterns = JSON.stringify(body.patterns);
    if (body.strategy !== undefined) updateData.strategy = body.strategy;
    if (body.responseTemplate !== undefined)
      updateData.responseTemplate = body.responseTemplate;
    if (body.discountPercent !== undefined)
      updateData.discountPercent = body.discountPercent;
    if (body.discountValidHours !== undefined)
      updateData.discountValidHours = body.discountValidHours;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.objectionPattern.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      pattern: {
        ...updated,
        patterns: JSON.parse(updated.patterns),
      },
    });
  } catch (error) {
    console.error("Update objection pattern error:", error);
    return NextResponse.json(
      { error: "Failed to update pattern" },
      { status: 500 }
    );
  }
}

// Delete pattern
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const pattern = await prisma.objectionPattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    // Verify agency access
    const isOwner = await verifyAgencyOwnership(session.user.id, pattern.agencyId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.objectionPattern.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete objection pattern error:", error);
    return NextResponse.json(
      { error: "Failed to delete pattern" },
      { status: 500 }
    );
  }
}
