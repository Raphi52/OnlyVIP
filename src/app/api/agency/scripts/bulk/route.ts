import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// POST /api/agency/scripts/bulk - Bulk actions on scripts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agencyId,
      scriptIds,
      action, // "delete" | "move" | "approve" | "reject" | "archive"
      folderId, // for "move" action
      rejectionReason, // for "reject" action
    } = body;

    if (!agencyId || !scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
      return NextResponse.json(
        { error: "Agency ID and script IDs are required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify all scripts belong to the agency
    const scripts = await prisma.script.findMany({
      where: {
        id: { in: scriptIds },
        agencyId,
      },
      select: { id: true },
    });

    if (scripts.length !== scriptIds.length) {
      return NextResponse.json(
        { error: "Some scripts not found or don't belong to this agency" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "delete":
        // Soft delete
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { isActive: false },
        });
        break;

      case "move":
        // Move to folder (or unfolder if folderId is null)
        if (folderId) {
          // Verify folder belongs to agency
          const folder = await prisma.scriptFolder.findFirst({
            where: { id: folderId, agencyId },
          });
          if (!folder) {
            return NextResponse.json(
              { error: "Folder not found" },
              { status: 400 }
            );
          }
        }
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { folderId: folderId || null },
        });
        break;

      case "approve":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: {
            status: "APPROVED",
            approvedById: session.user.id,
            approvedAt: new Date(),
            rejectionReason: null,
          },
        });
        break;

      case "reject":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason || null,
          },
        });
        break;

      case "archive":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { isActive: false },
        });
        break;

      case "restore":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { isActive: true },
        });
        break;

      case "favorite":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { isFavorite: true },
        });
        break;

      case "unfavorite":
        result = await prisma.script.updateMany({
          where: { id: { in: scriptIds } },
          data: { isFavorite: false },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      affected: result.count,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
