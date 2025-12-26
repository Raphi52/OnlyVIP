import prisma from "../src/lib/prisma";

async function main() {
  // List users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });
  console.log("Users:", users);

  // Find VIP plan
  const vipPlan = await prisma.subscriptionPlan.findFirst({
    where: { accessTier: "VIP" }
  });
  console.log("VIP Plan:", vipPlan);

  if (users.length > 0 && vipPlan) {
    // Update the last user (newest account) to VIP
    const lastUser = users[users.length - 1];

    // Delete existing subscription
    await prisma.subscription.deleteMany({
      where: { userId: lastUser.id }
    });

    // Create new subscription
    const sub = await prisma.subscription.create({
      data: {
        userId: lastUser.id,
        planId: vipPlan.id,
        status: "ACTIVE",
        paymentProvider: "MANUAL",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    console.log(`User ${lastUser.name} (${lastUser.email}) is now VIP!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
