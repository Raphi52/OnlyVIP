/**
 * API: AI vs Human Analytics
 *
 * GET /api/agency/analytics/ai-vs-human - Compare AI and human performance
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's agency
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { ownedAgencies: true },
    });

    const agency = user?.ownedAgencies?.[0];
    if (!agency) {
      return NextResponse.json({ error: "Not an agency user" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const creatorSlug = searchParams.get("creatorSlug");
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query for messages
    const messageWhere: Record<string, unknown> = {
      createdAt: { gte: startDate },
      conversation: {
        creator: {
          agencyId: agency.id,
        },
      },
    };

    if (creatorSlug) {
      messageWhere.conversation = {
        creatorSlug,
      };
    }

    // Get all messages
    const messages = await prisma.message.findMany({
      where: messageWhere,
      select: {
        id: true,
        isAiGenerated: true,
        responseTimeSeconds: true,
        createdAt: true,
        conversation: {
          select: {
            creatorSlug: true,
          },
        },
      },
    });

    // Separate AI and human messages
    const aiMessages = messages.filter((m) => m.isAiGenerated);
    const humanMessages = messages.filter((m) => !m.isAiGenerated);

    // Calculate average response times
    const aiResponseTimes = aiMessages
      .filter((m) => m.responseTimeSeconds && m.responseTimeSeconds > 0)
      .map((m) => m.responseTimeSeconds!);
    const humanResponseTimes = humanMessages
      .filter((m) => m.responseTimeSeconds && m.responseTimeSeconds > 0)
      .map((m) => m.responseTimeSeconds!);

    const avgAiResponseTime =
      aiResponseTimes.length > 0
        ? aiResponseTimes.reduce((a, b) => a + b, 0) / aiResponseTimes.length
        : 0;
    const avgHumanResponseTime =
      humanResponseTimes.length > 0
        ? humanResponseTimes.reduce((a, b) => a + b, 0) / humanResponseTimes.length
        : 0;

    // Get payments for revenue calculation
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "COMPLETED",
        creatorSlug: creatorSlug || undefined,
      },
      select: {
        amount: true,
        createdAt: true,
        type: true,
      },
    });

    // Note: We can't perfectly attribute revenue to AI vs Human without tracking
    // For now, we estimate based on total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const aiPercentage = messages.length > 0 ? aiMessages.length / messages.length : 0;
    const aiRevenue = Math.round(totalRevenue * aiPercentage);
    const humanRevenue = totalRevenue - aiRevenue;

    // Calculate messages by day for chart
    const messagesByDay: Record<
      string,
      { ai: number; human: number; date: string }
    > = {};

    for (const msg of messages) {
      const day = msg.createdAt.toISOString().split("T")[0];
      if (!messagesByDay[day]) {
        messagesByDay[day] = { ai: 0, human: 0, date: day };
      }
      if (msg.isAiGenerated) {
        messagesByDay[day].ai++;
      } else {
        messagesByDay[day].human++;
      }
    }

    // Get handoff stats - simplified query
    const handoffs = await prisma.conversationHandoff.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        triggerType: true,
        status: true,
      },
    });

    const handoffStats = {
      total: handoffs.length,
      byTrigger: {
        spending_threshold: handoffs.filter(
          (h) => h.triggerType === "spending_threshold"
        ).length,
        high_intent: handoffs.filter((h) => h.triggerType === "high_intent")
          .length,
        manual: handoffs.filter((h) => h.triggerType === "manual").length,
      },
      accepted: handoffs.filter((h) => h.status === "ACCEPTED").length,
      declined: handoffs.filter((h) => h.status === "DECLINED").length,
    };

    // Get objection handling stats - simplified query
    const objectionHandlings = await prisma.objectionHandling.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        strategy: true,
        outcome: true,
        revenueGenerated: true,
      },
    });

    const objectionStats = {
      total: objectionHandlings.length,
      converted: objectionHandlings.filter((o) => o.outcome === "converted")
        .length,
      totalRevenue: objectionHandlings
        .filter((o) => o.revenueGenerated)
        .reduce((sum, o) => sum + (o.revenueGenerated || 0), 0),
      conversionRate:
        objectionHandlings.length > 0
          ? Math.round(
              (objectionHandlings.filter((o) => o.outcome === "converted")
                .length /
                objectionHandlings.length) *
                100
            )
          : 0,
    };

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      comparison: {
        ai: {
          messagesSent: aiMessages.length,
          avgResponseTime: Math.round(avgAiResponseTime),
          revenue: aiRevenue,
          revenuePerMessage:
            aiMessages.length > 0 ? aiRevenue / aiMessages.length : 0,
        },
        human: {
          messagesSent: humanMessages.length,
          avgResponseTime: Math.round(avgHumanResponseTime),
          revenue: humanRevenue,
          revenuePerMessage:
            humanMessages.length > 0 ? humanRevenue / humanMessages.length : 0,
        },
      },
      timeline: Object.values(messagesByDay).sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
      handoffs: handoffStats,
      objections: objectionStats,
      summary: {
        totalMessages: messages.length,
        aiPercentage:
          messages.length > 0
            ? Math.round((aiMessages.length / messages.length) * 100)
            : 0,
        totalRevenue: aiRevenue + humanRevenue,
        aiRevenuePercentage:
          aiRevenue + humanRevenue > 0
            ? Math.round((aiRevenue / (aiRevenue + humanRevenue)) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("AI vs Human analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}
