import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalCreators,
      totalMedia,
      totalMessages,
      totalPageViews,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.creator.count(),
      prisma.mediaContent.count(),
      prisma.message.count(),
      prisma.pageView.count(),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalCreators,
      totalMedia,
      totalMessages,
      totalPageViews,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching site stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
