import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/conversations - Get conversations for assigned creators
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");
    const onlyUnread = searchParams.get("unread") === "true";

    // Get chatter to verify and get assigned creators
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: {
        assignedCreators: true,
      },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    const assignedSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);

    // If creatorSlug specified, verify it's assigned
    if (creatorSlug && !assignedSlugs.includes(creatorSlug)) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Build query
    const whereClause: any = {
      creatorSlug: creatorSlug ? creatorSlug : { in: assignedSlugs },
    };

    if (onlyUnread) {
      whereClause.messages = {
        some: {
          isRead: false,
          chatterId: null, // Not sent by this chatter
        },
      };
    }

    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            isRead: true,
            senderId: true,
            chatterId: true,
          },
        },
      },
    });

    // Get creator profiles for display
    const creatorProfiles = await prisma.creator.findMany({
      where: {
        slug: { in: assignedSlugs },
      },
      select: {
        slug: true,
        displayName: true,
        avatar: true,
        userId: true,
      },
    });

    const creatorMap = new Map(creatorProfiles.map((c) => [c.slug, c]));

    // Format response
    const formattedConversations = conversations.map((conv) => {
      const creator = creatorMap.get(conv.creatorSlug);
      // Find the fan (participant who is not the creator)
      const fanParticipant = conv.participants.find(
        (p) => p.userId !== creator?.userId
      );
      const lastMessage = conv.messages[0];

      // Count unread messages
      const unreadCount = conv.messages.filter(
        (m) => !m.isRead && m.chatterId !== chatterId
      ).length;

      return {
        id: conv.id,
        creatorSlug: conv.creatorSlug,
        creatorName: creator?.displayName || conv.creatorSlug,
        creatorAvatar: creator?.avatar,
        participant: fanParticipant?.user
          ? {
              id: fanParticipant.user.id,
              name: fanParticipant.user.name || "Fan",
              avatar: fanParticipant.user.image,
            }
          : null,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text || "[Media]",
              createdAt: lastMessage.createdAt.toISOString(),
              isRead: lastMessage.isRead,
              isFromChatter: lastMessage.chatterId === chatterId,
            }
          : null,
        unreadCount,
        updatedAt: conv.updatedAt.toISOString(),
      };
    });

    // Group by creator
    const byCreator = assignedSlugs.reduce(
      (acc, slug) => {
        const creator = creatorMap.get(slug);
        acc[slug] = {
          slug,
          name: creator?.displayName || slug,
          avatar: creator?.avatar,
          conversations: formattedConversations.filter(
            (c) => c.creatorSlug === slug
          ),
          unreadTotal: formattedConversations
            .filter((c) => c.creatorSlug === slug)
            .reduce((sum, c) => sum + c.unreadCount, 0),
        };
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      conversations: formattedConversations,
      byCreator: Object.values(byCreator),
      totalUnread: formattedConversations.reduce(
        (sum, c) => sum + c.unreadCount,
        0
      ),
    });
  } catch (error) {
    console.error("Error fetching chatter conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
