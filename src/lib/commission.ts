import prisma from "./prisma";

// ============= CONSTANTS =============

export const CREDITS_TO_EUR = 0.01; // 100 credits = 1 EUR
export const DEFAULT_COMMISSION_RATE = 0.05; // 5%
export const FIRST_MONTH_FREE = true;

// ============= TYPES =============

export type EarningType = "MEDIA_UNLOCK" | "TIP" | "PPV" | "SUBSCRIPTION";

export interface CommissionResult {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
}

export interface CommissionSettings {
  firstMonthFree: boolean;
  commissionRate: number;
}

// ============= HELPER FUNCTIONS =============

/**
 * Check if a creator is still in their first month (0% commission period)
 */
export function isFirstMonth(creatorCreatedAt: Date): boolean {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return creatorCreatedAt > oneMonthAgo;
}

/**
 * Convert credits to EUR
 * 100 credits = 1 EUR, so 1000 credits = 10 EUR
 */
export function creditsToEur(credits: number): number {
  return credits * CREDITS_TO_EUR;
}

/**
 * Convert EUR to credits
 */
export function eurToCredits(eur: number): number {
  return Math.round(eur / CREDITS_TO_EUR);
}

/**
 * Calculate commission based on gross amount and creator's age
 */
export function calculateCommission(
  grossAmountEur: number,
  creatorCreatedAt: Date,
  settings?: Partial<CommissionSettings>
): CommissionResult {
  const firstMonthFree = settings?.firstMonthFree ?? FIRST_MONTH_FREE;
  const baseRate = settings?.commissionRate ?? DEFAULT_COMMISSION_RATE;

  // Check if creator is in their first month
  const inFirstMonth = isFirstMonth(creatorCreatedAt);

  // Apply 0% commission if first month and setting is enabled
  const commissionRate = (firstMonthFree && inFirstMonth) ? 0 : baseRate;
  const commissionAmount = grossAmountEur * commissionRate;
  const netAmount = grossAmountEur - commissionAmount;

  return {
    grossAmount: grossAmountEur,
    commissionRate,
    commissionAmount,
    netAmount,
  };
}

// ============= MAIN FUNCTION =============

/**
 * Record a creator earning when credits are spent
 * This should be called after spendCredits() succeeds
 */
export async function recordCreatorEarning(
  creatorSlug: string,
  userId: string,
  creditsSpent: number,
  type: EarningType,
  sourceId?: string
): Promise<{
  earningId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
}> {
  // Get creator and site settings in parallel
  const [creator, settings] = await Promise.all([
    prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: { createdAt: true },
    }),
    prisma.siteSettings.findFirst({
      select: {
        platformCommission: true,
        firstMonthFreeCommission: true,
      },
    }),
  ]);

  if (!creator) {
    throw new Error(`Creator not found: ${creatorSlug}`);
  }

  // Calculate commission
  const grossAmountEur = creditsToEur(creditsSpent);
  const commission = calculateCommission(grossAmountEur, creator.createdAt, {
    firstMonthFree: settings?.firstMonthFreeCommission ?? FIRST_MONTH_FREE,
    commissionRate: settings?.platformCommission ?? DEFAULT_COMMISSION_RATE,
  });

  // Create earning record and update creator balance in a transaction
  const earning = await prisma.$transaction(async (tx) => {
    // Create the earning record
    const newEarning = await tx.creatorEarning.create({
      data: {
        creatorSlug,
        userId,
        type,
        sourceId,
        grossAmount: commission.grossAmount,
        commissionRate: commission.commissionRate,
        commissionAmount: commission.commissionAmount,
        netAmount: commission.netAmount,
        status: "PENDING",
      },
    });

    // Update creator's balance
    await tx.creator.update({
      where: { slug: creatorSlug },
      data: {
        pendingBalance: { increment: commission.netAmount },
        totalEarned: { increment: commission.netAmount },
      },
    });

    return newEarning;
  });

  console.log(
    `[Commission] Recorded earning for ${creatorSlug}: ${commission.grossAmount.toFixed(2)}EUR gross, ` +
    `${(commission.commissionRate * 100).toFixed(0)}% commission, ${commission.netAmount.toFixed(2)}EUR net`
  );

  return {
    earningId: earning.id,
    grossAmount: commission.grossAmount,
    commissionRate: commission.commissionRate,
    commissionAmount: commission.commissionAmount,
    netAmount: commission.netAmount,
  };
}

// ============= QUERY FUNCTIONS =============

/**
 * Get creator's current commission rate
 */
export async function getCreatorCommissionRate(
  creatorSlug: string
): Promise<{ commissionRate: number; isFirstMonth: boolean; firstMonthFree: boolean }> {
  const [creator, settings] = await Promise.all([
    prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: { createdAt: true },
    }),
    prisma.siteSettings.findFirst({
      select: {
        platformCommission: true,
        firstMonthFreeCommission: true,
      },
    }),
  ]);

  if (!creator) {
    throw new Error(`Creator not found: ${creatorSlug}`);
  }

  const inFirstMonth = isFirstMonth(creator.createdAt);
  const firstMonthFree = settings?.firstMonthFreeCommission ?? FIRST_MONTH_FREE;
  const baseRate = settings?.platformCommission ?? DEFAULT_COMMISSION_RATE;

  return {
    commissionRate: (firstMonthFree && inFirstMonth) ? 0 : baseRate,
    isFirstMonth: inFirstMonth,
    firstMonthFree,
  };
}

/**
 * Get creator's earnings summary
 */
export async function getCreatorEarningsSummary(creatorSlug: string) {
  const [creator, earningsCount] = await Promise.all([
    prisma.creator.findUnique({
      where: { slug: creatorSlug },
      select: {
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
        createdAt: true,
      },
    }),
    prisma.creatorEarning.count({
      where: { creatorSlug },
    }),
  ]);

  if (!creator) {
    throw new Error(`Creator not found: ${creatorSlug}`);
  }

  return {
    pendingBalance: creator.pendingBalance,
    totalEarned: creator.totalEarned,
    totalPaid: creator.totalPaid,
    earningsCount,
  };
}

/**
 * Get creator's earnings history with pagination
 */
export async function getCreatorEarnings(
  creatorSlug: string,
  options?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "PAID";
    type?: EarningType;
  }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const offset = (page - 1) * limit;

  const where = {
    creatorSlug,
    ...(options?.status && { status: options.status }),
    ...(options?.type && { type: options.type }),
  };

  const [earnings, total] = await Promise.all([
    prisma.creatorEarning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.creatorEarning.count({ where }),
  ]);

  return { earnings, total };
}
