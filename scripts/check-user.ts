import prisma from "../src/lib/prisma";

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@onlyvip.com" },
    include: { creatorProfiles: true }
  });

  if (user) {
    console.log("User found:");
    console.log("  ID:", user.id);
    console.log("  Email:", user.email);
    console.log("  Name:", user.name);
    console.log("  isCreator:", user.isCreator);
    console.log("  passwordHash:", user.passwordHash ? "SET" : "NOT SET");
    console.log("  creatorProfiles:", user.creatorProfiles?.[0]?.slug || "NOT LINKED");
  } else {
    console.log("User NOT found!");
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
