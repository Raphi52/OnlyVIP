import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/chatter - Get chatter info and stats
export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "CHATTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatterId = (session.user as any).chatterId;

    if (!chatterId) {
      return NextResponse.json({ error: "Chatter ID not found" }, { status: 400 });
    }

    // Get chatter with agency and assigned creators
    const chatter = await prisma.chatter.findUnique({
      where: { id: chatterId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        assignedCreators: {
          select: {
            creatorSlug: true,
          },
        },
      },
    });

    if (!chatter) {
      return NextResponse.json({ error: "Chatter not found" }, { status: 404 });
    }

    if (!chatter.isActive) {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }

    // Get creator profiles for assigned creators
    const creatorSlugs = chatter.assignedCreators.map((a) => a.creatorSlug);
    const creators = await prisma.creator.findMany({
      where: {
        slug: { in: creatorSlugs },
      },
      select: {
        slug: true,
        displayName: true,
        avatar: true,
      },
    });

    // Get earnings stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEarnings = await prisma.chatterEarning.aggregate({
      where: {
        chatterId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        commissionAmount: true,
      },
      _count: true,
    });

    // Count messages in last 30 days
    const recentMessages = await prisma.message.count({
      where: {
        chatterId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get unread conversation count
    const unreadConversations = await prisma.conversation.count({
      where: {
        creatorSlug: { in: creatorSlugs },
        messages: {
          some: {
            isRead: false,
            chatterId: null, // Not sent by chatter
          },
        },
      },
    });

    // Transform creators to expected format
    const transformedCreators = creators.map((c) => ({
      slug: c.slug,
      displayName: c.displayName,
      avatarUrl: c.avatar,
    }));

    return NextResponse.json({
      id: chatter.id,
      name: chatter.name,
      email: chatter.email,
      avatar: chatter.avatar,
      agency: chatter.agency,
      commissionRate: chatter.commissionRate,
      assignedCreators: transformedCreators,
      stats: {
        totalEarnings: chatter.totalEarnings,
        pendingBalance: chatter.pendingBalance,
        totalPaid: chatter.totalPaid,
        messages30d: recentMessages,
        sales30d: recentEarnings._count,
        earnings30d: recentEarnings._sum.commissionAmount || 0,
        conversionRate:
          chatter.totalMessages > 0
            ? ((chatter.totalSales / chatter.totalMessages) * 100).toFixed(1)
            : 0,
        unreadConversations,
      },
    });
  } catch (error) {
    console.error("Error fetching chatter data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatter data" },
      { status: 500 }
    );
  }
}
