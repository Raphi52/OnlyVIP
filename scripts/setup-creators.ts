import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Configuration des créateurs ===\n');

  // 1. Nettoyer le compte superadmin (admin@onlyvip.com)
  console.log('1. Nettoyage du compte superadmin...');
  await prisma.user.update({
    where: { email: 'admin@onlyvip.com' },
    data: {
      isCreator: false,
    },
  });
  console.log('   ✓ admin@onlyvip.com est maintenant superadmin pur (isCreator: false)\n');

  // 2. Configurer viralstudioshop@gmail.com comme créateur
  console.log('2. Configuration de viralstudioshop@gmail.com comme créateur...');
  const creatorUser = await prisma.user.update({
    where: { email: 'viralstudioshop@gmail.com' },
    data: {
      isCreator: true,
    },
  });
  console.log(`   ✓ ${creatorUser.name} (${creatorUser.email}) est maintenant créateur\n`);

  // 3. Associer les deux créateurs à ce compte
  console.log('3. Association des profils créateurs...');

  await prisma.creator.update({
    where: { slug: 'miacosta' },
    data: {
      userId: creatorUser.id,
      name: 'Mia Costa',
      displayName: 'Mia Costa',
    },
  });
  console.log('   ✓ miacosta → viralstudioshop@gmail.com');

  await prisma.creator.update({
    where: { slug: 'emmarose' },
    data: {
      userId: creatorUser.id,
      name: 'Emma Rose',
      displayName: 'Emma Rose',
    },
  });
  console.log('   ✓ emmarose → viralstudioshop@gmail.com\n');

  // 4. Afficher le résultat final
  console.log('=== Résultat final ===\n');

  const users = await prisma.user.findMany({
    where: { isCreator: true },
    include: { creatorProfiles: true },
  });

  for (const user of users) {
    console.log(`${user.name} (${user.email}):`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Créateurs gérés: ${user.creatorProfiles.map(c => c.slug).join(', ') || 'aucun'}`);
    console.log('');
  }

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { name: true, email: true, isCreator: true },
  });

  console.log('=== Comptes Admin ===');
  for (const admin of admins) {
    console.log(`${admin.name} (${admin.email}) - isCreator: ${admin.isCreator}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
