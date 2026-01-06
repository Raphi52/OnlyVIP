import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractVariables, validateScript } from "@/lib/scripts/variables";

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

  if (!creator) return { hasAccess: false, creator: null, agencyId: null };

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
    creator,
    agencyId: creator.agencyId,
  };
}

// GET /api/creator/scripts - List scripts for a creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");
    const category = searchParams.get("category");
    const folderId = searchParams.get("folderId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const favorites = searchParams.get("favorites") === "true";
    const intent = searchParams.get("intent");
    const fanStage = searchParams.get("fanStage");
    const language = searchParams.get("language");

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "Creator slug is required" },
        { status: 400 }
      );
    }

    // Verify access
    const { hasAccess, agencyId } = await verifyCreatorAccess(session.user.id, creatorSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause
    const whereClause: any = {
      creatorSlug,
      isActive: true,
    };

    if (status) {
      whereClause.status = status;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (folderId === "null") {
      whereClause.folderId = null;
    } else if (folderId) {
      whereClause.folderId = folderId;
    }

    if (intent) {
      whereClause.intent = intent;
    }

    if (fanStage) {
      whereClause.fanStage = fanStage;
    }

    if (language && language !== "any") {
      whereClause.OR = [{ language }, { language: "any" }];
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

    if (favorites) {
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
        mediaItems: {
          include: {
            media: {
              select: { id: true, contentUrl: true, type: true, thumbnailUrl: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [
        { isFavorite: "desc" },
        { category: "asc" },
        { usageCount: "desc" },
      ],
    });

    // Get intent counts
    const intentCounts = await prisma.script.groupBy({
      by: ["intent"],
      where: {
        creatorSlug,
        isActive: true,
        intent: { not: null },
      },
      _count: true,
    });

    const intents = intentCounts.map((c) => ({
      value: c.intent,
      label: (c.intent || "").replace(/_/g, " "),
      count: c._count,
    }));

    // Get category counts
    const categoryCounts = await prisma.script.groupBy({
      by: ["category"],
      where: {
        creatorSlug,
        isActive: true,
      },
      _count: true,
    });

    const categories = categoryCounts.map((c) => ({
      value: c.category,
      label: c.category.replace(/_/g, " "),
      count: c._count,
    }));

    return NextResponse.json({
      scripts,
      intents,
      categories,
      agencyId,
    });
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}

// POST /api/creator/scripts - Create a new script
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      creatorSlug,
      name,
      content,
      category,
      folderId,
      mediaIds,
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

    if (!creatorSlug || !name || !content || !category) {
      return NextResponse.json(
        { error: "Creator slug, name, content, and category are required" },
        { status: 400 }
      );
    }

    // Verify access
    const { hasAccess, agencyId } = await verifyCreatorAccess(session.user.id, creatorSlug);
    if (!hasAccess) {
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

    // Extract and validate variables
    const validation = validateScript(content);
    const usedVariables = extractVariables(content);

    // Create script
    const script = await prisma.script.create({
      data: {
        creatorSlug,
        agencyId: agencyId || null,
        name,
        content,
        category,
        folderId: folderId || null,
        authorId: session.user.id,
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        hasVariables: usedVariables.length > 0,
        variables: usedVariables.length > 0 ? JSON.stringify(usedVariables) : null,
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

// PATCH /api/creator/scripts - Update a script
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
      isActive,
      folderId,
      mediaIds,
      isFavorite,
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
      select: { creatorSlug: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Verify access
    const { hasAccess } = await verifyCreatorAccess(session.user.id, script.creatorSlug);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    }
    if (category !== undefined) updateData.category = category;
    if (folderId !== undefined) updateData.folderId = folderId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

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
      await prisma.scriptMedia.deleteMany({ where: { scriptId: id } });

      if (mediaIds.length > 0) {
        const mediaData = mediaIds.map((mediaId: string, index: number) => ({
          scriptId: id,
          mediaId,
          order: index,
        }));
        await prisma.scriptMedia.createMany({ data: mediaData });
      }

      const refreshedScript = await prisma.script.findUnique({
        where: { id },
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

// DELETE /api/creator/scripts - Soft delete a script
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
      select: { creatorSlug: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Verify access
    const { hasAccess } = await verifyCreatorAccess(session.user.id, script.creatorSlug);
    if (!hasAccess) {
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

// PUT /api/creator/scripts - Track script usage
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
