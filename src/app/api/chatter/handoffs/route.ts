/**
 * API: Chatter Handoffs Management
 *
 * GET /api/chatter/handoffs - List pending handoffs for chatter
 * POST /api/chatter/handoffs - Create manual handoff request
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHandoff } from "@/lib/handoff-manager";

// Get pending handoffs for current chatter
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "PENDING";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verify user is a chatter
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "CHATTER" && user.role !== "AGENCY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Not a chatter" }, { status: 403 });
    }

    // Build query based on status
    let whereClause = {};

    if (status === "PENDING") {
      whereClause = {
        status: "PENDING",
        OR: [
          { toChatterId: null },
          { toChatterId: session.user.id },
        ],
      };
    } else if (status === "ACCEPTED") {
      whereClause = {
        status: "ACCEPTED",
        toChatterId: session.user.id,
      };
    } else {
      whereClause = {
        toChatterId: session.user.id,
      };
    }

    // Get handoffs with conversation details
    const handoffs = await prisma.conversationHandoff.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, isCreator: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { text: true, createdAt: true },
            },
          },
        },
      },
    });

    // Get fan info for each handoff
    const handoffsWithFanInfo = await Promise.all(
      handoffs.map(async (h) => {
        // Find the fan (non-creator participant)
        const fanParticipant = h.conversation.participants.find(
          (p: { user: { isCreator: boolean } }) => !p.user.isCreator
        );
        const fanUserId = fanParticipant?.user.id || "";
        const creatorSlug = h.conversation.creatorSlug;

        // Get creator info
        const creator = await prisma.creator.findUnique({
          where: { slug: creatorSlug },
          select: { displayName: true, slug: true },
        });

        const fanProfile = fanUserId && creatorSlug
          ? await prisma.fanProfile.findUnique({
              where: {
                fanUserId_creatorSlug: { fanUserId, creatorSlug },
              },
            })
          : null;

        return {
          id: h.id,
          conversationId: h.conversationId,
          triggerType: h.triggerType,
          triggerValue: h.triggerValue,
          status: h.status,
          createdAt: h.createdAt,
          creator,
          fan: {
            name: fanParticipant?.user.name || "Unknown",
            totalSpent: fanProfile?.totalSpent || 0,
          },
          lastMessage: h.conversation.messages[0]?.text || "",
          lastMessageAt: h.conversation.messages[0]?.createdAt,
        };
      })
    );

    return NextResponse.json({ handoffs: handoffsWithFanInfo });
  } catch (error) {
    console.error("Get handoffs error:", error);
    return NextResponse.json(
      { error: "Failed to get handoffs" },
      { status: 500 }
    );
  }
}

// Create manual handoff request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, reason, toChatterId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create handoff
    const handoff = await createHandoff(
      conversationId,
      "manual",
      reason || "Manual request",
      {
        notes: reason,
        autoAssign: !!toChatterId,
      }
    );

    if (!handoff) {
      return NextResponse.json(
        { error: "Failed to create handoff" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, handoff });
  } catch (error) {
    console.error("Create handoff error:", error);
    return NextResponse.json(
      { error: "Failed to create handoff" },
      { status: 500 }
    );
  }
}
