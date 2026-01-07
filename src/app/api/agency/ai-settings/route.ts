import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptApiKey, maskApiKey } from "@/lib/encryption";
import { validateKeyFormat, type AiProvider } from "@/lib/ai-providers";

// PATCH /api/agency/ai-settings - Update AI settings for agency
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agencyId,
      aiProvider,
      aiModel,
      aiApiKey, // Plain key or null to remove
      aiUseCustomKey,
    } = body;

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Verify the user owns this agency
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { ownerId: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    if (agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "You can only update your own agency" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // AI Provider Settings
    if (aiProvider !== undefined) {
      if (!["openai", "openrouter"].includes(aiProvider)) {
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
      const provider = (aiProvider || "openrouter") as AiProvider;
      if (!validateKeyFormat(provider, aiApiKey)) {
        return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
      }
      // Encrypt and store
      updateData.aiApiKey = encryptApiKey(aiApiKey);
      updateData.aiApiKeyHash = maskApiKey(aiApiKey);
      updateData.aiUseCustomKey = true;
    }

    // Update AI settings
    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      aiProvider: updated.aiProvider,
      aiModel: updated.aiModel,
      aiApiKeyHash: updated.aiApiKeyHash,
      aiUseCustomKey: updated.aiUseCustomKey,
    });
  } catch (error) {
    console.error("Error updating agency AI settings:", error);
    return NextResponse.json({ error: "Failed to update AI settings" }, { status: 500 });
  }
}
