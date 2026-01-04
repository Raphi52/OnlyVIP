/**
 * Script Matching System
 * Finds the best script for a given conversation context
 *
 * NOTE: This feature requires additional fields in the Script model:
 * - intent, language, successScore, aiInstructions, allowAiModify,
 * - preserveCore, triggerKeywords, triggerPatterns, priority, minConfidence
 * All functions return null/empty until schema is updated.
 */

import prisma from "@/lib/prisma";
import { IntentType } from "./intent-detector";

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
  };
  confidence: number;
  intent: IntentType | null;
  strategy: "SCRIPT_ONLY" | "AI_PERSONALIZED_SCRIPT" | "AI_WITH_HINTS";
  parsedContent: string;
}

export interface ConversationMatchContext {
  message: string;
  creatorSlug: string;
  agencyId: string;
  fanName?: string;
  fanCredits?: number;
  creatorName?: string;
  language?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  ppvPrice?: number;
}

/**
 * Find the best matching script for a conversation context
 */
export async function matchScript(
  _context: ConversationMatchContext
): Promise<MatchedScript | null> {
  // TODO: Add missing fields to Script model
  return null;
}

/**
 * Get top performing scripts for an intent (for AI hints)
 */
export async function getTopScriptsForIntent(
  _agencyId: string,
  _intent: IntentType | null,
  _limit: number = 3
): Promise<string[]> {
  // TODO: Add missing fields to Script model
  return [];
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
      agencyId,
      isActive: true,
      status: "APPROVED",
      category,
      OR: creatorSlug
        ? [{ creatorSlug }, { creatorSlug: null }]
        : [{ creatorSlug: null }],
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
