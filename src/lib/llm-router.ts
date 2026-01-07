/**
 * LLM Router - Dynamic model selection for AI chat
 *
 * Strategy:
 * - Venice Uncensored: Default for all conversations (uncensored, free via OpenRouter)
 * - OpenRouter models: All AI goes through OpenRouter
 */

// Types
export type LLMModel = "venice" | "fallback";

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

// Model configurations (all via OpenRouter)
const MODELS = {
  venice: {
    id: "mistralai/mistral-small-creative",
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.3,
    maxTokens: 1024,
    temperature: 0.9,
  },
  fallback: {
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    maxTokens: 1024,
    temperature: 0.9,
  },
};

/**
 * Select the best model based on context
 * Now always returns venice (all via OpenRouter)
 */
export function selectModel(context: LLMContext): LLMModel {
  // Always use Venice Uncensored via OpenRouter
  return "venice";
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
 * Generate a response using OpenRouter (Venice Uncensored)
 * Note: Keeping old function name for backward compatibility
 */
export async function generateWithClaude(
  systemPrompt: string,
  userMessage: string,
  context: LLMContext = {}
): Promise<LLMResponse> {
  // Always use OpenRouter now
  return generateWithOpenRouter(systemPrompt, userMessage);
}

/**
 * Generate a response using OpenRouter (Venice Uncensored)
 */
async function generateWithOpenRouter(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  // Use Venice Uncensored as default
  const modelConfig = MODELS.venice;

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
      model: "venice",
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      cost: calculateCost("venice", usage.prompt_tokens, usage.completion_tokens),
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
    venice: {
      name: "Venice Uncensored (OpenRouter)",
      costPer1000Messages: 0, // Free
      avgLatency: "300-600ms",
      quality: "Excellent for uncensored roleplay",
      useCase: "All conversations (uncensored)",
    },
    fallback: {
      name: "Mistral 7B (OpenRouter)",
      costPer1000Messages: (1150 / 1_000_000 * 0.25 + 80 / 1_000_000 * 0.25) * 1000, // ~$0.31
      avgLatency: "300-600ms",
      quality: "Acceptable",
      useCase: "Fallback",
    },
  };
}

// Re-export for convenience
export { MODELS };
