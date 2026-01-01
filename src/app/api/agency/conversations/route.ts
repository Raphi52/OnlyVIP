import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/conversations - List all conversations for agency's creators
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is agency owner
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: {
        creators: {
          select: { slug: true, displayName: true, avatar: true, userId: true },
        },
        chatters: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Not an agency owner" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creatorSlug");
    const chatterId = searchParams.get("chatterId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get creator slugs for this agency
    const creatorSlugs = agency.creators.map((c) => c.slug);

    if (creatorSlugs.length === 0) {
      return NextResponse.json({
        conversations: [],
        total: 0,
        agency: {
          id: agency.id,
          name: agency.name,
          creators: agency.creators,
          chatters: agency.chatters,
        },
      });
    }

    // Build where clause
    const whereClause: any = {
      creatorSlug: creatorSlug
        ? { equals: creatorSlug }
        : { in: creatorSlugs },
    };

    // If filtering by chatter, get conversations where that chatter has sent messages
    if (chatterId) {
      const chatterConversationIds = await prisma.message.findMany({
        where: { chatterId },
        select: { conversationId: true },
        distinct: ["conversationId"],
      });
      whereClause.id = { in: chatterConversationIds.map((c) => c.conversationId) };
    }

    // Get total count
    const total = await prisma.conversation.count({ where: whereClause });

    // Get conversations with latest message and participant info
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            chatter: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get creator info map
    const creatorMap = new Map(
      agency.creators.map((c) => [c.slug, c])
    );

    // Get message counts by chatter for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const chatterMessageCounts = await prisma.message.groupBy({
      by: ["conversationId", "chatterId"],
      where: {
        conversationId: { in: conversationIds },
        chatterId: { not: null },
      },
      _count: true,
    });

    // Build chatter message map
    const chatterMessageMap = new Map<string, Map<string, number>>();
    for (const item of chatterMessageCounts) {
      if (!item.chatterId) continue;
      if (!chatterMessageMap.has(item.conversationId)) {
        chatterMessageMap.set(item.conversationId, new Map());
      }
      chatterMessageMap.get(item.conversationId)!.set(item.chatterId, item._count);
    }

    // Transform conversations
    const transformedConversations = conversations.map((conv) => {
      const creator = creatorMap.get(conv.creatorSlug);
      const fan = conv.participants.find((p) => p.userId !== creator?.userId);
      const lastMessage = conv.messages[0];
      const chatterCounts = chatterMessageMap.get(conv.id);

      // Get chatters who participated in this conversation
      const participatingChatters: Array<{ id: string; name: string; messageCount: number }> = [];
      if (chatterCounts) {
        for (const [chatterId, count] of chatterCounts) {
          const chatter = agency.chatters.find((c) => c.id === chatterId);
          if (chatter) {
            participatingChatters.push({
              id: chatter.id,
              name: chatter.name,
              messageCount: count,
            });
          }
        }
      }

      return {
        id: conv.id,
        creatorSlug: conv.creatorSlug,
        creator: creator
          ? {
              slug: creator.slug,
              displayName: creator.displayName,
              avatar: creator.avatar,
            }
          : null,
        fan: fan?.user
          ? {
              id: fan.user.id,
              name: fan.user.name || "Fan",
              email: fan.user.email,
              avatar: fan.user.image,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              isFromCreator: lastMessage.senderId === creator?.userId,
              chatterName: lastMessage.chatter?.name,
              createdAt: lastMessage.createdAt,
            }
          : null,
        messageCount: conv._count.messages,
        participatingChatters,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      };
    });

    // Apply search filter on fan name/email if provided
    let filteredConversations = transformedConversations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = transformedConversations.filter(
        (c) =>
          c.fan?.name?.toLowerCase().includes(searchLower) ||
          c.fan?.email?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      conversations: filteredConversations,
      total,
      agency: {
        id: agency.id,
        name: agency.name,
        creators: agency.creators,
        chatters: agency.chatters,
      },
    });
  } catch (error) {
    console.error("Error fetching agency conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
