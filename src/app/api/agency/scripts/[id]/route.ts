import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractVariables } from "@/lib/scripts/variables";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// GET /api/agency/scripts/[id] - Get a single script
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true },
        },
        author: {
          select: { id: true, name: true, image: true },
        },
        approvedBy: {
          select: { id: true, name: true },
        },
        mediaItems: {
          include: {
            media: {
              select: { id: true, contentUrl: true, type: true, thumbnailUrl: true },
            },
          },
          orderBy: { order: "asc" },
        },
        sequence: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            chatterFavorites: true,
            usageLogs: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Verify access
    if (!(await verifyAgencyOwnership(session.user.id, script.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error fetching script:", error);
    return NextResponse.json(
      { error: "Failed to fetch script" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts/[id] - Duplicate a script
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
    const { name } = body; // Optional new name

    // Get original script
    const original = await prisma.script.findUnique({
      where: { id },
      include: {
        mediaItems: {
          select: { mediaId: true, order: true },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, original.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create duplicate
    const duplicate = await prisma.script.create({
      data: {
        agencyId: original.agencyId,
        name: name || `${original.name} (Copy)`,
        content: original.content,
        category: original.category,
        folderId: original.folderId,
        creatorSlug: original.creatorSlug,
        authorId: session.user.id,
        status: "APPROVED", // Duplicates are auto-approved
        approvedById: session.user.id,
        approvedAt: new Date(),
        hasVariables: original.hasVariables,
        variables: original.variables,
        // Reset stats for duplicate
        usageCount: 0,
        messagesSent: 0,
        salesGenerated: 0,
        revenueGenerated: 0,
        conversionRate: 0,
      },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true },
        },
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Duplicate media attachments
    if (original.mediaItems.length > 0) {
      await prisma.scriptMedia.createMany({
        data: original.mediaItems.map((item) => ({
          scriptId: duplicate.id,
          mediaId: item.mediaId,
          order: item.order,
        })),
      });
    }

    // Fetch full duplicate with media
    const fullDuplicate = await prisma.script.findUnique({
      where: { id: duplicate.id },
      include: {
        folder: {
          select: { id: true, name: true, color: true, icon: true },
        },
        author: {
          select: { id: true, name: true, image: true },
        },
        mediaItems: {
          include: {
            media: {
              select: { id: true, contentUrl: true, type: true, thumbnailUrl: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ script: fullDuplicate }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating script:", error);
    return NextResponse.json(
      { error: "Failed to duplicate script" },
      { status: 500 }
    );
  }
}
