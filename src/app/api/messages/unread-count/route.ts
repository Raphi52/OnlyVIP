import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/messages/unread-count - Get total unread message count
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const userId = session.user.id;

    // Count unread messages where current user is receiver (exclude self-messages)
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        senderId: { not: userId },
        isRead: false,
        isDeleted: false,
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0 });
  }
}
