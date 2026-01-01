import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/agency-applications/[id]/conversation - Start a conversation from an accepted application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;

    // Get application
    const application = await prisma.agencyApplication.findUnique({
      where: { id: applicationId },
      include: {
        modelListing: {
          include: { creator: true },
        },
        agency: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Only accepted applications can start conversations
    if (application.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Application must be accepted first" }, { status: 400 });
    }

    // Check if conversation already exists
    if (application.conversationId) {
      return NextResponse.json({
        conversationId: application.conversationId,
        message: "Conversation already exists",
      });
    }

    // Get both user IDs
    const modelUserId = application.modelListing?.creator?.userId;
    const agencyOwnerId = application.agency?.ownerId;

    if (!modelUserId || !agencyOwnerId) {
      return NextResponse.json({ error: "Cannot determine participants" }, { status: 400 });
    }

    // Cannot start conversation with yourself
    if (modelUserId === agencyOwnerId) {
      return NextResponse.json({ error: "Cannot start conversation with yourself" }, { status: 400 });
    }

    // Verify current user is one of the participants
    if (session.user.id !== modelUserId && session.user.id !== agencyOwnerId) {
      return NextResponse.json({ error: "You are not a participant" }, { status: 403 });
    }

    // Create a conversation using the existing chat system
    // We'll use the first creator's slug for the conversation (for routing purposes)
    const creatorSlug = application.modelListing?.creator?.slug || "marketplace";

    // Check if a conversation already exists between these two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: modelUserId } } },
          { participants: { some: { userId: agencyOwnerId } } },
        ],
      },
      include: {
        participants: true,
      },
    });

    // Ensure it's exactly a 2-person conversation between these users
    if (conversation && conversation.participants.length !== 2) {
      conversation = null;
    }

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          creatorSlug,
          participants: {
            create: [
              { userId: modelUserId },
              { userId: agencyOwnerId },
            ],
          },
        },
        include: {
          participants: true,
        },
      });
    }

    // Update application with conversation ID
    await prisma.agencyApplication.update({
      where: { id: applicationId },
      data: { conversationId: conversation.id },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: "Conversation started",
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
