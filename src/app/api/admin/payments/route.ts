import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const type = searchParams.get("type") || "all";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get payments from Payment model (credits, crypto, paygate)
    const paymentWhere: any = {
      createdAt: { gte: startDate },
    };
    if (type !== "all") {
      paymentWhere.type = type;
    }
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { createdAt: "desc" },
    });

    // Get user info for payments
    const paymentUserIds = [...new Set(payments.map(p => p.userId))];
    const paymentUsers = await prisma.user.findMany({
      where: { id: { in: paymentUserIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(paymentUsers.map(u => [u.id, u]));

    // Get subscriptions payments
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ["ACTIVE", "CANCELED"] },
      },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get media purchases
    const mediaPurchases = await prisma.mediaPurchase.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "COMPLETED",
      },
      include: {
        user: { select: { name: true, email: true } },
        media: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get message payments (PPV & tips)
    const messagePurchases = await prisma.messagePayment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "COMPLETED",
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform all to unified format
    const allPayments = [
      // Payment model (credits purchases, crypto, paygate)
      ...payments.map((p) => {
        const user = userMap.get(p.userId);
        return {
          id: p.id,
          type: p.type as string,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          provider: p.provider,
          user: user?.name || user?.email || "Unknown",
          description: p.type === "CREDITS" ? `${Number(p.amount) * 100} credits` : p.type,
          createdAt: p.createdAt,
        };
      }),
      ...subscriptions.map((s) => ({
        id: s.id,
        type: "SUBSCRIPTION" as const,
        amount: s.plan.monthlyPrice,
        currency: "USD",
        status: s.status,
        provider: "STRIPE",
        user: s.user.name || s.user.email,
        description: `${s.plan.name} subscription`,
        createdAt: s.createdAt,
      })),
      ...mediaPurchases.map((p) => ({
        id: p.id,
        type: "MEDIA_PURCHASE" as const,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        user: p.user.name || p.user.email,
        description: p.media.title,
        createdAt: p.createdAt,
      })),
      ...messagePurchases.map((p) => ({
        id: p.id,
        type: p.type as "PPV_UNLOCK" | "TIP",
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        user: p.user.name || p.user.email,
        description: p.type === "TIP" ? "Tip" : "PPV Unlock",
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by type if specified
    const filteredPayments =
      type === "all"
        ? allPayments
        : allPayments.filter((p) => p.type === type);

    // Calculate stats (only COMPLETED payments for revenue)
    const completedPayments = filteredPayments.filter((p) => p.status === "COMPLETED");
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const subscriptionRevenue = allPayments
      .filter((p) => p.type === "SUBSCRIPTION" && p.status === "ACTIVE")
      .reduce((sum, p) => sum + p.amount, 0);
    const mediaRevenue = allPayments
      .filter((p) => p.type === "MEDIA_PURCHASE" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const tipsRevenue = allPayments
      .filter((p) => p.type === "TIP" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const ppvRevenue = allPayments
      .filter((p) => p.type === "PPV_UNLOCK" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const creditsRevenue = allPayments
      .filter((p) => p.type === "CREDITS" && p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    // Revenue by day for chart
    const revenueByDay: Record<string, number> = {};
    filteredPayments.forEach((p) => {
      const day = new Date(p.createdAt).toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + p.amount;
    });

    const chartData = Object.entries(revenueByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date, amount }));

    return NextResponse.json({
      payments: filteredPayments,
      stats: {
        totalRevenue,
        subscriptionRevenue,
        mediaRevenue,
        tipsRevenue,
        ppvRevenue,
        creditsRevenue,
        totalTransactions: filteredPayments.length,
      },
      chartData,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
