import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper to verify agency ownership
async function verifyAgencyOwnership(userId: string, agencyId: string) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { ownerId: true, aiEnabled: true },
  });
  return { isOwner: agency?.ownerId === userId, aiEnabled: agency?.aiEnabled };
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

    // Verify ownership and AI enabled
    const { isOwner, aiEnabled } = await verifyAgencyOwnership(
      session.user.id,
      agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!aiEnabled) {
      return NextResponse.json(
        { error: "AI is not enabled for this agency. Contact admin." },
        { status: 403 }
      );
    }

    const whereClause: any = { agencyId };
    if (creatorSlug) whereClause.creatorSlug = creatorSlug;

    const personalities = await prisma.agencyAiPersonality.findMany({
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
      aiMediaEnabled,
      aiMediaFrequency,
      aiPPVRatio,
      aiTeasingEnabled,
    } = body;

    if (!agencyId || !creatorSlug || !name) {
      return NextResponse.json(
        { error: "Agency ID, creator slug, and name are required" },
        { status: 400 }
      );
    }

    // Verify ownership and AI enabled
    const { isOwner, aiEnabled } = await verifyAgencyOwnership(
      session.user.id,
      agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!aiEnabled) {
      return NextResponse.json(
        { error: "AI is not enabled for this agency. Contact admin." },
        { status: 403 }
      );
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
    const aiPersonality = await prisma.agencyAiPersonality.create({
      data: {
        agencyId,
        creatorSlug,
        name,
        personality: JSON.stringify(personality || {}),
        trafficShare: trafficShare ?? 100,
        primaryTone: primaryTone || null,
        aiMediaEnabled: aiMediaEnabled ?? true,
        aiMediaFrequency: aiMediaFrequency ?? 4,
        aiPPVRatio: aiPPVRatio ?? 30,
        aiTeasingEnabled: aiTeasingEnabled ?? true,
      },
    });

    return NextResponse.json(
      {
        personality: {
          ...aiPersonality,
          personality: JSON.parse(aiPersonality.personality),
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
      aiMediaEnabled,
      aiMediaFrequency,
      aiPPVRatio,
      aiTeasingEnabled,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Personality ID is required" },
        { status: 400 }
      );
    }

    // Get personality and verify agency ownership
    const existingPersonality = await prisma.agencyAiPersonality.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!existingPersonality) {
      return NextResponse.json(
        { error: "AI personality not found" },
        { status: 404 }
      );
    }

    const { isOwner, aiEnabled } = await verifyAgencyOwnership(
      session.user.id,
      existingPersonality.agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!aiEnabled) {
      return NextResponse.json(
        { error: "AI is not enabled for this agency" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (personality !== undefined)
      updateData.personality = JSON.stringify(personality);
    if (trafficShare !== undefined) updateData.trafficShare = trafficShare;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (primaryTone !== undefined) updateData.primaryTone = primaryTone || null;
    if (aiMediaEnabled !== undefined) updateData.aiMediaEnabled = aiMediaEnabled;
    if (aiMediaFrequency !== undefined) updateData.aiMediaFrequency = aiMediaFrequency;
    if (aiPPVRatio !== undefined) updateData.aiPPVRatio = aiPPVRatio;
    if (aiTeasingEnabled !== undefined) updateData.aiTeasingEnabled = aiTeasingEnabled;

    const updatedPersonality = await prisma.agencyAiPersonality.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      personality: {
        ...updatedPersonality,
        personality: JSON.parse(updatedPersonality.personality),
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

    // Get personality and verify agency ownership
    const personality = await prisma.agencyAiPersonality.findUnique({
      where: { id },
      select: { agencyId: true },
    });

    if (!personality) {
      return NextResponse.json(
        { error: "AI personality not found" },
        { status: 404 }
      );
    }

    const { isOwner } = await verifyAgencyOwnership(
      session.user.id,
      personality.agencyId
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.agencyAiPersonality.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting AI personality:", error);
    return NextResponse.json(
      { error: "Failed to delete AI personality" },
      { status: 500 }
    );
  }
}
