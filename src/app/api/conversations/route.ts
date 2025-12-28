import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/conversations - Get conversations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";
    const isCreator = (session.user as any).isCreator;

    // Get creator filter from query params
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get("creator");

    // Build where clause - get conversations where user is a participant
    const whereClause: any = {
      participants: {
        some: { userId },
      },
    };

    if (creatorSlug) {
      whereClause.creatorSlug = creatorSlug;
    }

    // Get conversations with participants and last message
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            media: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform data for frontend
    const transformedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other user (not current user)
        // For self-conversations (admin testing), show self as other user
        const otherParticipant = conv.participants.find(
          (p) => p.userId !== userId
        ) || conv.participants[0];
        const otherUser = otherParticipant?.user;

        // Check if the other user is a creator and get their avatar
        let userImage = otherUser?.image;
        let userName = otherUser?.name || otherUser?.email?.split("@")[0] || "User";

        if (otherUser?.id) {
          const creator = await prisma.creator.findFirst({
            where: { userId: otherUser.id },
            select: { avatar: true, displayName: true },
          });
          if (creator) {
            userImage = creator.avatar || userImage;
            userName = creator.displayName || userName;
          }
        }

        // Count unread messages for current user (exclude self-messages)
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            senderId: { not: userId }, // Don't count messages from self
            isRead: false,
          },
        });

        // Get other user's subscription (for admin/creator view)
        let subscriptionName = null;
        if (isAdmin || isCreator) {
          const subscription = await prisma.subscription.findFirst({
            where: {
              userId: otherUser?.id,
              status: "ACTIVE",
            },
            include: {
              plan: true,
            },
          });
          subscriptionName = subscription?.plan?.name || "Free";
        }

        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          otherUser: {
            id: otherUser?.id || "",
            name: userName,
            email: otherUser?.email,
            image: userImage,
            isOnline: false,
          },
          // Keep 'user' for backward compatibility with admin pages
          user: {
            id: otherUser?.id || "",
            name: userName,
            email: otherUser?.email,
            image: userImage,
            isOnline: false,
          },
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                isPPV: lastMessage.isPPV,
                createdAt: lastMessage.createdAt,
                isRead: lastMessage.isRead,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
          subscription: subscriptionName,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({ conversations: transformedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation (for admin/creator)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if conversation already exists between current user and target user
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        ...existingConversation,
        conversationId: existingConversation.id,
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: currentUserId }, { userId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...conversation,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
