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

    // Check if user is blocked by the creator
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { creatorSlug: true },
    });

    if (conversation?.creatorSlug) {
      const memberRecord = await prisma.creatorMember.findUnique({
        where: {
          creatorSlug_userId: {
            creatorSlug: conversation.creatorSlug,
            userId: currentUserId,
          },
        },
        select: { isBlocked: true },
      });

      if (memberRecord?.isBlocked) {
        return NextResponse.json(
          { error: "You have been blocked by this creator" },
          { status: 403 }
        );
      }
    }

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

    // Security: Locked placeholder for PPV content - never expose real URLs
    const LOCKED_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23d4af37'/%3E%3Cstop offset='50%25' style='stop-color:%23b8860b'/%3E%3Cstop offset='100%25' style='stop-color:%23996515'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3C/svg%3E";

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

          if (msg.isPPV) {
            if (isUnlocked) {
              // User has unlocked - show actual content
              url = sourceMedia?.contentUrl || m.url;
              previewUrl = sourceMedia?.thumbnailUrl || m.previewUrl;
            } else {
              // SECURITY: Not unlocked - use locked placeholder
              // For photos, thumbnail = content so we MUST hide both
              // For videos, we can show video thumbnail frame
              const isPhoto = m.type === "PHOTO";
              if (isPhoto) {
                url = LOCKED_PLACEHOLDER;
                previewUrl = LOCKED_PLACEHOLDER;
              } else {
                // Videos: generated thumbnail frames are safe to show
                url = LOCKED_PLACEHOLDER;
                previewUrl = sourceMedia?.thumbnailUrl || m.previewUrl || LOCKED_PLACEHOLDER;
              }
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
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error instanceof Error ? error.message : String(error) },
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

    // Check if user is blocked by the creator (only for non-creators sending messages)
    if (conversation.creatorSlug) {
      const memberRecord = await prisma.creatorMember.findUnique({
        where: {
          creatorSlug_userId: {
            creatorSlug: conversation.creatorSlug,
            userId: actualSenderId,
          },
        },
        select: { isBlocked: true },
      });

      if (memberRecord?.isBlocked) {
        return NextResponse.json(
          { error: "You have been blocked by this creator" },
          { status: 403 }
        );
      }
    }

    // Find receiver - for self-conversations, receiver is same as sender
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== actualSenderId
    );
    const receiverId = otherParticipant?.userId || actualSenderId;

    // For PPV from library: fetch MediaContent URLs if mediaId is provided but url is missing
    let processedMedia = media;
    if (media && media.length > 0) {
      const mediaIdsToFetch = media
        .filter((m: any) => m.mediaId && !m.url)
        .map((m: any) => m.mediaId);

      if (mediaIdsToFetch.length > 0) {
        const mediaContents = await prisma.mediaContent.findMany({
          where: { id: { in: mediaIdsToFetch } },
          select: { id: true, contentUrl: true, thumbnailUrl: true, type: true },
        });

        const mediaContentMap = new Map(mediaContents.map((mc) => [mc.id, mc]));

        processedMedia = media.map((m: any) => {
          if (m.mediaId && !m.url) {
            const mc = mediaContentMap.get(m.mediaId);
            if (mc) {
              return {
                ...m,
                url: mc.contentUrl,
                previewUrl: m.previewUrl || mc.thumbnailUrl,
                type: m.type || mc.type,
              };
            }
          }
          return m;
        });
      }
    }

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
        media: processedMedia && processedMedia.length > 0
          ? {
              create: processedMedia.map((m: any) => ({
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
      // Get the creator's AI settings
      const creator = await prisma.creator.findUnique({
        where: { slug: conversation.creatorSlug },
        select: { aiResponseDelay: true },
      });

      // Schedule AI response with the creator's configured delay
      await scheduleAiResponse(
        message.id,
        conversationId,
        conversation.creatorSlug,
        creator?.aiResponseDelay || 120
      );
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
