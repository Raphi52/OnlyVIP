import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/messages/recent - Get recent messages for dashboard widget
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ messages: [], unreadCount: 0 });
    }

    const userId = session.user.id;

    // Get recent messages from conversations where user is a participant
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          participants: {
            some: { userId: userId },
          },
        },
        senderId: { not: userId }, // Only messages from others
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        conversation: {
          select: {
            id: true,
            creatorSlug: true,
          },
        },
      },
    });

    // Count unread messages
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        senderId: { not: userId },
        isRead: false,
        isDeleted: false,
      },
    });

    // Format messages - use creator profile if sender is a creator
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        let senderName = msg.sender.name || "User";
        let senderAvatar = msg.sender.image;

        // Check if sender has a creator profile (for this conversation's creatorSlug)
        // If sender is the creator owner, show creator displayName instead of user name
        if (msg.conversation.creatorSlug) {
          const creatorProfile = await prisma.creator.findUnique({
            where: { slug: msg.conversation.creatorSlug },
            select: { userId: true, displayName: true, avatar: true },
          });

          // If sender is the creator owner, use creator's displayName and avatar
          if (creatorProfile && creatorProfile.userId === msg.sender.id) {
            senderName = creatorProfile.displayName || senderName;
            senderAvatar = creatorProfile.avatar || senderAvatar;
          }
        }

        return {
          id: msg.id,
          conversationId: msg.conversation.id,
          text: msg.text || "[Media]",
          createdAt: msg.createdAt.toISOString(),
          senderId: msg.sender.id,
          senderName,
          senderAvatar,
          isRead: msg.isRead,
        };
      })
    );

    return NextResponse.json({
      messages: formattedMessages,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    return NextResponse.json({ messages: [], unreadCount: 0 });
  }
}
