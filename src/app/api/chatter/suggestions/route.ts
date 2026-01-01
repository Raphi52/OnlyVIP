import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/suggestions - Get pending AI suggestions for chatter
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    // Get chatter's assigned creators
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: {
        assignedCreators: {
          select: { creatorSlug: true },
        },
      },
    });

    if (!chatter || !chatter.isActive) {
      return NextResponse.json({ error: "Chatter not found or disabled" }, { status: 403 });
    }

    const creatorSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const conversationId = searchParams.get("conversationId");

    // Build where clause
    const whereClause: any = {
      conversation: {
        creatorSlug: { in: creatorSlugs },
      },
    };

    if (status === "pending") {
      whereClause.status = "pending";
      whereClause.expiresAt = { gt: new Date() };
    } else if (status !== "all") {
      whereClause.status = status;
    }

    if (conversationId) {
      whereClause.conversationId = conversationId;
    }

    // Get suggestions with conversation context
    const suggestions = await prisma.aiSuggestion.findMany({
      where: whereClause,
      include: {
        conversation: {
          select: {
            id: true,
            creatorSlug: true,
            detectedTone: true,
            toneConfidence: true,
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            messages: {
              take: 3,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                text: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
        personality: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Transform for frontend
    const transformedSuggestions = suggestions.map((s) => {
      const fanParticipant = s.conversation.participants.find(
        (p) => p.user.id !== s.conversation.creatorSlug
      );

      return {
        id: s.id,
        content: s.content,
        mediaDecision: s.mediaDecision,
        mediaId: s.mediaId,
        status: s.status,
        editedContent: s.editedContent,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        personality: s.personality,
        conversation: {
          id: s.conversation.id,
          creatorSlug: s.conversation.creatorSlug,
          detectedTone: s.conversation.detectedTone,
          toneConfidence: s.conversation.toneConfidence,
          fan: fanParticipant?.user || null,
          recentMessages: s.conversation.messages.reverse(),
        },
      };
    });

    // Count pending suggestions
    const pendingCount = await prisma.aiSuggestion.count({
      where: {
        status: "pending",
        expiresAt: { gt: new Date() },
        conversation: {
          creatorSlug: { in: creatorSlugs },
        },
      },
    });

    return NextResponse.json({
      suggestions: transformedSuggestions,
      pendingCount,
    });
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

// POST /api/chatter/suggestions - Send, edit, reject, or regenerate a suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { suggestionId, action, editedContent } = body;

    if (!suggestionId || !action) {
      return NextResponse.json(
        { error: "suggestionId and action are required" },
        { status: 400 }
      );
    }

    if (!["send", "edit", "reject", "regenerate"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be send, edit, reject, or regenerate" },
        { status: 400 }
      );
    }

    // Get suggestion and verify access
    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        conversation: {
          select: {
            id: true,
            creatorSlug: true,
            aiPersonalityId: true,
            participants: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify chatter has access to this creator
    const assignment = await prisma.chatterCreatorAssignment.findFirst({
      where: {
        chatterId,
        creatorSlug: suggestion.conversation.creatorSlug,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this creator" },
        { status: 403 }
      );
    }

    // Check if suggestion is still valid
    if (suggestion.status !== "pending") {
      return NextResponse.json(
        { error: `Suggestion is already ${suggestion.status}` },
        { status: 400 }
      );
    }

    if (new Date() > suggestion.expiresAt) {
      await prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Suggestion has expired" },
        { status: 400 }
      );
    }

    // Handle actions
    switch (action) {
      case "send":
      case "edit": {
        const contentToSend = action === "edit" ? editedContent : suggestion.content;

        if (action === "edit" && !editedContent) {
          return NextResponse.json(
            { error: "editedContent is required for edit action" },
            { status: 400 }
          );
        }

        // Find creator user and fan user
        const creator = await prisma.creator.findUnique({
          where: { slug: suggestion.conversation.creatorSlug },
          select: { userId: true },
        });

        if (!creator?.userId) {
          return NextResponse.json(
            { error: "Creator account not found" },
            { status: 400 }
          );
        }

        const fanUserId = suggestion.conversation.participants.find(
          (p) => p.userId !== creator.userId
        )?.userId;

        if (!fanUserId) {
          return NextResponse.json(
            { error: "Fan not found in conversation" },
            { status: 400 }
          );
        }

        // Create the message
        const message = await prisma.message.create({
          data: {
            conversationId: suggestion.conversationId,
            senderId: creator.userId,
            receiverId: fanUserId,
            text: contentToSend,
            chatterId: chatterId,
            aiPersonalityId: suggestion.personalityId,
            isAiGenerated: true,
            // Handle PPV if media decision is PPV
            isPPV: suggestion.mediaDecision === "PPV",
            ppvPrice: suggestion.mediaDecision === "PPV" ? 1000 : null, // Default price
          },
          include: {
            media: true,
          },
        });

        // If there's media to attach
        if (suggestion.mediaId && suggestion.mediaDecision !== "NONE") {
          await prisma.messageMedia.create({
            data: {
              messageId: message.id,
              mediaId: suggestion.mediaId,
              type: "PHOTO", // Default, should be determined from media
              url: "", // Will be populated from MediaContent
            },
          });
        }

        // Update suggestion status
        await prisma.aiSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: action === "edit" ? "edited" : "sent",
            editedContent: action === "edit" ? editedContent : null,
            sentById: chatterId,
            messageId: message.id,
            sentAt: new Date(),
          },
        });

        // Update chatter stats
        await prisma.chatter.update({
          where: { id: chatterId },
          data: {
            totalMessages: { increment: 1 },
            lastActiveAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          action,
          messageId: message.id,
        });
      }

      case "reject": {
        await prisma.aiSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: "rejected",
            sentById: chatterId,
          },
        });

        return NextResponse.json({
          success: true,
          action: "rejected",
        });
      }

      case "regenerate": {
        // Mark current suggestion as rejected
        await prisma.aiSuggestion.update({
          where: { id: suggestionId },
          data: { status: "rejected" },
        });

        // Queue a new AI response - find last message from fan
        const creatorForSlug = await prisma.creator.findUnique({
          where: { slug: suggestion.conversation.creatorSlug },
        });

        // Build where clause for finding last fan message
        const messageWhereClause: {
          conversationId: string;
          senderId?: { not: string };
        } = {
          conversationId: suggestion.conversationId,
        };

        if (creatorForSlug?.userId) {
          messageWhereClause.senderId = { not: creatorForSlug.userId };
        }

        const lastFanMessage = await prisma.message.findFirst({
          where: messageWhereClause,
          orderBy: { createdAt: "desc" },
        });

        if (lastFanMessage) {
          // Create a new queue entry for AI to regenerate
          await prisma.aiResponseQueue.create({
            data: {
              messageId: `regen_${suggestionId}_${Date.now()}`,
              conversationId: suggestion.conversationId,
              creatorSlug: suggestion.conversation.creatorSlug,
              scheduledAt: new Date(),
              status: "PENDING",
            },
          });
        }

        return NextResponse.json({
          success: true,
          action: "regenerate",
          message: "New suggestion will be generated shortly",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing suggestion action:", error);
    return NextResponse.json(
      { error: "Failed to process suggestion" },
      { status: 500 }
    );
  }
}
