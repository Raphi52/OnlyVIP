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

// GET /api/agency/scripts/sequences - List all sequences
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");
    const category = searchParams.get("category");

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

    const whereClause: any = { agencyId };
    if (category) whereClause.category = category;

    const sequences = await prisma.scriptSequence.findMany({
      where: whereClause,
      include: {
        scripts: {
          where: { isActive: true },
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            name: true,
            content: true,
            category: true,
            sequenceOrder: true,
            hasVariables: true,
            mediaItems: {
              select: {
                media: {
                  select: { id: true, thumbnailUrl: true, type: true },
                },
              },
            },
          },
        },
        _count: {
          select: { scripts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const sequencesWithStats = sequences.map((seq) => ({
      ...seq,
      scriptCount: seq._count.scripts,
      completionRate: seq.timesStarted > 0
        ? Math.round((seq.timesCompleted / seq.timesStarted) * 100)
        : 0,
    }));

    return NextResponse.json({ sequences: sequencesWithStats });
  } catch (error) {
    console.error("Error fetching sequences:", error);
    return NextResponse.json(
      { error: "Failed to fetch sequences" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts/sequences - Create a new sequence
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, name, description, category, scriptIds } = body;

    if (!agencyId || !name || !category) {
      return NextResponse.json(
        { error: "Agency ID, name, and category are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate category
    const validCategories = [
      "PPV_FUNNEL",
      "ONBOARDING",
      "REACTIVATION",
      "CUSTOM",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Create sequence
    const sequence = await prisma.scriptSequence.create({
      data: {
        agencyId,
        name,
        description: description || null,
        category,
      },
    });

    // If scripts provided, add them to the sequence
    if (scriptIds && scriptIds.length > 0) {
      await Promise.all(
        scriptIds.map((scriptId: string, index: number) =>
          prisma.script.update({
            where: { id: scriptId },
            data: {
              sequenceId: sequence.id,
              sequenceOrder: index,
            },
          })
        )
      );
    }

    // Fetch full sequence with scripts
    const fullSequence = await prisma.scriptSequence.findUnique({
      where: { id: sequence.id },
      include: {
        scripts: {
          where: { isActive: true },
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            name: true,
            content: true,
            category: true,
            sequenceOrder: true,
          },
        },
      },
    });

    return NextResponse.json({ sequence: fullSequence }, { status: 201 });
  } catch (error) {
    console.error("Error creating sequence:", error);
    return NextResponse.json(
      { error: "Failed to create sequence" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/scripts/sequences - Update a sequence
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, category, isActive, scriptIds } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Sequence ID is required" },
        { status: 400 }
      );
    }

    // Get sequence and verify ownership
    const sequence = await prisma.scriptSequence.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, sequence.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSequence = await prisma.scriptSequence.update({
      where: { id },
      data: updateData,
    });

    // If scriptIds provided, reorder scripts in sequence
    if (scriptIds !== undefined) {
      // First, remove all scripts from this sequence
      await prisma.script.updateMany({
        where: { sequenceId: id },
        data: {
          sequenceId: null,
          sequenceOrder: null,
        },
      });

      // Then, add new scripts in order
      if (scriptIds.length > 0) {
        await Promise.all(
          scriptIds.map((scriptId: string, index: number) =>
            prisma.script.update({
              where: { id: scriptId },
              data: {
                sequenceId: id,
                sequenceOrder: index,
              },
            })
          )
        );
      }
    }

    // Fetch full sequence
    const fullSequence = await prisma.scriptSequence.findUnique({
      where: { id },
      include: {
        scripts: {
          where: { isActive: true },
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            name: true,
            content: true,
            category: true,
            sequenceOrder: true,
          },
        },
      },
    });

    return NextResponse.json({ sequence: fullSequence });
  } catch (error) {
    console.error("Error updating sequence:", error);
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/scripts/sequences - Delete a sequence
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Sequence ID is required" },
        { status: 400 }
      );
    }

    // Get sequence and verify ownership
    const sequence = await prisma.scriptSequence.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, sequence.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove scripts from sequence first
    await prisma.script.updateMany({
      where: { sequenceId: id },
      data: {
        sequenceId: null,
        sequenceOrder: null,
      },
    });

    // Delete sequence
    await prisma.scriptSequence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sequence:", error);
    return NextResponse.json(
      { error: "Failed to delete sequence" },
      { status: 500 }
    );
  }
}

// PUT /api/agency/scripts/sequences - Reorder scripts in a sequence
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, scriptIds } = body; // scriptIds in new order

    if (!id || !scriptIds || !Array.isArray(scriptIds)) {
      return NextResponse.json(
        { error: "Sequence ID and script IDs array are required" },
        { status: 400 }
      );
    }

    // Get sequence and verify ownership
    const sequence = await prisma.scriptSequence.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, sequence.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update order for each script
    await Promise.all(
      scriptIds.map((scriptId: string, index: number) =>
        prisma.script.update({
          where: { id: scriptId },
          data: { sequenceOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering scripts:", error);
    return NextResponse.json(
      { error: "Failed to reorder scripts" },
      { status: 500 }
    );
  }
}
