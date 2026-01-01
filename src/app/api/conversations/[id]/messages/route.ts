import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";
import { scheduleAiResponse } from "@/lib/ai-girlfriend";

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        media: {
          include: {
            // Include the source MediaContent for PPV content
            media: {
              select: {
                contentUrl: true,
                thumbnailUrl: true,
                previewUrl: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        // Attribution: who sent this message on behalf of creator
        chatter: {
          select: {
            id: true,
            name: true,
          },
        },
        aiPersonality: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderId: true,
            sender: {
              select: {
                name: true,
              },
            },
            media: {
              select: {
                type: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Only mark messages as read if explicitly requested via query param
    // This prevents polling from marking messages as read
    const markAsRead = searchParams.get("markAsRead") === "true";

    if (markAsRead) {
      // Mark all unread messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: currentUserId,
          isRead: false,
        },
        data: { isRead: true },
      });

      // Also update participant's lastReadAt for consistency
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: currentUserId,
        },
        data: { lastReadAt: new Date() },
      });
    }

    // Transform messages for frontend
    const transformedMessages = messages.map((msg) => {
      // Group reactions by emoji and count
      const reactionMap = new Map<string, { count: number; users: string[] }>();
      msg.reactions.forEach((r) => {
        const existing = reactionMap.get(r.emoji) || { count: 0, users: [] };
        existing.count++;
        existing.users.push(r.userId);
        reactionMap.set(r.emoji, existing);
      });

      const reactions = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users,
      }));

      const isUnlocked = JSON.parse(msg.ppvUnlockedBy || "[]").includes(currentUserId) || msg.senderId === currentUserId;

      return {
        id: msg.id,
        text: msg.text,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        isPPV: msg.isPPV,
        ppvPrice: msg.ppvPrice ? Number(msg.ppvPrice) : null,
        isUnlocked,
        ppvUnlockedBy: JSON.parse(msg.ppvUnlockedBy || "[]"),
        totalTips: Number(msg.totalTips),
        isRead: msg.isRead,
        // Attribution fields
        isAiGenerated: msg.isAiGenerated,
        chatterId: msg.chatterId,
        chatterName: msg.chatter?.name || null,
        aiPersonalityId: msg.aiPersonalityId,
        aiPersonalityName: msg.aiPersonality?.name || null,
        media: msg.media.map((m) => {
          // For PPV content, return actual contentUrl only when unlocked
          const sourceMedia = m.media; // MediaContent if linked
          let url = m.url;
          let previewUrl = m.previewUrl;

          if (msg.isPPV && sourceMedia) {
            if (isUnlocked) {
              // User has unlocked - show actual content
              url = sourceMedia.contentUrl || m.url;
            } else {
              // Not unlocked - show preview/thumbnail
              url = sourceMedia.previewUrl || sourceMedia.thumbnailUrl || m.url;
              previewUrl = sourceMedia.thumbnailUrl || m.previewUrl;
            }
          }

          return {
            id: m.id,
            type: m.type,
            url,
            previewUrl,
          };
        }),
        reactions,
        replyTo: msg.replyTo ? {
          id: msg.replyTo.id,
          text: msg.replyTo.text,
          senderName: msg.replyTo.sender?.name || "User",
        } : undefined,
        createdAt: msg.createdAt,
      };
    });

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { text, media, isPPV, ppvPrice, senderId, replyToId } = body;

    // Use senderId from body if provided, otherwise use session user
    const actualSenderId = senderId || session.user.id;

    // Get the other participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Find receiver - for self-conversations, receiver is same as sender
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== actualSenderId
    );
    const receiverId = otherParticipant?.userId || actualSenderId;

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: actualSenderId,
        receiverId,
        text: text || null,
        replyToId: replyToId || null,
        isPPV: isPPV || false,
        ppvPrice: isPPV && ppvPrice ? ppvPrice : null,
        ppvUnlockedBy: "[]",
        media: media && media.length > 0
          ? {
              create: media.map((m: any) => ({
                type: m.type,
                url: m.url,
                previewUrl: m.previewUrl || null,
                // Link to existing MediaContent if provided (for PPV from library)
                mediaId: m.mediaId || null,
              })),
            }
          : undefined,
      },
      include: {
        media: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderId: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const transformedMessage = {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isPPV: message.isPPV,
      ppvPrice: message.ppvPrice ? Number(message.ppvPrice) : null,
      isUnlocked: true, // Sender always sees their own content
      ppvUnlockedBy: JSON.parse(message.ppvUnlockedBy || "[]"),
      totalTips: Number(message.totalTips),
      isRead: message.isRead,
      media: message.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        previewUrl: m.previewUrl,
      })),
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        text: message.replyTo.text,
        senderName: message.replyTo.sender?.name || "User",
      } : undefined,
      createdAt: message.createdAt,
    };

    // Trigger real-time notification via Pusher
    await triggerNewMessage(conversationId, transformedMessage);

    // Check if we need to schedule an AI response
    // Only trigger if sender is NOT a creator (i.e., a fan sent the message)
    const senderUser = await prisma.user.findUnique({
      where: { id: actualSenderId },
      select: { isCreator: true },
    });

    if (!senderUser?.isCreator && conversation.creatorSlug) {
      // Check if the creator has AI enabled
      const creator = await prisma.creator.findUnique({
        where: { slug: conversation.creatorSlug },
        select: { aiEnabled: true, aiResponseDelay: true },
      });

      if (creator?.aiEnabled) {
        // Schedule AI response with the creator's configured delay
        await scheduleAiResponse(
          message.id,
          conversationId,
          conversation.creatorSlug,
          creator.aiResponseDelay || 120
        );
      }
    }

    return NextResponse.json(transformedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
