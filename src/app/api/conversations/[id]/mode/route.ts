import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/conversations/[id]/mode - Change AI mode for a conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { mode, assignChatter } = body;

    // Validate mode
    if (!mode || !["auto", "assisted", "disabled"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'auto', 'assisted', or 'disabled'" },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        creatorSlug: true,
        aiMode: true,
        assignedChatterId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify user has access
    const isAdmin = (session.user as any).role === "ADMIN";
    const isChatter = (session.user as any).role === "CHATTER";
    const chatterId = (session.user as any).chatterId;

    if (!isAdmin) {
      if (isChatter) {
        // Chatter must be assigned to this creator
        const assignment = await prisma.chatterCreatorAssignment.findFirst({
          where: {
            chatterId,
            creatorSlug: conversation.creatorSlug,
          },
        });

        if (!assignment) {
          return NextResponse.json(
            { error: "You are not assigned to this creator" },
            { status: 403 }
          );
        }
      } else {
        // Regular user or agency owner - check ownership
        const creator = await prisma.creator.findUnique({
          where: { slug: conversation.creatorSlug },
          select: {
            agencyId: true,
            agency: {
              select: { ownerId: true },
            },
          },
        });

        if (!creator?.agency || creator.agency.ownerId !== session.user.id) {
          return NextResponse.json(
            { error: "You don't have permission to manage this conversation" },
            { status: 403 }
          );
        }
      }
    }

    // Build update data
    const updateData: any = { aiMode: mode };

    // If switching to disabled mode and assignChatter is true, assign current chatter
    if (mode === "disabled" && assignChatter && isChatter && chatterId) {
      updateData.assignedChatterId = chatterId;
    }

    // If switching to auto mode, optionally clear chatter assignment
    if (mode === "auto" && body.clearAssignment) {
      updateData.assignedChatterId = null;
    }

    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      select: {
        id: true,
        aiMode: true,
        assignedChatterId: true,
        assignedChatter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("Error updating conversation mode:", error);
    return NextResponse.json(
      { error: "Failed to update conversation mode" },
      { status: 500 }
    );
  }
}

// GET /api/conversations/[id]/mode - Get current AI mode
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        creatorSlug: true,
        aiMode: true,
        autoToneSwitch: true,
        detectedTone: true,
        toneConfidence: true,
        assignedChatterId: true,
        assignedChatter: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        aiPersonality: {
          select: {
            id: true,
            name: true,
            primaryTone: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get stats for this conversation
    const messageStats = await prisma.message.groupBy({
      by: ["isAiGenerated"],
      where: { conversationId },
      _count: true,
    });

    const aiMessages = messageStats.find((s) => s.isAiGenerated)?._count || 0;
    const humanMessages = messageStats.find((s) => !s.isAiGenerated)?._count || 0;

    // Get pending suggestions count
    const pendingSuggestions = await prisma.aiSuggestion.count({
      where: {
        conversationId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      mode: conversation.aiMode,
      autoToneSwitch: conversation.autoToneSwitch,
      detectedTone: conversation.detectedTone,
      toneConfidence: conversation.toneConfidence,
      assignedChatter: conversation.assignedChatter,
      currentPersonality: conversation.aiPersonality,
      stats: {
        aiMessages,
        humanMessages,
        pendingSuggestions,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation mode:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation mode" },
      { status: 500 }
    );
  }
}
