import prisma from "../src/lib/prisma";

async function main() {
  // Create admin user if doesn't exist
  const adminUser = await prisma.user.upsert({
    where: { email: "mia@miacosta.com" },
    create: {
      email: "mia@miacosta.com",
      name: "Mia Costa",
      role: "ADMIN",
      image: "/mia-avatar.jpg",
    },
    update: {
      role: "ADMIN",
    }
  });

  console.log("Admin user created/updated:", adminUser);
  console.log("\nAdd this to your .env file:");
  console.log(`ADMIN_USER_ID="${adminUser.id}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
