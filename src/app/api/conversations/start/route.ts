import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/conversations/start - Start or get existing conversation with a creator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { creatorSlug } = await request.json();
    console.log("[conversations/start] Received creatorSlug:", creatorSlug);

    if (!creatorSlug) {
      return NextResponse.json(
        { error: "Creator slug is required" },
        { status: 400 }
      );
    }

    // Admin can always message
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isAdmin) {
      // Check if user has VIP flag set by admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isVip: true },
      });

      // Check user's subscription allows messaging
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      });

      // VIP users (admin-granted) or subscribers can message
      const canMessage = user?.isVip ||
                         subscription?.plan?.canMessage ||
                         ["BASIC", "VIP"].includes(subscription?.plan?.accessTier || "");

      if (!canMessage) {
        return NextResponse.json(
          { error: "Subscription required for messaging" },
          { status: 403 }
        );
      }
    }

    // Find the creator and their user account
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: { user: true },
    });

    if (!creator?.userId) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    const creatorUserId = creator.userId;

    // Check if conversation already exists between user and this specific creator profile
    // We must check creatorSlug too, because one owner can have multiple creator profiles
    console.log("[conversations/start] Looking for existing conversation with creatorSlug:", creatorSlug, "creatorUserId:", creatorUserId, "userId:", userId);
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        creatorSlug,
        AND: [
          { participants: { some: { userId: creatorUserId } } },
          { participants: { some: { userId } } },
        ],
      },
    });
    console.log("[conversations/start] Existing conversation found:", existingConversation?.id || "NONE");

    if (existingConversation) {
      return NextResponse.json({
        conversationId: existingConversation.id,
        isNew: false
      });
    }

    // Create new conversation
    // If same user (admin testing), only create one participant
    const participants = userId === creatorUserId
      ? [{ userId }]
      : [{ userId: creatorUserId }, { userId }];

    const conversation = await prisma.conversation.create({
      data: {
        creatorSlug,
        participants: {
          create: participants,
        },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      isNew: true
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
