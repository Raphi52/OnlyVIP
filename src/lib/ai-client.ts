/**
 * Unified AI Client
 *
 * Routes AI requests to the appropriate provider (Anthropic, OpenAI, OpenRouter).
 * Supports both platform keys and custom user keys.
 */

import { AiProvider, getModel, getDefaultModel } from "./ai-providers";
import { decryptApiKey } from "./encryption";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateOptions {
  provider: AiProvider;
  model: string;
  apiKey: string | null; // null = use platform key
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  content: string;
  provider: AiProvider;
  model: string;
  tokensUsed?: number;
}

/**
 * Get platform API key for a provider
 */
function getPlatformKey(provider: AiProvider): string {
  switch (provider) {
    case "openai":
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");
      return openaiKey;
    case "openrouter":
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterKey) throw new Error("OPENROUTER_API_KEY not configured");
      return openrouterKey;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const modelConfig = getModel("openai", options.model) || getDefaultModel("openai");

  // Convert messages to OpenAI format (system is first message)
  const openaiMessages = [
    { role: "system" as const, content: options.systemPrompt },
    ...options.messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature ?? 0.9,
      messages: openaiMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "",
    provider: "openai",
    model: options.model,
    tokensUsed: data.usage?.completion_tokens,
  };
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  apiKey: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const modelConfig = getModel("openrouter", options.model) || getDefaultModel("openrouter");

  // OpenRouter uses OpenAI-compatible format
  const messages = [
    { role: "system" as const, content: options.systemPrompt },
    ...options.messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://viponly.fun",
      "X-Title": "VipOnly",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature ?? 0.9,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0]?.message?.content || "",
    provider: "openrouter",
    model: options.model,
    tokensUsed: data.usage?.completion_tokens,
  };
}

/**
 * Generate AI message using specified provider
 *
 * @param options - Generation options
 * @returns Generated content and metadata
 */
export async function generateAiMessage(
  options: GenerateOptions
): Promise<GenerateResult> {
  // Get API key: custom (decrypted) or platform
  let apiKey: string;

  if (options.apiKey) {
    // Custom key - decrypt if encrypted
    apiKey = options.apiKey.includes(":")
      ? decryptApiKey(options.apiKey)
      : options.apiKey;
  } else {
    // Platform key
    apiKey = getPlatformKey(options.provider);
  }

  // Route to correct provider
  switch (options.provider) {
    case "openai":
      return callOpenAI(apiKey, options);
    case "openrouter":
      return callOpenRouter(apiKey, options);
    default:
      throw new Error(`Unknown provider: ${options.provider}`);
  }
}

/**
 * Validate an API key by making a minimal request
 *
 * @param provider - AI provider
 * @param apiKey - Plain API key to validate
 * @returns True if key is valid
 */
export async function validateApiKey(
  provider: AiProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Make a minimal request to validate the key
    switch (provider) {
      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (response.ok) {
          return { valid: true };
        }

        if (response.status === 401) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      case "openrouter": {
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (response.ok) {
          return { valid: true };
        }

        if (response.status === 401 || response.status === 403) {
          return { valid: false, error: "Invalid API key" };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: "Unknown provider" };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Check if platform has a key configured for a provider
 */
export function hasPlatformKey(provider: AiProvider): boolean {
  switch (provider) {
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "openrouter":
      return !!process.env.OPENROUTER_API_KEY;
    default:
      return false;
  }
}
