/**
 * Media Access Control Library
 *
 * Handles determining if a user can access media based on:
 * - Tag system (tagFree, tagVIP, tagPPV)
 * - Subscription status
 * - Previous purchases
 * - Credit system for unlocking
 */

import prisma from "./prisma";
import { spendCredits, hasEnoughCredits } from "./credits";

export type AccessResult = {
  canAccess: boolean;
  reason?: "free" | "subscribed" | "purchased" | "login_required" | "vip_required" | "ppv_locked" | "subscription_required";
  ppvPrice?: number | null;
  requiresCredits?: number;
};

export type MediaWithTags = {
  id: string;
  tagFree: boolean;
  tagVIP: boolean;
  tagPPV: boolean;
  ppvPriceCredits: number | null;
  accessTier?: string; // Legacy field
};

export type UserContext = {
  userId?: string;
  isVIP?: boolean;
  hasActiveSubscription?: boolean;
} | null;

/**
 * Check if a user can access a specific media item
 */
export async function canAccessMedia(
  media: MediaWithTags,
  userContext: UserContext
): Promise<AccessResult> {
  // 1. Free tag = everyone can access (including visitors)
  if (media.tagFree) {
    return { canAccess: true, reason: "free" };
  }

  // 2. No user = login required (except for free content)
  if (!userContext?.userId) {
    return { canAccess: false, reason: "login_required" };
  }

  const userId = userContext.userId;

  // 3. Check if already purchased
  const purchase = await prisma.mediaPurchase.findUnique({
    where: {
      userId_mediaId: {
        userId,
        mediaId: media.id,
      },
    },
  });

  if (purchase) {
    return { canAccess: true, reason: "purchased" };
  }

  // 4. VIP tag = requires VIP subscription
  if (media.tagVIP) {
    // Check if user has VIP subscription
    const vipSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        plan: {
          accessTier: "VIP",
        },
      },
    });

    // Also check if user is manually marked as VIP
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    const isVIP = !!vipSubscription || user?.isVip === true;

    if (!isVIP) {
      // If also PPV, they can still unlock with credits
      if (media.tagPPV && media.ppvPriceCredits) {
        return {
          canAccess: false,
          reason: "ppv_locked",
          ppvPrice: media.ppvPriceCredits,
          requiresCredits: media.ppvPriceCredits,
        };
      }
      return { canAccess: false, reason: "vip_required" };
    }
  }

  // 5. PPV tag = requires payment (unless already purchased above)
  if (media.tagPPV) {
    return {
      canAccess: false,
      reason: "ppv_locked",
      ppvPrice: media.ppvPriceCredits,
      requiresCredits: media.ppvPriceCredits || 1000,
    };
  }

  // 6. Default: require any active subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  if (activeSubscription) {
    return { canAccess: true, reason: "subscribed" };
  }

  return { canAccess: false, reason: "subscription_required" };
}

/**
 * Unlock a PPV media item using credits
 */
export async function unlockMediaWithCredits(
  userId: string,
  mediaId: string
): Promise<{
  success: boolean;
  error?: string;
  newBalance?: number;
}> {
  // Get media to check PPV price
  const media = await prisma.mediaContent.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      tagPPV: true,
      ppvPriceCredits: true,
      tagVIP: true,
    },
  });

  if (!media) {
    return { success: false, error: "Media not found" };
  }

  if (!media.tagPPV) {
    return { success: false, error: "Media is not PPV" };
  }

  const price = media.ppvPriceCredits || 1000; // Default to 1000 credits if not set

  // Check if VIP is required
  if (media.tagVIP) {
    const vipSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        plan: { accessTier: "VIP" },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVip: true },
    });

    if (!vipSubscription && !user?.isVip) {
      return { success: false, error: "VIP subscription required" };
    }
  }

  // Check if already purchased
  const existingPurchase = await prisma.mediaPurchase.findUnique({
    where: {
      userId_mediaId: { userId, mediaId },
    },
  });

  if (existingPurchase) {
    return { success: false, error: "Already unlocked" };
  }

  // Check if user has enough credits
  const hasCredits = await hasEnoughCredits(userId, price);
  if (!hasCredits) {
    return { success: false, error: "Insufficient credits" };
  }

  // Spend credits
  const result = await spendCredits(userId, price, "MEDIA_UNLOCK", {
    mediaId,
    description: `Unlocked media: ${mediaId}`,
  });

  // Create purchase record
  await prisma.mediaPurchase.create({
    data: {
      userId,
      mediaId,
      amount: 0,
      currency: "CREDITS",
      provider: "CREDITS",
      status: "COMPLETED",
    },
  });

  // Increment purchase count
  await prisma.mediaContent.update({
    where: { id: mediaId },
    data: { purchaseCount: { increment: 1 } },
  });

  return {
    success: true,
    newBalance: result.newBalance,
  };
}

/**
 * Get access info for multiple media items (batch)
 */
export async function getMediaAccessBatch(
  mediaItems: MediaWithTags[],
  userId?: string
): Promise<Map<string, AccessResult>> {
  const results = new Map<string, AccessResult>();

  if (!userId) {
    // Not logged in - only free content is accessible
    for (const media of mediaItems) {
      if (media.tagFree) {
        results.set(media.id, { canAccess: true, reason: "free" });
      } else {
        results.set(media.id, { canAccess: false, reason: "login_required" });
      }
    }
    return results;
  }

  // Get all purchases for this user in one query
  const purchases = await prisma.mediaPurchase.findMany({
    where: {
      userId,
      mediaId: { in: mediaItems.map((m) => m.id) },
    },
    select: { mediaId: true },
  });

  const purchasedIds = new Set(purchases.map((p) => p.mediaId));

  // Get user subscription info
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      plan: { select: { accessTier: true } },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isVip: true },
  });

  const isVIP = subscription?.plan?.accessTier === "VIP" || user?.isVip === true;
  const hasSubscription = !!subscription;

  for (const media of mediaItems) {
    // Free = accessible
    if (media.tagFree) {
      results.set(media.id, { canAccess: true, reason: "free" });
      continue;
    }

    // Already purchased
    if (purchasedIds.has(media.id)) {
      results.set(media.id, { canAccess: true, reason: "purchased" });
      continue;
    }

    // VIP required
    if (media.tagVIP && !isVIP) {
      if (media.tagPPV && media.ppvPriceCredits) {
        results.set(media.id, {
          canAccess: false,
          reason: "ppv_locked",
          ppvPrice: media.ppvPriceCredits,
          requiresCredits: media.ppvPriceCredits,
        });
      } else {
        results.set(media.id, { canAccess: false, reason: "vip_required" });
      }
      continue;
    }

    // PPV
    if (media.tagPPV) {
      results.set(media.id, {
        canAccess: false,
        reason: "ppv_locked",
        ppvPrice: media.ppvPriceCredits,
        requiresCredits: media.ppvPriceCredits || 1000,
      });
      continue;
    }

    // Has subscription = can access
    if (hasSubscription) {
      results.set(media.id, { canAccess: true, reason: "subscribed" });
      continue;
    }

    // No subscription
    results.set(media.id, { canAccess: false, reason: "subscription_required" });
  }

  return results;
}
