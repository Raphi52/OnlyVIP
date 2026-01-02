/**
 * Credits System Library
 *
 * Handles all credit-related operations:
 * - Adding credits (subscription, purchase, admin grant)
 * - Spending credits (media unlock, PPV, tips)
 * - Expiration management
 * - Balance calculations
 *
 * CREDIT TYPES:
 * - PAID: Credits from purchases, usable everywhere, generate creator earnings
 * - BONUS: Free credits from bonuses, only usable for PPV catalog, NO creator earnings
 */

import prisma from "./prisma";

// Credit values
export const CREDITS_PER_DOLLAR = 100; // $1 = 100 credits
export const CREDITS_PER_MEDIA = 1000; // 1000 credits = 1 media unlock
export const CREDIT_EXPIRY_DAYS = 0; // 0 = Credits never expire

// Credit types
export type CreditType = "PAID" | "BONUS";

// Transaction types
export type CreditTransactionType =
  | "SUBSCRIPTION_GRANT"
  | "SUBSCRIPTION"
  | "SUBSCRIPTION_BONUS"
  | "PURCHASE"
  | "PURCHASE_BONUS"
  | "MEDIA_UNLOCK"
  | "TIP"
  | "PPV"
  | "EXPIRATION"
  | "ADMIN_GRANT"
  | "RECURRING_GRANT"
  | "AI_CHAT"; // Coût par réponse AI (débité à l'agence/créateur)

/**
 * Get user's credit balances (paid and bonus separately)
 */
export async function getCreditBalances(userId: string): Promise<{
  paid: number;
  bonus: number;
  total: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { paidCredits: true, bonusCredits: true, creditBalance: true },
  });
  return {
    paid: user?.paidCredits ?? 0,
    bonus: user?.bonusCredits ?? 0,
    total: user?.creditBalance ?? 0,
  };
}

/**
 * Get user's current credit balance (total)
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

/**
 * Add credits to a user's account
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options?: {
    creditType?: CreditType; // "PAID" (default) or "BONUS"
    description?: string;
    subscriptionId?: string;
    mediaId?: string;
    messageId?: string;
  }
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const creditType = options?.creditType ?? "PAID";

  // Calculate expiration date (null if expiry disabled)
  const expiresAt = CREDIT_EXPIRY_DAYS > 0
    ? new Date(Date.now() + CREDIT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    : null;

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get current balances
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, paidCredits: true, bonusCredits: true },
    });

    const currentTotal = user?.creditBalance ?? 0;
    const currentPaid = user?.paidCredits ?? 0;
    const currentBonus = user?.bonusCredits ?? 0;

    const newTotal = currentTotal + amount;
    const newPaid = creditType === "PAID" ? currentPaid + amount : currentPaid;
    const newBonus = creditType === "BONUS" ? currentBonus + amount : currentBonus;

    // Update user balances
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newTotal,
        paidCredits: newPaid,
        bonusCredits: newBonus,
      },
    });

    // Create transaction record
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        balance: newTotal,
        type,
        creditType,
        description: options?.description,
        subscriptionId: options?.subscriptionId,
        mediaId: options?.mediaId,
        messageId: options?.messageId,
        expiresAt,
      },
    });

    return { newBalance: newTotal, transactionId: transaction.id };
  });

  return { success: true, ...result };
}

/**
 * Spend credits from a user's account
 *
 * @param allowBonus - If true, bonus credits can be used (for PPV catalog media)
 *                     If false, only paid credits can be used (for chat, tips, PPV messages)
 */
export async function spendCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options?: {
    allowBonus?: boolean; // If true, can use bonus credits (bonus first, then paid)
    description?: string;
    mediaId?: string;
    messageId?: string;
  }
): Promise<{
  success: boolean;
  newBalance: number;
  paidSpent: number;
  bonusSpent: number;
  transactionId: string;
}> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const allowBonus = options?.allowBonus ?? false;

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get current balances
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, paidCredits: true, bonusCredits: true },
    });

    const currentTotal = user?.creditBalance ?? 0;
    const currentPaid = user?.paidCredits ?? 0;
    const currentBonus = user?.bonusCredits ?? 0;

    let paidSpent = 0;
    let bonusSpent = 0;

    if (allowBonus) {
      // PPV Catalog: Use bonus first, then paid
      bonusSpent = Math.min(amount, currentBonus);
      paidSpent = amount - bonusSpent;

      // Check if we have enough total
      if (currentPaid < paidSpent) {
        throw new Error("Insufficient credits");
      }
    } else {
      // Chat, Tips, PPV Messages: Paid only
      paidSpent = amount;
      bonusSpent = 0;

      if (currentPaid < paidSpent) {
        throw new Error("Insufficient paid credits");
      }
    }

    const newTotal = currentTotal - amount;
    const newPaid = currentPaid - paidSpent;
    const newBonus = currentBonus - bonusSpent;

    // Update user balances
    await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newTotal,
        paidCredits: newPaid,
        bonusCredits: newBonus,
      },
    });

    // Create transaction record(s)
    // If both paid and bonus were spent, create two transactions
    let transactionId = "";

    if (paidSpent > 0) {
      const paidTx = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -paidSpent,
          balance: newTotal + bonusSpent, // Balance after paid deduction
          type,
          creditType: "PAID",
          description: options?.description,
          mediaId: options?.mediaId,
          messageId: options?.messageId,
        },
      });
      transactionId = paidTx.id;
    }

    if (bonusSpent > 0) {
      const bonusTx = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -bonusSpent,
          balance: newTotal,
          type,
          creditType: "BONUS",
          description: options?.description ? `${options.description} (bonus)` : "Bonus credits",
          mediaId: options?.mediaId,
          messageId: options?.messageId,
        },
      });
      if (!transactionId) transactionId = bonusTx.id;
    }

    return { newBalance: newTotal, paidSpent, bonusSpent, transactionId };
  });

  return { success: true, ...result };
}

/**
 * Check if user has enough credits
 * @param paidOnly - If true, only check paid credits
 */
export async function hasEnoughCredits(
  userId: string,
  amount: number,
  paidOnly: boolean = false
): Promise<boolean> {
  const balances = await getCreditBalances(userId);
  if (paidOnly) {
    return balances.paid >= amount;
  }
  return balances.total >= amount;
}

/**
 * Get user's credit transactions
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get the next credit expiration for a user
 */
export async function getNextExpiration(
  userId: string
): Promise<Date | null> {
  // Return null if expiry is disabled
  if (CREDIT_EXPIRY_DAYS === 0) {
    return null;
  }

  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      amount: { gt: 0 },
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
    select: { expiresAt: true },
  });
  return transaction?.expiresAt ?? null;
}

/**
 * Expire old credits for all users
 * Should be called by a cron job daily
 */
export async function expireCredits(): Promise<{
  usersAffected: number;
  creditsExpired: number;
}> {
  // Skip if expiry is disabled
  if (CREDIT_EXPIRY_DAYS === 0) {
    return { usersAffected: 0, creditsExpired: 0 };
  }

  const now = new Date();

  // Find all users with expired credits, grouped by credit type
  const expiredTransactions = await prisma.creditTransaction.findMany({
    where: {
      amount: { gt: 0 },
      expiresAt: { lte: now },
      type: { not: "EXPIRATION" },
    },
    select: {
      userId: true,
      amount: true,
      creditType: true,
    },
  });

  if (expiredTransactions.length === 0) {
    return { usersAffected: 0, creditsExpired: 0 };
  }

  // Group by user and credit type
  const userCredits = new Map<string, { paid: number; bonus: number }>();
  for (const tx of expiredTransactions) {
    const current = userCredits.get(tx.userId) ?? { paid: 0, bonus: 0 };
    if (tx.creditType === "BONUS") {
      current.bonus += tx.amount;
    } else {
      current.paid += tx.amount;
    }
    userCredits.set(tx.userId, current);
  }

  let creditsExpired = 0;
  const usersAffected = userCredits.size;

  // Process each user
  for (const [userId, amounts] of userCredits) {
    await prisma.$transaction(async (tx) => {
      // Get current balances
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true, paidCredits: true, bonusCredits: true },
      });

      const currentTotal = user?.creditBalance ?? 0;
      const currentPaid = user?.paidCredits ?? 0;
      const currentBonus = user?.bonusCredits ?? 0;

      // Don't expire more than they have
      const paidToExpire = Math.min(amounts.paid, currentPaid);
      const bonusToExpire = Math.min(amounts.bonus, currentBonus);
      const totalToExpire = paidToExpire + bonusToExpire;

      if (totalToExpire > 0) {
        const newTotal = currentTotal - totalToExpire;
        const newPaid = currentPaid - paidToExpire;
        const newBonus = currentBonus - bonusToExpire;

        // Update balances
        await tx.user.update({
          where: { id: userId },
          data: {
            creditBalance: newTotal,
            paidCredits: newPaid,
            bonusCredits: newBonus,
          },
        });

        // Create expiration transactions
        if (paidToExpire > 0) {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -paidToExpire,
              balance: newTotal + bonusToExpire,
              type: "EXPIRATION",
              creditType: "PAID",
              description: "Paid credits expired after 6 days",
            },
          });
        }

        if (bonusToExpire > 0) {
          await tx.creditTransaction.create({
            data: {
              userId,
              amount: -bonusToExpire,
              balance: newTotal,
              type: "EXPIRATION",
              creditType: "BONUS",
              description: "Bonus credits expired after 6 days",
            },
          });
        }

        creditsExpired += totalToExpire;
      }
    });
  }

  // Mark original transactions as processed
  await prisma.creditTransaction.updateMany({
    where: {
      amount: { gt: 0 },
      expiresAt: { lte: now },
      type: { not: "EXPIRATION" },
    },
    data: {
      expiresAt: new Date(0),
    },
  });

  return { usersAffected, creditsExpired };
}

/**
 * Grant recurring credits to VIP subscribers
 * Should be called by a cron job daily
 */
export async function grantRecurringCredits(): Promise<{
  usersGranted: number;
  creditsGranted: number;
}> {
  const now = new Date();

  // Find all active VIP subscriptions that are due for credits
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: {
        recurringCredits: { gt: 0 },
      },
      OR: [
        { nextCreditGrant: null },
        { nextCreditGrant: { lte: now } },
      ],
    },
    include: {
      plan: {
        select: {
          recurringCredits: true,
          creditIntervalDays: true,
        },
      },
    },
  });

  let usersGranted = 0;
  let creditsGranted = 0;

  for (const sub of subscriptions) {
    try {
      // Grant credits as PAID (recurring subscription credits are paid)
      await addCredits(
        sub.userId,
        sub.plan.recurringCredits,
        "RECURRING_GRANT",
        {
          creditType: "PAID",
          description: `Recurring VIP credits (${sub.plan.recurringCredits} credits)`,
          subscriptionId: sub.id,
        }
      );

      // Calculate next grant date
      const nextGrant = new Date();
      nextGrant.setDate(nextGrant.getDate() + sub.plan.creditIntervalDays);

      // Update subscription
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          lastCreditGrant: now,
          nextCreditGrant: nextGrant,
        },
      });

      usersGranted++;
      creditsGranted += sub.plan.recurringCredits;
    } catch (error) {
      console.error(`Failed to grant credits to subscription ${sub.id}:`, error);
    }
  }

  return { usersGranted, creditsGranted };
}

/**
 * Grant initial credits when a subscription is created
 */
export async function grantSubscriptionCredits(
  userId: string,
  subscriptionId: string,
  planId: string
): Promise<{ creditsGranted: number }> {
  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      initialCredits: true,
      recurringCredits: true,
      creditIntervalDays: true,
    },
  });

  if (!plan || plan.initialCredits === 0) {
    return { creditsGranted: 0 };
  }

  // Grant initial credits as PAID
  await addCredits(
    userId,
    plan.initialCredits,
    "SUBSCRIPTION_GRANT",
    {
      creditType: "PAID",
      description: `Subscription credits (${plan.initialCredits} credits)`,
      subscriptionId,
    }
  );

  // Set next credit grant date if recurring
  if (plan.recurringCredits > 0) {
    const nextGrant = new Date();
    nextGrant.setDate(nextGrant.getDate() + plan.creditIntervalDays);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        lastCreditGrant: new Date(),
        nextCreditGrant: nextGrant,
      },
    });
  }

  return { creditsGranted: plan.initialCredits };
}

/**
 * Charge creator/agency for AI chat response
 * Returns the userId that was charged (agency owner if agency, else creator)
 */
export async function chargeAiChatCredit(
  creatorSlug: string,
  options?: {
    messageId?: string;
    conversationId?: string;
  }
): Promise<{
  success: boolean;
  charged: boolean;
  chargedUserId?: string;
  newBalance?: number;
  error?: string;
}> {
  // Get creator and their agency
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: {
      userId: true,
      agencyId: true,
      agency: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!creator) {
    return { success: false, charged: false, error: "Creator not found" };
  }

  // Determine who to charge: agency owner if agency exists, else creator
  const userIdToCharge = creator.agency?.ownerId || creator.userId;

  if (!userIdToCharge) {
    return { success: false, charged: false, error: "No user to charge" };
  }

  // Check balance
  const balances = await getCreditBalances(userIdToCharge);

  if (balances.paid < 1) {
    // Not enough credits - AI response will not be sent
    return {
      success: true,
      charged: false,
      chargedUserId: userIdToCharge,
      error: "Insufficient credits for AI response",
    };
  }

  try {
    // Spend 1 credit (paid only, no bonus for AI)
    const result = await spendCredits(
      userIdToCharge,
      1,
      "AI_CHAT",
      {
        allowBonus: false,
        description: `AI response for ${creatorSlug}`,
        messageId: options?.messageId,
      }
    );

    return {
      success: true,
      charged: true,
      chargedUserId: userIdToCharge,
      newBalance: result.newBalance,
    };
  } catch (error) {
    return {
      success: false,
      charged: false,
      chargedUserId: userIdToCharge,
      error: error instanceof Error ? error.message : "Failed to charge credit",
    };
  }
}

/**
 * Check if creator/agency has credits for AI chat
 */
export async function hasAiChatCredits(creatorSlug: string): Promise<{
  hasCredits: boolean;
  balance: number;
  chargedUserId?: string;
}> {
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
    select: {
      userId: true,
      agencyId: true,
      agency: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!creator) {
    return { hasCredits: false, balance: 0 };
  }

  const userIdToCharge = creator.agency?.ownerId || creator.userId;

  if (!userIdToCharge) {
    return { hasCredits: false, balance: 0 };
  }

  const balances = await getCreditBalances(userIdToCharge);

  return {
    hasCredits: balances.paid >= 1,
    balance: balances.paid,
    chargedUserId: userIdToCharge,
  };
}

/**
 * Convert dollar amount to credits
 */
export function dollarsToCredits(dollars: number): number {
  return Math.floor(dollars * CREDITS_PER_DOLLAR);
}

/**
 * Convert credits to dollar amount
 */
export function creditsToDollars(credits: number): number {
  return credits / CREDITS_PER_DOLLAR;
}
