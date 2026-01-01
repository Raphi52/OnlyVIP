import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/agency/conversations/[id] - Get conversation details and messages
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

    // Check if user is agency owner
    const agency = await prisma.agency.findFirst({
      where: { ownerId: session.user.id },
      include: {
        creators: {
          select: { slug: true, displayName: true, avatar: true, userId: true },
        },
        chatters: {
          select: { id: true, name: true },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Not an agency owner" }, { status: 403 });
    }

    // Get the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify this conversation belongs to one of the agency's creators
    const creatorSlugs = agency.creators.map((c) => c.slug);
    if (!creatorSlugs.includes(conversation.creatorSlug)) {
      return NextResponse.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const cursor = searchParams.get("cursor");

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        media: true,
        sender: {
          select: { id: true, name: true, image: true },
        },
        chatter: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Get creator info
    const creator = agency.creators.find((c) => c.slug === conversation.creatorSlug);
    const fan = conversation.participants.find((p) => p.userId !== creator?.userId);

    // Get chatter stats for this conversation
    const chatterStats = await prisma.message.groupBy({
      by: ["chatterId"],
      where: {
        conversationId,
        chatterId: { not: null },
      },
      _count: true,
    });

    const chatterStatsMap = new Map(
      chatterStats.map((s) => [s.chatterId, s._count])
    );

    const participatingChatters = agency.chatters
      .filter((c) => chatterStatsMap.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        messageCount: chatterStatsMap.get(c.id) || 0,
      }));

    // Transform messages
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      senderId: msg.senderId,
      isFromCreator: msg.senderId === creator?.userId,
      isPPV: msg.isPPV,
      ppvPrice: msg.ppvPrice ? Number(msg.ppvPrice) : null,
      isUnlocked: msg.ppvUnlockedBy ? JSON.parse(msg.ppvUnlockedBy).length > 0 : false,
      media: msg.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        previewUrl: m.previewUrl,
      })),
      sender: msg.sender,
      chatter: msg.chatter,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        creatorSlug: conversation.creatorSlug,
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
        participatingChatters,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: transformedMessages,
      hasMore: messages.length === limit,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
