import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Nettoyage des rôles ===\n');

  // 1. Mettre tous les users en USER sauf admin@onlyvip.com
  console.log('1. Reset de tous les rôles à USER...');
  await prisma.user.updateMany({
    where: {
      email: { not: 'admin@onlyvip.com' }
    },
    data: {
      role: 'USER',
    },
  });

  // 2. S'assurer que admin@onlyvip.com est ADMIN
  console.log('2. Configuration de admin@onlyvip.com comme seul ADMIN...');
  await prisma.user.update({
    where: { email: 'admin@onlyvip.com' },
    data: {
      role: 'ADMIN',
      isCreator: false,
    },
  });

  // 3. Garder viralstudioshop@gmail.com comme créateur
  console.log('3. Configuration de viralstudioshop@gmail.com comme créateur...');
  await prisma.user.update({
    where: { email: 'viralstudioshop@gmail.com' },
    data: {
      isCreator: true,
    },
  });

  // 4. Afficher le résultat
  console.log('\n=== Résultat ===\n');

  const users = await prisma.user.findMany({
    include: { creatorProfiles: { select: { slug: true, name: true } } },
    orderBy: { role: 'asc' },
  });

  console.log('| Email | Nom | Rôle | isCreator | Modèles |');
  console.log('|-------|-----|------|-----------|---------|');
  for (const user of users) {
    const models = user.creatorProfiles.map(c => c.slug).join(', ') || '-';
    console.log(`| ${user.email} | ${user.name} | ${user.role} | ${user.isCreator} | ${models} |`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
