/**
 * Script Attribution System
 * Tracks and attributes sales to scripts that generated them
 */

import prisma from "@/lib/prisma";

// Time window for attribution (24 hours)
const ATTRIBUTION_WINDOW_MS = 24 * 60 * 60 * 1000;

interface AttributionResult {
  attributed: boolean;
  scriptId?: string;
  scriptName?: string;
  messageId?: string;
}

/**
 * Attribute a sale to the most recent script used in a conversation
 * Looks back within the attribution window to find the script that led to the sale
 */
export async function attributeSaleToScript(
  conversationId: string,
  saleAmount: number,
  saleType: "PPV" | "TIP" | "SUBSCRIPTION",
  purchaseTime: Date = new Date()
): Promise<AttributionResult> {
  try {
    // Find the most recent script usage in this conversation within the attribution window
    const windowStart = new Date(purchaseTime.getTime() - ATTRIBUTION_WINDOW_MS);

    const recentUsage = await prisma.scriptUsage.findFirst({
      where: {
        conversationId,
        usedAt: {
          gte: windowStart,
          lte: purchaseTime,
        },
        action: { in: ["SENT", "SENT_MODIFIED"] }, // Only count actually sent messages
        resultedInSale: false, // Not already attributed
      },
      orderBy: { usedAt: "desc" },
      include: {
        script: {
          select: { id: true, name: true },
        },
      },
    });

    if (!recentUsage) {
      return { attributed: false };
    }

    // Update the usage log
    await prisma.scriptUsage.update({
      where: { id: recentUsage.id },
      data: {
        resultedInSale: true,
        saleAmount,
        saleType,
      },
    });

    // Update the script stats
    await prisma.script.update({
      where: { id: recentUsage.scriptId },
      data: {
        salesGenerated: { increment: 1 },
        revenueGenerated: { increment: saleAmount },
      },
    });

    // Update the message if we have one
    if (recentUsage.messageId) {
      await prisma.message.update({
        where: { id: recentUsage.messageId },
        data: {
          resultedInSale: true,
          saleAmount,
        },
      });
    }

    // Recalculate conversion rate
    await recalculateConversionRate(recentUsage.scriptId);

    return {
      attributed: true,
      scriptId: recentUsage.scriptId,
      scriptName: recentUsage.script.name,
      messageId: recentUsage.messageId || undefined,
    };
  } catch (error) {
    console.error("Error attributing sale to script:", error);
    return { attributed: false };
  }
}

/**
 * Recalculate conversion rate for a script
 */
export async function recalculateConversionRate(scriptId: string): Promise<void> {
  try {
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { messagesSent: true, salesGenerated: true },
    });

    if (!script || script.messagesSent === 0) return;

    const conversionRate = (script.salesGenerated / script.messagesSent) * 100;

    await prisma.script.update({
      where: { id: scriptId },
      data: { conversionRate },
    });
  } catch (error) {
    console.error("Error recalculating conversion rate:", error);
  }
}

/**
 * Recalculate all script stats (batch operation)
 */
export async function recalculateAllScriptStats(agencyId: string): Promise<void> {
  try {
    const scripts = await prisma.script.findMany({
      where: { agencyId, isActive: true },
      select: { id: true },
    });

    for (const script of scripts) {
      // Get usage stats
      const usageStats = await prisma.scriptUsage.aggregate({
        where: { scriptId: script.id },
        _count: true,
      });

      const sentStats = await prisma.scriptUsage.aggregate({
        where: {
          scriptId: script.id,
          action: { in: ["SENT", "SENT_MODIFIED"] },
        },
        _count: true,
      });

      const salesStats = await prisma.scriptUsage.aggregate({
        where: {
          scriptId: script.id,
          resultedInSale: true,
        },
        _count: true,
        _sum: { saleAmount: true },
      });

      // Calculate average response time
      const responseTimeStats = await prisma.scriptUsage.aggregate({
        where: {
          scriptId: script.id,
          responseTime: { not: null },
        },
        _avg: { responseTime: true },
      });

      // Update script
      const messagesSent = sentStats._count;
      const salesGenerated = salesStats._count;
      const conversionRate = messagesSent > 0
        ? (salesGenerated / messagesSent) * 100
        : 0;

      await prisma.script.update({
        where: { id: script.id },
        data: {
          usageCount: usageStats._count,
          messagesSent,
          salesGenerated,
          revenueGenerated: salesStats._sum.saleAmount || 0,
          conversionRate,
          avgResponseTime: responseTimeStats._avg.responseTime,
        },
      });
    }
  } catch (error) {
    console.error("Error recalculating script stats:", error);
  }
}

/**
 * Update sequence stats when a script in the sequence completes
 */
export async function updateSequenceStats(
  sequenceId: string,
  completed: boolean,
  revenue?: number
): Promise<void> {
  try {
    const updateData: any = {
      timesStarted: { increment: 1 },
    };

    if (completed) {
      updateData.timesCompleted = { increment: 1 };
    }

    if (revenue) {
      updateData.totalRevenue = { increment: revenue };
    }

    await prisma.scriptSequence.update({
      where: { id: sequenceId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating sequence stats:", error);
  }
}

/**
 * Get attribution stats for a time period
 */
export async function getAttributionStats(
  agencyId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalSales: number;
  totalRevenue: number;
  attributedSales: number;
  attributedRevenue: number;
  attributionRate: number;
  topScripts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}> {
  try {
    // Get all script usages with sales in the period
    const attributedUsages = await prisma.scriptUsage.findMany({
      where: {
        script: { agencyId },
        resultedInSale: true,
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        script: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate stats
    const attributedSales = attributedUsages.length;
    const attributedRevenue = attributedUsages.reduce(
      (sum, u) => sum + (u.saleAmount || 0),
      0
    );

    // Group by script for top performers
    const byScript = new Map<string, { name: string; sales: number; revenue: number }>();
    for (const usage of attributedUsages) {
      const existing = byScript.get(usage.scriptId) || {
        name: usage.script.name,
        sales: 0,
        revenue: 0,
      };
      existing.sales += 1;
      existing.revenue += usage.saleAmount || 0;
      byScript.set(usage.scriptId, existing);
    }

    const topScripts = Array.from(byScript.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales: attributedSales, // Would need total sales from payments
      totalRevenue: attributedRevenue,
      attributedSales,
      attributedRevenue,
      attributionRate: 100, // Would calculate vs total sales
      topScripts,
    };
  } catch (error) {
    console.error("Error getting attribution stats:", error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      attributedSales: 0,
      attributedRevenue: 0,
      attributionRate: 0,
      topScripts: [],
    };
  }
}
