// Script de diagnostic pour vérifier pourquoi l'IA de Mia ne répond pas
// Usage: npx ts-node scripts/check-mia-ai.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMiaAI() {
  console.log("\n🔍 DIAGNOSTIC IA POUR MIACOSTA\n");
  console.log("=".repeat(50));

  // 1. Check if creator exists
  console.log("\n1️⃣ VÉRIFICATION DU CRÉATEUR");
  const creator = await prisma.creator.findUnique({
    where: { slug: "miacosta" },
    select: {
      id: true,
      slug: true,
      displayName: true,
      userId: true,
      aiResponseDelay: true,
      aiProvider: true,
      aiModel: true,
      agencyId: true,
    },
  });

  if (!creator) {
    console.log("❌ Creator 'miacosta' NOT FOUND!");
    return;
  }

  console.log("✅ Creator trouvé:", creator.displayName);
  console.log("   - ID:", creator.id);
  console.log("   - User ID:", creator.userId);
  console.log("   - Agency ID:", creator.agencyId || "Aucune agence");
  console.log("   - AI Delay:", creator.aiResponseDelay, "secondes");
  console.log("   - AI Provider:", creator.aiProvider || "anthropic (default)");
  console.log("   - AI Model:", creator.aiModel || "claude-haiku (default)");

  // 2. Check AI Personalities
  console.log("\n2️⃣ VÉRIFICATION DES PERSONNALITÉS IA");
  const personalities = await prisma.creatorAiPersonality.findMany({
    where: { creatorSlug: "miacosta" },
    select: {
      id: true,
      name: true,
      isActive: true,
      trafficShare: true,
      primaryTone: true,
      language: true,
      agencyId: true,
    },
  });

  if (personalities.length === 0) {
    console.log("❌ AUCUNE personnalité IA trouvée pour miacosta!");
    console.log("   → L'IA ne peut pas répondre sans personnalité configurée");
  } else {
    console.log(`✅ ${personalities.length} personnalité(s) trouvée(s):`);
    for (const p of personalities) {
      const status = p.isActive ? "✅ ACTIVE" : "❌ INACTIVE";
      console.log(`   - ${p.name} (${status})`);
      console.log(`     ID: ${p.id}`);
      console.log(`     Traffic Share: ${p.trafficShare}%`);
      console.log(`     Tone: ${p.primaryTone || "non défini"}`);
      console.log(`     Language: ${p.language || "tous"}`);
    }

    const activeCount = personalities.filter((p) => p.isActive).length;
    if (activeCount === 0) {
      console.log("\n⚠️  PROBLÈME: Aucune personnalité ACTIVE!");
    }
  }

  // 3. Check recent conversations
  console.log("\n3️⃣ VÉRIFICATION DES CONVERSATIONS RÉCENTES");
  const conversations = await prisma.conversation.findMany({
    where: { creatorSlug: "miacosta" },
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      aiMode: true,
      aiPersonalityId: true,
      updatedAt: true,
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              isCreator: true,
            },
          },
        },
      },
    },
  });

  if (conversations.length === 0) {
    console.log("❌ Aucune conversation trouvée pour miacosta");
  } else {
    console.log(`✅ ${conversations.length} conversations récentes:`);
    for (const conv of conversations) {
      console.log(`\n   Conversation ${conv.id.slice(0, 8)}...`);
      console.log(`   - AI Mode: ${conv.aiMode || "auto"}`);
      console.log(`   - AI Personality ID: ${conv.aiPersonalityId || "NON ASSIGNÉ"}`);
      console.log(`   - Participants:`);
      for (const p of conv.participants) {
        const isCreatorTag = p.user.isCreator ? " [CREATOR]" : "";
        console.log(`     • ${p.user.name}${isCreatorTag}`);
      }

      if (conv.aiMode === "disabled") {
        console.log("   ⚠️  AI DÉSACTIVÉE pour cette conversation!");
      }
    }
  }

  // 4. Check AI Response Queue
  console.log("\n4️⃣ VÉRIFICATION DE LA QUEUE AI");
  const queueItems = await prisma.aiResponseQueue.findMany({
    where: { creatorSlug: "miacosta" },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      error: true,
      createdAt: true,
      processedAt: true,
    },
  });

  if (queueItems.length === 0) {
    console.log("❌ Aucun élément dans la queue AI");
    console.log("   → Les messages ne sont peut-être pas ajoutés à la queue");
  } else {
    console.log(`✅ ${queueItems.length} éléments récents dans la queue:`);
    for (const item of queueItems) {
      const statusEmoji =
        item.status === "COMPLETED"
          ? "✅"
          : item.status === "FAILED"
            ? "❌"
            : item.status === "PENDING"
              ? "⏳"
              : "🔄";
      console.log(`\n   ${statusEmoji} ${item.status}`);
      console.log(`   - ID: ${item.id.slice(0, 8)}...`);
      console.log(`   - Créé: ${item.createdAt.toISOString()}`);
      if (item.processedAt) {
        console.log(`   - Traité: ${item.processedAt.toISOString()}`);
      }
      if (item.error) {
        console.log(`   - ERREUR: ${item.error}`);
      }
    }
  }

  // 5. Check user who might be sending messages
  console.log("\n5️⃣ VÉRIFICATION DE L'UTILISATEUR QUI ENVOIE");
  console.log("   ⚠️  Si tu es connecté en tant que CREATOR, l'IA ne répondra pas!");
  console.log("   → Le code vérifie: !senderUser?.isCreator");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 RÉSUMÉ DES PROBLÈMES POTENTIELS:\n");

  const issues: string[] = [];

  if (!creator) {
    issues.push("❌ Creator miacosta non trouvé");
  }

  if (personalities.length === 0) {
    issues.push("❌ Aucune personnalité IA configurée");
  } else if (personalities.filter((p) => p.isActive).length === 0) {
    issues.push("❌ Aucune personnalité IA ACTIVE");
  }

  const disabledConvs = conversations.filter((c) => c.aiMode === "disabled");
  if (disabledConvs.length > 0) {
    issues.push(`⚠️  ${disabledConvs.length} conversation(s) avec AI désactivée`);
  }

  const failedQueue = queueItems.filter((q) => q.status === "FAILED");
  if (failedQueue.length > 0) {
    issues.push(`⚠️  ${failedQueue.length} message(s) échoué(s) dans la queue`);
  }

  if (issues.length === 0) {
    console.log("✅ Aucun problème évident détecté!");
    console.log("   Vérifie que tu n'es pas connecté comme CREATOR quand tu testes.");
  } else {
    for (const issue of issues) {
      console.log(issue);
    }
  }

  console.log("\n");
}

checkMiaAI()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
