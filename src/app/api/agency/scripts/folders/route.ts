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

// GET /api/agency/scripts/folders - List all folders for an agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const folders = await prisma.scriptFolder.findMany({
      where: { agencyId },
      include: {
        children: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { scripts: true },
            },
          },
        },
        _count: {
          select: { scripts: true },
        },
      },
      orderBy: { order: "asc" },
    });

    // Build hierarchical structure (only top-level folders with nested children)
    const topLevelFolders = folders.filter((f) => !f.parentId);

    // Add script count to each folder
    const foldersWithCounts = topLevelFolders.map((folder) => ({
      ...folder,
      scriptCount: folder._count.scripts,
      children: folder.children.map((child) => ({
        ...child,
        scriptCount: child._count.scripts,
      })),
    }));

    // Also get total scripts without folder
    const unfolderedCount = await prisma.script.count({
      where: { agencyId, folderId: null, isActive: true },
    });

    return NextResponse.json({
      folders: foldersWithCounts,
      unfolderedCount,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, creatorSlug, name, description, color, icon, parentId } = body;

    if (!agencyId || !creatorSlug || !name) {
      return NextResponse.json(
        { error: "Agency ID, creator slug, and name are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If parent folder specified, verify it belongs to same agency
    if (parentId) {
      const parentFolder = await prisma.scriptFolder.findFirst({
        where: { id: parentId, agencyId },
      });
      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 400 }
        );
      }
    }

    // Get max order for positioning
    const maxOrderFolder = await prisma.scriptFolder.findFirst({
      where: { agencyId, parentId: parentId || null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = (maxOrderFolder?.order ?? -1) + 1;

    const folder = await prisma.scriptFolder.create({
      data: {
        creatorSlug,
        agencyId,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        parentId: parentId || null,
        order: newOrder,
      },
      include: {
        _count: {
          select: { scripts: true },
        },
      },
    });

    return NextResponse.json({
      folder: {
        ...folder,
        scriptCount: folder._count.scripts,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/scripts/folders - Update a folder
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, color, icon, parentId, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Get folder and verify ownership
    const folder = await prisma.scriptFolder.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (!folder.agencyId || !(await verifyAgencyOwnership(session.user.id, folder.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent folder from being its own parent
    if (parentId === id) {
      return NextResponse.json(
        { error: "Folder cannot be its own parent" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (color !== undefined) updateData.color = color || null;
    if (icon !== undefined) updateData.icon = icon || null;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (order !== undefined) updateData.order = order;

    const updatedFolder = await prisma.scriptFolder.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { scripts: true },
        },
      },
    });

    return NextResponse.json({
      folder: {
        ...updatedFolder,
        scriptCount: updatedFolder._count.scripts,
      },
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/scripts/folders - Delete a folder
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const moveScriptsTo = searchParams.get("moveScriptsTo"); // Optional: move scripts to another folder

    if (!id) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Get folder and verify ownership
    const folder = await prisma.scriptFolder.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (!folder.agencyId || !(await verifyAgencyOwnership(session.user.id, folder.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Move scripts to another folder or set to null
    await prisma.script.updateMany({
      where: { folderId: id },
      data: { folderId: moveScriptsTo || null },
    });

    // Move child folders to parent or null
    await prisma.scriptFolder.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    // Delete folder
    await prisma.scriptFolder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}

// PUT /api/agency/scripts/folders - Reorder folders
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, folders } = body; // folders: [{ id, order, parentId }]

    if (!agencyId || !folders || !Array.isArray(folders)) {
      return NextResponse.json(
        { error: "Agency ID and folders array are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update each folder's order and parent
    await Promise.all(
      folders.map((f: { id: string; order: number; parentId?: string | null }) =>
        prisma.scriptFolder.update({
          where: { id: f.id },
          data: {
            order: f.order,
            parentId: f.parentId ?? null,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering folders:", error);
    return NextResponse.json(
      { error: "Failed to reorder folders" },
      { status: 500 }
    );
  }
}
