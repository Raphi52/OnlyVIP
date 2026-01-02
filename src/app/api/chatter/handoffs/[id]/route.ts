/**
 * API: Handoff by ID
 *
 * GET /api/chatter/handoffs/[id] - Get handoff details
 * POST /api/chatter/handoffs/[id] - Accept/decline handoff
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptHandoff, declineHandoff } from "@/lib/handoff-manager";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Get handoff details
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const handoff = await prisma.conversationHandoff.findUnique({
      where: { id },
    });

    if (!handoff) {
      return NextResponse.json({ error: "Handoff not found" }, { status: 404 });
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: handoff.conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, isCreator: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            text: true,
            senderId: true,
            createdAt: true,
            isAiGenerated: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get creator from creatorSlug
    const creator = await prisma.creator.findUnique({
      where: { slug: conversation.creatorSlug },
      select: { displayName: true, slug: true, avatar: true },
    });

    // Find the fan (non-creator participant)
    const fanParticipant = conversation.participants.find(
      (p) => !p.user.isCreator
    );
    const fanUserId = fanParticipant?.user.id || "";
    const creatorSlug = conversation.creatorSlug;

    // Get fan profile
    const fanProfile = fanUserId && creatorSlug
      ? await prisma.fanProfile.findUnique({
          where: {
            fanUserId_creatorSlug: { fanUserId, creatorSlug },
          },
        })
      : null;

    // Get fan lead score
    const leadScore = fanUserId && creatorSlug
      ? await prisma.fanLeadScore.findUnique({
          where: {
            fanUserId_creatorSlug: { fanUserId, creatorSlug },
          },
        })
      : null;

    // Get fan memories
    const memories = fanUserId && creatorSlug
      ? await prisma.fanMemory.findMany({
          where: {
            fanUserId,
            creatorSlug,
            isActive: true,
          },
        })
      : [];

    return NextResponse.json({
      handoff: {
        id: handoff.id,
        triggerType: handoff.triggerType,
        triggerValue: handoff.triggerValue,
        status: handoff.status,
        createdAt: handoff.createdAt,
      },
      conversation: {
        id: conversation.id,
        creator,
        messages: conversation.messages.reverse(), // Chronological order
      },
      fan: {
        id: fanUserId,
        name: fanParticipant?.user.name || "Unknown",
        email: fanParticipant?.user.email,
        totalSpent: fanProfile?.totalSpent || 0,
        leadScore: leadScore?.score || 50,
        purchaseProbability: leadScore?.purchaseProbability,
        qualityTier: fanProfile?.qualityTier || "unknown",
      },
      memories: memories.map((m) => ({
        category: m.category,
        key: m.key,
        value: m.value,
      })),
    });
  } catch (error) {
    console.error("Get handoff error:", error);
    return NextResponse.json(
      { error: "Failed to get handoff" },
      { status: 500 }
    );
  }
}

// Accept or decline handoff
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Verify handoff exists
    const handoff = await prisma.conversationHandoff.findUnique({
      where: { id },
    });

    if (!handoff) {
      return NextResponse.json({ error: "Handoff not found" }, { status: 404 });
    }

    if (handoff.status !== "PENDING") {
      return NextResponse.json(
        { error: "Handoff already processed" },
        { status: 400 }
      );
    }

    let result;

    if (action === "accept") {
      result = await acceptHandoff(id, session.user.id);

      if (result) {
        return NextResponse.json({
          success: true,
          message: "Handoff accepted",
          conversationId: handoff.conversationId,
        });
      }
    } else {
      result = await declineHandoff(id, session.user.id);

      if (result) {
        return NextResponse.json({
          success: true,
          message: "Handoff declined",
        });
      }
    }

    return NextResponse.json(
      { error: `Failed to ${action} handoff` },
      { status: 500 }
    );
  } catch (error) {
    console.error("Process handoff error:", error);
    return NextResponse.json(
      { error: "Failed to process handoff" },
      { status: 500 }
    );
  }
}
