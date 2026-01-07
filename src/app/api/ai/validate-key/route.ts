/**
 * API: Validate AI API Key
 *
 * POST /api/ai/validate-key - Test if an API key is valid
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateApiKey } from "@/lib/ai-client";
import { validateKeyFormat, type AiProvider } from "@/lib/ai-providers";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    // Validate required fields
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "provider and apiKey are required" },
        { status: 400 }
      );
    }

    // Validate provider
    if (!["openai", "openrouter"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be: openai or openrouter" },
        { status: 400 }
      );
    }

    // Validate key format first
    if (!validateKeyFormat(provider as AiProvider, apiKey)) {
      return NextResponse.json({
        valid: false,
        error: `Invalid key format for ${provider}`,
      });
    }

    // Validate key with provider
    const result = await validateApiKey(provider as AiProvider, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate API key error:", error);
    return NextResponse.json(
      { error: "Failed to validate API key" },
      { status: 500 }
    );
  }
}
