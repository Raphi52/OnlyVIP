import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to verify creator access (owner, agency owner, or admin)
async function verifyCreatorAccess(userId: string, creatorSlug: string) {
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: {
      userId: true,
      agencyId: true,
      agency: {
        select: { ownerId: true },
      },
    },
  });

  if (!creator) return { hasAccess: false };

  // Check if user is the creator owner
  const isOwner = creator.userId === userId;

  // Check if user is the agency owner
  const isAgencyOwner = creator.agency?.ownerId === userId;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "ADMIN";

  return {
    hasAccess: isOwner || isAgencyOwner || isAdmin,
  };
}

// DELETE /api/creator/scripts/bulk - Bulk delete scripts
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scriptIds, creatorSlug } = body;

    if (!scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
      return NextResponse.json(
        { error: "Script IDs array is required" },
        { status: 400 }
      );
    }

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "Creator slug is required" },
        { status: 400 }
      );
    }

    // Verify access to the creator
    const { hasAccess } = await verifyCreatorAccess(session.user.id, creatorSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify all scripts belong to this creator
    const scripts = await prisma.script.findMany({
      where: {
        id: { in: scriptIds },
        creatorSlug,
      },
      select: { id: true },
    });

    const validIds = scripts.map((s) => s.id);

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid scripts found" },
        { status: 404 }
      );
    }

    // Soft delete all scripts
    const result = await prisma.script.updateMany({
      where: {
        id: { in: validIds },
        creatorSlug,
      },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      requested: scriptIds.length,
    });
  } catch (error) {
    console.error("Error bulk deleting scripts:", error);
    return NextResponse.json(
      { error: "Failed to delete scripts" },
      { status: 500 }
    );
  }
}
