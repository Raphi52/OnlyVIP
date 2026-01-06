/**
 * Chatter AI Billing System
 *
 * Handles billing logic for AI suggestions:
 * - FREE if agency/creator uses their own API key
 * - 1 credit per suggestion if using platform key
 *
 * Credits are only charged when suggestion is SENT, not generated
 */

import prisma from "@/lib/prisma";
import { getCreditBalances, chargeAiChatCredit } from "@/lib/credits";

export interface BillingStatus {
  shouldCharge: boolean;
  hasCustomKey: boolean;
  balance: number;
  chargeableUserId: string | null;
  costPerSuggestion: number;
}

/**
 * Check if AI suggestions should be charged for a creator
 * Returns billing status including whether custom API key is being used
 */
export async function shouldChargeForAi(
  creatorSlug: string
): Promise<BillingStatus> {
  // Get creator with agency info
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: {
      userId: true,
      aiUseCustomKey: true,
      aiApiKey: true,
      agencyId: true,
      agency: {
        select: {
          ownerId: true,
          aiUseCustomKey: true,
          aiApiKey: true,
        },
      },
    },
  });

  if (!creator) {
    return {
      shouldCharge: true,
      hasCustomKey: false,
      balance: 0,
      chargeableUserId: null,
      costPerSuggestion: 1,
    };
  }

  // Check for custom API key - creator level first, then agency level
  const creatorHasKey = creator.aiUseCustomKey && !!creator.aiApiKey;
  const agencyHasKey =
    creator.agency?.aiUseCustomKey && !!creator.agency?.aiApiKey;

  if (creatorHasKey || agencyHasKey) {
    return {
      shouldCharge: false,
      hasCustomKey: true,
      balance: 0, // Not relevant when using custom key
      chargeableUserId: null,
      costPerSuggestion: 0,
    };
  }

  // No custom key - will charge credits
  // Determine who to charge: agency owner or creator
  const chargeableUserId = creator.agency?.ownerId || creator.userId;

  if (!chargeableUserId) {
    return {
      shouldCharge: true,
      hasCustomKey: false,
      balance: 0,
      chargeableUserId: null,
      costPerSuggestion: 1,
    };
  }

  // Get balance
  const balances = await getCreditBalances(chargeableUserId);

  return {
    shouldCharge: true,
    hasCustomKey: false,
    balance: balances.paid, // Only paid credits can be used for AI
    chargeableUserId,
    costPerSuggestion: 1,
  };
}

/**
 * Check if there are enough credits for AI suggestion
 */
export async function hasCreditsForAi(
  creatorSlug: string
): Promise<{
  hasCredits: boolean;
  billing: BillingStatus;
}> {
  const billing = await shouldChargeForAi(creatorSlug);

  // Free if using custom key
  if (!billing.shouldCharge) {
    return { hasCredits: true, billing };
  }

  // Check balance
  return {
    hasCredits: billing.balance >= billing.costPerSuggestion,
    billing,
  };
}

/**
 * Charge for an AI suggestion that was USED (sent)
 * Only call this when the chatter actually sends the suggestion
 */
export async function chargeAiSuggestion(
  creatorSlug: string,
  options: {
    chatterId: string;
    suggestionId: string;
    conversationId: string;
  }
): Promise<{
  success: boolean;
  charged: boolean;
  newBalance?: number;
  error?: string;
}> {
  const billing = await shouldChargeForAi(creatorSlug);

  // No charge if using custom API key
  if (!billing.shouldCharge) {
    return { success: true, charged: false };
  }

  // Check balance before charging
  if (billing.balance < billing.costPerSuggestion) {
    return {
      success: false,
      charged: false,
      error: "Insufficient credits",
    };
  }

  // Use existing chargeAiChatCredit function
  const result = await chargeAiChatCredit(creatorSlug, {
    conversationId: options.conversationId,
  });

  if (!result.success) {
    return {
      success: false,
      charged: false,
      error: result.error || "Failed to charge credits",
    };
  }

  // Log the usage for analytics
  await prisma.aiSuggestion.update({
    where: { id: options.suggestionId },
    data: {
      chargedCredits: 1,
      chargedAt: new Date(),
    },
  }).catch(() => {
    // Ignore if suggestion doesn't exist or doesn't have these fields
  });

  return {
    success: true,
    charged: true,
    newBalance: result.newBalance,
  };
}

/**
 * Get billing summary for a chatter across all their assigned creators
 */
export async function getChatterBillingSummary(
  chatterId: string
): Promise<{
  creators: Array<{
    creatorSlug: string;
    creatorName: string;
    hasCustomKey: boolean;
    balance: number;
  }>;
  totalBalance: number;
  hasAnyCustomKey: boolean;
}> {
  // Get all creators assigned to this chatter
  const assignments = await prisma.chatterCreatorAssignment.findMany({
    where: { chatterId },
    include: {
      creator: {
        select: {
          slug: true,
          displayName: true,
          aiUseCustomKey: true,
          aiApiKey: true,
          agency: {
            select: {
              ownerId: true,
              aiUseCustomKey: true,
              aiApiKey: true,
            },
          },
        },
      },
    },
  });

  const creators = await Promise.all(
    assignments.map(async (a) => {
      const billing = await shouldChargeForAi(a.creatorSlug);
      return {
        creatorSlug: a.creatorSlug,
        creatorName: a.creator.displayName || a.creatorSlug,
        hasCustomKey: billing.hasCustomKey,
        balance: billing.balance,
      };
    })
  );

  return {
    creators,
    totalBalance: Math.max(...creators.map((c) => c.balance), 0),
    hasAnyCustomKey: creators.some((c) => c.hasCustomKey),
  };
}

/**
 * Track AI suggestion usage for analytics
 */
export async function trackAiSuggestionUsage(
  chatterId: string,
  creatorSlug: string,
  action: "generated" | "sent" | "edited" | "rejected" | "expired"
): Promise<void> {
  // Update chatter stats
  await prisma.chatter.update({
    where: { id: chatterId },
    data: {
      ...(action === "generated" && {
        // Could track generation count if needed
      }),
      ...(action === "sent" && {
        // Could track sent count if needed
      }),
    },
  }).catch(() => {
    // Ignore errors if fields don't exist
  });
}
