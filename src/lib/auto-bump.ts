/**
 * Auto-Bump System
 *
 * Automatically sends messages to fans based on triggers:
 * 1. online_greeting - Fan comes online after being away
 * 2. dormant_reactivation - Fan hasn't messaged in X days
 * 3. new_content - New content uploaded, notify interested fans
 */

import { prisma } from "@/lib/prisma";
import { generateWithClaude, type LLMContext } from "@/lib/llm-router";

// Types
export type BumpType = "online_greeting" | "dormant_reactivation" | "new_content";

export interface BumpConfig {
  enabled: boolean;
  cooldownHours: number;
  minLeadScore?: number; // Only bump fans with score above this
  templates: Record<string, string[]>;
}

// Default bump templates per type and language
const BUMP_TEMPLATES: Record<BumpType, Record<string, string[]>> = {
  online_greeting: {
    en: [
      "Hey you 💕 I was just thinking about you...",
      "Look who's online 😏 Miss me?",
      "Hey babe! Perfect timing, I have something for you 💋",
      "Finally! I've been waiting for you 😘",
    ],
    fr: [
      "Coucou toi 💕 Je pensais justement à toi...",
      "Tiens, qui voilà 😏 Je t'ai manqué?",
      "Hey bébé! Tu tombes bien, j'ai quelque chose pour toi 💋",
      "Enfin! Je t'attendais 😘",
    ],
    es: [
      "Hola guapo 💕 Estaba pensando en ti...",
      "Mira quién está en línea 😏 ¿Me extrañaste?",
      "¡Hola cariño! Justo a tiempo, tengo algo para ti 💋",
      "¡Por fin! Te estaba esperando 😘",
    ],
  },
  dormant_reactivation: {
    en: [
      "Hey stranger... where have you been? 🥺",
      "I miss our conversations 💕 Come say hi?",
      "It's been too long babe... I have new things to show you 😏",
      "Did you forget about me? 🥺💔",
    ],
    fr: [
      "Hey toi... t'étais passé où? 🥺",
      "Nos conversations me manquent 💕 Tu passes me faire coucou?",
      "Ça fait trop longtemps bébé... J'ai des nouvelles choses à te montrer 😏",
      "Tu m'as oubliée? 🥺💔",
    ],
    es: [
      "Oye extraño... ¿dónde has estado? 🥺",
      "Extraño nuestras conversaciones 💕 ¿Vienes a saludar?",
      "Ha pasado mucho tiempo cariño... Tengo cosas nuevas para mostrarte 😏",
      "¿Te olvidaste de mí? 🥺💔",
    ],
  },
  new_content: {
    en: [
      "I just uploaded something special... want to see? 😏",
      "New content alert! 🔥 I think you'll love this one",
      "I made something just for you 💕 Check it out?",
      "Fresh content dropping now 🎉 Don't miss it!",
    ],
    fr: [
      "Je viens de poster quelque chose de spécial... tu veux voir? 😏",
      "Nouveau contenu! 🔥 Je pense que tu vas adorer",
      "J'ai fait quelque chose juste pour toi 💕 Tu regardes?",
      "Nouveau contenu dispo maintenant 🎉 Rate pas ça!",
    ],
    es: [
      "Acabo de subir algo especial... ¿quieres ver? 😏",
      "¡Nuevo contenido! 🔥 Creo que te va a encantar",
      "Hice algo solo para ti 💕 ¿Lo ves?",
      "Contenido nuevo ahora 🎉 ¡No te lo pierdas!",
    ],
  },
};

/**
 * Get a random template for a bump type
 */
function getRandomTemplate(type: BumpType, language: string = "en"): string {
  const templates = BUMP_TEMPLATES[type][language] || BUMP_TEMPLATES[type]["en"];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Check if a fan can be bumped (respects cooldown)
 */
export async function canBumpFan(
  fanUserId: string,
  creatorSlug: string,
  bumpType: BumpType
): Promise<boolean> {
  const presence = await prisma.fanPresence.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  if (!presence) return true; // New fan, can bump

  if (!presence.lastBumpedAt) return true;

  const cooldownHours = presence.bumpCooldownHours || 24;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const timeSinceLastBump = Date.now() - presence.lastBumpedAt.getTime();

  return timeSinceLastBump >= cooldownMs;
}

/**
 * Schedule a bump for a fan
 */
export async function scheduleBump(
  conversationId: string,
  fanUserId: string,
  creatorSlug: string,
  bumpType: BumpType,
  delaySeconds: number = 0,
  personalityId?: string
): Promise<string | null> {
  // Check cooldown
  const canBump = await canBumpFan(fanUserId, creatorSlug, bumpType);
  if (!canBump) {
    console.log(`Fan ${fanUserId} is in cooldown, skipping bump`);
    return null;
  }

  // Check lead score if required
  const leadScore = await prisma.fanLeadScore.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  // Skip very low quality fans (score < 20)
  if (leadScore && leadScore.score < 20) {
    console.log(`Fan ${fanUserId} has low lead score (${leadScore.score}), skipping bump`);
    return null;
  }

  // Get fan profile for language
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  const language = fanProfile?.language || "en";
  const message = getRandomTemplate(bumpType, language);

  // Schedule the bump
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000);

  const bump = await prisma.autoBump.create({
    data: {
      conversationId,
      fanUserId,
      creatorSlug,
      bumpType,
      scheduledAt,
      personalityId,
      message,
      status: "PENDING",
    },
  });

  return bump.id;
}

/**
 * Handle fan coming online - trigger online_greeting bump
 */
export async function handleFanOnline(
  fanUserId: string,
  creatorSlug: string
): Promise<void> {
  // Update presence
  await prisma.fanPresence.upsert({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    update: {
      isOnline: true,
      lastSeen: new Date(),
    },
    create: {
      fanUserId,
      creatorSlug,
      isOnline: true,
      lastSeen: new Date(),
    },
  });

  // Find conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      creatorSlug,
      participants: {
        some: { userId: fanUserId },
      },
    },
    include: {
      aiPersonality: true,
    },
  });

  if (!conversation) return;

  // Check if there was recent activity (don't bump if they were active recently)
  const recentMessage = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentMessage) {
    const timeSinceLastMessage = Date.now() - recentMessage.createdAt.getTime();
    const oneHourMs = 60 * 60 * 1000;

    // Don't bump if last message was less than 1 hour ago
    if (timeSinceLastMessage < oneHourMs) {
      return;
    }
  }

  // Schedule the bump with small delay (5-30 seconds to seem natural)
  const delay = Math.floor(Math.random() * 25) + 5;
  await scheduleBump(
    conversation.id,
    fanUserId,
    creatorSlug,
    "online_greeting",
    delay,
    conversation.aiPersonalityId || undefined
  );
}

/**
 * Handle fan going offline - update presence
 */
export async function handleFanOffline(
  fanUserId: string,
  creatorSlug: string
): Promise<void> {
  await prisma.fanPresence.upsert({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
    update: {
      isOnline: false,
      lastSeen: new Date(),
    },
    create: {
      fanUserId,
      creatorSlug,
      isOnline: false,
      lastSeen: new Date(),
    },
  });
}

/**
 * Find dormant fans and schedule reactivation bumps
 * Call this from a cron job (e.g., daily)
 */
export async function scheduleDormantReactivations(
  creatorSlug: string,
  dormantDays: number = 7
): Promise<number> {
  const dormantDate = new Date();
  dormantDate.setDate(dormantDate.getDate() - dormantDays);

  // Find conversations where fan hasn't messaged in X days
  const dormantConversations = await prisma.conversation.findMany({
    where: {
      creatorSlug,
      aiMode: { not: "disabled" },
      messages: {
        some: {
          createdAt: { lt: dormantDate },
        },
      },
    },
    include: {
      participants: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      aiPersonality: true,
    },
  });

  let scheduledCount = 0;

  for (const convo of dormantConversations) {
    // Get the fan (non-creator participant)
    const fanParticipant = convo.participants.find(
      (p) => p.userId !== creatorSlug
    );
    if (!fanParticipant) continue;

    // Check last message date
    const lastMessage = convo.messages[0];
    if (!lastMessage) continue;

    const daysSinceLastMessage = Math.floor(
      (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastMessage < dormantDays) continue;

    // Schedule reactivation bump
    const bumpId = await scheduleBump(
      convo.id,
      fanParticipant.userId,
      creatorSlug,
      "dormant_reactivation",
      Math.floor(Math.random() * 3600), // Random delay up to 1 hour
      convo.aiPersonalityId || undefined
    );

    if (bumpId) scheduledCount++;
  }

  return scheduledCount;
}

/**
 * Notify fans about new content
 * Call this when new media is uploaded
 */
export async function scheduleNewContentBumps(
  creatorSlug: string,
  mediaId: string,
  mediaTags: string[] = []
): Promise<number> {
  // Find fans who might be interested in this content type
  const interestedFans = await prisma.fanProfile.findMany({
    where: {
      creatorSlug,
      // Only fans who have shown interest (spent money or are active)
      OR: [
        { spendingTier: { in: ["whale", "regular"] } },
        { activityLevel: { in: ["daily", "weekly"] } },
      ],
    },
  });

  let scheduledCount = 0;

  for (const fan of interestedFans) {
    // Find conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        creatorSlug,
        participants: {
          some: { userId: fan.fanUserId },
        },
        aiMode: { not: "disabled" },
      },
    });

    if (!conversation) continue;

    // Schedule bump with staggered delay (spread over 4 hours)
    const delay = Math.floor(Math.random() * 14400);
    const bumpId = await scheduleBump(
      conversation.id,
      fan.fanUserId,
      creatorSlug,
      "new_content",
      delay
    );

    if (bumpId) scheduledCount++;
  }

  return scheduledCount;
}

/**
 * Process pending bumps and send them
 * Call this from a cron job (every 30 seconds)
 */
export async function processPendingBumps(limit: number = 10): Promise<number> {
  const now = new Date();

  // Get pending bumps that are ready to send
  const pendingBumps = await prisma.autoBump.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
  });

  let sentCount = 0;

  for (const bump of pendingBumps) {
    try {
      // Mark as processing
      await prisma.autoBump.update({
        where: { id: bump.id },
        data: { status: "PROCESSING" as never },
      });

      // Get conversation and check if still valid
      const conversation = await prisma.conversation.findUnique({
        where: { id: bump.conversationId },
        include: {
          participants: true,
        },
      });

      if (!conversation || conversation.aiMode === "disabled") {
        await prisma.autoBump.update({
          where: { id: bump.id },
          data: { status: "CANCELLED", error: "Conversation invalid or AI disabled" },
        });
        continue;
      }

      // Get creator user ID
      const creator = await prisma.creator.findUnique({
        where: { slug: bump.creatorSlug },
      });

      if (!creator?.userId) {
        await prisma.autoBump.update({
          where: { id: bump.id },
          data: { status: "FAILED", error: "Creator not found" },
        });
        continue;
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          conversationId: bump.conversationId,
          senderId: creator.userId,
          receiverId: bump.fanUserId,
          text: bump.message || "Hey! 💕",
          isAiGenerated: true,
          aiPersonalityId: bump.personalityId,
        },
      });

      // Update bump status
      await prisma.autoBump.update({
        where: { id: bump.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          messageId: message.id,
        },
      });

      // Update fan presence (last bumped)
      await prisma.fanPresence.update({
        where: {
          fanUserId_creatorSlug: {
            fanUserId: bump.fanUserId,
            creatorSlug: bump.creatorSlug,
          },
        },
        data: {
          lastBumpedAt: new Date(),
          totalBumps: { increment: 1 },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: bump.conversationId },
        data: { updatedAt: new Date() },
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to process bump ${bump.id}:`, error);
      await prisma.autoBump.update({
        where: { id: bump.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  return sentCount;
}

/**
 * Generate AI bump message (more personalized than templates)
 */
export async function generateAiBumpMessage(
  bumpType: BumpType,
  context: {
    fanName?: string;
    fanLanguage?: string;
    personalityName?: string;
    personalityStyle?: string;
    daysSinceLast?: number;
  }
): Promise<string> {
  const { fanName, fanLanguage = "en", personalityName, personalityStyle, daysSinceLast } = context;

  const prompts: Record<BumpType, string> = {
    online_greeting: `Generate a short, flirty greeting (1-2 sentences) for a fan who just came online. ${fanName ? `Their name is ${fanName}.` : ""} Be playful and make them feel special. Use 1-2 emojis.`,
    dormant_reactivation: `Generate a short message (1-2 sentences) to re-engage a fan who hasn't messaged in ${daysSinceLast || 7} days. ${fanName ? `Their name is ${fanName}.` : ""} Be sweet, slightly pouty, make them feel missed. Use 1-2 emojis.`,
    new_content: `Generate a short, teasing message (1-2 sentences) to let a fan know about new exclusive content. ${fanName ? `Their name is ${fanName}.` : ""} Create curiosity without being too explicit. Use 1-2 emojis.`,
  };

  const systemPrompt = `You are ${personalityName || "a flirty content creator"}. Style: ${personalityStyle || "casual_sexy"}. Language: ${fanLanguage}. Keep responses very short (1-2 sentences max). Sound natural like texting.`;

  try {
    const llmContext: LLMContext = { conversationType: "reactivation" };
    const response = await generateWithClaude(systemPrompt, prompts[bumpType], llmContext);
    return response.content;
  } catch {
    // Fallback to template
    return getRandomTemplate(bumpType, fanLanguage);
  }
}

/**
 * Get bump statistics
 */
export async function getBumpStats(
  creatorSlug: string,
  days: number = 30
): Promise<{
  total: number;
  sent: number;
  cancelled: number;
  failed: number;
  byType: Record<BumpType, number>;
  conversionRate: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const bumps = await prisma.autoBump.findMany({
    where: {
      creatorSlug,
      createdAt: { gte: since },
    },
  });

  const stats = {
    total: bumps.length,
    sent: bumps.filter((b) => b.status === "SENT").length,
    cancelled: bumps.filter((b) => b.status === "CANCELLED").length,
    failed: bumps.filter((b) => b.status === "FAILED").length,
    byType: {
      online_greeting: bumps.filter((b) => b.bumpType === "online_greeting").length,
      dormant_reactivation: bumps.filter((b) => b.bumpType === "dormant_reactivation").length,
      new_content: bumps.filter((b) => b.bumpType === "new_content").length,
    },
    conversionRate: 0,
  };

  // Calculate conversion rate (bumps that led to fan response within 24h)
  const sentBumps = bumps.filter((b) => b.status === "SENT" && b.messageId);
  if (sentBumps.length > 0) {
    let conversions = 0;
    for (const bump of sentBumps) {
      const fanResponse = await prisma.message.findFirst({
        where: {
          conversationId: bump.conversationId,
          senderId: bump.fanUserId,
          createdAt: {
            gte: bump.sentAt!,
            lte: new Date(bump.sentAt!.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });
      if (fanResponse) conversions++;
    }
    stats.conversionRate = conversions / sentBumps.length;
  }

  return stats;
}
