import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/conversations/[id] - Update conversation settings (pin/mute)
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
    const userId = session.user.id;
    const body = await request.json();

    // Find participant record for current user
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or you are not a participant" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: { isPinned?: boolean; isMuted?: boolean } = {};
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.isMuted !== undefined) updateData.isMuted = body.isMuted;

    // Update participant settings
    const updated = await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      isPinned: updated.isPinned,
      isMuted: updated.isMuted,
    });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation for current user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or you are not a participant" },
        { status: 404 }
      );
    }

    // Remove user from conversation (soft delete - just remove participant)
    await prisma.conversationParticipant.delete({
      where: { id: participant.id },
    });

    // Check if conversation has any participants left
    const remainingParticipants = await prisma.conversationParticipant.count({
      where: { conversationId },
    });

    // If no participants left, delete the entire conversation
    if (remainingParticipants === 0) {
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
