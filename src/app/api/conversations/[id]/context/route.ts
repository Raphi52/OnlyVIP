import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Determine fan status based on behavior
function determineFanStatus(
  totalSpent: number,
  daysSinceLastSeen: number,
  messagesSent: number,
  purchaseCount: number
): "active" | "dropped" | "inactive" | "new" {
  // New fan - recently joined, few messages
  if (messagesSent < 5 && purchaseCount === 0) {
    return "new";
  }

  // Dropped - lots of messages but no purchases (time waster)
  if (messagesSent > 20 && purchaseCount === 0 && totalSpent === 0) {
    return "dropped";
  }

  // Inactive - hasn't been active in a while
  if (daysSinceLastSeen > 14) {
    return "inactive";
  }

  // Active - regular engagement
  return "active";
}

// Get reason for the status
function getFanStatusReason(
  totalSpent: number,
  daysSinceLastSeen: number,
  messagesSent: number,
  purchaseCount: number
): string | undefined {
  if (messagesSent > 20 && purchaseCount === 0 && totalSpent === 0) {
    return "Too many messages without buying";
  }

  if (daysSinceLastSeen > 30) {
    return `Inactive for ${daysSinceLastSeen} days`;
  }

  if (daysSinceLastSeen > 14) {
    return `Last seen ${daysSinceLastSeen} days ago`;
  }

  return undefined;
}

/**
 * GET /api/conversations/[id]/context
 * Get fan context for a conversation (for creators and chatters)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const isCreator = (session.user as any)?.isCreator;
    const isChatter = (session.user as any)?.role === "CHATTER";
    const chatterId = (session.user as any)?.chatterId;

    // Fetch conversation with participants and creator
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
        creator: {
          select: { userId: true, slug: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify access
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId
    );

    let hasAccess = isParticipant;

    // Chatters can access if assigned to this creator
    if (isChatter && chatterId) {
      const assignment = await prisma.chatterCreatorAssignment.findFirst({
        where: {
          chatterId,
          creatorSlug: conversation.creatorSlug,
        },
      });
      hasAccess = hasAccess || !!assignment;
    }

    // Creators can access their own conversations
    if (isCreator && conversation.creator?.userId === userId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the fan (non-creator participant)
    const creatorUserId = conversation.creator?.userId;
    const fanParticipant = conversation.participants.find(
      (p) => p.userId !== creatorUserId
    );

    if (!fanParticipant?.user) {
      return NextResponse.json({ error: "Fan not found" }, { status: 404 });
    }

    const fanUser = fanParticipant.user;
    const fanUserId = fanUser.id;
    const creatorSlug = conversation.creatorSlug;

    // Fetch fan profile, memories, and transaction history in parallel
    const [fanProfile, fanMemories, transactions, ppvStats, lastSeen, fanMessageCount] =
      await Promise.all([
        // Fan profile (behavioral data)
        prisma.fanProfile.findUnique({
          where: {
            fanUserId_creatorSlug: {
              fanUserId,
              creatorSlug,
            },
          },
        }),

        // Fan memories (extracted facts)
        prisma.fanMemory.findMany({
          where: {
            fanUserId,
            creatorSlug,
            isActive: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),

        // Recent transactions (fan's credit transactions)
        prisma.creditTransaction.findMany({
          where: {
            userId: fanUserId,
            amount: { lt: 0 }, // Only spending transactions
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),

        // PPV stats
        prisma.message.aggregate({
          where: {
            conversationId,
            isPPV: true,
            ...(creatorUserId ? { senderId: creatorUserId } : {}),
          },
          _count: true,
          _sum: { ppvPrice: true },
        }),

        // Last activity
        prisma.fanPresence.findUnique({
          where: {
            fanUserId_creatorSlug: {
              fanUserId,
              creatorSlug,
            },
          },
          select: { lastSeen: true, isOnline: true },
        }),

        // Count messages sent by fan in this conversation
        prisma.message.count({
          where: {
            conversationId,
            senderId: fanUserId,
          },
        }),
      ]);

    // Calculate purchased PPV count
    const ppvMessages = await prisma.message.findMany({
      where: {
        conversationId,
        isPPV: true,
        ...(creatorUserId ? { senderId: creatorUserId } : {}),
      },
      select: { ppvUnlockedBy: true, ppvPrice: true },
    });

    const purchasedPpvCount = ppvMessages.filter((msg) => {
      const unlockedBy: string[] = JSON.parse(msg.ppvUnlockedBy || "[]");
      return unlockedBy.includes(fanUserId);
    }).length;

    const totalPpvRevenue = ppvMessages
      .filter((msg) => {
        const unlockedBy: string[] = JSON.parse(msg.ppvUnlockedBy || "[]");
        return unlockedBy.includes(fanUserId);
      })
      .reduce((sum, msg) => sum + (msg.ppvPrice || 0), 0);

    // Calculate stage
    const totalSpent = fanProfile?.totalSpent || 0;
    const daysSinceLastSeen = lastSeen?.lastSeen
      ? Math.floor(
          (Date.now() - lastSeen.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    let stage: "new" | "engaged" | "vip" | "cooling_off" = "new";
    if (totalSpent >= 200) {
      stage = "vip";
    } else if (totalSpent >= 50) {
      stage = "engaged";
    } else if (daysSinceLastSeen > 14) {
      stage = "cooling_off";
    }

    // Extract personal info from memories
    const personalInfo: {
      age: number | null;
      job: string | null;
      location: string | null;
      interests: string[];
      relationship: string | null;
      name: string | null;
    } = {
      age: null,
      job: null,
      location: null,
      interests: [],
      relationship: null,
      name: null,
    };

    for (const memory of fanMemories) {
      switch (memory.key) {
        case "age":
          personalInfo.age = parseInt(memory.value) || null;
          break;
        case "job":
        case "profession":
        case "work":
          personalInfo.job = memory.value;
          break;
        case "location":
        case "city":
        case "country":
          personalInfo.location = memory.value;
          break;
        case "interest":
        case "hobby":
          if (!personalInfo.interests.includes(memory.value)) {
            personalInfo.interests.push(memory.value);
          }
          break;
        case "relationship":
        case "status":
          personalInfo.relationship = memory.value;
          break;
        case "name":
        case "first_name":
        case "real_name":
          personalInfo.name = memory.value;
          break;
      }
    }

    // Extract facts and preferences from memories
    const facts = fanMemories
      .filter((m) => m.category === "personal" || m.category === "event")
      .map((m) => `${m.key}: ${m.value}`);

    const preferences: {
      contentType?: string;
      priceRange?: string;
      communicationStyle?: string;
    } = {};

    for (const memory of fanMemories) {
      if (memory.category === "preference") {
        if (memory.key === "content_type") preferences.contentType = memory.value;
        if (memory.key === "price_range") preferences.priceRange = memory.value;
        if (memory.key === "communication_style")
          preferences.communicationStyle = memory.value;
      }
    }

    // Build response
    return NextResponse.json({
      fan: {
        id: fanUser.id,
        name: personalInfo.name || fanUser.name,
        image: fanUser.image,
        email: fanUser.email,
        joinedAt: fanUser.createdAt.toISOString(),
        lastActive: lastSeen?.lastSeen?.toISOString() || null,
        isOnline: lastSeen?.isOnline || false,
      },
      profile: {
        stage,
        totalSpent,
        purchaseCount: transactions.length,
        avgOrderValue:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + t.amount, 0) /
              transactions.length
            : 0,
        lastPurchase: transactions[0]?.createdAt.toISOString() || null,
        messagesSent: fanMessageCount,
        fanStatus: determineFanStatus(totalSpent, daysSinceLastSeen, fanMessageCount, transactions.length),
        fanStatusReason: getFanStatusReason(totalSpent, daysSinceLastSeen, fanMessageCount, transactions.length),
      },
      personalInfo,
      memory: {
        facts: facts.slice(0, 10),
        preferences,
      },
      recentPurchases: transactions.slice(0, 5).map((t) => ({
        type: t.type,
        amount: t.amount,
        date: t.createdAt.toISOString(),
        description: t.description,
      })),
      ppvStats: {
        totalSent: ppvStats._count || 0,
        totalPurchased: purchasedPpvCount,
        totalRevenue: totalPpvRevenue,
        conversionRate:
          (ppvStats._count || 0) > 0
            ? (purchasedPpvCount / ppvStats._count) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching fan context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
