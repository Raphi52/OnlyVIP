import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/creator/ai-personas - Get all personas for a creator
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");

    if (!creatorSlug) {
      return NextResponse.json({ error: "creatorSlug required" }, { status: 400 });
    }

    // Verify the user owns this creator OR is an agency owner managing this creator
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: {
        userId: true,
        agencyId: true,
        agency: { select: { ownerId: true } },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const isOwner = creator.userId === session.user.id;
    const isAgencyOwner = creator.agency?.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isOwner && !isAgencyOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this creator" }, { status: 403 });
    }

    // Get all personas for this creator
    const personalities = await prisma.creatorAiPersonality.findMany({
      where: { creatorSlug },
      orderBy: [{ isActive: "desc" }, { trafficShare: "desc" }, { createdAt: "desc" }],
    });

    // Get stats for each personality (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const personalitiesWithStats = await Promise.all(
      personalities.map(async (p) => {
        // Get earnings
        const earnings = await prisma.aiPersonalityEarning.aggregate({
          where: {
            aiPersonalityId: p.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
          _count: { id: true },
        });

        // Get messages count
        const messagesCount = await prisma.message.count({
          where: {
            aiPersonalityId: p.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        // Get conversations count
        const conversationsCount = await prisma.conversation.count({
          where: {
            aiPersonalityId: p.id,
            updatedAt: { gte: thirtyDaysAgo },
          },
        });

        // Calculate conversion rate - count transactions/sales
        const conversions = await prisma.creatorEarning.count({
          where: {
            creatorSlug: p.creatorSlug,
            aiPersonalityId: p.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        // Safely parse JSON fields
        let parsedPersonality = {};
        let parsedToneKeywords = null;
        let parsedHandoffKeywords = null;

        try {
          parsedPersonality = p.personality ? JSON.parse(p.personality) : {};
        } catch {
          parsedPersonality = {};
        }
        try {
          parsedToneKeywords = p.toneKeywords ? JSON.parse(p.toneKeywords) : null;
        } catch {
          parsedToneKeywords = null;
        }
        try {
          parsedHandoffKeywords = p.handoffKeywords ? JSON.parse(p.handoffKeywords) : null;
        } catch {
          parsedHandoffKeywords = null;
        }

        return {
          id: p.id,
          creatorSlug: p.creatorSlug,
          agencyId: p.agencyId,
          name: p.name,
          personality: parsedPersonality,
          primaryTone: p.primaryTone,
          toneKeywords: parsedToneKeywords,
          language: p.language, // Language targeting
          trafficShare: p.trafficShare,
          isActive: p.isActive,
          aiMediaEnabled: p.aiMediaEnabled,
          aiMediaFrequency: p.aiMediaFrequency,
          aiPPVRatio: p.aiPPVRatio,
          aiTeasingEnabled: p.aiTeasingEnabled,
          autoHandoffEnabled: p.autoHandoffEnabled,
          handoffSpendThreshold: p.handoffSpendThreshold,
          handoffOnHighIntent: p.handoffOnHighIntent,
          handoffKeywords: parsedHandoffKeywords,
          giveUpOnNonPaying: p.giveUpOnNonPaying,
          giveUpMessageThreshold: p.giveUpMessageThreshold,
          giveUpAction: p.giveUpAction,
          createdAt: p.createdAt.toISOString(),
          stats: {
            revenue30d: earnings._sum.grossAmount || 0,
            sales30d: earnings._count.id || 0,
            messages30d: messagesCount,
            conversations30d: conversationsCount,
            conversionRate: conversationsCount > 0 ? Math.round((conversions / conversationsCount) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({ personalities: personalitiesWithStats });
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}

// POST /api/creator/ai-personas - Create a new persona
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
      personality,
      primaryTone,
      toneKeywords,
      language, // Language targeting for this persona
      trafficShare = 100,
      aiMediaEnabled = true,
      aiMediaFrequency = 4,
      aiPPVRatio = 30,
      aiTeasingEnabled = true,
      autoHandoffEnabled = true,
      handoffSpendThreshold = 40,
      handoffOnHighIntent = true,
      handoffKeywords,
      giveUpOnNonPaying = false,
      giveUpMessageThreshold = 20,
      giveUpAction = "stop",
    } = body;

    if (!creatorSlug || !name) {
      return NextResponse.json({ error: "creatorSlug and name required" }, { status: 400 });
    }

    // Verify the user owns this creator OR is an agency owner
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: {
        id: true,
        userId: true,
        agencyId: true,
        agency: { select: { ownerId: true } },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const isOwner = creator.userId === session.user.id;
    const isAgencyOwner = creator.agency?.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isOwner && !isAgencyOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this creator" }, { status: 403 });
    }

    // Create persona
    const newPersona = await prisma.creatorAiPersonality.create({
      data: {
        creatorSlug,
        creatorId: creator.id,
        agencyId: creator.agencyId, // Will be null if not part of agency
        name,
        personality: JSON.stringify(personality || {}),
        primaryTone: primaryTone || null,
        toneKeywords: toneKeywords ? JSON.stringify(toneKeywords) : null,
        language: language || null, // Language targeting
        trafficShare,
        isActive: true,
        aiMediaEnabled,
        aiMediaFrequency,
        aiPPVRatio,
        aiTeasingEnabled,
        autoHandoffEnabled,
        handoffSpendThreshold,
        handoffOnHighIntent,
        handoffKeywords: handoffKeywords ? JSON.stringify(handoffKeywords) : null,
        giveUpOnNonPaying,
        giveUpMessageThreshold,
        giveUpAction,
      },
    });

    return NextResponse.json({
      personality: {
        id: newPersona.id,
        creatorSlug: newPersona.creatorSlug,
        name: newPersona.name,
        personality: newPersona.personality ? JSON.parse(newPersona.personality) : {},
        primaryTone: newPersona.primaryTone,
        toneKeywords: newPersona.toneKeywords ? JSON.parse(newPersona.toneKeywords) : null,
        language: newPersona.language, // Language targeting
        trafficShare: newPersona.trafficShare,
        isActive: newPersona.isActive,
        aiMediaEnabled: newPersona.aiMediaEnabled,
        aiMediaFrequency: newPersona.aiMediaFrequency,
        aiPPVRatio: newPersona.aiPPVRatio,
        aiTeasingEnabled: newPersona.aiTeasingEnabled,
        autoHandoffEnabled: newPersona.autoHandoffEnabled,
        handoffSpendThreshold: newPersona.handoffSpendThreshold,
        handoffOnHighIntent: newPersona.handoffOnHighIntent,
        handoffKeywords: newPersona.handoffKeywords ? JSON.parse(newPersona.handoffKeywords) : null,
        giveUpOnNonPaying: newPersona.giveUpOnNonPaying,
        giveUpMessageThreshold: newPersona.giveUpMessageThreshold,
        giveUpAction: newPersona.giveUpAction,
        createdAt: newPersona.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating persona:", error);
    return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
  }
}

// PATCH /api/creator/ai-personas - Update a persona
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Persona ID required" }, { status: 400 });
    }

    // Get persona and verify access
    const persona = await prisma.creatorAiPersonality.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            userId: true,
            agency: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const isOwner = persona.creator?.userId === session.user.id;
    const isAgencyOwner = persona.creator?.agency?.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isOwner && !isAgencyOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this persona" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.personality !== undefined) updateData.personality = JSON.stringify(updates.personality);
    if (updates.primaryTone !== undefined) updateData.primaryTone = updates.primaryTone;
    if (updates.toneKeywords !== undefined) {
      updateData.toneKeywords = updates.toneKeywords ? JSON.stringify(updates.toneKeywords) : null;
    }
    if (updates.language !== undefined) updateData.language = updates.language || null;
    if (updates.trafficShare !== undefined) updateData.trafficShare = updates.trafficShare;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.aiMediaEnabled !== undefined) updateData.aiMediaEnabled = updates.aiMediaEnabled;
    if (updates.aiMediaFrequency !== undefined) updateData.aiMediaFrequency = updates.aiMediaFrequency;
    if (updates.aiPPVRatio !== undefined) updateData.aiPPVRatio = updates.aiPPVRatio;
    if (updates.aiTeasingEnabled !== undefined) updateData.aiTeasingEnabled = updates.aiTeasingEnabled;
    if (updates.autoHandoffEnabled !== undefined) updateData.autoHandoffEnabled = updates.autoHandoffEnabled;
    if (updates.handoffSpendThreshold !== undefined) updateData.handoffSpendThreshold = updates.handoffSpendThreshold;
    if (updates.handoffOnHighIntent !== undefined) updateData.handoffOnHighIntent = updates.handoffOnHighIntent;
    if (updates.handoffKeywords !== undefined) {
      updateData.handoffKeywords = updates.handoffKeywords ? JSON.stringify(updates.handoffKeywords) : null;
    }
    if (updates.giveUpOnNonPaying !== undefined) updateData.giveUpOnNonPaying = updates.giveUpOnNonPaying;
    if (updates.giveUpMessageThreshold !== undefined) updateData.giveUpMessageThreshold = updates.giveUpMessageThreshold;
    if (updates.giveUpAction !== undefined) updateData.giveUpAction = updates.giveUpAction;

    const updated = await prisma.creatorAiPersonality.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      personality: {
        id: updated.id,
        creatorSlug: updated.creatorSlug,
        name: updated.name,
        personality: updated.personality ? JSON.parse(updated.personality) : {},
        primaryTone: updated.primaryTone,
        toneKeywords: updated.toneKeywords ? JSON.parse(updated.toneKeywords) : null,
        language: updated.language, // Language targeting
        trafficShare: updated.trafficShare,
        isActive: updated.isActive,
        aiMediaEnabled: updated.aiMediaEnabled,
        aiMediaFrequency: updated.aiMediaFrequency,
        aiPPVRatio: updated.aiPPVRatio,
        aiTeasingEnabled: updated.aiTeasingEnabled,
        autoHandoffEnabled: updated.autoHandoffEnabled,
        handoffSpendThreshold: updated.handoffSpendThreshold,
        handoffOnHighIntent: updated.handoffOnHighIntent,
        handoffKeywords: updated.handoffKeywords ? JSON.parse(updated.handoffKeywords) : null,
        giveUpOnNonPaying: updated.giveUpOnNonPaying,
        giveUpMessageThreshold: updated.giveUpMessageThreshold,
        giveUpAction: updated.giveUpAction,
      },
    });
  } catch (error) {
    console.error("Error updating persona:", error);
    return NextResponse.json({ error: "Failed to update persona" }, { status: 500 });
  }
}

// DELETE /api/creator/ai-personas - Delete a persona
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Persona ID required" }, { status: 400 });
    }

    // Get persona and verify access
    const persona = await prisma.creatorAiPersonality.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            userId: true,
            agency: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const isOwner = persona.creator?.userId === session.user.id;
    const isAgencyOwner = persona.creator?.agency?.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isOwner && !isAgencyOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this persona" }, { status: 403 });
    }

    await prisma.creatorAiPersonality.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting persona:", error);
    return NextResponse.json({ error: "Failed to delete persona" }, { status: 500 });
  }
}
