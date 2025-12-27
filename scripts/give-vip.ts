import prisma from "../src/lib/prisma";

async function main() {
  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: "admin@onlyvip.com" },
  });

  if (!admin) {
    console.log("Admin not found");
    return;
  }

  // Find VIP plan
  let vipPlan = await prisma.subscriptionPlan.findFirst({
    where: { accessTier: "VIP" },
  });

  if (!vipPlan) {
    // Create VIP plan if it doesn't exist
    vipPlan = await prisma.subscriptionPlan.create({
      data: {
        name: "VIP",
        slug: "vip",
        description: "Full VIP access",
        monthlyPrice: 29.99,
        annualPrice: 299.99,
        accessTier: "VIP",
        canMessage: true,
        features: JSON.stringify([
          "All content",
          "Direct messages",
          "Priority support",
        ]),
        isPopular: true,
      },
    });
    console.log("Created VIP plan");
  }

  // Create lifetime subscription (100 years)
  const now = new Date();
  const lifetime = new Date();
  lifetime.setFullYear(lifetime.getFullYear() + 100);

  // Delete existing subscription if any
  await prisma.subscription.deleteMany({
    where: { userId: admin.id },
  });

  await prisma.subscription.create({
    data: {
      userId: admin.id,
      planId: vipPlan.id,
      status: "ACTIVE",
      paymentProvider: "MANUAL",
      billingInterval: "ANNUAL",
      currentPeriodStart: now,
      currentPeriodEnd: lifetime,
      metadata: JSON.stringify({ type: "lifetime", grantedBy: "system" }),
    },
  });

  console.log("\n========================================");
  console.log("Admin VIP lifetime subscription created!");
  console.log("========================================");
  console.log(`User: ${admin.email}`);
  console.log(`Plan: ${vipPlan.name}`);
  console.log(`Expires: ${lifetime.toLocaleDateString()} (100 years)`);
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
