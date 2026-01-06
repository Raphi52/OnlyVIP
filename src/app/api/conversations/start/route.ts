import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  selectPersonalityForConversation,
  switchPersonality,
} from "@/lib/ai-personality-selector";

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

    // Check if user is a creator (creators can always message)
    const isCreator = (session.user as any).isCreator === true;

    if (!isAdmin && !isCreator) {
      // Check user's subscription for THIS creator allows messaging
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          creatorSlug,
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        include: {
          plan: true,
        },
      });

      // Subscribers with message access can message
      const canMessage = subscription?.plan?.canMessage ||
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

    // Select personality for this conversation (A/B testing via trafficShare)
    let aiPersonalityId = await selectPersonalityForConversation(creatorSlug);
    console.log("[conversations/start] Selected AI personality:", aiPersonalityId || "NONE (AI disabled)");

    // Validate aiPersonalityId exists if not null
    if (aiPersonalityId) {
      const personalityExists = await prisma.creatorAiPersonality.findUnique({
        where: { id: aiPersonalityId },
        select: { id: true },
      });
      if (!personalityExists) {
        console.warn("[conversations/start] AI personality not found, setting to null:", aiPersonalityId);
        aiPersonalityId = null;
      }
    }

    console.log("[conversations/start] Creating conversation with:", {
      creatorSlug,
      aiPersonalityId,
      participants,
      creatorUserId,
      userId,
    });

    const conversation = await prisma.conversation.create({
      data: {
        creatorSlug,
        aiPersonalityId,
        participants: {
          create: participants,
        },
      },
    });

    // Log the initial personality assignment if one was selected
    if (aiPersonalityId) {
      await switchPersonality(
        conversation.id,
        aiPersonalityId,
        "initial_assignment"
      );
    }

    return NextResponse.json({
      conversationId: conversation.id,
      isNew: true,
      aiPersonalityId: aiPersonalityId || null,
    });
  } catch (error: any) {
    console.error("Error starting conversation:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error meta:", JSON.stringify(error?.meta, null, 2));
    return NextResponse.json(
      { error: "Failed to start conversation", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
