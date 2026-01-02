/**
 * Objection Handler - Detect and respond to purchase objections
 *
 * Strategies:
 * 1. discount_offer - Offer a real discount with promo code
 * 2. urgency - Create time-limited offer
 * 3. value_prop - Emphasize unique value
 * 4. scarcity - Limited availability
 * 5. social_proof - Others are buying
 */

import { prisma } from "@/lib/prisma";
import { generateWithClaude, type LLMContext } from "@/lib/llm-router";
import { nanoid } from "nanoid";

// Types
export type ObjectionStrategy =
  | "discount_offer"
  | "urgency"
  | "value_prop"
  | "scarcity"
  | "social_proof";

export interface ObjectionMatch {
  patternId: string;
  patternName: string;
  strategy: ObjectionStrategy;
  confidence: number;
  matchedKeywords: string[];
}

export interface ObjectionResponse {
  text: string;
  discountCode?: string;
  discountPercent?: number;
  expiresAt?: Date;
  patternId: string;
}

// Default objection patterns (multi-language)
// Also exported for API to show suggestions
export const DEFAULT_OBJECTION_PATTERNS: {
  name: string;
  patterns: string[];
  strategy: ObjectionStrategy;
  discountPercent?: number;
  discountValidHours?: number;
}[] = [
  { name: "Too Expensive", patterns: ["expensive", "too much", "can't afford", "too costly", "pricey", "broke"], strategy: "discount_offer", discountPercent: 20, discountValidHours: 24 },
  { name: "Maybe Later", patterns: ["later", "not now", "maybe", "thinking about it", "need to think"], strategy: "urgency", discountValidHours: 2 },
  { name: "Wants Free Content", patterns: ["for free", "free", "send free", "without paying", "free preview"], strategy: "value_prop" },
  { name: "Comparison with Others", patterns: ["others", "other girls", "cheaper elsewhere", "seen for less"], strategy: "value_prop" },
  { name: "Not Interested", patterns: ["not interested", "don't want", "no thanks", "pass", "nah"], strategy: "scarcity" },
];

const DEFAULT_PATTERNS: Record<
  string,
  {
    name: string;
    keywords: Record<string, string[]>;
    strategy: ObjectionStrategy;
    responseTemplates: Record<string, string[]>;
    discountPercent?: number;
  }
> = {
  too_expensive: {
    name: "Too Expensive",
    keywords: {
      en: ["expensive", "too much", "can't afford", "too costly", "pricey", "broke", "no money"],
      fr: ["cher", "trop cher", "pas les moyens", "coûte", "pas d'argent", "fauché"],
      es: ["caro", "muy caro", "no puedo pagar", "costoso", "sin dinero"],
    },
    strategy: "discount_offer",
    responseTemplates: {
      en: [
        "I understand babe... Just for you, I'll give you {{discount}}% off if you unlock in the next hour 💋 Use code: {{code}}",
        "Aww, I get it... Tell you what, use code {{code}} for {{discount}}% off. But hurry, it expires soon 😘",
      ],
      fr: [
        "Je comprends bébé... Juste pour toi, -{{discount}}% si tu débloques dans l'heure 💋 Code: {{code}}",
        "Ohh je vois... Tiens, utilise le code {{code}} pour {{discount}}% de réduction. Mais fais vite 😘",
      ],
    },
    discountPercent: 20,
  },
  maybe_later: {
    name: "Maybe Later",
    keywords: {
      en: ["later", "not now", "maybe", "thinking about it", "need to think", "let me think"],
      fr: ["plus tard", "pas maintenant", "peut-être", "je réfléchis", "je vais voir"],
      es: ["luego", "más tarde", "ahora no", "tal vez", "lo pienso"],
    },
    strategy: "urgency",
    responseTemplates: {
      en: [
        "Okay babe... but this offer expires in 2 hours 😏 Don't miss out on something special 💕",
        "I understand... Just so you know, I might take this down soon. Don't want you to regret it 💋",
      ],
      fr: [
        "D'accord bébé... mais cette offre expire dans 2 heures 😏 Rate pas quelque chose de spécial 💕",
        "Je comprends... Mais je vais peut-être le retirer bientôt. Je veux pas que tu regrettes 💋",
      ],
    },
  },
  free_content: {
    name: "Wants Free Content",
    keywords: {
      en: ["for free", "free", "send free", "without paying", "free preview", "free sample"],
      fr: ["gratuit", "gratos", "sans payer", "gratuitement", "pour rien"],
      es: ["gratis", "sin pagar", "gratuito", "de gratis"],
    },
    strategy: "value_prop",
    responseTemplates: {
      en: [
        "Babe, what I give you is exclusive... You won't find this anywhere else 💕 Trust me, it's worth it 😏",
        "Hmm sweetie, quality costs 💋 But I promise you'll love what you see... It's just between us 🔥",
      ],
      fr: [
        "Bébé, ce que je te donne est exclusif... Tu trouveras ça nulle part ailleurs 💕 Crois-moi, ça vaut le coup 😏",
        "Hmm mon cœur, la qualité a un prix 💋 Mais je te promets que tu vas adorer... C'est juste entre nous 🔥",
      ],
    },
  },
  comparison: {
    name: "Comparison with Others",
    keywords: {
      en: ["others", "other girls", "cheaper elsewhere", "seen for less", "found for free"],
      fr: ["autres", "autres filles", "moins cher ailleurs", "vu pour moins", "trouvé gratuit"],
      es: ["otras", "otras chicas", "más barato", "vi por menos"],
    },
    strategy: "value_prop",
    responseTemplates: {
      en: [
        "Maybe... but you won't get ME anywhere else 😏 What we have is special, don't you think? 💕",
        "Babe, I'm not like the others... What I share with you is personal and exclusive 💋",
      ],
      fr: [
        "Peut-être... mais tu ne m'auras pas ailleurs 😏 Ce qu'on a est spécial, non? 💕",
        "Bébé, je suis pas comme les autres... Ce que je partage avec toi c'est personnel et exclusif 💋",
      ],
    },
  },
  not_interested: {
    name: "Not Interested",
    keywords: {
      en: ["not interested", "don't want", "no thanks", "pass", "nah", "not for me"],
      fr: ["pas intéressé", "non merci", "je veux pas", "pas pour moi", "sans façon"],
      es: ["no interesado", "no quiero", "no gracias", "paso", "no es para mí"],
    },
    strategy: "scarcity",
    responseTemplates: {
      en: [
        "That's okay babe 💕 But just so you know, I'm only sharing this with a few special people... 😘",
        "No pressure love 💋 I just thought you'd appreciate something most don't get to see 😏",
      ],
      fr: [
        "C'est ok bébé 💕 Mais sache que je partage ça qu'avec quelques personnes spéciales... 😘",
        "Pas de pression 💋 Je pensais juste que t'apprécierais quelque chose que peu de gens voient 😏",
      ],
    },
  },
};

/**
 * Detect objections in a message
 */
export function detectObjection(
  message: string,
  language: string = "en",
  patterns?: typeof DEFAULT_PATTERNS
): ObjectionMatch | null {
  const patternsToCheck = patterns || DEFAULT_PATTERNS;
  const lowerMessage = message.toLowerCase();

  let bestMatch: ObjectionMatch | null = null;
  let highestConfidence = 0;

  for (const [patternId, pattern] of Object.entries(patternsToCheck)) {
    const keywords = pattern.keywords[language] || pattern.keywords["en"] || [];
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // Calculate confidence based on number of matches and message length
      const confidence = Math.min(
        1,
        (matchedKeywords.length * 0.3) + (matchedKeywords.join("").length / lowerMessage.length)
      );

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          patternId,
          patternName: pattern.name,
          strategy: pattern.strategy,
          confidence,
          matchedKeywords,
        };
      }
    }
  }

  // Only return if confidence is above threshold
  return highestConfidence >= 0.3 ? bestMatch : null;
}

/**
 * Generate a discount code
 */
export async function generateDiscountCode(
  creatorSlug: string,
  discountPercent: number,
  validHours: number = 2,
  options: {
    fanUserId?: string;
    conversationId?: string;
    sourceType?: string;
    sourceId?: string;
    maxUses?: number;
  } = {}
): Promise<{ code: string; expiresAt: Date }> {
  const code = `VIP${nanoid(8).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + validHours);

  await prisma.discountCode.create({
    data: {
      code,
      creatorSlug,
      discountType: "percent",
      discountValue: discountPercent,
      expiresAt,
      fanUserId: options.fanUserId,
      conversationId: options.conversationId,
      sourceType: options.sourceType || "objection",
      sourceId: options.sourceId,
      maxUses: options.maxUses || 1,
      isActive: true,
    },
  });

  return { code, expiresAt };
}

/**
 * Get response template for an objection
 */
function getResponseTemplate(
  patternId: string,
  language: string = "en"
): string {
  const pattern = DEFAULT_PATTERNS[patternId];
  if (!pattern) return "";

  const templates = pattern.responseTemplates[language] || pattern.responseTemplates["en"] || [];
  return templates[Math.floor(Math.random() * templates.length)] || "";
}

/**
 * Handle an objection and generate a response
 */
export async function handleObjection(
  conversationId: string,
  fanMessageId: string,
  fanMessage: string,
  options: {
    creatorSlug: string;
    fanUserId: string;
    language?: string;
    personalityName?: string;
    agencyId?: string;
  }
): Promise<ObjectionResponse | null> {
  const { creatorSlug, fanUserId, language = "en", personalityName, agencyId } = options;

  // First check agency-specific patterns if agencyId provided
  let customPatterns: typeof DEFAULT_PATTERNS | undefined;

  if (agencyId) {
    const agencyPatterns = await prisma.objectionPattern.findMany({
      where: {
        agencyId,
        isActive: true,
        OR: [{ language: "all" }, { language }],
      },
      orderBy: { priority: "desc" },
    });

    if (agencyPatterns.length > 0) {
      // Convert agency patterns to the expected format
      customPatterns = {};
      for (const ap of agencyPatterns) {
        customPatterns[ap.id] = {
          name: ap.name,
          keywords: JSON.parse(ap.patterns),
          strategy: ap.strategy as ObjectionStrategy,
          responseTemplates: { [language]: [ap.responseTemplate] },
          discountPercent: ap.discountEnabled ? (ap.discountPercent || undefined) : undefined,
        };
      }
    }
  }

  // Detect objection
  const match = detectObjection(fanMessage, language, customPatterns);

  if (!match) {
    return null;
  }

  // Log the objection detection
  const pattern = customPatterns?.[match.patternId] || DEFAULT_PATTERNS[match.patternId];

  let responseText: string;
  let discountCode: string | undefined;
  let discountPercent: number | undefined;
  let expiresAt: Date | undefined;

  // Handle based on strategy
  if (match.strategy === "discount_offer" && pattern.discountPercent) {
    // Generate real discount code
    discountPercent = pattern.discountPercent;
    const discount = await generateDiscountCode(creatorSlug, discountPercent, 2, {
      fanUserId,
      conversationId,
      sourceType: "objection",
      sourceId: match.patternId,
    });

    discountCode = discount.code;
    expiresAt = discount.expiresAt;

    // Get template and replace variables
    responseText = getResponseTemplate(match.patternId, language)
      .replace(/\{\{discount\}\}/g, discountPercent.toString())
      .replace(/\{\{code\}\}/g, discountCode);
  } else {
    // Use template without discount
    responseText = getResponseTemplate(match.patternId, language);
  }

  // If no template found, generate with AI
  if (!responseText) {
    const llmContext: LLMContext = {
      isObjectionHandling: true,
      isNegotiation: true,
    };

    const systemPrompt = `You are ${personalityName || "a flirty content creator"}. A fan just raised an objection about buying content. Strategy: ${match.strategy}. Language: ${language}. Generate a short, persuasive response (1-2 sentences) that addresses their concern. Be flirty and confident. Use 1-2 emojis.`;

    const userPrompt = `Fan said: "${fanMessage}". Objection type: ${match.patternName}. ${
      discountCode ? `Offer them code ${discountCode} for ${discountPercent}% off.` : ""
    }`;

    try {
      const response = await generateWithClaude(systemPrompt, userPrompt, llmContext);
      responseText = response.content;
    } catch {
      // Fallback
      responseText = language === "fr"
        ? "Je comprends bébé... Mais crois-moi, ça vaut vraiment le coup 💕"
        : "I understand babe... But trust me, it's really worth it 💕";
    }
  }

  // Record the objection handling
  await prisma.objectionHandling.create({
    data: {
      conversationId,
      messageId: fanMessageId,
      patternId: match.patternId,
      strategy: match.strategy,
      discountCodeId: discountCode,
    },
  });

  // Update pattern stats
  if (customPatterns?.[match.patternId]) {
    await prisma.objectionPattern.update({
      where: { id: match.patternId },
      data: {
        timesTriggered: { increment: 1 },
      },
    });
  }

  return {
    text: responseText,
    discountCode,
    discountPercent,
    expiresAt,
    patternId: match.patternId,
  };
}

/**
 * Record objection conversion (when fan purchases after objection handling)
 */
export async function recordObjectionConversion(
  objectionHandlingId: string,
  purchaseMessageId: string,
  revenue: number
): Promise<void> {
  const handling = await prisma.objectionHandling.findUnique({
    where: { id: objectionHandlingId },
  });

  if (!handling) return;

  await prisma.objectionHandling.update({
    where: { id: objectionHandlingId },
    data: {
      outcome: "converted",
      outcomeMessageId: purchaseMessageId,
      revenueGenerated: revenue,
      resolvedAt: new Date(),
    },
  });

  // Update pattern conversion stats
  await prisma.objectionPattern.updateMany({
    where: { id: handling.patternId },
    data: {
      timesConverted: { increment: 1 },
      totalRevenue: { increment: revenue },
    },
  });

  // Recalculate conversion rate
  const pattern = await prisma.objectionPattern.findUnique({
    where: { id: handling.patternId },
  });

  if (pattern && pattern.timesTriggered > 0) {
    await prisma.objectionPattern.update({
      where: { id: pattern.id },
      data: {
        conversionRate: pattern.timesConverted / pattern.timesTriggered,
      },
    });
  }
}

/**
 * Check for unconverted objections that might need follow-up
 */
export async function getUnresolvedObjections(
  conversationId: string,
  withinHours: number = 24
): Promise<Array<{ id: string; strategy: string; discountCode?: string }>> {
  const since = new Date();
  since.setHours(since.getHours() - withinHours);

  const objections = await prisma.objectionHandling.findMany({
    where: {
      conversationId,
      outcome: null,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  return objections.map((o) => ({
    id: o.id,
    strategy: o.strategy,
    discountCode: o.discountCodeId || undefined,
  }));
}

/**
 * Validate and apply a discount code
 */
export async function validateDiscountCode(
  code: string,
  creatorSlug: string,
  fanUserId?: string
): Promise<{
  valid: boolean;
  discountPercent?: number;
  discountValue?: number;
  discountType?: string;
  error?: string;
}> {
  const discount = await prisma.discountCode.findUnique({
    where: { code },
  });

  if (!discount) {
    return { valid: false, error: "Invalid code" };
  }

  if (!discount.isActive) {
    return { valid: false, error: "Code is no longer active" };
  }

  if (discount.creatorSlug !== creatorSlug) {
    return { valid: false, error: "Code not valid for this creator" };
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return { valid: false, error: "Code has expired" };
  }

  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    return { valid: false, error: "Code usage limit reached" };
  }

  if (discount.fanUserId && discount.fanUserId !== fanUserId) {
    return { valid: false, error: "Code is for another user" };
  }

  return {
    valid: true,
    discountType: discount.discountType,
    discountPercent: discount.discountType === "percent" ? discount.discountValue : undefined,
    discountValue: discount.discountType === "fixed" ? discount.discountValue : undefined,
  };
}

/**
 * Use a discount code (increment usage counter)
 */
export async function useDiscountCode(code: string): Promise<void> {
  await prisma.discountCode.update({
    where: { code },
    data: {
      currentUses: { increment: 1 },
      usedAt: new Date(),
    },
  });
}

/**
 * Get objection handling statistics
 */
export async function getObjectionStats(
  agencyId: string,
  days: number = 30
): Promise<{
  total: number;
  converted: number;
  conversionRate: number;
  totalRevenue: number;
  byStrategy: Record<ObjectionStrategy, { count: number; converted: number; revenue: number }>;
  topPatterns: Array<{ name: string; triggers: number; conversions: number; rate: number }>;
}> {
  const patterns = await prisma.objectionPattern.findMany({
    where: { agencyId },
    orderBy: { timesTriggered: "desc" },
  });

  const stats = {
    total: 0,
    converted: 0,
    conversionRate: 0,
    totalRevenue: 0,
    byStrategy: {} as Record<ObjectionStrategy, { count: number; converted: number; revenue: number }>,
    topPatterns: [] as Array<{ name: string; triggers: number; conversions: number; rate: number }>,
  };

  for (const pattern of patterns) {
    stats.total += pattern.timesTriggered;
    stats.converted += pattern.timesConverted;
    stats.totalRevenue += pattern.totalRevenue;

    const strategy = pattern.strategy as ObjectionStrategy;
    if (!stats.byStrategy[strategy]) {
      stats.byStrategy[strategy] = { count: 0, converted: 0, revenue: 0 };
    }
    stats.byStrategy[strategy].count += pattern.timesTriggered;
    stats.byStrategy[strategy].converted += pattern.timesConverted;
    stats.byStrategy[strategy].revenue += pattern.totalRevenue;

    if (pattern.timesTriggered > 0) {
      stats.topPatterns.push({
        name: pattern.name,
        triggers: pattern.timesTriggered,
        conversions: pattern.timesConverted,
        rate: pattern.conversionRate,
      });
    }
  }

  stats.conversionRate = stats.total > 0 ? stats.converted / stats.total : 0;
  stats.topPatterns.sort((a, b) => b.triggers - a.triggers);
  stats.topPatterns = stats.topPatterns.slice(0, 5);

  return stats;
}

/**
 * Create default objection patterns for an agency
 */
export async function createDefaultPatterns(agencyId: string): Promise<number> {
  let created = 0;

  for (const [, pattern] of Object.entries(DEFAULT_PATTERNS)) {
    await prisma.objectionPattern.create({
      data: {
        agencyId,
        name: pattern.name,
        patterns: JSON.stringify(pattern.keywords),
        strategy: pattern.strategy,
        responseTemplate: pattern.responseTemplates["en"]?.[0] || "",
        discountEnabled: pattern.strategy === "discount_offer",
        discountPercent: pattern.discountPercent || null,
        discountValidHours: 2,
        isActive: true,
      },
    });
    created++;
  }

  return created;
}
