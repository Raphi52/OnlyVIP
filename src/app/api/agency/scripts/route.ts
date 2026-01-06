import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractVariables, validateScript } from "@/lib/scripts/variables";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return agency?.ownerId === userId;
}

// Helper to check if user is agency owner or chatter
async function getUserAgencyRole(userId: string, agencyId: string) {
  // Check if owner
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });

  if (agency?.ownerId === userId) {
    return { role: "owner" as const, chatterId: null };
  }

  // Check if chatter (via user email)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (user?.email) {
    const chatter = await prisma.chatter.findFirst({
      where: {
        agencyId,
        email: user.email,
        isActive: true,
      },
      select: { id: true },
    });

    if (chatter) {
      return { role: "chatter" as const, chatterId: chatter.id };
    }
  }

  return { role: null, chatterId: null };
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
    const folderId = searchParams.get("folderId");
    const status = searchParams.get("status");
    const authorId = searchParams.get("authorId");
    const hasMedia = searchParams.get("hasMedia");
    const sequenceId = searchParams.get("sequenceId");
    const search = searchParams.get("search");
    const favorites = searchParams.get("favorites") === "true";
    // New filters
    const intent = searchParams.get("intent");
    const fanStage = searchParams.get("fanStage");
    const language = searchParams.get("language");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Check user role
    const { role, chatterId } = await getUserAgencyRole(session.user.id, agencyId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause
    const whereClause: any = {
      agencyId,
      isActive: true,
    };

    // For chatters, only show approved scripts + their own drafts
    if (role === "chatter") {
      whereClause.OR = [
        { status: "APPROVED" },
        { authorId: session.user.id, status: { in: ["DRAFT", "PENDING", "REJECTED"] } },
      ];
    } else if (status) {
      whereClause.status = status;
    }

    // Creator filter
    if (creatorSlug) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [{ creatorSlug }, { creatorSlug: null }],
      });
    }

    // Other filters
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (folderId === "null") {
      whereClause.folderId = null;
    } else if (folderId) {
      whereClause.folderId = folderId;
    }
    if (authorId) {
      whereClause.authorId = authorId;
    }
    if (sequenceId) {
      whereClause.sequenceId = sequenceId;
    }
    // New filters
    if (intent) {
      whereClause.intent = intent;
    }
    if (fanStage) {
      whereClause.fanStage = fanStage;
    }
    if (language && language !== "any") {
      whereClause.OR = [
        { language },
        { language: "any" },
      ];
    }

    // Search
    if (search) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Owner favorites
    if (favorites && role === "owner") {
      whereClause.isFavorite = true;
    }

    const scripts = await prisma.script.findMany({
      where: whereClause,
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
          },
        },
      },
      orderBy: [
        { isFavorite: "desc" },
        { category: "asc" },
        { usageCount: "desc" },
      ],
    });

    // If chatter, also get their favorites
    let chatterFavoriteIds: Set<string> = new Set();
    if (chatterId) {
      const favorites = await prisma.chatterScriptFavorite.findMany({
        where: { chatterId },
        select: { scriptId: true },
      });
      chatterFavoriteIds = new Set(favorites.map((f) => f.scriptId));
    }

    // Get category counts
    const categoryCounts = await prisma.script.groupBy({
      by: ["category"],
      where: {
        agencyId,
        isActive: true,
        status: role === "chatter" ? "APPROVED" : undefined,
      },
      _count: true,
    });

    const categories = categoryCounts.map((c) => ({
      value: c.category,
      label: c.category.replace(/_/g, " "),
      count: c._count,
    }));

    // Get intent counts
    const intentCounts = await prisma.script.groupBy({
      by: ["intent"],
      where: {
        agencyId,
        isActive: true,
        status: role === "chatter" ? "APPROVED" : undefined,
        intent: { not: null },
      },
      _count: true,
    });

    const intents = intentCounts.map((c) => ({
      value: c.intent,
      label: (c.intent || "").replace(/_/g, " "),
      count: c._count,
    }));

    // Format response
    const scriptsWithStats = scripts.map((script) => ({
      ...script,
      isChatterFavorite: chatterFavoriteIds.has(script.id),
      mediaCount: script.mediaItems.length,
      favoritesCount: script._count.chatterFavorites,
    }));

    // Get pending count for owner
    let pendingCount = 0;
    if (role === "owner") {
      pendingCount = await prisma.script.count({
        where: { agencyId, status: "PENDING", isActive: true },
      });
    }

    return NextResponse.json({
      scripts: scriptsWithStats,
      categories,
      intents,
      pendingCount,
      role,
    });
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
    const {
      agencyId,
      name,
      content,
      category,
      creatorSlug,
      folderId,
      mediaIds,
      sequenceId,
      sequenceOrder,
      // New fields
      intent,
      triggerKeywords,
      triggerPatterns,
      fanStage,
      minConfidence,
      priority,
      suggestedPrice,
      priceMin,
      priceMax,
      isFreeTease,
      aiInstructions,
      allowAiModify,
      preserveCore,
      exampleResponses,
      nextScriptOnSuccess,
      nextScriptOnReject,
      followUpDelay,
      followUpScriptId,
      language,
      objectionType,
      objectionResponse,
    } = body;

    if (!agencyId || !name || !content || !category) {
      return NextResponse.json(
        { error: "Agency ID, name, content, and category are required" },
        { status: 400 }
      );
    }

    // Check user role
    const { role, chatterId } = await getUserAgencyRole(session.user.id, agencyId);
    if (!role) {
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

    // Validate folder belongs to agency
    if (folderId) {
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

    // Extract and validate variables
    const validation = validateScript(content);
    const usedVariables = extractVariables(content);

    // Determine status based on role
    // Owner: auto-approved, Chatter: pending review
    const status = role === "owner" ? "APPROVED" : "PENDING";

    // Create script
    const script = await prisma.script.create({
      data: {
        agencyId,
        name,
        content,
        category,
        creatorSlug: creatorSlug || null,
        folderId: folderId || null,
        authorId: session.user.id,
        status,
        approvedById: role === "owner" ? session.user.id : null,
        approvedAt: role === "owner" ? new Date() : null,
        hasVariables: usedVariables.length > 0,
        variables: usedVariables.length > 0 ? JSON.stringify(usedVariables) : null,
        sequenceId: sequenceId || null,
        sequenceOrder: sequenceOrder ?? null,
        // New fields
        intent: intent || null,
        triggerKeywords: triggerKeywords ? JSON.stringify(triggerKeywords) : null,
        triggerPatterns: triggerPatterns ? JSON.stringify(triggerPatterns) : null,
        fanStage: fanStage || null,
        minConfidence: minConfidence ?? 0.5,
        priority: priority ?? 50,
        suggestedPrice: suggestedPrice ?? null,
        priceMin: priceMin ?? null,
        priceMax: priceMax ?? null,
        isFreeTease: isFreeTease ?? false,
        aiInstructions: aiInstructions || null,
        allowAiModify: allowAiModify ?? true,
        preserveCore: preserveCore || null,
        exampleResponses: exampleResponses ? JSON.stringify(exampleResponses) : null,
        nextScriptOnSuccess: nextScriptOnSuccess || null,
        nextScriptOnReject: nextScriptOnReject || null,
        followUpDelay: followUpDelay ?? null,
        followUpScriptId: followUpScriptId || null,
        language: language || "any",
        objectionType: objectionType || null,
        objectionResponse: objectionResponse || null,
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

    // Attach media if provided
    if (mediaIds && mediaIds.length > 0) {
      const mediaData = mediaIds.map((mediaId: string, index: number) => ({
        scriptId: script.id,
        mediaId,
        order: index,
      }));
      await prisma.scriptMedia.createMany({ data: mediaData });
    }

    // Get full script with media
    const fullScript = await prisma.script.findUnique({
      where: { id: script.id },
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

    return NextResponse.json({
      script: fullScript,
      validation,
    }, { status: 201 });
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
    const {
      id,
      name,
      content,
      category,
      creatorSlug,
      isActive,
      folderId,
      mediaIds,
      isFavorite,
      sequenceId,
      sequenceOrder,
      // Approval actions (owner only)
      action, // "approve" | "reject"
      rejectionReason,
      // New fields
      intent,
      triggerKeywords,
      triggerPatterns,
      fanStage,
      minConfidence,
      priority,
      suggestedPrice,
      priceMin,
      priceMax,
      isFreeTease,
      aiInstructions,
      allowAiModify,
      preserveCore,
      exampleResponses,
      nextScriptOnSuccess,
      nextScriptOnReject,
      followUpDelay,
      followUpScriptId,
      language,
      objectionType,
      objectionResponse,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Script ID is required" },
        { status: 400 }
      );
    }

    // Get script
    const script = await prisma.script.findUnique({
      where: { id },
      select: {
        agencyId: true,
        authorId: true,
        status: true,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Script must have an agencyId for this agency API
    if (!script.agencyId) {
      return NextResponse.json({ error: "Script not associated with an agency" }, { status: 400 });
    }

    // Check user role
    const { role } = await getUserAgencyRole(session.user.id, script.agencyId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Chatters can only edit their own draft/rejected scripts
    if (role === "chatter") {
      if (script.authorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["DRAFT", "REJECTED"].includes(script.status)) {
        return NextResponse.json(
          { error: "Cannot edit approved or pending scripts" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    // Handle approval workflow (owner only)
    if (role === "owner" && action) {
      if (action === "approve") {
        updateData.status = "APPROVED";
        updateData.approvedById = session.user.id;
        updateData.approvedAt = new Date();
        updateData.rejectionReason = null;
      } else if (action === "reject") {
        updateData.status = "REJECTED";
        updateData.rejectionReason = rejectionReason || null;
      }
    }

    // Handle content updates
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) {
      updateData.content = content;
      // Re-extract variables
      const usedVariables = extractVariables(content);
      updateData.hasVariables = usedVariables.length > 0;
      updateData.variables = usedVariables.length > 0
        ? JSON.stringify(usedVariables)
        : null;

      // If chatter modifies a rejected script, set back to pending
      if (role === "chatter" && script.status === "REJECTED") {
        updateData.status = "PENDING";
        updateData.rejectionReason = null;
      }
    }
    if (category !== undefined) updateData.category = category;
    if (creatorSlug !== undefined) updateData.creatorSlug = creatorSlug || null;
    if (folderId !== undefined) updateData.folderId = folderId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFavorite !== undefined && role === "owner") {
      updateData.isFavorite = isFavorite;
    }
    if (sequenceId !== undefined) updateData.sequenceId = sequenceId || null;
    if (sequenceOrder !== undefined) updateData.sequenceOrder = sequenceOrder;

    // New fields
    if (intent !== undefined) updateData.intent = intent || null;
    if (triggerKeywords !== undefined) {
      updateData.triggerKeywords = triggerKeywords ? JSON.stringify(triggerKeywords) : null;
    }
    if (triggerPatterns !== undefined) {
      updateData.triggerPatterns = triggerPatterns ? JSON.stringify(triggerPatterns) : null;
    }
    if (fanStage !== undefined) updateData.fanStage = fanStage || null;
    if (minConfidence !== undefined) updateData.minConfidence = minConfidence;
    if (priority !== undefined) updateData.priority = priority;
    if (suggestedPrice !== undefined) updateData.suggestedPrice = suggestedPrice;
    if (priceMin !== undefined) updateData.priceMin = priceMin;
    if (priceMax !== undefined) updateData.priceMax = priceMax;
    if (isFreeTease !== undefined) updateData.isFreeTease = isFreeTease;
    if (aiInstructions !== undefined) updateData.aiInstructions = aiInstructions || null;
    if (allowAiModify !== undefined) updateData.allowAiModify = allowAiModify;
    if (preserveCore !== undefined) updateData.preserveCore = preserveCore || null;
    if (exampleResponses !== undefined) {
      updateData.exampleResponses = exampleResponses ? JSON.stringify(exampleResponses) : null;
    }
    if (nextScriptOnSuccess !== undefined) updateData.nextScriptOnSuccess = nextScriptOnSuccess || null;
    if (nextScriptOnReject !== undefined) updateData.nextScriptOnReject = nextScriptOnReject || null;
    if (followUpDelay !== undefined) updateData.followUpDelay = followUpDelay;
    if (followUpScriptId !== undefined) updateData.followUpScriptId = followUpScriptId || null;
    if (language !== undefined) updateData.language = language || "any";
    if (objectionType !== undefined) updateData.objectionType = objectionType || null;
    if (objectionResponse !== undefined) updateData.objectionResponse = objectionResponse || null;

    const updatedScript = await prisma.script.update({
      where: { id },
      data: updateData,
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
      },
    });

    // Update media attachments if provided
    if (mediaIds !== undefined) {
      // Remove existing
      await prisma.scriptMedia.deleteMany({ where: { scriptId: id } });

      // Add new
      if (mediaIds.length > 0) {
        const mediaData = mediaIds.map((mediaId: string, index: number) => ({
          scriptId: id,
          mediaId,
          order: index,
        }));
        await prisma.scriptMedia.createMany({ data: mediaData });
      }

      // Refetch with updated media
      const refreshedScript = await prisma.script.findUnique({
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
        },
      });

      return NextResponse.json({ script: refreshedScript });
    }

    return NextResponse.json({ script: updatedScript });
  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/scripts - Soft delete a script
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

    // Get script
    const script = await prisma.script.findUnique({
      where: { id },
      select: { agencyId: true, authorId: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Script must have an agencyId for this agency API
    if (!script.agencyId) {
      return NextResponse.json({ error: "Script not associated with an agency" }, { status: 400 });
    }

    // Check user role
    const { role } = await getUserAgencyRole(session.user.id, script.agencyId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Chatters can only delete their own drafts
    if (role === "chatter" && script.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

// PUT /api/agency/scripts - Track script usage (legacy)
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
