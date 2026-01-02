import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractVariables } from "@/lib/scripts/variables";

// GET /api/chatter/scripts - Get scripts from agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const agencyId = (session.user as any).agencyId;
    const userId = session.user?.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const favoritesOnly = searchParams.get("favorites") === "true";
    const myDrafts = searchParams.get("myDrafts") === "true";

    if (!agencyId || !chatterId) {
      return NextResponse.json({ error: "Agency ID not found" }, { status: 400 });
    }

    // Verify chatter is active
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        isActive: true,
        assignedCreators: {
          select: { creatorSlug: true },
        },
      },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    const assignedSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);

    // Get chatter's favorites
    const favorites = await prisma.chatterScriptFavorite.findMany({
      where: { chatterId },
      select: { scriptId: true, order: true },
      orderBy: { order: "asc" },
    });
    const favoriteIds = new Set(favorites.map((f) => f.scriptId));

    // Build query
    let whereClause: any;

    if (myDrafts) {
      // Show chatter's own drafts/pending/rejected
      whereClause = {
        agencyId,
        authorId: userId,
        status: { in: ["DRAFT", "PENDING", "REJECTED"] },
        isActive: true,
      };
    } else if (favoritesOnly) {
      // Show only favorites
      whereClause = {
        id: { in: Array.from(favoriteIds) },
        isActive: true,
      };
    } else {
      // Show approved scripts + own drafts
      whereClause = {
        agencyId,
        isActive: true,
        OR: [
          {
            status: "APPROVED",
            OR: [
              { creatorSlug: null },
              { creatorSlug: { in: assignedSlugs } },
            ],
          },
          {
            authorId: userId,
            status: { in: ["DRAFT", "PENDING", "REJECTED"] },
          },
        ],
      };
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (search) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Get scripts
    const scripts = await prisma.script.findMany({
      where: whereClause,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      include: {
        folder: {
          select: { id: true, name: true, icon: true },
        },
        author: {
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
      },
    });

    // Add favorite status
    const scriptsWithFavorites = scripts.map((script) => ({
      ...script,
      isFavorite: favoriteIds.has(script.id),
      favoriteOrder: favorites.find((f) => f.scriptId === script.id)?.order ?? null,
    }));

    // Sort favorites first if not filtering by favorites
    if (!favoritesOnly) {
      scriptsWithFavorites.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
    }

    // Group by category for quick access
    const categories = ["GREETING", "PPV_PITCH", "FOLLOW_UP", "CLOSING", "CUSTOM"];
    const approvedScripts = scriptsWithFavorites.filter((s) => s.status === "APPROVED");
    const byCategory = categories.reduce(
      (acc, cat) => {
        acc[cat] = approvedScripts.filter((s) => s.category === cat);
        return acc;
      },
      {} as Record<string, typeof scriptsWithFavorites>
    );

    // Count pending scripts by this chatter
    const pendingCount = scriptsWithFavorites.filter(
      (s) => s.status === "PENDING" && s.authorId === userId
    ).length;

    return NextResponse.json({
      scripts: scriptsWithFavorites,
      byCategory,
      categories: categories.map((cat) => ({
        value: cat,
        label: cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count: byCategory[cat]?.length || 0,
      })),
      total: scriptsWithFavorites.length,
      favoritesCount: favoriteIds.size,
      pendingCount,
    });
  } catch (error) {
    console.error("Error fetching chatter scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}

// POST /api/chatter/scripts - Propose a new script
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;
    const agencyId = (session.user as any).agencyId;

    if (!agencyId || !userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const body = await request.json();
    const { name, content, category, creatorSlug } = body;

    if (!name || !content || !category) {
      return NextResponse.json(
        { error: "Name, content, and category are required" },
        { status: 400 }
      );
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

    // Extract variables
    const usedVariables = extractVariables(content);

    // Create script with PENDING status (needs approval)
    const script = await prisma.script.create({
      data: {
        agencyId,
        name,
        content,
        category,
        creatorSlug: creatorSlug || null,
        authorId: userId,
        status: "PENDING", // Chatter scripts need approval
        hasVariables: usedVariables.length > 0,
        variables: usedVariables.length > 0 ? JSON.stringify(usedVariables) : null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ script }, { status: 201 });
  } catch (error) {
    console.error("Error proposing script:", error);
    return NextResponse.json(
      { error: "Failed to propose script" },
      { status: 500 }
    );
  }
}

// PATCH /api/chatter/scripts - Update own draft script
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;
    const body = await request.json();
    const { id, name, content, category, creatorSlug } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Get script
    const script = await prisma.script.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Chatters can only edit their own drafts or rejected scripts
    if (script.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["DRAFT", "REJECTED"].includes(script.status)) {
      return NextResponse.json(
        { error: "Cannot edit approved or pending scripts" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) {
      updateData.content = content;
      const usedVariables = extractVariables(content);
      updateData.hasVariables = usedVariables.length > 0;
      updateData.variables = usedVariables.length > 0
        ? JSON.stringify(usedVariables)
        : null;

      // If editing rejected script, set back to pending
      if (script.status === "REJECTED") {
        updateData.status = "PENDING";
        updateData.rejectionReason = null;
      }
    }
    if (category !== undefined) updateData.category = category;
    if (creatorSlug !== undefined) updateData.creatorSlug = creatorSlug || null;

    const updatedScript = await prisma.script.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
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

// PUT /api/chatter/scripts - Track script usage with more details
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const body = await request.json();
    const {
      scriptId,
      conversationId,
      messageId,
      creatorSlug,
      fanUserId,
      action = "COPIED", // COPIED | SENT | SENT_MODIFIED | CANCELLED
      modifications,
    } = body;

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    // Increment usage count on script
    await prisma.script.update({
      where: { id: scriptId },
      data: {
        usageCount: { increment: 1 },
        messagesSent: action === "SENT" || action === "SENT_MODIFIED"
          ? { increment: 1 }
          : undefined,
      },
    });

    // Create usage log if we have conversation context
    if (conversationId && creatorSlug && fanUserId) {
      await prisma.scriptUsage.create({
        data: {
          scriptId,
          chatterId,
          conversationId,
          messageId: messageId || null,
          creatorSlug,
          fanUserId,
          action,
          modifications: modifications || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking script usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}

// DELETE /api/chatter/scripts - Delete own draft script
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Get script
    const script = await prisma.script.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Chatters can only delete their own drafts
    if (script.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["DRAFT", "REJECTED"].includes(script.status)) {
      return NextResponse.json(
        { error: "Cannot delete approved or pending scripts" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.script.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 }
    );
  }
}
