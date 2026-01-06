/**
 * Script Reference System
 *
 * Loads creator scripts as REFERENCE material for AI.
 * The AI uses these as inspiration and examples, NOT as verbatim responses.
 */

import prisma from "@/lib/prisma";
import { ScriptReference } from "./prompt-builder";

// Re-export for convenience
export type { ScriptReference };

// Intent detection patterns
const INTENT_PATTERNS: Record<string, RegExp[]> = {
  GREETING: [
    /^(salut|hey|coucou|bonjour|bonsoir|hello|hi)/i,
    /comment (vas|ca va|tu vas)/i,
    /quoi de (neuf|beau)/i,
  ],
  PPV_PITCH: [
    /(photo|video|contenu|content|exclusive)/i,
    /(montre|show|envoie|send)/i,
    /(nude|nu|nue|sexy)/i,
  ],
  OBJECTION_PRICE: [
    /(trop cher|expensive|prix|price|argent|money)/i,
    /(pas les moyens|can't afford)/i,
    /(moins cher|cheaper|discount|reduc)/i,
  ],
  OBJECTION_TIME: [
    /(pas le temps|no time|busy|occupe)/i,
    /(plus tard|later|demain|tomorrow)/i,
  ],
  OBJECTION_TRUST: [
    /(arnaque|scam|fake|faux)/i,
    /(confiance|trust|vrai|real)/i,
    /(preuve|proof)/i,
  ],
  REENGAGEMENT: [
    /(tu es la|you there|t'es ou)/i,
    /(reviens|come back)/i,
    /^(hey|coucou|salut)$/i,
  ],
  CLOSING: [
    /(ok|d'accord|oui|yes|je veux|i want)/i,
    /(j'achete|buy|prends|take)/i,
    /(combien|how much)/i,
  ],
  THANK_YOU: [
    /(merci|thanks|thank you)/i,
    /(genial|amazing|parfait|perfect)/i,
    /(j'adore|i love)/i,
  ],
};

/**
 * Detect the most likely intent from a message
 */
function detectIntent(message: string): string | null {
  const lower = message.toLowerCase().trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return intent;
      }
    }
  }

  return null;
}

/**
 * Get relevant script references for the current context
 * Returns scripts as examples/inspiration, NOT as responses to send
 */
export async function getScriptReferences(params: {
  creatorSlug: string;
  agencyId?: string | null;
  currentMessage: string;
  language?: string;
}): Promise<ScriptReference[]> {
  const { creatorSlug, currentMessage, language = "fr" } = params;

  // Detect intent from the current message
  const detectedIntent = detectIntent(currentMessage);

  // Build query
  const whereClause: any = {
    creatorSlug,
    isActive: true,
    status: "APPROVED",
  };

  // Filter by language
  whereClause.OR = [{ language }, { language: "any" }];

  // If we detected an intent, prioritize those scripts
  if (detectedIntent) {
    whereClause.intent = detectedIntent;
  }

  // Fetch relevant scripts
  const scripts = await prisma.script.findMany({
    where: whereClause,
    orderBy: [
      { conversionRate: "desc" },
      { usageCount: "desc" },
      { priority: "desc" },
    ],
    take: 10,
    select: {
      id: true,
      name: true,
      content: true,
      category: true,
      intent: true,
      conversionRate: true,
      aiInstructions: true,
      preserveCore: true,
    },
  });

  if (scripts.length === 0) {
    return [];
  }

  // Group scripts by category/intent
  const grouped = scripts.reduce((acc, script) => {
    const key = script.intent || script.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(script);
    return acc;
  }, {} as Record<string, typeof scripts>);

  // Convert to ScriptReference format
  const references: ScriptReference[] = Object.entries(grouped).map(([category, categoryScripts]) => ({
    category: category.replace(/_/g, " "),
    examples: categoryScripts.slice(0, 3).map((script) => ({
      situation: script.name,
      response: script.content,
      technique: script.aiInstructions || undefined,
      conversionRate: script.conversionRate > 0 ? script.conversionRate : undefined,
    })),
  }));

  return references;
}

/**
 * Get objection handling scripts
 */
export async function getObjectionScripts(
  creatorSlug: string,
  objectionType: string,
  language: string = "fr"
): Promise<ScriptReference[]> {
  const intentMap: Record<string, string> = {
    price: "OBJECTION_PRICE",
    time: "OBJECTION_TIME",
    trust: "OBJECTION_TRUST",
    not_interested: "OBJECTION_TRUST",
  };

  const intent = intentMap[objectionType] || "OBJECTION_PRICE";

  const scripts = await prisma.script.findMany({
    where: {
      creatorSlug,
      isActive: true,
      status: "APPROVED",
      intent,
      OR: [{ language }, { language: "any" }],
    },
    orderBy: [{ conversionRate: "desc" }, { priority: "desc" }],
    take: 5,
    select: {
      id: true,
      name: true,
      content: true,
      objectionResponse: true,
      conversionRate: true,
      aiInstructions: true,
    },
  });

  if (scripts.length === 0) {
    return [];
  }

  return [
    {
      category: `Objection: ${objectionType}`,
      examples: scripts.map((script) => ({
        situation: script.name,
        response: script.objectionResponse || script.content,
        technique: script.aiInstructions || undefined,
        conversionRate: script.conversionRate > 0 ? script.conversionRate : undefined,
      })),
    },
  ];
}

/**
 * Get greeting scripts
 */
export async function getGreetingScripts(
  creatorSlug: string,
  isReturningFan: boolean,
  language: string = "fr"
): Promise<ScriptReference[]> {
  const intent = isReturningFan ? "REENGAGEMENT" : "GREETING";

  const scripts = await prisma.script.findMany({
    where: {
      creatorSlug,
      isActive: true,
      status: "APPROVED",
      intent,
      OR: [{ language }, { language: "any" }],
    },
    orderBy: [{ conversionRate: "desc" }, { priority: "desc" }],
    take: 5,
    select: {
      id: true,
      name: true,
      content: true,
      conversionRate: true,
      aiInstructions: true,
    },
  });

  if (scripts.length === 0) {
    return [];
  }

  return [
    {
      category: isReturningFan ? "Re-engagement" : "Greeting",
      examples: scripts.map((script) => ({
        situation: script.name,
        response: script.content,
        technique: script.aiInstructions || undefined,
        conversionRate: script.conversionRate > 0 ? script.conversionRate : undefined,
      })),
    },
  ];
}

/**
 * Get PPV pitch scripts
 */
export async function getPPVScripts(
  creatorSlug: string,
  isExplicit: boolean,
  language: string = "fr"
): Promise<ScriptReference[]> {
  const scripts = await prisma.script.findMany({
    where: {
      creatorSlug,
      isActive: true,
      status: "APPROVED",
      intent: "PPV_PITCH",
      OR: [{ language }, { language: "any" }],
    },
    orderBy: [{ conversionRate: "desc" }, { revenueGenerated: "desc" }],
    take: 5,
    select: {
      id: true,
      name: true,
      content: true,
      suggestedPrice: true,
      conversionRate: true,
      aiInstructions: true,
      isFreeTease: true,
    },
  });

  if (scripts.length === 0) {
    return [];
  }

  // Filter: if explicit content requested, prefer non-free scripts
  const filtered = isExplicit
    ? scripts.filter((s) => !s.isFreeTease)
    : scripts;

  const finalScripts = filtered.length > 0 ? filtered : scripts;

  return [
    {
      category: "PPV Pitch",
      examples: finalScripts.map((script) => ({
        situation: script.name,
        response: script.content,
        technique: script.aiInstructions || undefined,
        conversionRate: script.conversionRate > 0 ? script.conversionRate : undefined,
      })),
    },
  ];
}

/**
 * Get scripts matching specific keywords in the message
 */
export async function getScriptsByKeywords(
  creatorSlug: string,
  message: string,
  language: string = "fr"
): Promise<ScriptReference[]> {
  // Get all scripts with trigger keywords
  const scripts = await prisma.script.findMany({
    where: {
      creatorSlug,
      isActive: true,
      status: "APPROVED",
      triggerKeywords: { not: null },
      OR: [{ language }, { language: "any" }],
    },
    select: {
      id: true,
      name: true,
      content: true,
      category: true,
      intent: true,
      triggerKeywords: true,
      conversionRate: true,
      aiInstructions: true,
    },
  });

  if (scripts.length === 0) {
    return [];
  }

  const messageLower = message.toLowerCase();

  // Find scripts whose keywords match the message
  const matchingScripts = scripts.filter((script) => {
    try {
      const keywords = JSON.parse(script.triggerKeywords || "[]") as string[];
      return keywords.some((keyword) =>
        messageLower.includes(keyword.toLowerCase())
      );
    } catch {
      return false;
    }
  });

  if (matchingScripts.length === 0) {
    return [];
  }

  // Group by intent/category
  const grouped = matchingScripts.reduce((acc, script) => {
    const key = script.intent || script.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(script);
    return acc;
  }, {} as Record<string, typeof matchingScripts>);

  return Object.entries(grouped).map(([category, categoryScripts]) => ({
    category: category.replace(/_/g, " "),
    examples: categoryScripts.slice(0, 2).map((script) => ({
      situation: script.name,
      response: script.content,
      technique: script.aiInstructions || undefined,
      conversionRate: script.conversionRate > 0 ? script.conversionRate : undefined,
    })),
  }));
}
