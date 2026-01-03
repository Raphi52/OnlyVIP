import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/credit-purchases - Get only credit purchases (crypto/card)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";

    // Calculate date range
    let startDate = new Date(0);
    switch (period) {
      case "7d":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Get payments from Payment model (only CREDITS type)
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        type: "CREDITS",
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user info for payments
    const paymentUserIds = [...new Set(payments.map(p => p.userId))];
    const paymentUsers = await prisma.user.findMany({
      where: { id: { in: paymentUserIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(paymentUsers.map(u => [u.id, u]));

    // Transform to response format
    const transformedPayments = payments.map((p) => {
      const user = userMap.get(p.userId);
      return {
        id: p.id,
        type: p.type,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        user: user?.name || user?.email || "Unknown",
        description: `${Number(p.amount)} credits`,
        createdAt: p.createdAt,
      };
    });

    // Calculate stats
    const completedPayments = transformedPayments.filter((p) => p.status === "COMPLETED");
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments: transformedPayments,
      stats: {
        totalRevenue,
        totalTransactions: transformedPayments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching credit purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit purchases" },
      { status: 500 }
    );
  }
}
