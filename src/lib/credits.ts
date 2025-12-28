/**
 * Credits System Library
 *
 * Handles all credit-related operations:
 * - Adding credits (subscription, purchase, admin grant)
 * - Spending credits (media unlock, PPV, tips)
 * - Expiration management
 * - Balance calculations
 */

import prisma from "./prisma";

// Credit values
export const CREDITS_PER_DOLLAR = 100; // $1 = 100 credits
export const CREDITS_PER_MEDIA = 1000; // 1000 credits = 1 media unlock
export const CREDIT_EXPIRY_DAYS = 6; // Credits expire after 6 days

// Transaction types
export type CreditTransactionType =
  | "SUBSCRIPTION_GRANT"
  | "SUBSCRIPTION"
  | "SUBSCRIPTION_BONUS"
  | "PURCHASE"
  | "MEDIA_UNLOCK"
  | "TIP"
  | "PPV"
  | "EXPIRATION"
  | "ADMIN_GRANT"
  | "RECURRING_GRANT";

/**
 * Get user's current credit balance
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
    description?: string;
    subscriptionId?: string;
    mediaId?: string;
    messageId?: string;
  }
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Calculate expiration date (6 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CREDIT_EXPIRY_DAYS);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });

    const currentBalance = user?.creditBalance ?? 0;
    const newBalance = currentBalance + amount;

    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance },
    });

    // Create transaction record
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        balance: newBalance,
        type,
        description: options?.description,
        subscriptionId: options?.subscriptionId,
        mediaId: options?.mediaId,
        messageId: options?.messageId,
        expiresAt,
      },
    });

    return { newBalance, transactionId: transaction.id };
  });

  return { success: true, ...result };
}

/**
 * Spend credits from a user's account
 */
export async function spendCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options?: {
    description?: string;
    mediaId?: string;
    messageId?: string;
  }
): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });

    const currentBalance = user?.creditBalance ?? 0;

    if (currentBalance < amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = currentBalance - amount;

    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: newBalance },
    });

    // Create transaction record (negative amount for spending)
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        balance: newBalance,
        type,
        description: options?.description,
        mediaId: options?.mediaId,
        messageId: options?.messageId,
      },
    });

    return { newBalance, transactionId: transaction.id };
  });

  return { success: true, ...result };
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= amount;
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
  const now = new Date();

  // Find all users with expired credits
  const expiredTransactions = await prisma.creditTransaction.findMany({
    where: {
      amount: { gt: 0 },
      expiresAt: { lte: now },
      type: { not: "EXPIRATION" }, // Don't process already-expired transactions
    },
    select: {
      userId: true,
      amount: true,
    },
  });

  if (expiredTransactions.length === 0) {
    return { usersAffected: 0, creditsExpired: 0 };
  }

  // Group by user
  const userCredits = new Map<string, number>();
  for (const tx of expiredTransactions) {
    const current = userCredits.get(tx.userId) ?? 0;
    userCredits.set(tx.userId, current + tx.amount);
  }

  let creditsExpired = 0;
  const usersAffected = userCredits.size;

  // Process each user
  for (const [userId, amount] of userCredits) {
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      const currentBalance = user?.creditBalance ?? 0;
      // Don't expire more than they have
      const toExpire = Math.min(amount, currentBalance);

      if (toExpire > 0) {
        const newBalance = currentBalance - toExpire;

        // Update balance
        await tx.user.update({
          where: { id: userId },
          data: { creditBalance: newBalance },
        });

        // Create expiration transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: -toExpire,
            balance: newBalance,
            type: "EXPIRATION",
            description: "Credits expired after 6 days",
          },
        });

        creditsExpired += toExpire;
      }
    });
  }

  // Mark original transactions as processed by updating their expiresAt to past
  await prisma.creditTransaction.updateMany({
    where: {
      amount: { gt: 0 },
      expiresAt: { lte: now },
      type: { not: "EXPIRATION" },
    },
    data: {
      expiresAt: new Date(0), // Set to epoch to mark as processed
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
      // Grant credits
      await addCredits(
        sub.userId,
        sub.plan.recurringCredits,
        "RECURRING_GRANT",
        {
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

  // Grant initial credits
  await addCredits(
    userId,
    plan.initialCredits,
    "SUBSCRIPTION_GRANT",
    {
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
