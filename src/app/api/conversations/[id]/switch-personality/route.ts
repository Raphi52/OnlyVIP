import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { switchPersonality } from "@/lib/ai-personality-selector";

// POST /api/conversations/[id]/switch-personality - Manually switch personality
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
    const { personalityId, toggleAutoSwitch } = await request.json();

    // Get conversation to verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        creatorSlug: true,
        aiPersonalityId: true,
        autoToneSwitch: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check user has access to this creator (agency owner, chatter, or admin)
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isAdmin) {
      // Check if user owns the agency that manages this creator
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
        // Check if user is a chatter assigned to this creator
        const chatter = await prisma.chatter.findFirst({
          where: {
            agency: { ownerId: session.user.id },
            assignedCreators: {
              some: { creatorSlug: conversation.creatorSlug },
            },
          },
        });

        if (!chatter) {
          return NextResponse.json(
            { error: "You don't have permission to manage this conversation" },
            { status: 403 }
          );
        }
      }
    }

    // Handle auto-switch toggle
    if (toggleAutoSwitch !== undefined) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { autoToneSwitch: toggleAutoSwitch },
      });

      if (!personalityId) {
        return NextResponse.json({
          success: true,
          autoToneSwitch: toggleAutoSwitch,
        });
      }
    }

    // Switch personality
    if (personalityId) {
      // Verify personality exists and belongs to the same creator
      const personality = await prisma.agencyAiPersonality.findFirst({
        where: {
          id: personalityId,
          creatorSlug: conversation.creatorSlug,
          isActive: true,
        },
      });

      if (!personality) {
        return NextResponse.json(
          { error: "Invalid or inactive personality" },
          { status: 400 }
        );
      }

      // Perform the switch
      await switchPersonality(
        conversationId,
        personalityId,
        "manual",
        { triggeredBy: session.user.id }
      );

      return NextResponse.json({
        success: true,
        newPersonalityId: personalityId,
        newPersonalityName: personality.name,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error switching personality:", error);
    return NextResponse.json(
      { error: "Failed to switch personality" },
      { status: 500 }
    );
  }
}

// GET /api/conversations/[id]/switch-personality - Get current personality and options
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

    // Get conversation with personality
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        creatorSlug: true,
        aiPersonalityId: true,
        autoToneSwitch: true,
        detectedTone: true,
        toneConfidence: true,
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

    // Get all available personalities for this creator
    const personalities = await prisma.agencyAiPersonality.findMany({
      where: {
        creatorSlug: conversation.creatorSlug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        primaryTone: true,
        trafficShare: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      currentPersonality: conversation.aiPersonality,
      autoToneSwitch: conversation.autoToneSwitch,
      detectedTone: conversation.detectedTone,
      toneConfidence: conversation.toneConfidence,
      availablePersonalities: personalities,
    });
  } catch (error) {
    console.error("Error getting personality options:", error);
    return NextResponse.json(
      { error: "Failed to get personality options" },
      { status: 500 }
    );
  }
}
