import prisma from "@/lib/prisma";

// System message types
export type SystemMessageType =
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "WELCOME"
  | "PAYOUT_COMPLETED"
  | "SUBSCRIPTION_REMINDER";

// Get or create a system user for VIPonly
async function getOrCreateSystemUser(): Promise<string> {
  const SYSTEM_EMAIL = "system@viponly.fun";

  let systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_EMAIL },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_EMAIL,
        name: "VIPonly",
        role: "ADMIN",
        image: "/viponly-logo.png",
      },
    });
  }

  return systemUser.id;
}

// Get or create a system conversation between VIPonly and a user
async function getOrCreateSystemConversation(
  userId: string,
  creatorSlug: string = "system"
): Promise<string> {
  const systemUserId = await getOrCreateSystemUser();

  // Check if conversation already exists
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      creatorSlug: "system",
      participants: {
        every: {
          userId: {
            in: [systemUserId, userId],
          },
        },
      },
    },
    include: {
      participants: true,
    },
  });

  // Verify both users are in the conversation
  if (existingConversation) {
    const participantIds = existingConversation.participants.map(p => p.userId);
    if (participantIds.includes(systemUserId) && participantIds.includes(userId)) {
      return existingConversation.id;
    }
  }

  // Create new system conversation
  const conversation = await prisma.conversation.create({
    data: {
      creatorSlug: "system",
      aiMode: "disabled",
      participants: {
        create: [
          { userId: systemUserId },
          { userId: userId },
        ],
      },
    },
  });

  return conversation.id;
}

// Send a system message to a user
export async function sendSystemMessage({
  userId,
  text,
  messageType,
}: {
  userId: string;
  text: string;
  messageType: SystemMessageType;
}): Promise<void> {
  try {
    const systemUserId = await getOrCreateSystemUser();
    const conversationId = await getOrCreateSystemConversation(userId);

    await prisma.message.create({
      data: {
        conversationId,
        senderId: systemUserId,
        receiverId: userId,
        text,
        isSystemMessage: true,
        systemMessageType: messageType,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    console.log(`System message sent to user ${userId}: ${messageType}`);
  } catch (error) {
    console.error("Failed to send system message:", error);
    throw error;
  }
}

// Pre-defined system messages
export const SYSTEM_MESSAGES = {
  VERIFICATION_APPROVED: (creatorName: string) => `🎉 Félicitations ${creatorName} !

Votre vérification d'identité a été approuvée avec succès ! Vous êtes maintenant un créateur vérifié sur VIPonly.

✅ Badge de vérification activé
✅ Accès complet aux fonctionnalités premium
✅ Vos documents ont été supprimés pour votre sécurité (RGPD)

Bienvenue dans la communauté VIPonly ! 🌟`,

  VERIFICATION_REJECTED: (reason: string) => `❌ Vérification d'identité refusée

Malheureusement, votre demande de vérification n'a pas pu être approuvée.

Raison : ${reason}

Vos documents ont été supprimés pour votre sécurité. Vous pouvez soumettre une nouvelle demande avec des documents plus clairs.

Si vous avez des questions, contactez-nous à support@viponly.fun`,

  WELCOME: (name: string) => `👋 Bienvenue sur VIPonly, ${name} !

Nous sommes ravis de vous accueillir sur notre plateforme.

Pour commencer :
1. Complétez votre profil
2. Vérifiez votre identité
3. Ajoutez votre contenu

À bientôt ! 🌟`,
};
