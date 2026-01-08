/**
 * Script Matching System
 * Finds the best script for a given conversation context
 */

import prisma from "@/lib/prisma";
import { detectIntent, IntentType, SCRIPT_INTENTS } from "./intent-detector";
import { parseScriptVariables } from "./variables";

export interface ScriptMediaItem {
  id: string;
  order: number;
  media: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    contentUrl: string;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    ppvPriceCredits: number | null;
    tagFree: boolean;
    tagPPV: boolean;
  };
}

export interface MatchedScript {
  script: {
    id: string;
    name: string;
    content: string;
    category: string;
    intent: string | null;
    conversionRate: number;
    successScore: number;
    aiInstructions: string | null;
    allowAiModify: boolean;
    preserveCore: string | null;
    language: string;
    suggestedPrice: number | null;
    nextScriptOnSuccess: string | null;
    nextScriptOnReject: string | null;
    mediaItems: ScriptMediaItem[];
  };
  confidence: number;
  intent: IntentType | null;
  strategy: "SCRIPT_ONLY" | "AI_PERSONALIZED_SCRIPT" | "AI_WITH_HINTS";
  parsedContent: string;
  matchReason: "intent" | "keyword" | "pattern" | "category";
}

export interface ConversationMatchContext {
  message: string;
  creatorSlug: string;
  agencyId: string;
  fanName?: string;
  fanCredits?: number;
  fanStage?: "new" | "engaged" | "vip" | "cooling_off";
  creatorName?: string;
  language?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  ppvPrice?: number;
}

export interface ScriptReference {
  intent: string;
  examples: Array<{
    id: string;
    name: string;
    content: string;
    technique: string;
    conversionRate: number;
    suggestedPrice: number | null;
  }>;
}

/**
 * Find the best matching script for a conversation context
 */
export async function matchScript(
  context: ConversationMatchContext
): Promise<MatchedScript | null> {
  // 1. Detect intent from message
  const detected = detectIntent(context.message);

  // 2. Build query filters
  const whereClause: Record<string, unknown> = {
    agencyId: context.agencyId,
    isActive: true,
    status: "APPROVED",
  };

  // Filter by intent if detected
  if (detected.intent) {
    const intentCategory = SCRIPT_INTENTS[detected.intent]?.category;
    // Match scripts with same intent or same category
    whereClause.OR = [
      { intent: detected.intent },
      { intent: { startsWith: intentCategory } },
    ];
  }

  // Filter by fan stage
  if (context.fanStage) {
    whereClause.AND = [
      {
        OR: [
          { fanStage: context.fanStage },
          { fanStage: "any" },
          { fanStage: null },
        ],
      },
    ];
  }

  // NOTE: Scripts are written in English only.
  // The AI will translate/adapt to the persona's language during generation.
  // No language filtering here - we match all scripts regardless of language.

  // Filter by creator (creator-specific or global)
  whereClause.OR = [
    { creatorSlug: context.creatorSlug },
    { creatorSlug: null },
  ];

  // 3. Fetch candidate scripts
  const scripts = await prisma.script.findMany({
    where: whereClause,
    orderBy: [
      { priority: "desc" },
      { conversionRate: "desc" },
      { successScore: "desc" },
    ],
    take: 20,
    select: {
      id: true,
      name: true,
      content: true,
      category: true,
      intent: true,
      conversionRate: true,
      successScore: true,
      aiInstructions: true,
      allowAiModify: true,
      preserveCore: true,
      language: true,
      suggestedPrice: true,
      nextScriptOnSuccess: true,
      nextScriptOnReject: true,
      triggerKeywords: true,
      triggerPatterns: true,
      priority: true,
      minConfidence: true,
      // Include media items attached to the script
      mediaItems: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          media: {
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              contentUrl: true,
              previewUrl: true,
              thumbnailUrl: true,
              ppvPriceCredits: true,
              tagFree: true,
              tagPPV: true,
            },
          },
        },
      },
    },
  });

  if (scripts.length === 0) {
    return null;
  }

  // 4. Score each script based on match quality
  const scoredScripts = scripts.map((script) => {
    let score = 0;
    let matchReason: "intent" | "keyword" | "pattern" | "category" = "category";

    // Base score from script priority
    score += (script.priority || 50) / 100;

    // Intent match bonus
    if (script.intent === detected.intent) {
      score += 0.4;
      matchReason = "intent";
    } else if (detected.category && script.intent?.startsWith(detected.category)) {
      score += 0.2;
      matchReason = "category";
    }

    // Keyword matching
    if (script.triggerKeywords) {
      try {
        const keywords = JSON.parse(script.triggerKeywords) as string[];
        const messageLower = context.message.toLowerCase();
        for (const keyword of keywords) {
          if (messageLower.includes(keyword.toLowerCase())) {
            score += 0.15;
            if (matchReason === "category") matchReason = "keyword";
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    // Pattern matching
    if (script.triggerPatterns) {
      try {
        const patterns = JSON.parse(script.triggerPatterns) as string[];
        for (const patternStr of patterns) {
          try {
            const regex = new RegExp(patternStr, "i");
            if (regex.test(context.message)) {
              score += 0.25;
              matchReason = "pattern";
            }
          } catch {
            // Invalid regex, skip
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    // Bonus for high-performing scripts
    score += (script.conversionRate || 0) / 200;
    score += (script.successScore || 0) / 200;

    return {
      script,
      score,
      matchReason,
    };
  });

  // 5. Sort by score and filter by minConfidence
  const sortedScripts = scoredScripts
    .filter((s) => s.score >= (s.script.minConfidence || 0.3))
    .sort((a, b) => b.score - a.score);

  if (sortedScripts.length === 0) {
    return null;
  }

  // 6. Get best match
  const best = sortedScripts[0];
  const confidence = Math.min(best.score, 1);

  // 7. Determine strategy based on script settings and confidence
  let strategy: MatchedScript["strategy"];
  if (confidence >= 0.8 && !best.script.allowAiModify) {
    strategy = "SCRIPT_ONLY";
  } else if (confidence >= 0.5 && best.script.allowAiModify) {
    strategy = "AI_PERSONALIZED_SCRIPT";
  } else {
    strategy = "AI_WITH_HINTS";
  }

  // 8. Parse variables in content
  const parsedContent = parseScriptVariables(best.script.content, {
    fanName: context.fanName || "babe",
    creatorName: context.creatorName || "me",
    ppvPrice: context.ppvPrice || best.script.suggestedPrice || 15,
  });

  return {
    script: {
      id: best.script.id,
      name: best.script.name,
      content: best.script.content,
      category: best.script.category,
      intent: best.script.intent,
      conversionRate: best.script.conversionRate,
      successScore: best.script.successScore,
      aiInstructions: best.script.aiInstructions,
      allowAiModify: best.script.allowAiModify,
      preserveCore: best.script.preserveCore,
      language: best.script.language,
      suggestedPrice: best.script.suggestedPrice,
      nextScriptOnSuccess: best.script.nextScriptOnSuccess,
      nextScriptOnReject: best.script.nextScriptOnReject,
      mediaItems: best.script.mediaItems,
    },
    confidence,
    intent: detected.intent,
    strategy,
    parsedContent,
    matchReason: best.matchReason,
  };
}

/**
 * Get top performing scripts for an intent (for AI hints)
 */
export async function getTopScriptsForIntent(
  agencyId: string,
  intent: IntentType | string | null,
  limit: number = 3
): Promise<ScriptReference | null> {
  if (!intent) return null;

  // Get category from intent if it's a known intent type
  const category = SCRIPT_INTENTS[intent as IntentType]?.category || intent;

  const scripts = await prisma.script.findMany({
    where: {
      agencyId,
      isActive: true,
      status: "APPROVED",
      OR: [
        { intent: intent },
        { intent: { startsWith: category } },
        { category: category },
      ],
    },
    orderBy: [
      { conversionRate: "desc" },
      { successScore: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      content: true,
      intent: true,
      conversionRate: true,
      suggestedPrice: true,
      aiInstructions: true,
    },
  });

  if (scripts.length === 0) {
    return null;
  }

  return {
    intent: intent,
    examples: scripts.map((s) => ({
      id: s.id,
      name: s.name,
      content: s.content,
      technique: s.aiInstructions || "Standard approach",
      conversionRate: s.conversionRate,
      suggestedPrice: s.suggestedPrice,
    })),
  };
}

/**
 * Build AI system prompt addition from script reference
 */
export function buildScriptReferencePrompt(reference: ScriptReference): string {
  if (!reference || reference.examples.length === 0) {
    return "";
  }

  let prompt = `\n\n## SCRIPT EXAMPLES FOR ${reference.intent.replace(/_/g, " ")}\n`;
  prompt += `Use these proven scripts as inspiration for your response:\n\n`;

  for (const example of reference.examples) {
    prompt += `### ${example.name} (${example.conversionRate.toFixed(1)}% conversion)\n`;
    prompt += `${example.content}\n`;
    if (example.technique !== "Standard approach") {
      prompt += `Technique: ${example.technique}\n`;
    }
    if (example.suggestedPrice) {
      prompt += `Suggested price: $${example.suggestedPrice}\n`;
    }
    prompt += "\n";
  }

  return prompt;
}

/**
 * Build AI system prompt from matched script
 * Scripts are always in English - AI must translate to target language
 * @param matched - The matched script
 * @param targetLanguage - The language to translate to (from persona)
 */
export function buildMatchedScriptPrompt(matched: MatchedScript, targetLanguage: string = "en"): string {
  let prompt = "";

  // Language instruction - scripts are in English, must translate
  const needsTranslation = targetLanguage !== "en";
  const translationNote = needsTranslation
    ? `\n⚠️ IMPORTANT: This script is in English. You MUST translate/adapt it naturally to ${getLanguageName(targetLanguage)}.\n`
    : "";

  if (matched.strategy === "SCRIPT_ONLY") {
    // Translate but keep the exact meaning
    prompt = `\n\n## REQUIRED RESPONSE\nUse this message (translate to your language if needed):\n"${matched.parsedContent}"\n`;
    prompt += translationNote;
    prompt += `Keep the EXACT meaning and structure, but express it naturally in your language.\n`;
  } else if (matched.strategy === "AI_PERSONALIZED_SCRIPT") {
    // Use the script as a base but allow personalization
    prompt = `\n\n## SCRIPT BASE\nUse this script as your starting point:\n"${matched.parsedContent}"\n`;
    prompt += translationNote;

    if (matched.script.preserveCore) {
      prompt += `IMPORTANT: You must keep this core message: "${matched.script.preserveCore}"\n`;
    }

    if (matched.script.aiInstructions) {
      prompt += `Instructions: ${matched.script.aiInstructions}\n`;
    }

    prompt += `You can adapt the tone and add personal touches, but keep the core message.\n`;
  } else {
    // AI_WITH_HINTS - just provide guidance
    prompt = `\n\n## SUGGESTED APPROACH\n`;
    prompt += `A proven script for this situation:\n"${matched.parsedContent}"\n`;
    prompt += translationNote;
    prompt += `Use this as inspiration but craft your own personalized response.\n`;

    if (matched.script.aiInstructions) {
      prompt += `Technique: ${matched.script.aiInstructions}\n`;
    }
  }

  if (matched.script.suggestedPrice) {
    prompt += `\nSuggested price for PPV: $${matched.script.suggestedPrice}\n`;
  }

  return prompt;
}

/**
 * Get human-readable language name
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    fr: "French",
    en: "English",
    es: "Spanish",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
  };
  return names[code] || code;
}

/**
 * Get scripts for a specific category (fallback)
 */
export async function getScriptsForCategory(
  agencyId: string,
  category: string,
  creatorSlug?: string,
  limit: number = 5
): Promise<
  Array<{
    id: string;
    name: string;
    content: string;
    conversionRate: number;
  }>
> {
  const scripts = await prisma.script.findMany({
    where: {
      creatorSlug,
      isActive: true,
      status: "APPROVED",
      category,
    },
    orderBy: [{ conversionRate: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      content: true,
      conversionRate: true,
    },
  });

  return scripts;
}

/**
 * Track script usage and update success metrics
 */
export async function trackScriptUsage(
  scriptId: string,
  outcome: {
    sent: boolean;
    modified: boolean;
    resultedInSale?: boolean;
    saleAmount?: number;
    fanResponded?: boolean;
    responseTime?: number;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    usageCount: { increment: 1 },
  };

  if (outcome.sent) {
    updateData.messagesSent = { increment: 1 };
  }

  if (outcome.resultedInSale) {
    updateData.salesGenerated = { increment: 1 };
    if (outcome.saleAmount) {
      updateData.revenueGenerated = { increment: outcome.saleAmount };
    }
  }

  await prisma.script.update({
    where: { id: scriptId },
    data: updateData,
  });

  // Recalculate conversion rate
  await recalculateScriptMetrics(scriptId);
}

/**
 * Recalculate script metrics
 */
async function recalculateScriptMetrics(scriptId: string): Promise<void> {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    select: {
      messagesSent: true,
      salesGenerated: true,
    },
  });

  if (!script || script.messagesSent === 0) return;

  const conversionRate = (script.salesGenerated / script.messagesSent) * 100;

  await prisma.script.update({
    where: { id: scriptId },
    data: {
      conversionRate,
    },
  });
}

/**
 * Batch update all script metrics for an agency
 */
export async function updateAllScriptMetrics(agencyId: string): Promise<void> {
  const scripts = await prisma.script.findMany({
    where: { agencyId, isActive: true },
    select: { id: true },
  });

  for (const script of scripts) {
    await recalculateScriptMetrics(script.id);
  }
}

/**
 * Get follow-up script for a flow
 */
export async function getNextScript(
  currentScriptId: string,
  outcome: "success" | "reject" | "followup"
): Promise<{
  id: string;
  name: string;
  content: string;
  suggestedPrice: number | null;
} | null> {
  const current = await prisma.script.findUnique({
    where: { id: currentScriptId },
    select: {
      nextScriptOnSuccess: true,
      nextScriptOnReject: true,
      followUpScriptId: true,
    },
  });

  if (!current) return null;

  let nextId: string | null = null;
  switch (outcome) {
    case "success":
      nextId = current.nextScriptOnSuccess;
      break;
    case "reject":
      nextId = current.nextScriptOnReject;
      break;
    case "followup":
      nextId = current.followUpScriptId;
      break;
  }

  if (!nextId) return null;

  const nextScript = await prisma.script.findUnique({
    where: { id: nextId },
    select: {
      id: true,
      name: true,
      content: true,
      suggestedPrice: true,
    },
  });

  return nextScript;
}
