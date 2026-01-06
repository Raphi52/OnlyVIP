import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true },
  });
  return { isOwner: agency?.ownerId === userId };
}

// GET /api/agency/ai-personas - List AI personalities for an agency
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");
    const creatorSlug = searchParams.get("creatorSlug");

    if (!agencyId) {
      return NextResponse.json(
        { error: "Agency ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { isOwner } = await verifyAgencyOwnership(
      session.user.id,
      agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: any = { agencyId };
    if (creatorSlug) whereClause.creatorSlug = creatorSlug;

    const personalities = await prisma.creatorAiPersonality.findMany({
      where: whereClause,
      orderBy: [{ creatorSlug: "asc" }, { createdAt: "desc" }],
    });

    // Get stats for each personality
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const personalitiesWithStats = await Promise.all(
      personalities.map(async (personality) => {
        // Revenue last 30 days
        const earnings = await prisma.aiPersonalityEarning.aggregate({
          where: {
            aiPersonalityId: personality.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { grossAmount: true },
          _count: true,
        });

        // Messages last 30 days
        const messageCount = await prisma.message.count({
          where: {
            aiPersonalityId: personality.id,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        // Unique conversations
        const conversations = await prisma.message.findMany({
          where: {
            aiPersonalityId: personality.id,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { conversationId: true },
          distinct: ["conversationId"],
        });

        const conversionRate =
          conversations.length > 0
            ? (earnings._count / conversations.length) * 100
            : 0;

        return {
          ...personality,
          personality: JSON.parse(personality.personality || "{}"),
          toneKeywords: personality.toneKeywords ? JSON.parse(personality.toneKeywords) : [],
          handoffKeywords: personality.handoffKeywords ? JSON.parse(personality.handoffKeywords) : [],
          stats: {
            revenue30d: earnings._sum.grossAmount || 0,
            sales30d: earnings._count,
            messages30d: messageCount,
            conversations30d: conversations.length,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
        };
      })
    );

    return NextResponse.json({ personalities: personalitiesWithStats });
  } catch (error) {
    console.error("Error fetching AI personalities:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI personalities" },
      { status: 500 }
    );
  }
}

// POST /api/agency/ai-personas - Create a new AI personality
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agencyId,
      creatorSlug,
      name,
      personality,
      trafficShare,
      primaryTone,
      toneKeywords,
      language, // Language targeting for this persona
      aiMediaEnabled,
      aiMediaFrequency,
      aiPPVRatio,
      aiTeasingEnabled,
      // Handoff settings
      autoHandoffEnabled,
      handoffSpendThreshold,
      handoffOnHighIntent,
      handoffKeywords,
      // Give-up settings
      giveUpOnNonPaying,
      giveUpMessageThreshold,
      giveUpAction,
    } = body;

    if (!agencyId || !creatorSlug || !name) {
      return NextResponse.json(
        { error: "Agency ID, creator slug, and name are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { isOwner } = await verifyAgencyOwnership(
      session.user.id,
      agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify creator belongs to agency
    const creator = await prisma.creator.findFirst({
      where: { slug: creatorSlug, agencyId },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found in this agency" },
        { status: 404 }
      );
    }

    // Create personality
    const aiPersonality = await prisma.creatorAiPersonality.create({
      data: {
        agencyId,
        creatorSlug,
        name,
        personality: JSON.stringify(personality || {}),
        trafficShare: trafficShare ?? 100,
        primaryTone: primaryTone || null,
        toneKeywords: toneKeywords ? JSON.stringify(toneKeywords) : null,
        language: language || null, // Language targeting
        aiMediaEnabled: aiMediaEnabled ?? true,
        aiMediaFrequency: aiMediaFrequency ?? 4,
        aiPPVRatio: aiPPVRatio ?? 30,
        aiTeasingEnabled: aiTeasingEnabled ?? true,
        // Handoff settings
        autoHandoffEnabled: autoHandoffEnabled ?? true,
        handoffSpendThreshold: handoffSpendThreshold ?? 40,
        handoffOnHighIntent: handoffOnHighIntent ?? true,
        handoffKeywords: handoffKeywords ? JSON.stringify(handoffKeywords) : null,
        // Give-up settings
        giveUpOnNonPaying: giveUpOnNonPaying ?? false,
        giveUpMessageThreshold: giveUpMessageThreshold ?? 20,
        giveUpAction: giveUpAction ?? "stop",
      },
    });

    return NextResponse.json(
      {
        personality: {
          ...aiPersonality,
          personality: JSON.parse(aiPersonality.personality),
          toneKeywords: aiPersonality.toneKeywords ? JSON.parse(aiPersonality.toneKeywords) : [],
          handoffKeywords: aiPersonality.handoffKeywords ? JSON.parse(aiPersonality.handoffKeywords) : [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating AI personality:", error);
    return NextResponse.json(
      { error: "Failed to create AI personality" },
      { status: 500 }
    );
  }
}

// PATCH /api/agency/ai-personas - Update an AI personality
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
      personality,
      trafficShare,
      isActive,
      primaryTone,
      toneKeywords,
      language, // Language targeting for this persona
      aiMediaEnabled,
      aiMediaFrequency,
      aiPPVRatio,
      aiTeasingEnabled,
      // Handoff settings
      autoHandoffEnabled,
      handoffSpendThreshold,
      handoffOnHighIntent,
      handoffKeywords,
      // Give-up settings
      giveUpOnNonPaying,
      giveUpMessageThreshold,
      giveUpAction,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Personality ID is required" },
        { status: 400 }
      );
    }

    // Get personality and verify ownership
    const existingPersonality = await prisma.creatorAiPersonality.findUnique({
      where: { id },
      select: { agencyId: true, creatorSlug: true },
    });

    if (!existingPersonality) {
      return NextResponse.json(
        { error: "AI personality not found" },
        { status: 404 }
      );
    }

    // Verify agency ownership if this persona belongs to an agency
    if (existingPersonality.agencyId) {
      const { isOwner } = await verifyAgencyOwnership(
        session.user.id,
        existingPersonality.agencyId
      );

      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // For personas without agency, verify creator ownership
      const creator = await prisma.creator.findFirst({
        where: { slug: existingPersonality.creatorSlug },
        select: { userId: true },
      });
      if (creator?.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (personality !== undefined)
      updateData.personality = JSON.stringify(personality);
    if (trafficShare !== undefined) updateData.trafficShare = trafficShare;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (primaryTone !== undefined) updateData.primaryTone = primaryTone || null;
    if (toneKeywords !== undefined)
      updateData.toneKeywords = toneKeywords ? JSON.stringify(toneKeywords) : null;
    if (language !== undefined) updateData.language = language || null;
    if (aiMediaEnabled !== undefined) updateData.aiMediaEnabled = aiMediaEnabled;
    if (aiMediaFrequency !== undefined) updateData.aiMediaFrequency = aiMediaFrequency;
    if (aiPPVRatio !== undefined) updateData.aiPPVRatio = aiPPVRatio;
    if (aiTeasingEnabled !== undefined) updateData.aiTeasingEnabled = aiTeasingEnabled;
    // Handoff settings
    if (autoHandoffEnabled !== undefined) updateData.autoHandoffEnabled = autoHandoffEnabled;
    if (handoffSpendThreshold !== undefined) updateData.handoffSpendThreshold = handoffSpendThreshold;
    if (handoffOnHighIntent !== undefined) updateData.handoffOnHighIntent = handoffOnHighIntent;
    if (handoffKeywords !== undefined)
      updateData.handoffKeywords = handoffKeywords ? JSON.stringify(handoffKeywords) : null;
    // Give-up settings
    if (giveUpOnNonPaying !== undefined) updateData.giveUpOnNonPaying = giveUpOnNonPaying;
    if (giveUpMessageThreshold !== undefined) updateData.giveUpMessageThreshold = giveUpMessageThreshold;
    if (giveUpAction !== undefined) updateData.giveUpAction = giveUpAction;

    const updatedPersonality = await prisma.creatorAiPersonality.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      personality: {
        ...updatedPersonality,
        personality: JSON.parse(updatedPersonality.personality),
        toneKeywords: updatedPersonality.toneKeywords ? JSON.parse(updatedPersonality.toneKeywords) : [],
        handoffKeywords: updatedPersonality.handoffKeywords ? JSON.parse(updatedPersonality.handoffKeywords) : [],
      },
    });
  } catch (error) {
    console.error("Error updating AI personality:", error);
    return NextResponse.json(
      { error: "Failed to update AI personality" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/ai-personas - Delete an AI personality
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
        { error: "Personality ID is required" },
        { status: 400 }
      );
    }

    // Get personality and verify ownership
    const personality = await prisma.creatorAiPersonality.findUnique({
      where: { id },
      select: { agencyId: true, creatorSlug: true },
    });

    if (!personality) {
      return NextResponse.json(
        { error: "AI personality not found" },
        { status: 404 }
      );
    }

    // Verify agency ownership if this persona belongs to an agency
    if (personality.agencyId) {
      const { isOwner } = await verifyAgencyOwnership(
        session.user.id,
        personality.agencyId
      );

      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // For personas without agency, verify creator ownership
      const creator = await prisma.creator.findFirst({
        where: { slug: personality.creatorSlug },
        select: { userId: true },
      });
      if (creator?.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.creatorAiPersonality.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI personality:", error);
    return NextResponse.json(
      { error: "Failed to delete AI personality" },
      { status: 500 }
    );
  }
}
