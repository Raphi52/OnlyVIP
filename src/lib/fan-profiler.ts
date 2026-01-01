import prisma from "@/lib/prisma";

interface Message {
  text: string | null;
  senderId: string;
  createdAt: Date;
  isPPV?: boolean;
  ppvPrice?: number | null;
}

interface SpendingInfo {
  totalSpent: number;
  purchaseCount: number;
  lastPurchase: Date | null;
}

// Spending tier thresholds (in credits)
const SPENDING_TIERS = {
  whale: 10000, // 100+ purchases
  regular: 1000, // 10+ purchases
  free: 0,
};

// Activity level thresholds
const ACTIVITY_LEVELS = {
  daily: 7, // Active 7 of last 7 days
  weekly: 3, // Active 3-6 of last 7 days
  occasional: 1, // Active 1-2 of last 7 days
};

// Topic keywords for detection
const TOPIC_KEYWORDS: Record<string, string[]> = {
  fitness: ["gym", "workout", "exercise", "training", "fit", "muscle", "yoga", "run"],
  travel: ["travel", "vacation", "trip", "flight", "hotel", "beach", "adventure", "explore"],
  flirty: ["sexy", "hot", "beautiful", "gorgeous", "stunning", "amazing", "love", "miss"],
  gaming: ["game", "gaming", "play", "stream", "twitch", "console", "pc"],
  music: ["music", "song", "concert", "band", "listen", "spotify", "playlist"],
  food: ["food", "eat", "restaurant", "cook", "dinner", "lunch", "hungry", "delicious"],
  movies: ["movie", "film", "watch", "netflix", "cinema", "actor", "show"],
  fashion: ["outfit", "wear", "dress", "style", "fashion", "clothes", "shopping"],
};

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  en: [/\b(the|and|is|are|have|has|will|would|can|could)\b/i],
  es: [/\b(el|la|los|las|que|de|en|un|una|es|son|estoy|hola)\b/i],
  fr: [/\b(le|la|les|de|du|des|un|une|est|sont|je|tu|nous|vous)\b/i],
  de: [/\b(der|die|das|und|ist|sind|ich|du|wir|ihr|ein|eine)\b/i],
  it: [/\b(il|lo|la|le|di|da|un|una|che|sono|sei|siamo)\b/i],
  pt: [/\b(o|a|os|as|de|do|da|um|uma|que|sou|és|somos)\b/i],
};

/**
 * Update fan profile based on recent messages and purchases
 */
export async function updateFanProfile(
  fanUserId: string,
  creatorSlug: string,
  messages: Message[],
  spending?: SpendingInfo
): Promise<void> {
  try {
    // Get or create fan profile
    let profile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
    });

    const updates: any = {
      lastSeen: new Date(),
      totalMessages: { increment: messages.filter((m) => m.senderId === fanUserId).length },
    };

    // Detect language from messages
    const fanMessages = messages.filter((m) => m.senderId === fanUserId && m.text);
    const combinedText = fanMessages.map((m) => m.text).join(" ");
    const detectedLanguage = detectLanguage(combinedText);
    if (detectedLanguage) {
      updates.language = detectedLanguage;
    }

    // Detect preferred topics
    const detectedTopics = detectTopics(combinedText);
    if (detectedTopics.length > 0 && profile) {
      // Merge with existing topics
      const existingTopics = profile.preferredTopics || [];
      const mergedTopics = [...new Set([...existingTopics, ...detectedTopics])].slice(0, 10);
      updates.preferredTopics = mergedTopics;
    } else if (detectedTopics.length > 0) {
      updates.preferredTopics = detectedTopics;
    }

    // Detect preferred tone from messages
    const detectedTone = detectPreferredTone(fanMessages);
    if (detectedTone) {
      updates.preferredTone = detectedTone;
    }

    // Update spending info if provided
    if (spending) {
      updates.totalSpent = spending.totalSpent;
      updates.spendingTier = getSpendingTier(spending.totalSpent);
    }

    // Calculate activity level
    const activityLevel = await calculateActivityLevel(fanUserId, creatorSlug);
    updates.activityLevel = activityLevel;

    // Upsert profile
    await prisma.fanProfile.upsert({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
      create: {
        fanUserId,
        creatorSlug,
        ...updates,
        preferredTopics: detectedTopics,
      },
      update: updates,
    });
  } catch (error) {
    console.error("[FanProfiler] Error updating fan profile:", error);
  }
}

/**
 * Get fan context for AI prompts
 */
export async function getFanContext(
  fanUserId: string,
  creatorSlug: string
): Promise<string> {
  try {
    const profile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
    });

    if (!profile) {
      return "New fan - no history available.";
    }

    const contextParts: string[] = [];

    // Activity level
    if (profile.activityLevel) {
      contextParts.push(`Activity: ${profile.activityLevel} visitor`);
    }

    // Spending tier
    if (profile.spendingTier) {
      const tierDescriptions: Record<string, string> = {
        whale: "high spender (VIP treatment recommended)",
        regular: "regular buyer",
        free: "free user (encourage purchases)",
      };
      contextParts.push(`Spending: ${tierDescriptions[profile.spendingTier] || profile.spendingTier}`);
    }

    // Preferred tone
    if (profile.preferredTone) {
      contextParts.push(`Prefers ${profile.preferredTone} conversation style`);
    }

    // Interests
    if (profile.preferredTopics && profile.preferredTopics.length > 0) {
      contextParts.push(`Interests: ${profile.preferredTopics.join(", ")}`);
    }

    // Language
    if (profile.language && profile.language !== "en") {
      const languageNames: Record<string, string> = {
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
      };
      contextParts.push(`Language: ${languageNames[profile.language] || profile.language}`);
    }

    // Time since first seen
    if (profile.firstSeen) {
      const daysSinceFirstSeen = Math.floor(
        (Date.now() - profile.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceFirstSeen > 30) {
        contextParts.push(`Long-term fan (${daysSinceFirstSeen} days)`);
      } else if (daysSinceFirstSeen > 7) {
        contextParts.push(`Regular fan (${daysSinceFirstSeen} days)`);
      } else {
        contextParts.push("New fan");
      }
    }

    // Notes
    if (profile.notes) {
      contextParts.push(`Notes: ${profile.notes}`);
    }

    return contextParts.length > 0
      ? `Fan Profile:\n${contextParts.map((p) => `- ${p}`).join("\n")}`
      : "Fan profile available but minimal data.";
  } catch (error) {
    console.error("[FanProfiler] Error getting fan context:", error);
    return "";
  }
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): string | null {
  if (!text || text.length < 10) return null;

  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    scores[lang] = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        scores[lang] += matches.length;
      }
    }
  }

  // Find language with highest score
  let maxScore = 0;
  let detectedLang = null;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // Only return if confidence is reasonable
  return maxScore >= 2 ? detectedLang : null;
}

/**
 * Detect topics from text
 */
function detectTopics(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const detectedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        detectedTopics.push(topic);
        break;
      }
    }
  }

  return detectedTopics;
}

/**
 * Detect preferred conversation tone
 */
function detectPreferredTone(messages: Message[]): string | null {
  const toneIndicators: Record<string, { pattern: RegExp; weight: number }[]> = {
    romantic: [
      { pattern: /\b(love|heart|miss|feelings|together)\b/i, weight: 1 },
      { pattern: /[❤️💕💖💗💘💝]/u, weight: 2 },
    ],
    playful: [
      { pattern: /\b(haha|lol|lmao|funny|joke)\b/i, weight: 1 },
      { pattern: /[😂🤣😜😝😛]/u, weight: 2 },
    ],
    explicit: [
      { pattern: /\b(naughty|dirty|hot|sexy|turn[s]?\s*on)\b/i, weight: 2 },
      { pattern: /[🔥💋🍑🍆]/u, weight: 2 },
    ],
    casual: [
      { pattern: /\b(hey|hi|what'?s up|how are you|how'?s it going)\b/i, weight: 1 },
    ],
    demanding: [
      { pattern: /\b(now|want|need|give me|show me|send)\b/i, weight: 1 },
      { pattern: /!/g, weight: 0.5 },
    ],
  };

  const scores: Record<string, number> = {};

  for (const [tone, indicators] of Object.entries(toneIndicators)) {
    scores[tone] = 0;
    for (const msg of messages) {
      if (!msg.text) continue;
      for (const { pattern, weight } of indicators) {
        const matches = msg.text.match(pattern);
        if (matches) {
          scores[tone] += matches.length * weight;
        }
      }
    }
  }

  // Find tone with highest score
  let maxScore = 0;
  let detectedTone = null;

  for (const [tone, score] of Object.entries(scores)) {
    if (score > maxScore && score >= 2) {
      maxScore = score;
      detectedTone = tone;
    }
  }

  return detectedTone;
}

/**
 * Calculate activity level based on recent message history
 */
async function calculateActivityLevel(
  fanUserId: string,
  creatorSlug: string
): Promise<string> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get conversations for this creator
    const conversations = await prisma.conversation.findMany({
      where: { creatorSlug },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);

    // Get messages from fan in last 7 days
    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        senderId: fanUserId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    // Count unique days with activity
    const activeDays = new Set(
      recentMessages.map((m) => m.createdAt.toISOString().split("T")[0])
    ).size;

    if (activeDays >= ACTIVITY_LEVELS.daily) return "daily";
    if (activeDays >= ACTIVITY_LEVELS.weekly) return "weekly";
    if (activeDays >= ACTIVITY_LEVELS.occasional) return "occasional";
    return "inactive";
  } catch (error) {
    console.error("[FanProfiler] Error calculating activity level:", error);
    return "unknown";
  }
}

/**
 * Get spending tier based on total spent
 */
function getSpendingTier(totalSpent: number): string {
  if (totalSpent >= SPENDING_TIERS.whale) return "whale";
  if (totalSpent >= SPENDING_TIERS.regular) return "regular";
  return "free";
}

/**
 * Get fans who need profile updates (called by cron)
 */
export async function getProfileUpdateCandidates(
  creatorSlug: string,
  limit: number = 50
): Promise<string[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find fans with recent activity but outdated profiles
  const conversations = await prisma.conversation.findMany({
    where: { creatorSlug },
    select: {
      participants: {
        select: { userId: true },
      },
      messages: {
        where: { createdAt: { gte: oneDayAgo } },
        select: { senderId: true },
        take: 1,
      },
    },
  });

  // Get unique fans with recent messages
  const activeFanIds = new Set<string>();
  for (const conv of conversations) {
    if (conv.messages.length > 0) {
      for (const p of conv.participants) {
        activeFanIds.add(p.userId);
      }
    }
  }

  // Filter to those needing updates
  const profiles = await prisma.fanProfile.findMany({
    where: {
      creatorSlug,
      fanUserId: { in: Array.from(activeFanIds) },
      updatedAt: { lt: oneDayAgo },
    },
    select: { fanUserId: true },
    take: limit,
  });

  return profiles.map((p) => p.fanUserId);
}
