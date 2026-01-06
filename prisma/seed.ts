import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user (Mia Costa)
  const adminUser = await prisma.user.upsert({
    where: { id: "admin" },
    update: {
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    },
    create: {
      id: "admin",
      name: "Mia Costa",
      email: "mia@viponly.fun",
      role: "ADMIN",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    },
  });

  console.log("Created admin user:", adminUser);

  // Create subscription plans - Both Basic and VIP can message
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "basic" },
    update: {
      canMessage: true, // Ensure messaging is enabled
      accessTier: "BASIC",
    },
    create: {
      name: "BASIC",
      slug: "basic",
      description: "Access to basic content library",
      monthlyPrice: 9.99,
      annualPrice: 95.88,
      currency: "USD",
      accessTier: "BASIC",
      canMessage: true, // Both Basic and VIP can message
      features: JSON.stringify([
        "Access to basic content library",
        "Direct messaging",
        "Weekly new content",
        "HD quality downloads",
        "Email support",
      ]),
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
  });

  const vipPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "vip" },
    update: {
      canMessage: true, // Ensure messaging is enabled
      accessTier: "VIP",
    },
    create: {
      name: "VIP",
      slug: "vip",
      description: "Ultimate experience with full access",
      monthlyPrice: 29.99,
      annualPrice: 287.88,
      currency: "USD",
      accessTier: "VIP",
      canMessage: true,
      features: JSON.stringify([
        "Full content access",
        "4K quality downloads",
        "Unlimited downloads",
        "Direct messaging",
        "Early access to new content",
        "Exclusive VIP-only content",
        "Behind-the-scenes access",
        "Priority support",
      ]),
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  console.log("Created subscription plans:", { basicPlan, vipPlan });

  // Create default categories
  const categories = [
    { name: "Photos", slug: "photos", description: "Photo collections", sortOrder: 1 },
    { name: "Videos", slug: "videos", description: "Video content", sortOrder: 2 },
    { name: "Exclusive", slug: "exclusive", description: "VIP exclusive content", sortOrder: 3 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Created categories");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
