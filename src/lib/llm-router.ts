/**
 * LLM Router - Dynamic model selection for AI chat
 *
 * Strategy:
 * - Claude Haiku 4.5: Default for most conversations (fast, cheap, good quality)
 * - Claude Sonnet 4: For high-value fans (whales, negotiations, complex scenarios)
 * - OpenRouter Fallback: When Anthropic quotas are exceeded
 */

import Anthropic from "@anthropic-ai/sdk";

// Types
export type LLMModel = "haiku" | "sonnet" | "fallback";

export interface LLMContext {
  fanSpendingTier?: "whale" | "regular" | "free";
  leadScore?: number;
  isNegotiation?: boolean;
  isObjectionHandling?: boolean;
  conversationType?: "normal" | "ppv_pitch" | "closing" | "reactivation";
  messageCount?: number;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  inputTokens: number;
  outputTokens: number;
  cost: number; // in USD
}

// Model configurations
const MODELS = {
  haiku: {
    id: "claude-haiku-4-5-20241022",
    inputCostPer1M: 1.0,  // $1 per million tokens
    outputCostPer1M: 5.0, // $5 per million tokens
    maxTokens: 1024,
    temperature: 0.9,
  },
  sonnet: {
    id: "claude-sonnet-4-20250514",
    inputCostPer1M: 3.0,   // $3 per million tokens
    outputCostPer1M: 15.0, // $15 per million tokens
    maxTokens: 1024,
    temperature: 0.85,
  },
  fallback: {
    id: "mistralai/mistral-7b-instruct",
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.25,
    maxTokens: 512,
    temperature: 0.9,
  },
};

// Anthropic client (singleton)
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * Select the best model based on context
 */
export function selectModel(context: LLMContext): LLMModel {
  // Use Sonnet for whales (high-value fans)
  if (context.fanSpendingTier === "whale") {
    return "sonnet";
  }

  // Use Sonnet for high lead scores (likely to convert)
  if (context.leadScore && context.leadScore >= 80) {
    return "sonnet";
  }

  // Use Sonnet for negotiations and objection handling
  if (context.isNegotiation || context.isObjectionHandling) {
    return "sonnet";
  }

  // Use Sonnet for critical conversation types
  if (context.conversationType === "closing" || context.conversationType === "ppv_pitch") {
    // Only for qualified fans (not free tier)
    if (context.fanSpendingTier !== "free") {
      return "sonnet";
    }
  }

  // Default to Haiku for everything else
  return "haiku";
}

/**
 * Calculate cost for a request
 */
export function calculateCost(
  model: LLMModel,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODELS[model];
  const inputCost = (inputTokens / 1_000_000) * config.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputCostPer1M;
  return inputCost + outputCost;
}

/**
 * Generate a response using Claude (Haiku or Sonnet)
 */
export async function generateWithClaude(
  systemPrompt: string,
  userMessage: string,
  context: LLMContext = {}
): Promise<LLMResponse> {
  const client = getAnthropicClient();
  const selectedModel = selectModel(context);

  // If no Anthropic key or fallback selected, use OpenRouter
  if (!client || selectedModel === "fallback") {
    return generateWithOpenRouter(systemPrompt, userMessage);
  }

  const modelConfig = MODELS[selectedModel];

  try {
    const response = await client.messages.create({
      model: modelConfig.id,
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const content = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      content: cleanResponse(content),
      model: selectedModel,
      inputTokens,
      outputTokens,
      cost: calculateCost(selectedModel, inputTokens, outputTokens),
    };
  } catch (error: unknown) {
    console.error(`Claude ${selectedModel} error, falling back to OpenRouter:`, error);
    // Fallback to OpenRouter on any error
    return generateWithOpenRouter(systemPrompt, userMessage);
  }
}

/**
 * Generate a response using OpenRouter (fallback)
 */
async function generateWithOpenRouter(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("No LLM API key configured (ANTHROPIC_API_KEY or OPENROUTER_API_KEY)");
  }

  const modelConfig = MODELS.fallback;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://viponly.io",
        "X-Title": "VipOnly AI Chat",
      },
      body: JSON.stringify({
        model: modelConfig.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    return {
      content: cleanResponse(content),
      model: "fallback",
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      cost: calculateCost("fallback", usage.prompt_tokens, usage.completion_tokens),
    };
  } catch (error) {
    console.error("OpenRouter error:", error);
    throw error;
  }
}

/**
 * Clean AI response - remove artifacts
 */
function cleanResponse(text: string): string {
  if (!text) return "";

  return text
    // Remove common model tokens
    .replace(/<\/?s>/g, "")
    .replace(/<\/?bot>/g, "")
    .replace(/<\/?assistant>/g, "")
    .replace(/<\|endoftext\|>/g, "")
    .replace(/\[INST\][\s\S]*?\[\/INST\]/g, "")
    .replace(/<<SYS>>[\s\S]*?<<\/SYS>>/g, "")
    // Remove roleplay actions
    .replace(/\*[^*]+\*/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Estimate token count (rough approximation)
 * More accurate would be to use tiktoken, but this is fast
 */
export function estimateTokens(text: string): number {
  // Average: 1 token ≈ 4 characters for English
  // For mixed content with emojis, use 3.5
  return Math.ceil(text.length / 3.5);
}

/**
 * Build conversation context for the AI
 */
export function buildConversationContext(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxMessages: number = 20
): string {
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages
    .map((msg) => `${msg.role === "user" ? "Fan" : "Creator"}: ${msg.content}`)
    .join("\n");
}

/**
 * Get model stats for analytics
 */
export function getModelStats() {
  return {
    haiku: {
      name: "Claude Haiku 4.5",
      costPer1000Messages: (1150 / 1_000_000 * 1.0 + 80 / 1_000_000 * 5.0) * 1000, // ~$1.55
      avgLatency: "200-400ms",
      quality: "Good",
      useCase: "Default conversations",
    },
    sonnet: {
      name: "Claude Sonnet 4",
      costPer1000Messages: (1150 / 1_000_000 * 3.0 + 80 / 1_000_000 * 15.0) * 1000, // ~$4.65
      avgLatency: "500-1000ms",
      quality: "Excellent",
      useCase: "High-value fans, negotiations",
    },
    fallback: {
      name: "Mistral 7B (OpenRouter)",
      costPer1000Messages: (1150 / 1_000_000 * 0.25 + 80 / 1_000_000 * 0.25) * 1000, // ~$0.31
      avgLatency: "300-600ms",
      quality: "Acceptable",
      useCase: "Fallback when Claude unavailable",
    },
  };
}

// Re-export for convenience
export { MODELS };
