import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";
import { parseSchedule, isWithinShift } from "@/lib/chatter-shift";

// GET /api/chatter/conversations/[id]/messages - Get messages for a conversation
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
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    // Verify chatter is assigned to this conversation's creator
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: { assignedCreators: true },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if chatter is assigned to this creator
    const isAssigned = chatter.assignedCreators.some(
      (a) => a.creatorSlug === conversation.creatorSlug
    );

    if (!isAssigned) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { slug: conversation.creatorSlug },
      select: { userId: true, displayName: true, avatar: true },
    });

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

    // Mark messages from fan as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: creator?.userId || "" },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Transform messages
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      isFromCreator: msg.senderId === creator?.userId,
      sentByChatter: msg.chatterId === chatterId,
      isPPV: msg.isPPV,
      ppvPrice: msg.ppvPrice ? Number(msg.ppvPrice) : null,
      isUnlocked: true, // Chatter sees all content
      media: msg.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        previewUrl: m.previewUrl,
      })),
      createdAt: msg.createdAt,
      chatterName: msg.chatter?.name,
    }));

    // Find the fan participant
    const fan = conversation.participants.find(
      (p) => p.userId !== creator?.userId
    );

    return NextResponse.json({
      messages: transformedMessages,
      conversation: {
        id: conversation.id,
        creatorSlug: conversation.creatorSlug,
        creatorName: creator?.displayName,
        creatorAvatar: creator?.avatar,
        creatorUserId: creator?.userId,
        fan: fan?.user
          ? {
              id: fan.user.id,
              name: fan.user.name || "Fan",
              avatar: fan.user.image,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching chatter messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/chatter/conversations/[id]/messages - Send message as creator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { id: conversationId } = await params;
    const body = await request.json();
    const { text, media, isPPV, ppvPrice } = body;

    if (!text && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "Message text or media required" },
        { status: 400 }
      );
    }

    // Verify chatter and get assignments + schedule
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: { assignedCreators: true },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    // Check if working outside shift
    const schedule = parseSchedule(chatter.schedule);
    const isOnShift = isWithinShift(schedule);
    const sentOutsideShift = schedule !== null && !isOnShift;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify assignment
    const isAssigned = chatter.assignedCreators.some(
      (a) => a.creatorSlug === conversation.creatorSlug
    );

    if (!isAssigned) {
      return NextResponse.json(
        { error: "Not assigned to this creator" },
        { status: 403 }
      );
    }

    // Get creator profile to send as creator
    const creator = await prisma.creator.findUnique({
      where: { slug: conversation.creatorSlug },
      select: { userId: true },
    });

    if (!creator?.userId) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Find receiver (the fan)
    const fanParticipant = conversation.participants.find(
      (p) => p.userId !== creator.userId
    );
    const receiverId = fanParticipant?.userId || creator.userId;

    // Create message as creator, attributed to chatter
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: creator.userId, // Send as creator
        receiverId,
        chatterId, // Attribute to chatter
        text: text || null,
        isPPV: isPPV || false,
        ppvPrice: isPPV && ppvPrice ? ppvPrice : null,
        ppvUnlockedBy: "[]",
        media:
          media && media.length > 0
            ? {
                create: media.map((m: any) => ({
                  type: m.type,
                  url: m.url,
                  previewUrl: m.previewUrl || null,
                })),
              }
            : undefined,
      },
      include: {
        media: true,
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Update chatter stats
    await prisma.chatter.update({
      where: { id: chatterId },
      data: {
        totalMessages: { increment: 1 },
        lastActiveAt: new Date(),
        // Track messages sent outside shift
        ...(sentOutsideShift && { messagesOutsideShift: { increment: 1 } }),
      },
    });

    const transformedMessage = {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isFromCreator: true,
      sentByChatter: true,
      isPPV: message.isPPV,
      ppvPrice: message.ppvPrice ? Number(message.ppvPrice) : null,
      isUnlocked: true,
      media: message.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        previewUrl: m.previewUrl,
      })),
      createdAt: message.createdAt,
    };

    // Trigger real-time notification
    await triggerNewMessage(conversationId, transformedMessage);

    return NextResponse.json(transformedMessage);
  } catch (error) {
    console.error("Error sending chatter message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
