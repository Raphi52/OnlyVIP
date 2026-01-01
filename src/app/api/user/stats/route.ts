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
      user,
      subscriptions,
      recentTransactions,
      unreadMessages,
    ] = await Promise.all([
      // Get user with credit balances (paid and bonus)
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          creditBalance: true,
          paidCredits: true,
          bonusCredits: true,
          name: true,
        },
      }),

      // Active subscriptions with creator info
      prisma.subscription.findMany({
        where: {
          userId,
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Recent credit transactions
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          type: true,
          creditType: true,
          description: true,
          createdAt: true,
        },
      }),

      // Unread messages count (exclude self-sent messages)
      prisma.message.count({
        where: {
          receiverId: userId,
          senderId: { not: userId },
          isRead: false,
        },
      }),
    ]);

    // Get creator info for each subscription
    const subscriptionsWithCreators = await Promise.all(
      subscriptions.map(async (sub) => {
        const creator = sub.creatorSlug
          ? await prisma.creator.findUnique({
              where: { slug: sub.creatorSlug },
              select: {
                slug: true,
                displayName: true,
                avatar: true,
              },
            })
          : null;

        return {
          id: sub.id,
          planId: sub.planId,
          planName: sub.plan?.name || sub.planId,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          creatorSlug: sub.creatorSlug,
          creator: creator,
        };
      })
    );

    return NextResponse.json({
      creditBalance: user?.creditBalance || 0,
      paidCredits: user?.paidCredits || 0,
      bonusCredits: user?.bonusCredits || 0,
      userName: user?.name || "User",
      subscriptions: subscriptionsWithCreators,
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        creditType: tx.creditType,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
      unreadMessages,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
