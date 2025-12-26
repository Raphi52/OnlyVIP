import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/user/stats - Get user dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all stats in parallel
    const [
      unlockedContent,
      messageCount,
      subscription,
      recentMedia,
    ] = await Promise.all([
      // Count of purchased media + accessible media based on subscription
      prisma.mediaPurchase.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      }),

      // Count of messages received
      prisma.message.count({
        where: {
          receiverId: userId,
        },
      }),

      // Active subscription with plan
      prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Recent published media (for content preview)
      prisma.mediaContent.findMany({
        where: {
          isPublished: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          title: true,
          type: true,
          thumbnailUrl: true,
          accessTier: true,
          isPurchaseable: true,
          price: true,
        },
      }),
    ]);

    // Determine user's access tier
    const userTier = subscription?.plan?.accessTier || "FREE";
    const tierOrder = ["FREE", "BASIC", "VIP"];
    const userTierIndex = tierOrder.indexOf(userTier);

    // Get user's purchased media IDs
    const purchasedMediaIds = await prisma.mediaPurchase.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        mediaId: true,
      },
    });
    const purchasedIds = new Set(purchasedMediaIds.map((p) => p.mediaId));

    // Mark content as locked/unlocked based on user's tier and purchases
    const contentWithAccess = recentMedia.map((media) => {
      const mediaTierIndex = tierOrder.indexOf(media.accessTier);
      const hasAccess = userTierIndex >= mediaTierIndex || purchasedIds.has(media.id);

      return {
        id: media.id,
        title: media.title,
        type: media.type.toLowerCase(),
        thumbnail: media.thumbnailUrl || "/placeholder.jpg",
        isLocked: !hasAccess,
        accessTier: media.accessTier,
      };
    });

    return NextResponse.json({
      stats: {
        unlockedContent,
        messageCount,
        currentPlan: subscription?.plan?.name || "Free",
        planTier: userTier,
        canMessage: subscription?.plan?.canMessage || false,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            planName: subscription.plan.name,
            accessTier: subscription.plan.accessTier,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            canMessage: subscription.plan.canMessage,
          }
        : null,
      recentContent: contentWithAccess,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
