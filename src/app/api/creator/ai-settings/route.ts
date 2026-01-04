import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptApiKey, maskApiKey, hashApiKey } from "@/lib/encryption";
import { validateKeyFormat, type AiProvider } from "@/lib/ai-providers";

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
      // AI Provider Settings
      aiProvider,
      aiModel,
      aiApiKey, // Plain key or null to remove
      aiUseCustomKey,
    } = body;

    if (!creatorSlug) {
      return NextResponse.json({ error: "Creator slug required" }, { status: 400 });
    }

    // Verify the user owns this creator
    const creator = await prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: { userId: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (creator.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own creators" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Legacy AI settings
    if (aiResponseDelay !== undefined) updateData.aiResponseDelay = aiResponseDelay;
    if (aiPersonality !== undefined) updateData.aiPersonality = aiPersonality;

    // AI Media Settings
    if (aiMediaEnabled !== undefined) updateData.aiMediaEnabled = aiMediaEnabled;
    if (aiMediaFrequency !== undefined) updateData.aiMediaFrequency = aiMediaFrequency;
    if (aiPPVRatio !== undefined) updateData.aiPPVRatio = aiPPVRatio;
    if (aiTeasingEnabled !== undefined) updateData.aiTeasingEnabled = aiTeasingEnabled;

    // AI Provider Settings
    if (aiProvider !== undefined) {
      if (!["anthropic", "openai", "openrouter"].includes(aiProvider)) {
        return NextResponse.json({ error: "Invalid AI provider" }, { status: 400 });
      }
      updateData.aiProvider = aiProvider;
    }
    if (aiModel !== undefined) updateData.aiModel = aiModel;
    if (aiUseCustomKey !== undefined) updateData.aiUseCustomKey = aiUseCustomKey;

    // Handle API key
    if (aiApiKey === null) {
      // Remove custom key
      updateData.aiApiKey = null;
      updateData.aiApiKeyHash = null;
      updateData.aiUseCustomKey = false;
    } else if (aiApiKey !== undefined && aiApiKey !== "") {
      // Validate key format
      const provider = (aiProvider || "anthropic") as AiProvider;
      if (!validateKeyFormat(provider, aiApiKey)) {
        return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
      }
      // Encrypt and store
      updateData.aiApiKey = encryptApiKey(aiApiKey);
      updateData.aiApiKeyHash = maskApiKey(aiApiKey);
      updateData.aiUseCustomKey = true;
    }

    // Update AI settings
    const updated = await prisma.creator.update({
      where: { slug: creatorSlug },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      aiResponseDelay: updated.aiResponseDelay,
      aiPersonality: updated.aiPersonality,
      aiMediaEnabled: updated.aiMediaEnabled,
      aiMediaFrequency: updated.aiMediaFrequency,
      aiPPVRatio: updated.aiPPVRatio,
      aiTeasingEnabled: updated.aiTeasingEnabled,
      // Provider settings
      aiProvider: updated.aiProvider,
      aiModel: updated.aiModel,
      aiApiKeyHash: updated.aiApiKeyHash, // Masked key, not actual key
      aiUseCustomKey: updated.aiUseCustomKey,
    });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json({ error: "Failed to update AI settings" }, { status: 500 });
  }
}
