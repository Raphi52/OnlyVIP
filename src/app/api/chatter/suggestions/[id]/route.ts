import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter/suggestions/[id] - Get a specific suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { id } = await params;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id },
      include: {
        conversation: {
          select: {
            id: true,
            creatorSlug: true,
            detectedTone: true,
            toneConfidence: true,
            aiMode: true,
          },
        },
        personality: {
          select: {
            id: true,
            name: true,
            primaryTone: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
        message: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify chatter has access
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

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestion" },
      { status: 500 }
    );
  }
}

// PATCH /api/chatter/suggestions/[id] - Update suggestion (edit content before sending)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { id } = await params;
    const body = await request.json();

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id },
      include: {
        conversation: {
          select: {
            creatorSlug: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify chatter has access
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

    // Only pending suggestions can be edited
    if (suggestion.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot edit suggestion with status: ${suggestion.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > suggestion.expiresAt) {
      await prisma.aiSuggestion.update({
        where: { id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Suggestion has expired" },
        { status: 400 }
      );
    }

    // Update editable fields
    const updateData: any = {};
    if (body.editedContent !== undefined) {
      updateData.editedContent = body.editedContent;
    }

    const updatedSuggestion = await prisma.aiSuggestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}

// DELETE /api/chatter/suggestions/[id] - Reject/delete a suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;
    const { id } = await params;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    const suggestion = await prisma.aiSuggestion.findUnique({
      where: { id },
      include: {
        conversation: {
          select: {
            creatorSlug: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify chatter has access
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

    // Only pending suggestions can be rejected
    if (suggestion.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot reject suggestion with status: ${suggestion.status}` },
        { status: 400 }
      );
    }

    // Mark as rejected (soft delete)
    await prisma.aiSuggestion.update({
      where: { id },
      data: {
        status: "rejected",
        sentById: chatterId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting suggestion:", error);
    return NextResponse.json(
      { error: "Failed to reject suggestion" },
      { status: 500 }
    );
  }
}
