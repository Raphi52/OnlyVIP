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
 *
 * IMPORTANT: Only pass PAID credits spent, NOT bonus credits!
 * Bonus credits do not generate creator earnings.
 *
 * @param paidCreditsSpent - Only the PAID credits portion that was spent
 */
export async function recordCreatorEarning(
  creatorSlug: string,
  userId: string,
  paidCreditsSpent: number,
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

  // Skip if no paid credits were spent (only bonus used)
  if (paidCreditsSpent <= 0) {
    console.log(`[Commission] No paid credits spent for ${creatorSlug}, skipping earning record`);
    return {
      earningId: "",
      grossAmount: 0,
      commissionRate: 0,
      commissionAmount: 0,
      netAmount: 0,
    };
  }

  // Calculate commission based on PAID credits only
  const grossAmountEur = creditsToEur(paidCreditsSpent);
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

// ============= EARNING DISTRIBUTION =============

export interface EarningDistributionParams {
  creatorSlug: string;
  userId: string;
  paidCreditsSpent: number;
  type: EarningType;
  sourceId?: string;
  chatterId?: string | null;
  aiPersonalityId?: string | null;
  attributedMessageId?: string | null;
}

export interface EarningDistributionResult {
  creatorEarningId: string;
  platformAmount: number;
  creatorAmount: number;
  agencyAmount: number;
  chatterAmount: number;
  agencyEarningId?: string;
  chatterEarningId?: string;
}

/**
 * Record earnings with full distribution to creator, agency, and chatter
 *
 * Flow:
 * 1. Platform takes 5% commission
 * 2. If creator has agency: split based on ModelListing.revenueShare (default 70/30)
 * 3. If chatter attributed (non-subscription): chatter takes commission from agency's share
 *
 * @param params - Distribution parameters
 */
export async function recordEarningDistribution(
  params: EarningDistributionParams
): Promise<EarningDistributionResult> {
  const {
    creatorSlug,
    userId,
    paidCreditsSpent,
    type,
    sourceId,
    chatterId,
    aiPersonalityId,
    attributedMessageId,
  } = params;

  // Skip if no paid credits were spent
  if (paidCreditsSpent <= 0) {
    console.log(`[Commission] No paid credits spent for ${creatorSlug}, skipping earning record`);
    return {
      creatorEarningId: "",
      platformAmount: 0,
      creatorAmount: 0,
      agencyAmount: 0,
      chatterAmount: 0,
    };
  }

  // Convert credits to EUR
  const grossAmountEur = creditsToEur(paidCreditsSpent);

  // Get creator with agency and model listing
  const [creator, settings, chatter] = await Promise.all([
    prisma.creator.findUnique({
      where: { slug: creatorSlug },
      include: {
        agency: true,
        modelListing: true,
      },
    }),
    prisma.siteSettings.findFirst({
      select: {
        platformCommission: true,
        firstMonthFreeCommission: true,
      },
    }),
    chatterId ? prisma.chatter.findUnique({
      where: { id: chatterId },
      select: {
        id: true,
        commissionEnabled: true,
        commissionRate: true,
      },
    }) : null,
  ]);

  if (!creator) {
    throw new Error(`Creator not found: ${creatorSlug}`);
  }

  // Calculate platform commission (may be 0% first month)
  const inFirstMonth = isFirstMonth(creator.createdAt);
  const firstMonthFree = settings?.firstMonthFreeCommission ?? FIRST_MONTH_FREE;
  const platformRate = (firstMonthFree && inFirstMonth) ? 0 : (settings?.platformCommission ?? DEFAULT_COMMISSION_RATE);
  const platformAmount = grossAmountEur * platformRate;
  const afterPlatform = grossAmountEur - platformAmount;

  // Initialize distribution
  let creatorAmount = afterPlatform;
  let agencyAmount = 0;
  let chatterAmount = 0;
  let agencyShare = 0;

  // Calculate agency split if creator has agency
  if (creator.agencyId && creator.agency) {
    // Get revenue share from model listing or default to 70%
    const creatorShare = (creator.modelListing?.revenueShare ?? 70) / 100;
    agencyShare = 1 - creatorShare;

    creatorAmount = afterPlatform * creatorShare;
    let agencyGross = afterPlatform * agencyShare;

    // Calculate chatter commission if applicable
    // Chatter commission only for non-subscription types
    if (chatter && chatter.commissionEnabled && type !== "SUBSCRIPTION") {
      chatterAmount = agencyGross * chatter.commissionRate;
      agencyAmount = agencyGross - chatterAmount;
    } else {
      agencyAmount = agencyGross;
    }
  }

  // Create all records in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create CreatorEarning
    const creatorEarning = await tx.creatorEarning.create({
      data: {
        creatorSlug,
        userId,
        type,
        sourceId,
        grossAmount: grossAmountEur,
        commissionRate: platformRate,
        commissionAmount: platformAmount,
        netAmount: creatorAmount,
        status: "PENDING",
        chatterId: chatterId || null,
        aiPersonalityId: aiPersonalityId || null,
        attributedMessageId: attributedMessageId || null,
      },
    });

    // 2. Update creator balance
    await tx.creator.update({
      where: { slug: creatorSlug },
      data: {
        pendingBalance: { increment: creatorAmount },
        totalEarned: { increment: creatorAmount },
      },
    });

    let agencyEarningId: string | undefined;
    let chatterEarningId: string | undefined;

    // 3. Create AgencyEarning if applicable
    if (creator.agencyId && agencyAmount > 0) {
      const agencyEarning = await tx.agencyEarning.create({
        data: {
          agencyId: creator.agencyId,
          creatorEarningId: creatorEarning.id,
          grossAmount: afterPlatform,
          agencyShare,
          agencyGross: afterPlatform * agencyShare,
          chatterAmount,
          netAmount: agencyAmount,
          type,
          status: "PENDING",
        },
      });
      agencyEarningId = agencyEarning.id;

      // Update agency balance
      await tx.agency.update({
        where: { id: creator.agencyId },
        data: {
          pendingBalance: { increment: agencyAmount },
          totalEarned: { increment: agencyAmount },
          totalRevenue: { increment: afterPlatform * agencyShare },
        },
      });
    }

    // 4. Create ChatterEarning if applicable
    if (chatter && chatterAmount > 0) {
      const chatterEarning = await tx.chatterEarning.create({
        data: {
          chatterId: chatter.id,
          creatorEarningId: creatorEarning.id,
          grossAmount: afterPlatform * agencyShare,
          commissionRate: chatter.commissionRate,
          commissionAmount: chatterAmount,
          type,
          attributedMessageId: attributedMessageId || null,
          status: "PENDING",
        },
      });
      chatterEarningId = chatterEarning.id;

      // Update chatter balance and stats
      await tx.chatter.update({
        where: { id: chatter.id },
        data: {
          pendingBalance: { increment: chatterAmount },
          totalEarnings: { increment: chatterAmount },
          totalSales: { increment: 1 },
        },
      });
    }

    // 5. Create AiPersonalityEarning if applicable (stats tracking only)
    if (aiPersonalityId) {
      await tx.aiPersonalityEarning.create({
        data: {
          aiPersonalityId,
          creatorEarningId: creatorEarning.id,
          grossAmount: grossAmountEur,
          type,
          attributedMessageId: attributedMessageId || null,
        },
      });

      // Update AI personality stats
      await tx.agencyAiPersonality.update({
        where: { id: aiPersonalityId },
        data: {
          totalEarnings: { increment: grossAmountEur },
          totalSales: { increment: 1 },
        },
      });
    }

    return {
      creatorEarningId: creatorEarning.id,
      agencyEarningId,
      chatterEarningId,
    };
  });

  // Log distribution
  console.log(
    `[Commission] Distribution for ${creatorSlug}: ` +
    `Gross €${grossAmountEur.toFixed(2)} → ` +
    `Platform €${platformAmount.toFixed(2)} (${(platformRate * 100).toFixed(0)}%), ` +
    `Creator €${creatorAmount.toFixed(2)}, ` +
    `Agency €${agencyAmount.toFixed(2)}, ` +
    `Chatter €${chatterAmount.toFixed(2)}`
  );

  return {
    creatorEarningId: result.creatorEarningId,
    platformAmount,
    creatorAmount,
    agencyAmount,
    chatterAmount,
    agencyEarningId: result.agencyEarningId,
    chatterEarningId: result.chatterEarningId,
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
