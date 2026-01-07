/**
 * AI Providers Registry
 *
 * Centralized configuration for all supported AI providers and models.
 */

export type AiProvider = "openai" | "openrouter";

export interface AiModel {
  id: string;
  name: string;
  tier: "free" | "fast" | "balanced" | "premium";
  default?: boolean;
  maxTokens: number;
  contextWindow: number;
}

export interface AiProviderConfig {
  name: string;
  models: AiModel[];
  keyPattern: RegExp;
  keyPlaceholder: string;
  baseUrl: string;
}

export const AI_PROVIDERS: Record<AiProvider, AiProviderConfig> = {
  openai: {
    name: "OpenAI (GPT)",
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        tier: "fast",
        default: true,
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        tier: "balanced",
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        tier: "premium",
        maxTokens: 4096,
        contextWindow: 128000,
      },
    ],
    keyPattern: /^sk-[a-zA-Z0-9_-]+$/,
    keyPlaceholder: "sk-proj-...",
    baseUrl: "https://api.openai.com/v1",
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      {
        id: "mistralai/mistral-small-creative",
        name: "Mistral Small Creative (Roleplay)",
        tier: "fast",
        default: true,
        maxTokens: 4096,
        contextWindow: 32000,
      },
      {
        id: "nousresearch/hermes-3-llama-3.1-405b:free",
        name: "Hermes 3 405B (Free)",
        tier: "free",
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        id: "neversleep/llama-3.1-lumimaid-8b",
        name: "Lumimaid 8B (Roleplay)",
        tier: "fast",
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        id: "gryphe/mythomax-l2-13b",
        name: "MythoMax 13B (Classic)",
        tier: "fast",
        maxTokens: 4096,
        contextWindow: 4096,
      },
      {
        id: "venice/uncensored:free",
        name: "Venice Uncensored (Free)",
        tier: "free",
        maxTokens: 4096,
        contextWindow: 32000,
      },
      {
        id: "meta-llama/llama-3.1-70b-instruct",
        name: "Llama 3.1 70B",
        tier: "balanced",
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        id: "openai/gpt-4o",
        name: "GPT-4o (via OpenRouter)",
        tier: "premium",
        maxTokens: 4096,
        contextWindow: 128000,
      },
    ],
    keyPattern: /^sk-or-v1-[a-zA-Z0-9]+$/,
    keyPlaceholder: "sk-or-v1-...",
    baseUrl: "https://openrouter.ai/api/v1",
  },
};

/**
 * Get provider configuration
 */
export function getProvider(provider: AiProvider): AiProviderConfig {
  return AI_PROVIDERS[provider];
}

/**
 * Get model configuration
 */
export function getModel(
  provider: AiProvider,
  modelId: string
): AiModel | undefined {
  return AI_PROVIDERS[provider].models.find((m) => m.id === modelId);
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: AiProvider): AiModel {
  const defaultModel = AI_PROVIDERS[provider].models.find((m) => m.default);
  return defaultModel || AI_PROVIDERS[provider].models[0];
}

/**
 * Validate API key format (not actual validity)
 */
export function validateKeyFormat(provider: AiProvider, key: string): boolean {
  return AI_PROVIDERS[provider].keyPattern.test(key);
}

/**
 * Get all providers as list for UI
 */
export function getProvidersList(): { id: AiProvider; name: string }[] {
  return Object.entries(AI_PROVIDERS).map(([id, config]) => ({
    id: id as AiProvider,
    name: config.name,
  }));
}

/**
 * Get models for provider as list for UI
 */
export function getModelsList(
  provider: AiProvider
): { id: string; name: string; tier: string; default?: boolean }[] {
  return AI_PROVIDERS[provider].models.map((m) => ({
    id: m.id,
    name: m.name,
    tier: m.tier,
    default: m.default,
  }));
}

/**
 * Get tier label with emoji
 */
export function getTierLabel(tier: AiModel["tier"]): string {
  switch (tier) {
    case "free":
      return "Free";
    case "fast":
      return "Fast";
    case "balanced":
      return "Balanced";
    case "premium":
      return "Premium";
  }
}

/**
 * Get tier color class for UI
 */
export function getTierColor(tier: AiModel["tier"]): string {
  switch (tier) {
    case "free":
      return "text-green-500 bg-green-500/10";
    case "fast":
      return "text-blue-500 bg-blue-500/10";
    case "balanced":
      return "text-purple-500 bg-purple-500/10";
    case "premium":
      return "text-amber-500 bg-amber-500/10";
  }
}
