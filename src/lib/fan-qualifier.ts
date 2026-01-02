/**
 * Fan Qualifier - Pre-qualification system
 *
 * Identifies and filters "time wasters":
 * - Fans who message a lot but never buy
 * - Repeated free content requests
 * - Low engagement patterns
 *
 * Actions:
 * - Mark as AI-only (never route to human)
 * - Reduce AI engagement level
 * - Skip from bump campaigns
 */

import { prisma } from "@/lib/prisma";

// Types
export type QualityTier = "vip" | "qualified" | "unqualified" | "unknown";

export interface QualificationResult {
  tier: QualityTier;
  score: number;
  aiOnlyMode: boolean;
  reason?: string;
  factors: QualificationFactor[];
}

export interface QualificationFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
}

// Time waster indicators
const TIME_WASTER_PATTERNS = {
  en: [
    "send free", "for free", "free preview", "free sample",
    "without paying", "don't want to pay", "too expensive",
    "can you send", "just send", "send me something",
  ],
  fr: [
    "envoie gratuit", "gratuit", "sans payer", "trop cher",
    "pas envie de payer", "envoie-moi quelque chose",
  ],
};

/**
 * Calculate quality score for a fan
 */
export async function calculateQualityScore(
  fanUserId: string,
  creatorSlug: string
): Promise<QualificationResult> {
  const factors: QualificationFactor[] = [];
  let score = 50; // Base score

  // Get fan profile
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  // Get conversation stats
  const conversation = await prisma.conversation.findFirst({
    where: {
      creatorSlug,
      participants: { some: { userId: fanUserId } },
    },
  });

  if (!conversation) {
    return {
      tier: "unknown",
      score: 50,
      aiOnlyMode: false,
      factors: [],
    };
  }

  // Get message count
  const messageCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: fanUserId,
    },
  });

  // Get purchase history
  const purchases = await prisma.creatorEarning.findMany({
    where: {
      creatorSlug,
      userId: fanUserId,
    },
  });

  const totalSpent = purchases.reduce((sum, p) => sum + p.grossAmount, 0);
  const purchaseCount = purchases.length;

  // Calculate messages per purchase ratio
  const messagesPerPurchase = purchaseCount > 0
    ? messageCount / purchaseCount
    : messageCount;

  // Scoring based on spending
  if (totalSpent >= 100) {
    score += 35;
    factors.push({
      name: "High spender",
      impact: "positive",
      weight: 35,
    });
  } else if (totalSpent >= 20) {
    score += 20;
    factors.push({
      name: "Has purchased",
      impact: "positive",
      weight: 20,
    });
  } else if (totalSpent > 0) {
    score += 10;
    factors.push({
      name: "Made a purchase",
      impact: "positive",
      weight: 10,
    });
  }

  // Penalize high message-to-purchase ratio
  if (messageCount >= 50 && purchaseCount === 0) {
    score -= 30;
    factors.push({
      name: "Many messages, no purchases",
      impact: "negative",
      weight: -30,
    });
  } else if (messagesPerPurchase > 100) {
    score -= 20;
    factors.push({
      name: "Very low conversion",
      impact: "negative",
      weight: -20,
    });
  } else if (messagesPerPurchase > 50) {
    score -= 10;
    factors.push({
      name: "Low conversion",
      impact: "negative",
      weight: -10,
    });
  }

  // Check for free content requests
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      senderId: fanUserId,
    },
    select: { text: true },
  });

  let freeRequestCount = 0;
  const allPatterns = [
    ...TIME_WASTER_PATTERNS.en,
    ...TIME_WASTER_PATTERNS.fr,
  ];

  for (const msg of messages) {
    const text = msg.text?.toLowerCase() || "";
    if (allPatterns.some((p) => text.includes(p))) {
      freeRequestCount++;
    }
  }

  if (freeRequestCount >= 5) {
    score -= 25;
    factors.push({
      name: "Repeated free requests",
      impact: "negative",
      weight: -25,
    });
  } else if (freeRequestCount >= 2) {
    score -= 10;
    factors.push({
      name: "Free content requests",
      impact: "negative",
      weight: -10,
    });
  }

  // Bonus for subscription
  const hasSubscription = await prisma.subscription.findFirst({
    where: {
      userId: fanUserId,
      creatorSlug,
      status: "ACTIVE",
    },
  });

  if (hasSubscription) {
    score += 20;
    factors.push({
      name: "Active subscriber",
      impact: "positive",
      weight: 20,
    });
  }

  // Determine tier and AI-only mode
  score = Math.min(100, Math.max(0, score));

  let tier: QualityTier;
  let aiOnlyMode = false;
  let reason: string | undefined;

  if (score >= 80) {
    tier = "vip";
  } else if (score >= 50) {
    tier = "qualified";
  } else if (score >= 30) {
    tier = "unqualified";
    if (messageCount >= 30 && purchaseCount === 0) {
      aiOnlyMode = true;
      reason = "High message count without purchases";
    }
  } else {
    tier = "unqualified";
    aiOnlyMode = true;
    reason = "Very low quality score";
  }

  return {
    tier,
    score,
    aiOnlyMode,
    reason,
    factors,
  };
}

/**
 * Update fan qualification in database
 */
export async function updateFanQualification(
  fanUserId: string,
  creatorSlug: string
): Promise<QualificationResult> {
  const result = await calculateQualityScore(fanUserId, creatorSlug);

  await prisma.fanProfile.upsert({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    update: {
      qualityScore: result.score,
      qualityTier: result.tier,
      aiOnlyMode: result.aiOnlyMode,
      aiOnlyReason: result.reason,
    },
    create: {
      fanUserId,
      creatorSlug,
      qualityScore: result.score,
      qualityTier: result.tier,
      aiOnlyMode: result.aiOnlyMode,
      aiOnlyReason: result.reason,
    },
  });

  return result;
}

/**
 * Check if a fan should be AI-only
 */
export async function isAiOnlyFan(
  fanUserId: string,
  creatorSlug: string
): Promise<boolean> {
  const profile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  return profile?.aiOnlyMode || false;
}

/**
 * Manually mark a fan as AI-only
 */
export async function setAiOnlyMode(
  fanUserId: string,
  creatorSlug: string,
  aiOnly: boolean,
  reason?: string
): Promise<void> {
  await prisma.fanProfile.update({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    data: {
      aiOnlyMode: aiOnly,
      aiOnlyReason: reason,
    },
  });
}

/**
 * Increment free content request counter
 */
export async function trackFreeContentRequest(
  fanUserId: string,
  creatorSlug: string
): Promise<void> {
  await prisma.fanProfile.update({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    data: {
      freeContentRequests: { increment: 1 },
    },
  });

  // Re-evaluate qualification if too many requests
  const profile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  if (profile && profile.freeContentRequests >= 5) {
    await updateFanQualification(fanUserId, creatorSlug);
  }
}

/**
 * Increment messages without purchase counter
 */
export async function trackMessageWithoutPurchase(
  fanUserId: string,
  creatorSlug: string
): Promise<void> {
  await prisma.fanProfile.update({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    data: {
      messagesWithoutPurchase: { increment: 1 },
    },
  });
}

/**
 * Reset messages without purchase counter (after a purchase)
 */
export async function resetMessageCounter(
  fanUserId: string,
  creatorSlug: string
): Promise<void> {
  await prisma.fanProfile.update({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    data: {
      messagesWithoutPurchase: 0,
    },
  });

  // Re-evaluate qualification after purchase
  await updateFanQualification(fanUserId, creatorSlug);
}

/**
 * Get quality distribution for a creator
 */
export async function getQualityDistribution(
  creatorSlug: string
): Promise<{
  vip: number;
  qualified: number;
  unqualified: number;
  unknown: number;
  aiOnly: number;
  total: number;
}> {
  const profiles = await prisma.fanProfile.findMany({
    where: { creatorSlug },
    select: {
      qualityTier: true,
      aiOnlyMode: true,
    },
  });

  return {
    vip: profiles.filter((p) => p.qualityTier === "vip").length,
    qualified: profiles.filter((p) => p.qualityTier === "qualified").length,
    unqualified: profiles.filter((p) => p.qualityTier === "unqualified").length,
    unknown: profiles.filter((p) => p.qualityTier === "unknown" || !p.qualityTier).length,
    aiOnly: profiles.filter((p) => p.aiOnlyMode).length,
    total: profiles.length,
  };
}

/**
 * Get list of time wasters
 */
export async function getTimeWasters(
  creatorSlug: string,
  limit: number = 20
): Promise<
  Array<{
    fanUserId: string;
    score: number;
    messagesWithoutPurchase: number;
    freeContentRequests: number;
    reason?: string;
  }>
> {
  const profiles = await prisma.fanProfile.findMany({
    where: {
      creatorSlug,
      aiOnlyMode: true,
    },
    orderBy: { qualityScore: "asc" },
    take: limit,
  });

  return profiles.map((p) => ({
    fanUserId: p.fanUserId,
    score: p.qualityScore,
    messagesWithoutPurchase: p.messagesWithoutPurchase,
    freeContentRequests: p.freeContentRequests,
    reason: p.aiOnlyReason || undefined,
  }));
}

/**
 * Batch update qualifications for all fans
 * Call from cron job
 */
export async function batchUpdateQualifications(
  creatorSlug: string,
  limit: number = 100
): Promise<number> {
  const profiles = await prisma.fanProfile.findMany({
    where: { creatorSlug },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });

  let updated = 0;

  for (const profile of profiles) {
    try {
      await updateFanQualification(profile.fanUserId, creatorSlug);
      updated++;
    } catch (error) {
      console.error(`Error updating qualification for ${profile.fanUserId}:`, error);
    }
  }

  return updated;
}
