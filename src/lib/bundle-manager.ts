/**
 * Bundle & Flash Sale System
 *
 * Features:
 * - Create content bundles with discounts
 * - Generate time-limited flash sales
 * - AI-triggered personalized offers
 * - Urgency messaging
 */

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { generateWithClaude, type LLMContext } from "@/lib/llm-router";

// Types
export interface BundleContent {
  mediaId: string;
  title: string;
  originalPrice: number;
}

export interface FlashSaleOffer {
  id: string;
  discountCode: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  expiresAt: Date;
  bundleId?: string;
  mediaId?: string;
  message: string;
}

/**
 * Create a bundle
 */
export async function createBundle(
  agencyId: string,
  data: {
    name: string;
    description?: string;
    mediaIds: string[];
    discountPercent: number;
    availableFor?: string;
    creatorSlug?: string;
    startsAt?: Date;
    endsAt?: Date;
    maxPurchases?: number;
  }
): Promise<string> {
  // Get media items and calculate pricing
  const mediaItems = await prisma.mediaContent.findMany({
    where: {
      id: { in: data.mediaIds },
    },
    select: {
      id: true,
      ppvPriceCredits: true,
    },
  });

  const originalPrice = mediaItems.reduce(
    (sum, m) => sum + (m.ppvPriceCredits || 0),
    0
  ) / 100; // Convert credits to EUR

  const bundlePrice = originalPrice * (1 - data.discountPercent / 100);

  const bundle = await prisma.bundle.create({
    data: {
      agencyId,
      name: data.name,
      description: data.description,
      mediaIds: JSON.stringify(data.mediaIds),
      originalPrice,
      bundlePrice,
      discountPercent: data.discountPercent,
      availableFor: data.availableFor || "all",
      creatorSlug: data.creatorSlug,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      maxPurchases: data.maxPurchases,
      isActive: true,
    },
  });

  return bundle.id;
}

/**
 * Get available bundles for a fan
 */
export async function getAvailableBundles(
  creatorSlug: string,
  fanUserId: string
): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    originalPrice: number;
    bundlePrice: number;
    discountPercent: number;
    mediaCount: number;
  }>
> {
  // Get fan's spending tier
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  const spendingTier = fanProfile?.spendingTier || "free";

  // Get creator's agency
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
  });

  if (!creator?.agencyId) return [];

  const now = new Date();

  // Get active bundles
  const bundles = await prisma.bundle.findMany({
    where: {
      agencyId: creator.agencyId,
      isActive: true,
      OR: [{ creatorSlug }, { creatorSlug: null }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        {
          OR: [
            { maxPurchases: null },
            { purchaseCount: { lt: prisma.bundle.fields.maxPurchases } },
          ],
        },
      ],
    },
  });

  // Filter by availability
  const availableBundles = bundles.filter((b) => {
    if (!b.availableFor || b.availableFor === "all") return true;
    if (b.availableFor === "whales" && spendingTier === "whale") return true;
    if (b.availableFor === "qualified" && spendingTier !== "free") return true;
    if (b.availableFor === "new_fans" && !fanProfile) return true;
    return false;
  });

  return availableBundles.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description || undefined,
    originalPrice: b.originalPrice,
    bundlePrice: b.bundlePrice,
    discountPercent: b.discountPercent,
    mediaCount: JSON.parse(b.mediaIds).length,
  }));
}

/**
 * Create a flash sale for a fan
 */
export async function createFlashSale(
  conversationId: string,
  fanUserId: string,
  creatorSlug: string,
  options: {
    bundleId?: string;
    mediaId?: string;
    discountPercent?: number;
    expiresInHours?: number;
    triggerType?: string;
  } = {}
): Promise<FlashSaleOffer | null> {
  const {
    bundleId,
    mediaId,
    discountPercent = 20,
    expiresInHours = 2,
    triggerType = "ai_detected",
  } = options;

  let originalPrice: number;
  let itemName: string;

  if (bundleId) {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });
    if (!bundle) return null;
    originalPrice = bundle.bundlePrice; // Discount on top of bundle
    itemName = bundle.name;
  } else if (mediaId) {
    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId },
    });
    if (!media) return null;
    originalPrice = (media.ppvPriceCredits || 0) / 100;
    itemName = media.title;
  } else {
    return null;
  }

  const salePrice = originalPrice * (1 - discountPercent / 100);
  const discountCode = `FLASH${nanoid(6).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  // Create flash sale
  const flashSale = await prisma.flashSale.create({
    data: {
      conversationId,
      fanUserId,
      creatorSlug,
      bundleId,
      mediaId,
      originalPrice,
      salePrice,
      discountCode,
      expiresAt,
      triggerType,
      status: "ACTIVE",
    },
  });

  // Generate sale message
  const message = await generateSaleMessage(itemName, discountPercent, expiresInHours);

  return {
    id: flashSale.id,
    discountCode,
    originalPrice,
    salePrice,
    discountPercent,
    expiresAt,
    bundleId: bundleId || undefined,
    mediaId: mediaId || undefined,
    message,
  };
}

/**
 * Generate a compelling flash sale message
 */
async function generateSaleMessage(
  itemName: string,
  discountPercent: number,
  expiresInHours: number
): Promise<string> {
  const templates = [
    `🔥 FLASH SALE! Get "${itemName}" for ${discountPercent}% OFF! Only ${expiresInHours}h left... Don't miss it 💕`,
    `Special offer just for you 💋 ${discountPercent}% off "${itemName}" - expires in ${expiresInHours} hours! 🔥`,
    `Babe... I'm giving you ${discountPercent}% off something special 😏 "${itemName}" - but hurry, ${expiresInHours}h only! 💕`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Get active flash sales for a fan
 */
export async function getActiveSalesForFan(
  fanUserId: string,
  creatorSlug: string
): Promise<{
  id: string;
  discountCode: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  expiresAt: Date;
  bundleId: string | null;
  mediaId: string | null;
}[]> {
  const activeSales = await prisma.flashSale.findMany({
    where: {
      fanUserId,
      creatorSlug,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return activeSales.map((sale) => ({
    id: sale.id,
    discountCode: sale.discountCode,
    originalPrice: sale.originalPrice,
    salePrice: sale.salePrice,
    discountPercent: Math.round(
      ((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100
    ),
    expiresAt: sale.expiresAt,
    bundleId: sale.bundleId,
    mediaId: sale.mediaId,
  }));
}

/**
 * Redeem a flash sale
 */
export async function redeemFlashSale(
  discountCode: string,
  fanUserId: string
): Promise<{
  success: boolean;
  originalPrice?: number;
  discountedPrice?: number;
  savings?: number;
  discountPercent?: number;
  bundleId?: string | null;
  mediaId?: string | null;
  error?: string;
}> {
  const flashSale = await prisma.flashSale.findUnique({
    where: { discountCode },
  });

  if (!flashSale) {
    return { success: false, error: "Invalid code" };
  }

  if (flashSale.status !== "ACTIVE") {
    return { success: false, error: "Offer is no longer active" };
  }

  if (flashSale.fanUserId !== fanUserId) {
    return { success: false, error: "This offer is for another user" };
  }

  if (flashSale.expiresAt < new Date()) {
    await prisma.flashSale.update({
      where: { id: flashSale.id },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "Offer has expired" };
  }

  // Mark as redeemed
  await prisma.flashSale.update({
    where: { id: flashSale.id },
    data: {
      status: "REDEEMED",
      redeemedAt: new Date(),
    },
  });

  // Update bundle stats if applicable
  if (flashSale.bundleId) {
    await prisma.bundle.update({
      where: { id: flashSale.bundleId },
      data: {
        purchaseCount: { increment: 1 },
        totalRevenue: { increment: flashSale.salePrice },
      },
    });
  }

  const discountPercent = Math.round(
    ((flashSale.originalPrice - flashSale.salePrice) / flashSale.originalPrice) * 100
  );
  const savings = flashSale.originalPrice - flashSale.salePrice;

  return {
    success: true,
    originalPrice: flashSale.originalPrice,
    discountedPrice: flashSale.salePrice,
    savings,
    discountPercent,
    bundleId: flashSale.bundleId,
    mediaId: flashSale.mediaId,
  };
}

/**
 * AI-triggered flash sale detection
 * Returns true if we should offer a flash sale based on conversation context
 */
export async function shouldOfferFlashSale(
  conversationId: string,
  fanMessage: string,
  fanUserId: string,
  creatorSlug: string
): Promise<{
  shouldOffer: boolean;
  suggestedBundleId?: string;
  suggestedMediaId?: string;
  reason?: string;
}> {
  // Check if there's already an active flash sale for this fan
  const existingSale = await prisma.flashSale.findFirst({
    where: {
      fanUserId,
      creatorSlug,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingSale) {
    return { shouldOffer: false, reason: "Active sale exists" };
  }

  // Check fan's lead score
  const leadScore = await prisma.fanLeadScore.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug },
    },
  });

  // Only offer to qualified fans (score > 40)
  if (!leadScore || leadScore.score < 40) {
    return { shouldOffer: false, reason: "Lead score too low" };
  }

  // Check for buying signals in message
  const buyingSignals = [
    "want", "interested", "how much", "price", "buy", "get",
    "veux", "intéressé", "combien", "prix", "acheter",
  ];

  const hasSignal = buyingSignals.some((s) =>
    fanMessage.toLowerCase().includes(s)
  );

  if (!hasSignal && leadScore.purchaseProbability && leadScore.purchaseProbability < 0.6) {
    return { shouldOffer: false, reason: "No buying signals" };
  }

  // Find a relevant bundle or media to offer
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
  });

  if (creator?.agencyId) {
    const bundles = await getAvailableBundles(creatorSlug, fanUserId);
    if (bundles.length > 0) {
      // Pick a random bundle
      const bundle = bundles[Math.floor(Math.random() * bundles.length)];
      return {
        shouldOffer: true,
        suggestedBundleId: bundle.id,
        reason: "High intent detected + bundle available",
      };
    }
  }

  // Fallback to a PPV media item
  const ppvMedia = await prisma.mediaContent.findFirst({
    where: {
      creatorSlug,
      tagPPV: true,
      ppvPriceCredits: { gt: 0 },
    },
    orderBy: { purchaseCount: "desc" },
  });

  if (ppvMedia) {
    return {
      shouldOffer: true,
      suggestedMediaId: ppvMedia.id,
      reason: "High intent detected + PPV available",
    };
  }

  return { shouldOffer: false, reason: "No content to offer" };
}

/**
 * Send flash sale reminder if not redeemed
 */
export async function sendFlashSaleReminders(): Promise<number> {
  const oneHourFromNow = new Date();
  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

  // Find sales expiring in the next hour that haven't had reminders
  const expiringSales = await prisma.flashSale.findMany({
    where: {
      status: "ACTIVE",
      reminderSent: false,
      expiresAt: {
        gt: new Date(),
        lt: oneHourFromNow,
      },
    },
  });

  let remindersSent = 0;

  for (const sale of expiringSales) {
    // Calculate time left
    const minutesLeft = Math.round(
      (sale.expiresAt.getTime() - Date.now()) / 60000
    );

    const reminderMessage = `⏰ Hey! Your ${Math.round(
      ((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100
    )}% discount expires in ${minutesLeft} minutes! Use code: ${sale.discountCode} 💕`;

    // Get creator user ID
    const creator = await prisma.creator.findUnique({
      where: { slug: sale.creatorSlug },
    });

    if (creator?.userId) {
      // Create reminder message
      await prisma.message.create({
        data: {
          conversationId: sale.conversationId,
          senderId: creator.userId,
          receiverId: sale.fanUserId,
          text: reminderMessage,
          isAiGenerated: true,
        },
      });

      // Mark reminder as sent
      await prisma.flashSale.update({
        where: { id: sale.id },
        data: { reminderSent: true },
      });

      remindersSent++;
    }
  }

  return remindersSent;
}

/**
 * Expire old flash sales
 */
export async function expireFlashSales(): Promise<number> {
  const result = await prisma.flashSale.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}

/**
 * Get flash sale statistics
 */
export async function getFlashSaleStats(
  creatorSlug: string,
  days: number = 30
): Promise<{
  total: number;
  redeemed: number;
  expired: number;
  redemptionRate: number;
  totalRevenue: number;
  avgDiscount: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.flashSale.findMany({
    where: {
      creatorSlug,
      createdAt: { gte: since },
    },
  });

  const redeemed = sales.filter((s) => s.status === "REDEEMED");
  const expired = sales.filter((s) => s.status === "EXPIRED");

  const totalRevenue = redeemed.reduce((sum, s) => sum + s.salePrice, 0);
  const avgDiscount =
    sales.length > 0
      ? sales.reduce(
          (sum, s) =>
            sum +
            ((s.originalPrice - s.salePrice) / s.originalPrice) * 100,
          0
        ) / sales.length
      : 0;

  return {
    total: sales.length,
    redeemed: redeemed.length,
    expired: expired.length,
    redemptionRate: sales.length > 0 ? redeemed.length / sales.length : 0,
    totalRevenue,
    avgDiscount,
  };
}

/**
 * Get bundle statistics
 */
export async function getBundleStats(
  agencyId: string
): Promise<
  Array<{
    id: string;
    name: string;
    purchaseCount: number;
    totalRevenue: number;
    discountPercent: number;
  }>
> {
  const bundles = await prisma.bundle.findMany({
    where: { agencyId },
    orderBy: { totalRevenue: "desc" },
  });

  return bundles.map((b) => ({
    id: b.id,
    name: b.name,
    purchaseCount: b.purchaseCount,
    totalRevenue: b.totalRevenue,
    discountPercent: b.discountPercent,
  }));
}
