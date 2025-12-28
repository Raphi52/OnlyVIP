import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/admin/migrate-credits - Run credits/tags migration (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow admins
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const results: string[] = [];

    // 1. Migrate all existing media to Free + Gallery tags
    results.push("Step 1: Migrating media to Free + Gallery tags...");

    const mediaResult = await prisma.mediaContent.updateMany({
      data: {
        tagFree: true,
        tagGallery: true,
      },
    });
    results.push(`  Updated ${mediaResult.count} media items`);

    // 2. Update subscription plans with credit allocations
    results.push("Step 2: Updating subscription plans with credits...");

    // Update plans by accessTier
    const basicPlans = await prisma.subscriptionPlan.updateMany({
      where: {
        OR: [
          { accessTier: "BASIC" },
          { accessTier: "FREE" },
        ],
      },
      data: {
        initialCredits: 1000,
        recurringCredits: 0,
        creditIntervalDays: 6,
      },
    });
    results.push(`  Updated ${basicPlans.count} Basic/Free plans: 1000 initial credits`);

    const vipPlans = await prisma.subscriptionPlan.updateMany({
      where: { accessTier: "VIP" },
      data: {
        initialCredits: 5000,
        recurringCredits: 1000,
        creditIntervalDays: 6,
      },
    });
    results.push(`  Updated ${vipPlans.count} VIP plans: 5000 initial + 1000 recurring credits`);

    // 3. Get summary
    const totalMedia = await prisma.mediaContent.count();
    const freeMedia = await prisma.mediaContent.count({ where: { tagFree: true } });
    const galleryMedia = await prisma.mediaContent.count({ where: { tagGallery: true } });

    const plans = await prisma.subscriptionPlan.findMany({
      select: {
        name: true,
        accessTier: true,
        initialCredits: true,
        recurringCredits: true,
        creditIntervalDays: true,
      },
    });

    return NextResponse.json({
      success: true,
      results,
      summary: {
        media: {
          total: totalMedia,
          free: freeMedia,
          gallery: galleryMedia,
        },
        plans: plans.map((p) => ({
          name: p.name,
          tier: p.accessTier,
          initialCredits: p.initialCredits,
          recurringCredits: p.recurringCredits,
          creditInterval: p.creditIntervalDays,
        })),
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
