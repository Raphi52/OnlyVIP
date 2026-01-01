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

// GET /api/agency/scripts - List scripts for an agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");
    const creatorSlug = searchParams.get("creatorSlug");
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
    if (creatorSlug) {
      // Get scripts for specific creator OR global scripts (no creatorSlug)
      whereClause.OR = [{ creatorSlug }, { creatorSlug: null }];
    }
    if (category) whereClause.category = category;

    const scripts = await prisma.script.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { usageCount: "desc" }],
    });

    // Calculate conversion rate for each script
    const scriptsWithStats = scripts.map((script) => ({
      ...script,
      conversionRate:
        script.usageCount > 0
          ? Math.round((script.salesGenerated / script.usageCount) * 10000) /
            100
          : 0,
    }));

    return NextResponse.json({ scripts: scriptsWithStats });
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts - Create a new script
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, name, content, category, creatorSlug } = body;

    if (!agencyId || !name || !content || !category) {
      return NextResponse.json(
        { error: "Agency ID, name, content, and category are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyAgencyOwnership(session.user.id, agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate category
    const validCategories = [
      "GREETING",
      "PPV_PITCH",
      "FOLLOW_UP",
      "CLOSING",
      "CUSTOM",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Create script
    const script = await prisma.script.create({
      data: {
        agencyId,
        name,
        content,
        category,
        creatorSlug: creatorSlug || null, // null means global script
      },
    });

    return NextResponse.json({ script }, { status: 201 });
  } catch (error) {
    console.error("Error creating script:", error);
    return NextResponse.json(
      { error: "Failed to create script" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/scripts - Update a script
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, content, category, creatorSlug, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Get script and verify agency ownership
    const script = await prisma.script.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, script.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (creatorSlug !== undefined) updateData.creatorSlug = creatorSlug || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedScript = await prisma.script.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ script: updatedScript });
  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/scripts - Delete a script
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
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Get script and verify agency ownership
    const script = await prisma.script.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!(await verifyAgencyOwnership(session.user.id, script.agencyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.script.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 }
    );
  }
}

// POST /api/agency/scripts/use - Track script usage
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Increment usage count
    const script = await prisma.script.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error tracking script usage:", error);
    return NextResponse.json(
      { error: "Failed to track script usage" },
      { status: 500 }
    );
  }
}
