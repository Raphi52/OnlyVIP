import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/chatter/conversations/[id]/context
 * Get detailed fan context for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const { id: conversationId } = await params;

    // Get conversation with participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify chatter has access
    const hasAccess = await prisma.chatterCreatorAssignment.findFirst({
      where: {
        chatterId,
        creatorSlug: conversation.creatorSlug,
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Get creator to find their userId
    const creator = await prisma.creator.findUnique({
      where: { slug: conversation.creatorSlug },
      select: { userId: true },
    });

    // Find fan participant (not the creator)
    const fanParticipant = conversation.participants.find(
      (p) => p.userId !== creator?.userId
    );

    if (!fanParticipant) {
      return NextResponse.json(
        { error: "Fan not found in conversation" },
        { status: 404 }
      );
    }

    const fanUser = fanParticipant.user;

    // Get fan profile
    const fanProfile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: {
          fanUserId: fanUser.id,
          creatorSlug: conversation.creatorSlug,
        },
      },
    });

    // Get fan memories
    const fanMemories = await prisma.fanMemory.findMany({
      where: {
        fanUserId: fanUser.id,
        creatorSlug: conversation.creatorSlug,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Get recent purchases (transactions)
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId: fanUser.id,
        type: { in: ["PPV", "MEDIA_UNLOCK", "TIP", "SUBSCRIPTION"] },
        amount: { lt: 0 }, // Negative = spending
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        type: true,
        amount: true,
        createdAt: true,
        description: true,
      },
    });

    // Calculate stats
    const totalSpent = fanProfile?.totalSpent || 0;
    const purchaseCount = recentTransactions.length;
    const avgOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

    // Determine spending stage
    let stage: "new" | "engaged" | "vip" | "cooling_off" = "new";
    if (totalSpent >= 200) {
      stage = "vip";
    } else if (totalSpent >= 50) {
      stage = "engaged";
    } else if (fanProfile?.lastSeen) {
      const daysSinceInteraction =
        (Date.now() - new Date(fanProfile.lastSeen).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceInteraction > 14) {
        stage = "cooling_off";
      }
    }

    // Extract facts from memories
    const facts: string[] = [];
    const preferences: Record<string, string> = {};

    for (const memory of fanMemories) {
      if (memory.key === "job" || memory.key === "occupation") {
        facts.push(`Works in ${memory.value}`);
      } else if (memory.key === "interest") {
        facts.push(`Interested in ${memory.value}`);
      } else if (memory.key === "preference") {
        facts.push(`Prefers ${memory.value}`);
      } else if (memory.key === "content_preference") {
        preferences.contentType = memory.value;
      } else if (memory.key === "spending_style") {
        preferences.priceRange = memory.value;
      } else if (memory.key === "communication_style") {
        preferences.communicationStyle = memory.value;
      } else if (memory.value && memory.value.length < 100) {
        facts.push(memory.value);
      }
    }

    // Calculate engagement score
    const engagementScore = Math.min(100, Math.round(
      (fanProfile?.totalMessages || 0) * 2 +
      (fanProfile?.totalSpent || 0) * 0.5 +
      purchaseCount * 5
    ));

    // Calculate quality score
    const qualityScore = Math.min(100, Math.round(
      (fanProfile?.totalSpent || 0) * 0.3 +
      (fanProfile?.totalMessages || 0) * 0.5 +
      (stage === "vip" ? 30 : stage === "engaged" ? 15 : 0)
    ));

    return NextResponse.json({
      fan: {
        id: fanUser.id,
        name: fanUser.name,
        image: fanUser.image,
        email: fanUser.email,
        joinedAt: fanUser.createdAt.toISOString(),
        lastActive: fanProfile?.lastSeen?.toISOString() || null,
      },
      profile: {
        stage,
        totalSpent,
        purchaseCount,
        avgOrderValue,
        lastPurchase: recentTransactions[0]?.createdAt.toISOString() || null,
        qualityScore,
        engagementScore,
      },
      memory: {
        facts: facts.slice(0, 5),
        preferences,
      },
      recentPurchases: recentTransactions.map((t) => ({
        type: t.type,
        amount: Math.abs(t.amount) / 100, // Convert credits to dollars
        date: t.createdAt.toISOString(),
        description: t.description || undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching fan context:", error);
    return NextResponse.json(
      { error: "Failed to fetch fan context" },
      { status: 500 }
    );
  }
}
