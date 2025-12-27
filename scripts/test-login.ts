import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function testLogin() {
  const email = "admin@viponly.fun";
  const password = "admin123";

  console.log("Testing login for:", email);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { creatorProfiles: true }
  });

  if (!user) {
    console.log("ERROR: User not found!");
    return;
  }

  console.log("User found:", user.name);
  console.log("passwordHash exists:", !!user.passwordHash);

  if (!user.passwordHash) {
    console.log("ERROR: No password hash set!");
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("Password valid:", isValid);

  if (isValid) {
    console.log("\n✓ Login should work!");
    console.log("  isCreator:", user.isCreator);
    console.log("  creatorSlug:", user.creatorProfiles?.[0]?.slug);
  } else {
    console.log("\n✗ Password mismatch!");
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
