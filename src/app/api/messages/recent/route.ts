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
            some: { id: userId },
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

    // Format messages
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversation.id,
      text: msg.text || "[Media]",
      createdAt: msg.createdAt.toISOString(),
      senderId: msg.sender.id,
      senderName: msg.sender.name || "User",
      senderAvatar: msg.sender.image,
      isRead: msg.isRead,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    return NextResponse.json({ messages: [], unreadCount: 0 });
  }
}
