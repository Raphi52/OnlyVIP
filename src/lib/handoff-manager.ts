/**
 * Handoff Manager - Automatic AI to Human Chatter Transition
 *
 * Triggers handoff when:
 * 1. Fan spending exceeds threshold (e.g., $40)
 * 2. High-intent keywords detected
 * 3. Fan upgraded to qualified tier
 * 4. Manual request
 */

import { prisma } from "@/lib/prisma";
import { triggerNewMessage } from "@/lib/pusher";

// Types
export type HandoffTrigger =
  | "spending_threshold"
  | "high_intent"
  | "quality_upgrade"
  | "manual";

export interface HandoffConfig {
  spendThreshold: number; // Default $40
  highIntentKeywords: string[];
  autoAssign: boolean; // Auto-assign to available chatter
  expirationHours: number; // Handoff expires if not accepted
}

// Default high-intent keywords (multi-language)
const HIGH_INTENT_KEYWORDS = {
  en: [
    "buy",
    "purchase",
    "how much",
    "price",
    "unlock",
    "send me",
    "show me",
    "want to see",
    "credit card",
    "pay",
    "subscribe",
    "vip",
  ],
  fr: [
    "acheter",
    "combien",
    "prix",
    "débloquer",
    "envoie-moi",
    "montre-moi",
    "je veux voir",
    "carte bancaire",
    "payer",
    "abonnement",
    "vip",
  ],
  es: [
    "comprar",
    "cuánto",
    "precio",
    "desbloquear",
    "envíame",
    "muéstrame",
    "quiero ver",
    "tarjeta",
    "pagar",
    "suscripción",
    "vip",
  ],
};

/**
 * Check if a message contains high-intent keywords
 */
export function detectHighIntent(
  message: string,
  language: string = "en"
): { isHighIntent: boolean; matchedKeywords: string[] } {
  const keywords = HIGH_INTENT_KEYWORDS[language as keyof typeof HIGH_INTENT_KEYWORDS] ||
    HIGH_INTENT_KEYWORDS.en;

  const lowerMessage = message.toLowerCase();
  const matchedKeywords = keywords.filter((kw) => lowerMessage.includes(kw));

  return {
    isHighIntent: matchedKeywords.length >= 1,
    matchedKeywords,
  };
}

/**
 * Check if fan should trigger spending-based handoff
 */
export async function checkSpendingThreshold(
  fanUserId: string,
  creatorSlug: string,
  threshold: number = 40
): Promise<{ shouldHandoff: boolean; totalSpent: number }> {
  // Get fan's total spending for this creator
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  const totalSpent = fanProfile?.totalSpent || 0;

  // Check if threshold is crossed and not already handled
  const existingHandoff = await prisma.conversationHandoff.findFirst({
    where: {
      triggerType: "spending_threshold",
      triggerValue: { contains: fanUserId },
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  return {
    shouldHandoff: totalSpent >= threshold && !existingHandoff,
    totalSpent,
  };
}

/**
 * Create a handoff request
 */
export async function createHandoff(
  conversationId: string,
  trigger: HandoffTrigger,
  triggerValue?: string,
  options: {
    fromAiPersonalityId?: string;
    notes?: string;
    autoAssign?: boolean;
  } = {}
): Promise<string | null> {
  // Check if there's already an active handoff for this conversation
  const existingHandoff = await prisma.conversationHandoff.findFirst({
    where: {
      conversationId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  if (existingHandoff) {
    console.log(`Handoff already exists for conversation ${conversationId}`);
    return existingHandoff.id;
  }

  // Get conversation details
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      aiPersonality: true,
    },
  });

  if (!conversation) {
    console.error(`Conversation ${conversationId} not found`);
    return null;
  }

  // Find available chatter if auto-assign is enabled
  let toChatterId: string | undefined;

  if (options.autoAssign !== false) {
    const availableChatter = await findAvailableChatter(conversation.creatorSlug);
    if (availableChatter) {
      toChatterId = availableChatter.id;
    }
  }

  // Calculate expiration (24 hours by default)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create the handoff
  const handoff = await prisma.conversationHandoff.create({
    data: {
      conversationId,
      triggerType: trigger,
      triggerValue,
      fromAiPersonalityId: options.fromAiPersonalityId || conversation.aiPersonalityId,
      toChatterId,
      status: toChatterId ? "AUTO_ASSIGNED" : "PENDING",
      expiresAt,
      notes: options.notes,
      notifiedAt: new Date(),
    },
  });

  // If auto-assigned, update conversation
  if (toChatterId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiMode: "assisted", // Switch to assisted mode
        assignedChatterId: toChatterId,
      },
    });
  }

  // Notify chatters via Pusher
  await notifyHandoff(handoff.id, conversation.creatorSlug);

  return handoff.id;
}

/**
 * Find an available chatter for a creator
 */
async function findAvailableChatter(
  creatorSlug: string
): Promise<{ id: string; name: string } | null> {
  // Find chatters assigned to this creator who are currently active
  const assignments = await prisma.chatterCreatorAssignment.findMany({
    where: {
      creatorSlug,
      chatter: {
        isActive: true,
      },
    },
    include: {
      chatter: true,
    },
  });

  if (assignments.length === 0) return null;

  // Sort by current workload (least conversations assigned)
  const chatterWorkloads = await Promise.all(
    assignments.map(async (a) => {
      const activeConversations = await prisma.conversation.count({
        where: {
          assignedChatterId: a.chatterId,
          aiMode: "assisted",
        },
      });
      return {
        chatter: a.chatter,
        workload: activeConversations,
      };
    })
  );

  // Pick the one with least workload
  chatterWorkloads.sort((a, b) => a.workload - b.workload);

  const selected = chatterWorkloads[0];
  return selected ? { id: selected.chatter.id, name: selected.chatter.name } : null;
}

/**
 * Notify chatters about a new handoff
 */
async function notifyHandoff(handoffId: string, creatorSlug: string): Promise<void> {
  // Get all chatters for this creator
  const assignments = await prisma.chatterCreatorAssignment.findMany({
    where: { creatorSlug },
    include: { chatter: true },
  });

  // Trigger Pusher notification for each chatter
  for (const assignment of assignments) {
    // Note: Implement Pusher channel for chatter notifications
    // await pusher.trigger(`chatter-${assignment.chatterId}`, 'new-handoff', { handoffId });
  }
}

/**
 * Accept a handoff request
 */
export async function acceptHandoff(
  handoffId: string,
  chatterId: string
): Promise<boolean> {
  const handoff = await prisma.conversationHandoff.findUnique({
    where: { id: handoffId },
  });

  if (!handoff || handoff.status !== "PENDING") {
    return false;
  }

  // Update handoff
  await prisma.conversationHandoff.update({
    where: { id: handoffId },
    data: {
      toChatterId: chatterId,
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });

  // Update conversation
  await prisma.conversation.update({
    where: { id: handoff.conversationId },
    data: {
      aiMode: "assisted",
      assignedChatterId: chatterId,
    },
  });

  return true;
}

/**
 * Decline a handoff request
 */
export async function declineHandoff(
  handoffId: string,
  chatterId: string
): Promise<boolean> {
  const handoff = await prisma.conversationHandoff.findUnique({
    where: { id: handoffId },
  });

  if (!handoff) return false;

  // Only can decline if assigned to this chatter
  if (handoff.toChatterId && handoff.toChatterId !== chatterId) {
    return false;
  }

  await prisma.conversationHandoff.update({
    where: { id: handoffId },
    data: {
      status: "DECLINED",
      respondedAt: new Date(),
    },
  });

  // Try to find another chatter
  const conversation = await prisma.conversation.findUnique({
    where: { id: handoff.conversationId },
  });

  if (conversation) {
    const nextChatter = await findAvailableChatter(conversation.creatorSlug);
    if (nextChatter && nextChatter.id !== chatterId) {
      // Create new handoff for next chatter
      await createHandoff(
        handoff.conversationId,
        handoff.triggerType as HandoffTrigger,
        handoff.triggerValue || undefined,
        {
          fromAiPersonalityId: handoff.fromAiPersonalityId || undefined,
          notes: `Reassigned after decline by ${chatterId}`,
        }
      );
    }
  }

  return true;
}

/**
 * Check if a conversation should be handed off
 * Called during AI response processing
 */
export async function shouldHandoff(
  conversationId: string,
  fanMessage: string
): Promise<{
  shouldHandoff: boolean;
  trigger?: HandoffTrigger;
  triggerValue?: string;
}> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
      aiPersonality: true,
    },
  });

  if (!conversation || conversation.aiMode !== "auto") {
    return { shouldHandoff: false };
  }

  // Get AI personality settings
  const personality = conversation.aiPersonality;
  if (!personality || !personality.autoHandoffEnabled) {
    return { shouldHandoff: false };
  }

  // Find the fan participant
  const fanParticipant = conversation.participants.find(
    (p) => p.userId !== conversation.creatorSlug
  );
  if (!fanParticipant) {
    return { shouldHandoff: false };
  }

  // Check spending threshold
  const spendingCheck = await checkSpendingThreshold(
    fanParticipant.userId,
    conversation.creatorSlug,
    personality.handoffSpendThreshold
  );

  if (spendingCheck.shouldHandoff) {
    return {
      shouldHandoff: true,
      trigger: "spending_threshold",
      triggerValue: `spent:${spendingCheck.totalSpent.toFixed(2)}`,
    };
  }

  // Check high-intent keywords
  if (personality.handoffOnHighIntent) {
    const fanProfile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: {
          fanUserId: fanParticipant.userId,
          creatorSlug: conversation.creatorSlug,
        },
      },
    });

    const intentCheck = detectHighIntent(fanMessage, fanProfile?.language || "en");

    if (intentCheck.isHighIntent) {
      return {
        shouldHandoff: true,
        trigger: "high_intent",
        triggerValue: `keywords:${intentCheck.matchedKeywords.join(",")}`,
      };
    }
  }

  return { shouldHandoff: false };
}

/**
 * Get pending handoffs for a chatter
 */
export async function getPendingHandoffs(
  chatterId: string
): Promise<
  Array<{
    id: string;
    conversationId: string;
    trigger: string;
    createdAt: Date;
    fanName?: string;
    totalSpent?: number;
  }>
> {
  // Get creator slugs this chatter is assigned to
  const assignments = await prisma.chatterCreatorAssignment.findMany({
    where: { chatterId },
  });

  const creatorSlugs = assignments.map((a) => a.creatorSlug);

  // Get pending handoffs for these creators
  const handoffs = await prisma.conversationHandoff.findMany({
    where: {
      status: "PENDING",
      OR: [
        { toChatterId: chatterId }, // Directly assigned
        {
          toChatterId: null,
          // Handoff for a creator this chatter manages
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by creator slugs and enrich with data
  const enrichedHandoffs = await Promise.all(
    handoffs.map(async (h) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: h.conversationId },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!conversation || !creatorSlugs.includes(conversation.creatorSlug)) {
        return null;
      }

      const fan = conversation.participants.find(
        (p) => p.userId !== conversation.creatorSlug
      );

      const fanProfile = fan
        ? await prisma.fanProfile.findUnique({
            where: {
              fanUserId_creatorSlug: {
                fanUserId: fan.userId,
                creatorSlug: conversation.creatorSlug,
              },
            },
          })
        : null;

      return {
        id: h.id,
        conversationId: h.conversationId,
        trigger: h.triggerType,
        createdAt: h.createdAt,
        fanName: fan?.user.name || undefined,
        totalSpent: fanProfile?.totalSpent || 0,
      };
    })
  );

  return enrichedHandoffs.filter((h): h is NonNullable<typeof h> => h !== null);
}

/**
 * Expire old pending handoffs
 * Call from cron job
 */
export async function expireOldHandoffs(): Promise<number> {
  const now = new Date();

  const result = await prisma.conversationHandoff.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}

/**
 * Get handoff statistics
 */
export async function getHandoffStats(
  creatorSlug: string,
  days: number = 30
): Promise<{
  total: number;
  accepted: number;
  declined: number;
  expired: number;
  avgResponseTime: number;
  byTrigger: Record<HandoffTrigger, number>;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const conversations = await prisma.conversation.findMany({
    where: { creatorSlug },
    select: { id: true },
  });

  const conversationIds = conversations.map((c) => c.id);

  const handoffs = await prisma.conversationHandoff.findMany({
    where: {
      conversationId: { in: conversationIds },
      createdAt: { gte: since },
    },
  });

  const accepted = handoffs.filter((h) => h.status === "ACCEPTED" || h.status === "AUTO_ASSIGNED");

  // Calculate average response time
  let totalResponseTime = 0;
  let responseCount = 0;

  for (const h of accepted) {
    if (h.respondedAt && h.notifiedAt) {
      totalResponseTime += h.respondedAt.getTime() - h.notifiedAt.getTime();
      responseCount++;
    }
  }

  return {
    total: handoffs.length,
    accepted: accepted.length,
    declined: handoffs.filter((h) => h.status === "DECLINED").length,
    expired: handoffs.filter((h) => h.status === "EXPIRED").length,
    avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0, // seconds
    byTrigger: {
      spending_threshold: handoffs.filter((h) => h.triggerType === "spending_threshold").length,
      high_intent: handoffs.filter((h) => h.triggerType === "high_intent").length,
      quality_upgrade: handoffs.filter((h) => h.triggerType === "quality_upgrade").length,
      manual: handoffs.filter((h) => h.triggerType === "manual").length,
    },
  };
}
