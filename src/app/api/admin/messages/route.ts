import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/messages - Get all conversations for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const creatorSlug = searchParams.get("creator") || "";
    const conversationId = searchParams.get("conversationId") || "";

    // If specific conversation requested, return full messages
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          creator: {
            select: { slug: true, displayName: true, avatar: true },
          },
          participants: {
            include: {
              user: {
                select: { id: true, name: true, image: true, email: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: {
                select: { id: true, name: true, image: true },
              },
              receiver: {
                select: { id: true, name: true, image: true },
              },
              media: true,
              payments: {
                include: {
                  user: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Calculate total spent in this conversation
      const totalSpent = conversation.messages.reduce((sum, msg) => {
        const ppvPayments = msg.payments
          .filter((p) => p.status === "COMPLETED")
          .reduce((s, p) => s + p.amount, 0);
        return sum + ppvPayments + msg.totalTips;
      }, 0);

      return NextResponse.json({
        conversation: {
          ...conversation,
          totalSpent,
        },
      });
    }

    // Build where clause for listing conversations
    const where: any = {};

    if (creatorSlug) {
      where.creatorSlug = creatorSlug;
    }

    if (search) {
      where.OR = [
        {
          creator: {
            displayName: { contains: search, mode: "insensitive" },
          },
        },
        {
          participants: {
            some: {
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          creator: {
            select: { slug: true, displayName: true, avatar: true },
          },
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
            select: {
              id: true,
              text: true,
              isPPV: true,
              ppvPrice: true,
              totalTips: true,
              isAiGenerated: true,
              createdAt: true,
              senderId: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // Get total spent per conversation
    const conversationIds = conversations.map((c) => c.id);
    const spentData = await prisma.messagePayment.groupBy({
      by: ["messageId"],
      where: {
        message: {
          conversationId: { in: conversationIds },
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    // Map message payments to conversations
    const messageToConversation = new Map<string, string>();
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        messageToConversation.set(msg.id, conv.id);
      }
    }

    // Get all messages with tips for these conversations
    const tipsData = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        totalTips: { gt: 0 },
      },
      _sum: { totalTips: true },
    });

    const tipsMap = new Map(tipsData.map((t) => [t.conversationId, t._sum.totalTips || 0]));

    // Format response
    const formattedConversations = conversations.map((conv) => {
      const fan = conv.participants.find(
        (p) => p.user.id !== conv.creator.slug
      )?.user;

      const lastMessage = conv.messages[0];
      const tips = tipsMap.get(conv.id) || 0;

      return {
        id: conv.id,
        creator: conv.creator,
        fan: fan || { id: "", name: "Unknown", image: null, email: "" },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              isPPV: lastMessage.isPPV,
              ppvPrice: lastMessage.ppvPrice,
              isAiGenerated: lastMessage.isAiGenerated,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        messageCount: conv._count.messages,
        totalTips: tips,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        aiMode: conv.aiMode,
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
