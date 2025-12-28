/**
 * Migration Script: Credits & Tags System
 *
 * This script migrates existing data to the new credits and tags system:
 * 1. Sets all existing media to tagFree=true and tagGallery=true
 * 2. Updates subscription plans with credit allocations:
 *    - Basic: 1000 initial credits
 *    - VIP: 5000 initial credits + 1000 recurring every 6 days
 *
 * Run with: npx tsx scripts/migrate-credits-tags.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration: Credits & Tags System\n");

  // 1. Migrate all existing media to Free + Gallery tags
  console.log("Step 1: Migrating existing media to Free + Gallery tags...");

  const mediaResult = await prisma.mediaContent.updateMany({
    where: {
      // Only update media that doesn't have tags set yet
      tagFree: false,
      tagGallery: false,
    },
    data: {
      tagFree: true,
      tagGallery: true,
    },
  });
  console.log(`  Updated ${mediaResult.count} media items to Free + Gallery\n`);

  // Also set remaining media that might have partial tags
  const allMediaResult = await prisma.mediaContent.updateMany({
    data: {
      tagFree: true,
      tagGallery: true,
    },
  });
  console.log(`  Total media items set to Free + Gallery: ${allMediaResult.count}\n`);

  // 2. Update subscription plans with credit allocations
  console.log("Step 2: Updating subscription plans with credits...");

  // Update or create Basic plan
  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { slug: "basic" },
  });

  if (basicPlan) {
    await prisma.subscriptionPlan.update({
      where: { id: basicPlan.id },
      data: {
        initialCredits: 1000,
        recurringCredits: 0,
        creditIntervalDays: 6,
      },
    });
    console.log("  Updated Basic plan: 1000 initial credits");
  } else {
    console.log("  Basic plan not found - skipping");
  }

  // Update or create VIP plan
  const vipPlan = await prisma.subscriptionPlan.findFirst({
    where: { slug: "vip" },
  });

  if (vipPlan) {
    await prisma.subscriptionPlan.update({
      where: { id: vipPlan.id },
      data: {
        initialCredits: 5000,
        recurringCredits: 1000,
        creditIntervalDays: 6,
      },
    });
    console.log("  Updated VIP plan: 5000 initial + 1000 recurring credits");
  } else {
    console.log("  VIP plan not found - skipping");
  }

  // Also check for any plans with accessTier matching
  const plansByTier = await prisma.subscriptionPlan.findMany({
    where: {
      OR: [
        { accessTier: "BASIC" },
        { accessTier: "VIP" },
      ],
    },
  });

  for (const plan of plansByTier) {
    if (plan.accessTier === "BASIC") {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          initialCredits: 1000,
          recurringCredits: 0,
          creditIntervalDays: 6,
        },
      });
      console.log(`  Updated plan "${plan.name}" (BASIC tier): 1000 initial credits`);
    } else if (plan.accessTier === "VIP") {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          initialCredits: 5000,
          recurringCredits: 1000,
          creditIntervalDays: 6,
        },
      });
      console.log(`  Updated plan "${plan.name}" (VIP tier): 5000 initial + 1000 recurring credits`);
    }
  }

  // 3. Summary
  console.log("\n=== Migration Summary ===");

  const totalMedia = await prisma.mediaContent.count();
  const freeMedia = await prisma.mediaContent.count({ where: { tagFree: true } });
  const galleryMedia = await prisma.mediaContent.count({ where: { tagGallery: true } });

  console.log(`Total media items: ${totalMedia}`);
  console.log(`Media with tagFree: ${freeMedia}`);
  console.log(`Media with tagGallery: ${galleryMedia}`);

  const plans = await prisma.subscriptionPlan.findMany({
    select: {
      name: true,
      accessTier: true,
      initialCredits: true,
      recurringCredits: true,
      creditIntervalDays: true,
    },
  });

  console.log("\nSubscription Plans:");
  for (const plan of plans) {
    console.log(`  - ${plan.name} (${plan.accessTier}): ${plan.initialCredits} initial, ${plan.recurringCredits} recurring every ${plan.creditIntervalDays} days`);
  }

  console.log("\nMigration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
