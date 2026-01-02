/**
 * Lead Scoring System - Predictive fan scoring
 *
 * UNIQUE FEATURE vs Substy
 *
 * Scores fans 0-100 based on:
 * 1. Engagement Score - Message frequency, responses
 * 2. Spending Score - Historical + recent spending
 * 3. Intent Score - Purchase intent signals
 * 4. Recency Score - How recent is activity
 *
 * Uses these scores to:
 * - Prioritize AI attention
 * - Target auto-bumps
 * - Select LLM model (Sonnet for high scores)
 * - Qualify for handoff
 */

import { prisma } from "@/lib/prisma";

// Types
export interface LeadScoreBreakdown {
  overall: number;
  engagement: number;
  spending: number;
  intent: number;
  recency: number;
  factors: LeadScoreFactor[];
}

export interface LeadScoreFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

// Scoring weights
const WEIGHTS = {
  engagement: 0.25,
  spending: 0.35,
  intent: 0.25,
  recency: 0.15,
};

// Intent keywords (signals of purchase intent)
const INTENT_KEYWORDS = {
  high: [
    "buy", "purchase", "unlock", "how much", "price", "send me", "show me",
    "i want", "give me", "pay", "credit", "subscribe", "vip",
    // French
    "acheter", "débloquer", "combien", "envoie-moi", "montre-moi", "je veux",
    "payer", "abonnement",
  ],
  medium: [
    "interested", "curious", "maybe", "thinking", "consider",
    "intéressé", "curieux", "peut-être", "je réfléchis",
  ],
  low: [
    "free", "cheaper", "expensive", "later", "not now",
    "gratuit", "moins cher", "cher", "plus tard", "pas maintenant",
  ],
};

/**
 * Calculate engagement score (0-100)
 * Based on message frequency and response patterns
 */
async function calculateEngagementScore(
  fanUserId: string,
  creatorSlug: string
): Promise<{ score: number; factors: LeadScoreFactor[] }> {
  const factors: LeadScoreFactor[] = [];
  let score = 50; // Base score

  // Get message stats for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conversation = await prisma.conversation.findFirst({
    where: {
      creatorSlug,
      participants: { some: { userId: fanUserId } },
    },
  });

  if (!conversation) {
    return { score: 30, factors: [{ name: "No conversation", impact: "negative", weight: -20, description: "No active conversation" }] };
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      senderId: fanUserId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "asc" },
  });

  const messageCount = messages.length;

  // Message frequency scoring
  if (messageCount >= 50) {
    score += 30;
    factors.push({ name: "High activity", impact: "positive", weight: 30, description: "50+ messages in 30 days" });
  } else if (messageCount >= 20) {
    score += 20;
    factors.push({ name: "Active", impact: "positive", weight: 20, description: "20+ messages in 30 days" });
  } else if (messageCount >= 5) {
    score += 10;
    factors.push({ name: "Moderate activity", impact: "positive", weight: 10, description: "5+ messages in 30 days" });
  } else if (messageCount === 0) {
    score -= 20;
    factors.push({ name: "Inactive", impact: "negative", weight: -20, description: "No messages in 30 days" });
  }

  // Response time scoring (how quickly they respond)
  if (messages.length >= 2) {
    const creatorMessages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: fanUserId },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const creatorMsg of creatorMessages) {
      const nextFanMsg = messages.find(
        (m) => m.createdAt > creatorMsg.createdAt
      );
      if (nextFanMsg) {
        const responseTime = nextFanMsg.createdAt.getTime() - creatorMsg.createdAt.getTime();
        if (responseTime < 24 * 60 * 60 * 1000) { // Within 24 hours
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    if (responseCount > 0) {
      const avgResponseMinutes = totalResponseTime / responseCount / 60000;
      if (avgResponseMinutes < 30) {
        score += 15;
        factors.push({ name: "Quick responder", impact: "positive", weight: 15, description: "Responds within 30 min" });
      } else if (avgResponseMinutes < 120) {
        score += 10;
        factors.push({ name: "Good responder", impact: "positive", weight: 10, description: "Responds within 2 hours" });
      }
    }
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
}

/**
 * Calculate spending score (0-100)
 * Based on total and recent spending
 */
async function calculateSpendingScore(
  fanUserId: string,
  creatorSlug: string
): Promise<{ score: number; factors: LeadScoreFactor[] }> {
  const factors: LeadScoreFactor[] = [];
  let score = 50;

  // Get fan profile
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  const totalSpent = fanProfile?.totalSpent || 0;

  // Total spending scoring
  if (totalSpent >= 500) {
    score += 40;
    factors.push({ name: "Whale", impact: "positive", weight: 40, description: `Spent $${totalSpent.toFixed(0)}+` });
  } else if (totalSpent >= 100) {
    score += 30;
    factors.push({ name: "High spender", impact: "positive", weight: 30, description: `Spent $${totalSpent.toFixed(0)}` });
  } else if (totalSpent >= 20) {
    score += 15;
    factors.push({ name: "Moderate spender", impact: "positive", weight: 15, description: `Spent $${totalSpent.toFixed(0)}` });
  } else if (totalSpent > 0) {
    score += 5;
    factors.push({ name: "Has purchased", impact: "positive", weight: 5, description: "Made at least one purchase" });
  } else {
    score -= 15;
    factors.push({ name: "No purchases", impact: "negative", weight: -15, description: "Never purchased" });
  }

  // Recent spending (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEarnings = await prisma.creatorEarning.findMany({
    where: {
      creatorSlug,
      userId: fanUserId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const recentSpent = recentEarnings.reduce((sum, e) => sum + e.grossAmount, 0);

  if (recentSpent >= 50) {
    score += 15;
    factors.push({ name: "Recent high spending", impact: "positive", weight: 15, description: `$${recentSpent.toFixed(0)} in last 7 days` });
  } else if (recentSpent >= 10) {
    score += 10;
    factors.push({ name: "Recent purchase", impact: "positive", weight: 10, description: `$${recentSpent.toFixed(0)} in last 7 days` });
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
}

/**
 * Calculate intent score (0-100)
 * Based on message content analysis
 */
async function calculateIntentScore(
  fanUserId: string,
  creatorSlug: string
): Promise<{ score: number; factors: LeadScoreFactor[] }> {
  const factors: LeadScoreFactor[] = [];
  let score = 50;

  // Get recent messages
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const conversation = await prisma.conversation.findFirst({
    where: {
      creatorSlug,
      participants: { some: { userId: fanUserId } },
    },
  });

  if (!conversation) {
    return { score: 40, factors };
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      senderId: fanUserId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // Analyze message content
  const allText = messages.map((m) => m.text?.toLowerCase() || "").join(" ");

  // Check for high-intent keywords
  let highIntentCount = 0;
  let mediumIntentCount = 0;
  let lowIntentCount = 0;

  for (const keyword of INTENT_KEYWORDS.high) {
    if (allText.includes(keyword)) highIntentCount++;
  }

  for (const keyword of INTENT_KEYWORDS.medium) {
    if (allText.includes(keyword)) mediumIntentCount++;
  }

  for (const keyword of INTENT_KEYWORDS.low) {
    if (allText.includes(keyword)) lowIntentCount++;
  }

  if (highIntentCount >= 3) {
    score += 35;
    factors.push({ name: "Strong purchase intent", impact: "positive", weight: 35, description: "Multiple buying signals" });
  } else if (highIntentCount >= 1) {
    score += 20;
    factors.push({ name: "Purchase intent detected", impact: "positive", weight: 20, description: "Buying signals in messages" });
  }

  if (mediumIntentCount >= 2) {
    score += 10;
    factors.push({ name: "Interest shown", impact: "positive", weight: 10, description: "Shows curiosity" });
  }

  if (lowIntentCount >= 3) {
    score -= 15;
    factors.push({ name: "Price sensitivity", impact: "negative", weight: -15, description: "Hesitant about spending" });
  }

  // Check for PPV unlock requests
  const ppvRequests = messages.filter((m) =>
    m.text?.toLowerCase().includes("unlock") ||
    m.text?.toLowerCase().includes("débloquer") ||
    m.text?.toLowerCase().includes("see") ||
    m.text?.toLowerCase().includes("voir")
  );

  if (ppvRequests.length > 0) {
    score += 15;
    factors.push({ name: "PPV interest", impact: "positive", weight: 15, description: "Asked about exclusive content" });
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
}

/**
 * Calculate recency score (0-100)
 * Based on how recently the fan was active
 */
async function calculateRecencyScore(
  fanUserId: string,
  creatorSlug: string
): Promise<{ score: number; factors: LeadScoreFactor[] }> {
  const factors: LeadScoreFactor[] = [];
  let score = 50;

  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  if (!fanProfile?.lastSeen) {
    return { score: 30, factors: [{ name: "Unknown activity", impact: "neutral", weight: 0, description: "No activity data" }] };
  }

  const daysSinceLastSeen = Math.floor(
    (Date.now() - fanProfile.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastSeen === 0) {
    score += 40;
    factors.push({ name: "Active today", impact: "positive", weight: 40, description: "Messaged today" });
  } else if (daysSinceLastSeen <= 3) {
    score += 30;
    factors.push({ name: "Recently active", impact: "positive", weight: 30, description: `Active ${daysSinceLastSeen} days ago` });
  } else if (daysSinceLastSeen <= 7) {
    score += 15;
    factors.push({ name: "Active this week", impact: "positive", weight: 15, description: `Active ${daysSinceLastSeen} days ago` });
  } else if (daysSinceLastSeen <= 14) {
    score += 5;
    factors.push({ name: "Active recently", impact: "positive", weight: 5, description: `Active ${daysSinceLastSeen} days ago` });
  } else if (daysSinceLastSeen <= 30) {
    score -= 10;
    factors.push({ name: "Dormant", impact: "negative", weight: -10, description: `Inactive for ${daysSinceLastSeen} days` });
  } else {
    score -= 25;
    factors.push({ name: "Churned", impact: "negative", weight: -25, description: `Inactive for ${daysSinceLastSeen}+ days` });
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
}

/**
 * Calculate complete lead score
 */
export async function calculateLeadScore(
  fanUserId: string,
  creatorSlug: string
): Promise<LeadScoreBreakdown> {
  const [engagement, spending, intent, recency] = await Promise.all([
    calculateEngagementScore(fanUserId, creatorSlug),
    calculateSpendingScore(fanUserId, creatorSlug),
    calculateIntentScore(fanUserId, creatorSlug),
    calculateRecencyScore(fanUserId, creatorSlug),
  ]);

  // Calculate weighted overall score
  const overall = Math.round(
    engagement.score * WEIGHTS.engagement +
    spending.score * WEIGHTS.spending +
    intent.score * WEIGHTS.intent +
    recency.score * WEIGHTS.recency
  );

  // Combine all factors
  const factors = [
    ...engagement.factors,
    ...spending.factors,
    ...intent.factors,
    ...recency.factors,
  ].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  return {
    overall: Math.min(100, Math.max(0, overall)),
    engagement: engagement.score,
    spending: spending.score,
    intent: intent.score,
    recency: recency.score,
    factors,
  };
}

/**
 * Update lead score in database
 */
export async function updateLeadScore(
  fanUserId: string,
  creatorSlug: string
): Promise<number> {
  const scoreBreakdown = await calculateLeadScore(fanUserId, creatorSlug);

  // Calculate predicted LTV based on spending score
  const predictedLTV = scoreBreakdown.spending > 70
    ? scoreBreakdown.spending * 10 // High spenders: ~$700+
    : scoreBreakdown.spending > 50
    ? scoreBreakdown.spending * 5 // Moderate: ~$250+
    : scoreBreakdown.spending * 2; // Low: ~$100

  // Calculate purchase probability based on intent and recency
  const purchaseProbability = Math.min(1, (scoreBreakdown.intent + scoreBreakdown.recency) / 200);

  // Calculate churn risk based on recency
  const churnRisk = Math.max(0, 1 - scoreBreakdown.recency / 100);

  await prisma.fanLeadScore.upsert({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    update: {
      score: scoreBreakdown.overall,
      engagementScore: scoreBreakdown.engagement,
      spendingScore: scoreBreakdown.spending,
      intentScore: scoreBreakdown.intent,
      recencyScore: scoreBreakdown.recency,
      predictedLTV,
      purchaseProbability,
      churnRisk,
      factors: JSON.stringify(scoreBreakdown.factors),
      lastCalculated: new Date(),
    },
    create: {
      fanUserId,
      creatorSlug,
      score: scoreBreakdown.overall,
      engagementScore: scoreBreakdown.engagement,
      spendingScore: scoreBreakdown.spending,
      intentScore: scoreBreakdown.intent,
      recencyScore: scoreBreakdown.recency,
      predictedLTV,
      purchaseProbability,
      churnRisk,
      factors: JSON.stringify(scoreBreakdown.factors),
    },
  });

  return scoreBreakdown.overall;
}

/**
 * Get lead score for a fan
 */
export async function getLeadScore(
  fanUserId: string,
  creatorSlug: string
): Promise<LeadScoreBreakdown | null> {
  const score = await prisma.fanLeadScore.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  if (!score) return null;

  return {
    overall: score.score,
    engagement: score.engagementScore,
    spending: score.spendingScore,
    intent: score.intentScore,
    recency: score.recencyScore,
    factors: score.factors ? JSON.parse(score.factors) : [],
  };
}

/**
 * Batch update lead scores for all fans of a creator
 * Call from cron job (e.g., daily)
 */
export async function batchUpdateLeadScores(
  creatorSlug: string,
  limit: number = 100
): Promise<number> {
  // Get all fan profiles for this creator
  const fanProfiles = await prisma.fanProfile.findMany({
    where: { creatorSlug },
    take: limit,
    orderBy: { updatedAt: "asc" }, // Update oldest first
  });

  let updated = 0;

  for (const profile of fanProfiles) {
    try {
      await updateLeadScore(profile.fanUserId, creatorSlug);
      updated++;
    } catch (error) {
      console.error(`Error updating lead score for ${profile.fanUserId}:`, error);
    }
  }

  return updated;
}

/**
 * Get top leads for a creator
 */
export async function getTopLeads(
  creatorSlug: string,
  limit: number = 20
): Promise<
  Array<{
    fanUserId: string;
    score: number;
    spendingTier: string;
    predictedLTV: number;
    purchaseProbability: number;
  }>
> {
  const leads = await prisma.fanLeadScore.findMany({
    where: { creatorSlug },
    orderBy: { score: "desc" },
    take: limit,
  });

  return leads.map((l) => ({
    fanUserId: l.fanUserId,
    score: l.score,
    spendingTier: l.spendingScore >= 70 ? "whale" : l.spendingScore >= 40 ? "regular" : "free",
    predictedLTV: l.predictedLTV || 0,
    purchaseProbability: l.purchaseProbability || 0,
  }));
}

/**
 * Get fans at risk of churning
 */
export async function getChurnRiskFans(
  creatorSlug: string,
  minRisk: number = 0.5,
  limit: number = 20
): Promise<
  Array<{
    fanUserId: string;
    score: number;
    churnRisk: number;
    lastSeen?: Date;
  }>
> {
  const atRisk = await prisma.fanLeadScore.findMany({
    where: {
      creatorSlug,
      churnRisk: { gte: minRisk },
    },
    orderBy: { churnRisk: "desc" },
    take: limit,
  });

  // Enrich with last seen data
  const enriched = await Promise.all(
    atRisk.map(async (r) => {
      const profile = await prisma.fanProfile.findUnique({
        where: {
          fanUserId_creatorSlug: { fanUserId: r.fanUserId, creatorSlug },
        },
      });
      return {
        fanUserId: r.fanUserId,
        score: r.score,
        churnRisk: r.churnRisk || 0,
        lastSeen: profile?.lastSeen || undefined,
      };
    })
  );

  return enriched;
}

/**
 * Get lead score distribution for analytics
 */
export async function getLeadScoreDistribution(
  creatorSlug: string
): Promise<{
  hot: number; // Score 80-100
  warm: number; // Score 60-79
  cold: number; // Score 40-59
  ice: number; // Score 0-39
  total: number;
  avgScore: number;
}> {
  const scores = await prisma.fanLeadScore.findMany({
    where: { creatorSlug },
    select: { score: true },
  });

  const distribution = {
    hot: scores.filter((s) => s.score >= 80).length,
    warm: scores.filter((s) => s.score >= 60 && s.score < 80).length,
    cold: scores.filter((s) => s.score >= 40 && s.score < 60).length,
    ice: scores.filter((s) => s.score < 40).length,
    total: scores.length,
    avgScore: scores.length > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0,
  };

  return distribution;
}
