import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateWithClaude, type LLMContext } from "@/lib/llm-router";

/**
 * GET /api/conversations/[id]/personal-note
 * Get the personal note for a fan in this conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const isCreator = (session.user as any)?.isCreator;
    const isChatter = (session.user as any)?.role === "CHATTER";
    const chatterId = (session.user as any)?.chatterId;

    // Get conversation to find fan and creator
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
        creator: { select: { userId: true, slug: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify access
    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    let hasAccess = isParticipant;

    if (isChatter && chatterId) {
      const assignment = await prisma.chatterCreatorAssignment.findFirst({
        where: { chatterId, creatorSlug: conversation.creatorSlug },
      });
      hasAccess = hasAccess || !!assignment;
    }

    if (isCreator && conversation.creator?.userId === userId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the fan (non-creator participant)
    const creatorUserId = conversation.creator?.userId;
    const fanParticipant = conversation.participants.find((p) => p.userId !== creatorUserId);

    if (!fanParticipant) {
      return NextResponse.json({ error: "Fan not found" }, { status: 404 });
    }

    const fanUserId = fanParticipant.userId;
    const creatorSlug = conversation.creatorSlug;

    // Get fan profile with personal note
    const fanProfile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
      select: {
        personalNote: true,
        personalNoteUpdatedAt: true,
        personalNoteUpdatedBy: true,
      },
    });

    // Get all memories for display
    const memories = await prisma.fanMemory.findMany({
      where: {
        fanUserId,
        creatorSlug,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      personalNote: fanProfile?.personalNote || null,
      updatedAt: fanProfile?.personalNoteUpdatedAt || null,
      updatedBy: fanProfile?.personalNoteUpdatedBy || null,
      memories: memories.map((m) => ({
        id: m.id,
        category: m.category,
        key: m.key,
        value: m.value,
        confidence: m.confidence,
        extractedBy: m.extractedBy,
        updatedAt: m.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching personal note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/conversations/[id]/personal-note
 * Update the personal note for a fan (manual edit)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const isCreator = (session.user as any)?.isCreator;
    const isChatter = (session.user as any)?.role === "CHATTER";
    const chatterId = (session.user as any)?.chatterId;

    const body = await request.json();
    const { personalNote } = body;

    if (typeof personalNote !== "string") {
      return NextResponse.json({ error: "Invalid personal note" }, { status: 400 });
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
        creator: { select: { userId: true, slug: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify access (only creator or assigned chatter can edit)
    let hasAccess = false;
    let updatedBy = "manual";

    if (isCreator && conversation.creator?.userId === userId) {
      hasAccess = true;
      updatedBy = "creator";
    }

    if (isChatter && chatterId) {
      const assignment = await prisma.chatterCreatorAssignment.findFirst({
        where: { chatterId, creatorSlug: conversation.creatorSlug },
      });
      if (assignment) {
        hasAccess = true;
        updatedBy = chatterId;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the fan
    const creatorUserId = conversation.creator?.userId;
    const fanParticipant = conversation.participants.find((p) => p.userId !== creatorUserId);

    if (!fanParticipant) {
      return NextResponse.json({ error: "Fan not found" }, { status: 404 });
    }

    const fanUserId = fanParticipant.userId;
    const creatorSlug = conversation.creatorSlug;

    // Update or create fan profile with personal note
    const fanProfile = await prisma.fanProfile.upsert({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
      update: {
        personalNote,
        personalNoteUpdatedAt: new Date(),
        personalNoteUpdatedBy: updatedBy,
      },
      create: {
        fanUserId,
        creatorSlug,
        personalNote,
        personalNoteUpdatedAt: new Date(),
        personalNoteUpdatedBy: updatedBy,
      },
    });

    return NextResponse.json({
      success: true,
      personalNote: fanProfile.personalNote,
      updatedAt: fanProfile.personalNoteUpdatedAt,
      updatedBy: fanProfile.personalNoteUpdatedBy,
    });
  } catch (error) {
    console.error("Error updating personal note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[id]/personal-note
 * Auto-generate personal note using AI from memories
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const isCreator = (session.user as any)?.isCreator;
    const isChatter = (session.user as any)?.role === "CHATTER";
    const chatterId = (session.user as any)?.chatterId;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
        creator: { select: { userId: true, slug: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify access
    let hasAccess = false;

    if (isCreator && conversation.creator?.userId === userId) {
      hasAccess = true;
    }

    if (isChatter && chatterId) {
      const assignment = await prisma.chatterCreatorAssignment.findFirst({
        where: { chatterId, creatorSlug: conversation.creatorSlug },
      });
      if (assignment) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the fan
    const creatorUserId = conversation.creator?.userId;
    const fanParticipant = conversation.participants.find((p) => p.userId !== creatorUserId);

    if (!fanParticipant) {
      return NextResponse.json({ error: "Fan not found" }, { status: 404 });
    }

    const fanUserId = fanParticipant.userId;
    const creatorSlug = conversation.creatorSlug;

    // Get fan user info
    const fanUser = await prisma.user.findUnique({
      where: { id: fanUserId },
      select: { name: true, email: true, createdAt: true },
    });

    // Get all memories
    const memories = await prisma.fanMemory.findMany({
      where: {
        fanUserId,
        creatorSlug,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get recent messages for context
    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: fanUserId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { text: true, createdAt: true },
    });

    // Get transaction history
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId: fanUserId,
        amount: { lt: 0 },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { type: true, amount: true, description: true, createdAt: true },
    });

    // Get fan profile
    const fanProfile = await prisma.fanProfile.findUnique({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
    });

    // Build context for AI
    const memoryContext = memories.map((m) => `${m.key}: ${m.value}`).join("\n");
    const messageContext = recentMessages
      .slice(0, 10)
      .map((m) => m.text)
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `Tu es un assistant qui crée des notes personnelles sur des fans pour aider les créateurs/chatters à personnaliser leurs conversations.

Crée une note personnelle CONCISE et UTILE qui résume tout ce qu'on sait sur ce fan.

Format souhaité (utilise les infos disponibles):
- Prénom ou pseudo
- Age et localisation si connus
- Travail/profession si connu
- Centres d'intérêt
- Personnalité/style de communication
- Historique d'achat (VIP, acheteur régulier, nouveau, etc.)
- Toute info importante pour personnaliser la conversation

Écris en français, de manière naturelle et concise (max 200 mots).
Si peu d'infos sont disponibles, indique juste ce qu'on sait.
Ne fabrique pas d'informations, utilise uniquement les données fournies.`;

    const userPrompt = `INFORMATIONS CONNUES SUR LE FAN:

Nom utilisateur: ${fanUser?.name || "Inconnu"}
Membre depuis: ${fanUser?.createdAt ? new Date(fanUser.createdAt).toLocaleDateString("fr-FR") : "Inconnu"}

MEMOIRES EXTRAITES:
${memoryContext || "Aucune mémoire extraite"}

PROFIL:
- Total dépensé: ${fanProfile?.totalSpent || 0} crédits
- Messages échangés: ${fanProfile?.totalMessages || 0}
- Niveau qualité: ${fanProfile?.qualityTier || "unknown"}
- Score qualité: ${fanProfile?.qualityScore || 0}/100

DERNIERS MESSAGES DU FAN:
${messageContext || "Pas de messages récents"}

TRANSACTIONS RÉCENTES:
${transactions.length > 0 ? transactions.map((t) => `- ${t.type}: ${Math.abs(t.amount)} crédits - ${t.description || ""}`).join("\n") : "Aucune transaction"}

Génère une note personnelle utile:`;

    // Generate with AI
    const llmContext: LLMContext = { conversationType: "normal" };
    const response = await generateWithClaude(systemPrompt, userPrompt, llmContext);

    const generatedNote = response.content.trim();

    // Save the generated note
    const updatedProfile = await prisma.fanProfile.upsert({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
      update: {
        personalNote: generatedNote,
        personalNoteUpdatedAt: new Date(),
        personalNoteUpdatedBy: "ai",
      },
      create: {
        fanUserId,
        creatorSlug,
        personalNote: generatedNote,
        personalNoteUpdatedAt: new Date(),
        personalNoteUpdatedBy: "ai",
      },
    });

    return NextResponse.json({
      success: true,
      personalNote: updatedProfile.personalNote,
      updatedAt: updatedProfile.personalNoteUpdatedAt,
      updatedBy: "ai",
    });
  } catch (error) {
    console.error("Error generating personal note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
