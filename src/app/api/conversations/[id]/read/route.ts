import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerPusherEvent } from "@/lib/pusher";

// POST /api/conversations/[id]/read - Mark all messages in conversation as read
export async function POST(
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

    // Update all unread messages where user is receiver
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        senderId: { not: userId },
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
      },
    });

    // Notify via Pusher that messages were read
    if (result.count > 0) {
      // Notify the conversation channel
      await triggerPusherEvent(`conversation-${conversationId}`, "messages-read", {
        readerId: userId,
        count: result.count,
      });

      // Notify the user's channel (for other tabs/devices)
      await triggerPusherEvent(`user-${userId}`, "messages-read", {
        conversationId,
        count: result.count,
      });
    }

    return NextResponse.json({
      success: true,
      markedAsRead: result.count
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
