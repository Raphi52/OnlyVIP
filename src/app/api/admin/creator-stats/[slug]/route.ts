import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/creator-stats/[slug] - Get detailed creator stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Get creator info
    const creator = await prisma.creator.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatar: true,
        pendingBalance: true,
        totalEarned: true,
        totalPaid: true,
        walletEth: true,
        walletBtc: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Get earnings breakdown by type (ALL earnings, not just pending)
    const earningsByType = await prisma.creatorEarning.groupBy({
      by: ["type"],
      where: { creatorSlug: slug },
      _sum: {
        grossAmount: true,
        netAmount: true,
        commissionAmount: true,
      },
      _count: true,
    });

    // Get earnings breakdown by status
    const earningsByStatus = await prisma.creatorEarning.groupBy({
      by: ["status"],
      where: { creatorSlug: slug },
      _sum: {
        grossAmount: true,
        netAmount: true,
        commissionAmount: true,
      },
      _count: true,
    });

    // Get media stats
    const mediaStats = await prisma.mediaContent.groupBy({
      by: ["type"],
      where: { creatorSlug: slug },
      _count: true,
    });

    // Get total media count
    const totalMedia = await prisma.mediaContent.count({
      where: { creatorSlug: slug },
    });

    // Get PPV media count
    const ppvMedia = await prisma.mediaContent.count({
      where: { creatorSlug: slug, price: { gt: 0 } },
    });

    // Get free media count
    const freeMedia = await prisma.mediaContent.count({
      where: { creatorSlug: slug, price: 0 },
    });

    // Get subscriber count
    const subscriberCount = await prisma.subscription.count({
      where: {
        creatorSlug: slug,
        status: "ACTIVE",
      },
    });

    // Get total subscribers ever
    const totalSubscribers = await prisma.subscription.count({
      where: { creatorSlug: slug },
    });

    // Get recent earnings (last 30)
    const recentEarnings = await prisma.creatorEarning.findMany({
      where: { creatorSlug: slug },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        grossAmount: true,
        netAmount: true,
        commissionAmount: true,
        status: true,
        createdAt: true,
      },
    });

    // Get media purchases for this creator
    const mediaPurchases = await prisma.mediaPurchase.aggregate({
      where: {
        media: { creatorSlug: slug },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Calculate totals
    const totalGross = earningsByType.reduce((sum, e) => sum + (e._sum.grossAmount || 0), 0);
    const totalNet = earningsByType.reduce((sum, e) => sum + (e._sum.netAmount || 0), 0);
    const totalCommission = earningsByType.reduce((sum, e) => sum + (e._sum.commissionAmount || 0), 0);

    // Format earnings by type
    const earningsBreakdown = earningsByType.map((e) => ({
      type: e.type,
      count: e._count,
      grossAmount: e._sum.grossAmount || 0,
      netAmount: e._sum.netAmount || 0,
      commission: e._sum.commissionAmount || 0,
    }));

    // Format earnings by status
    const statusBreakdown = earningsByStatus.map((e) => ({
      status: e.status,
      count: e._count,
      grossAmount: e._sum.grossAmount || 0,
      netAmount: e._sum.netAmount || 0,
      commission: e._sum.commissionAmount || 0,
    }));

    return NextResponse.json({
      creator: {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        avatar: creator.avatar,
        email: creator.user?.email,
        pendingBalance: creator.pendingBalance,
        totalEarned: creator.totalEarned,
        totalPaid: creator.totalPaid,
        walletEth: creator.walletEth,
        walletBtc: creator.walletBtc,
        createdAt: creator.createdAt,
        userCreatedAt: creator.user?.createdAt,
      },
      stats: {
        totalGross,
        totalNet,
        totalCommission,
        commissionRate: totalGross > 0 ? ((totalCommission / totalGross) * 100).toFixed(1) : "0",
        subscriberCount,
        totalSubscribers,
        totalMedia,
        ppvMedia,
        freeMedia,
        mediaPurchaseCount: mediaPurchases._count,
        mediaPurchaseRevenue: mediaPurchases._sum.amount || 0,
      },
      earnings: {
        byType: earningsBreakdown,
        byStatus: statusBreakdown,
        recent: recentEarnings,
      },
      messagePayments: [],
      mediaStats: mediaStats.map((ms) => ({
        type: ms.type,
        count: ms._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching creator stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator stats" },
      { status: 500 }
    );
  }
}
