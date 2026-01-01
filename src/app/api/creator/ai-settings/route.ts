import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/creator/ai-settings - Update AI settings for creator
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      creatorSlug,
      aiResponseDelay,
      aiPersonality,
      // AI Media Settings
      aiMediaEnabled,
      aiMediaFrequency,
      aiPPVRatio,
      aiTeasingEnabled,
    } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Verify the user owns this creator
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: { userId: true, aiEnabled: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own creators" }, { status: 403 });
    }

    // Only allow updating AI settings if AI is enabled for this creator
    if (!creator.aiEnabled) {
      return NextResponse.json({ error: "AI is not enabled for this creator" }, { status: 403 });
    }

    // Update AI settings (but NOT aiEnabled - that's admin only)
    const updated = await prisma.creator.update({
      where: { slug: creatorSlug },
      data: {
        ...(aiResponseDelay !== undefined && { aiResponseDelay }),
        ...(aiPersonality !== undefined && { aiPersonality }),
        // AI Media Settings
        ...(aiMediaEnabled !== undefined && { aiMediaEnabled }),
        ...(aiMediaFrequency !== undefined && { aiMediaFrequency }),
        ...(aiPPVRatio !== undefined && { aiPPVRatio }),
        ...(aiTeasingEnabled !== undefined && { aiTeasingEnabled }),
      },
    });

    return NextResponse.json({
      success: true,
      aiResponseDelay: updated.aiResponseDelay,
      aiPersonality: updated.aiPersonality,
      aiMediaEnabled: updated.aiMediaEnabled,
      aiMediaFrequency: updated.aiMediaFrequency,
      aiPPVRatio: updated.aiPPVRatio,
      aiTeasingEnabled: updated.aiTeasingEnabled,
    });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json({ error: "Failed to update AI settings" }, { status: 500 });
  }
}
