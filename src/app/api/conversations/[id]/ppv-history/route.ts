import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/conversations/[id]/ppv-history
 * Get all PPV messages sent in this conversation with purchase status
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

    // Fetch conversation with participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true },
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

    // Determine creator and fan user IDs
    const creatorUserId = conversation.creator?.userId;
    const fanUserId = conversation.participants.find(
      (p) => p.userId !== creatorUserId
    )?.userId;

    if (!fanUserId) {
      return NextResponse.json({
        ppvMessages: [],
        stats: { totalSent: 0, totalPurchased: 0, totalRevenue: 0 },
      });
    }

    // Fetch all PPV messages sent BY the creator TO the fan
    const ppvMessages = await prisma.message.findMany({
      where: {
        conversationId,
        isPPV: true,
        senderId: creatorUserId || undefined,
      },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            previewUrl: true,
            url: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Process messages to add purchase status
    const processedMessages = ppvMessages.map((msg) => {
      const unlockedBy: string[] = JSON.parse(msg.ppvUnlockedBy || "[]");
      const isPurchased = unlockedBy.includes(fanUserId);

      return {
        id: msg.id,
        mediaType: msg.media[0]?.type || "PHOTO",
        thumbnailUrl: msg.media[0]?.previewUrl || msg.media[0]?.url || null,
        mediaCount: msg.media.length,
        price: msg.ppvPrice || 0,
        isPurchased,
        purchasedAt: isPurchased ? msg.updatedAt?.toISOString() : null,
        sentAt: msg.createdAt.toISOString(),
        text: msg.text,
      };
    });

    // Calculate stats
    const totalSent = processedMessages.length;
    const purchasedMessages = processedMessages.filter((m) => m.isPurchased);
    const totalPurchased = purchasedMessages.length;
    const totalRevenue = purchasedMessages.reduce((sum, m) => sum + m.price, 0);

    return NextResponse.json({
      ppvMessages: processedMessages,
      stats: {
        totalSent,
        totalPurchased,
        totalRevenue,
        conversionRate: totalSent > 0 ? (totalPurchased / totalSent) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching PPV history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
