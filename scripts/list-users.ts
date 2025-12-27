import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isCreator: true }
  });
  console.log('=== USERS ===');
  console.table(users);

  const creators = await prisma.creator.findMany({
    select: { id: true, slug: true, name: true, userId: true }
  });
  console.log('=== CREATORS ===');
  console.table(creators);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
