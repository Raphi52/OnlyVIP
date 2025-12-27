import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@onlyvip.com";
  const password = "admin123"; // Change this!
  const hashedPassword = await bcrypt.hash(password, 10);

  // Find existing miacosta creator
  const existingCreator = await prisma.creator.findUnique({
    where: { slug: "miacosta" },
  });

  if (!existingCreator) {
    console.log("Creator 'miacosta' not found. Creating new one...");
  }

  // Create or update admin user linked to miacosta creator
  const adminUser = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      isCreator: true,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    },
    update: {
      name: "Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      isCreator: true,
    },
  });

  // Link creator to user if exists
  if (existingCreator) {
    await prisma.creator.update({
      where: { id: existingCreator.id },
      data: { userId: adminUser.id },
    });
    console.log("Linked creator 'miacosta' to admin user");
  } else {
    // Create creator if doesn't exist
    await prisma.creator.create({
      data: {
        slug: "miacosta",
        name: "miacosta",
        displayName: "Mia Costa",
        bio: "Welcome to my exclusive page",
        userId: adminUser.id,
      },
    });
    console.log("Created new creator 'miacosta'");
  }

  console.log("\n========================================");
  console.log("Admin account created successfully!");
  console.log("========================================");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log("========================================");
  console.log("\nLogin at: /auth/login");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
