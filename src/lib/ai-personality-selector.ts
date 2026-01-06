import prisma from "@/lib/prisma";
import { detectLanguage, detectLanguageFromMessages } from "./language-detection";

// Supported tones for conversation detection
export const CONVERSATION_TONES = {
  romantic: "romantic",
  playful: "playful",
  explicit: "explicit",
  casual: "casual",
  demanding: "demanding",
} as const;

export type ConversationTone = keyof typeof CONVERSATION_TONES;

// Keywords for tone detection (multilingual - EN/FR/ES/DE/IT/PT)
const TONE_KEYWORDS: Record<ConversationTone, string[]> = {
  romantic: [
    // English
    "love", "miss you", "beautiful", "gorgeous", "handsome", "baby", "babe",
    "honey", "sweetheart", "darling", "my love", "i love you", "thinking of you",
    "dream", "heart", "forever", "together", "kiss", "hug", "cuddle",
    // French
    "je t'aime", "tu me manques", "belle", "beau", "chéri", "chérie", "mon amour",
    "ma puce", "bisou", "câlin", "je pense à toi",
    // Spanish
    "te amo", "te quiero", "te extraño", "mi amor", "hermosa", "hermoso", "cariño",
    "corazón", "beso", "abrazo", "pienso en ti", "guapo", "guapa", "vida mía",
    // German
    "ich liebe dich", "vermisse dich", "schön", "schatz", "liebling", "mein herz",
    "kuss", "umarmung", "ich denke an dich", "wunderschön",
    // Italian
    "ti amo", "ti voglio bene", "mi manchi", "amore mio", "bella", "bello",
    "tesoro", "cuore", "bacio", "abbraccio", "penso a te",
    // Portuguese
    "te amo", "saudades", "linda", "lindo", "meu amor", "querida", "querido",
    "coração", "beijo", "abraço", "penso em você",
    // Emojis
    "❤️", "💕", "💖", "💗", "💘", "💝", "😍", "🥰", "😘", "💋",
  ],
  playful: [
    // English
    "haha", "lol", "lmao", "rofl", "funny", "tease", "game", "fun", "silly",
    "crazy", "joke", "kidding", "play", "guess", "bet", "dare", "challenge",
    // French
    "mdr", "ptdr", "rigole", "drôle", "taquin", "jeu", "amuse", "blague",
    // Spanish
    "jaja", "jeje", "gracioso", "divertido", "broma", "juego", "loco", "loca",
    "adivina", "reto", "desafío", "chistoso",
    // German
    "haha", "witzig", "lustig", "spaß", "spiel", "verrückt", "scherz", "witz",
    // Italian
    "ahah", "haha", "divertente", "buffo", "gioco", "pazzo", "pazza", "scherzo",
    // Portuguese
    "haha", "kkkk", "rsrs", "engraçado", "brincadeira", "jogo", "louco", "louca",
    // Emojis
    "😂", "🤣", "😜", "😝", "😋", "😏", "😈", "🎮", "🎲", "🎯",
  ],
  explicit: [
    // English
    "sexy", "hot", "nude", "naked", "want you", "need you", "horny", "turn on",
    "naughty", "dirty", "bed", "tonight", "private", "exclusive", "special content",
    // French
    "sexy", "chaud", "nu", "nue", "envie de toi", "coquin", "coquine", "privé",
    // Spanish
    "sexy", "caliente", "desnudo", "desnuda", "te deseo", "te quiero", "travieso",
    "traviesa", "sucio", "sucia", "privado", "exclusivo", "especial",
    // German
    "sexy", "heiß", "nackt", "ich will dich", "unartig", "frech", "privat",
    // Italian
    "sexy", "caldo", "calda", "nudo", "nuda", "ti voglio", "birichino", "privato",
    // Portuguese
    "sexy", "quente", "nu", "nua", "te quero", "safado", "safada", "privado",
    // Emojis
    "🔥", "🥵", "😈", "💦", "🍑", "🍆", "👅", "🫦",
  ],
  casual: [
    // English
    "how are you", "what's up", "hey", "hello", "hi", "good morning", "good night",
    "today", "work", "school", "weekend", "weather", "eat", "food", "movie",
    "music", "friend", "family", "day", "night", "thanks", "thank you",
    // French
    "ça va", "comment vas-tu", "salut", "bonjour", "bonsoir", "bonne nuit",
    "aujourd'hui", "travail", "weekend", "merci",
    // Spanish
    "cómo estás", "qué tal", "hola", "buenos días", "buenas noches",
    "hoy", "trabajo", "fin de semana", "gracias", "amigo", "amiga",
    // German
    "wie geht's", "hallo", "guten morgen", "gute nacht", "heute", "arbeit",
    "wochenende", "danke", "freund", "familie",
    // Italian
    "come stai", "ciao", "buongiorno", "buonanotte", "oggi", "lavoro",
    "fine settimana", "grazie", "amico", "amica",
    // Portuguese
    "como vai", "tudo bem", "olá", "oi", "bom dia", "boa noite",
    "hoje", "trabalho", "fim de semana", "obrigado", "obrigada",
    // Emojis
    "👋", "😊", "🙂", "👍", "☕", "🌞", "🌙",
  ],
  demanding: [
    // English
    "now", "send", "show me", "want", "need", "give me", "where", "when",
    "hurry", "faster", "waiting", "still", "answer", "reply", "respond",
    "why", "how long", "come on", "please", "asap",
    // French
    "maintenant", "envoie", "montre", "veux", "besoin", "donne", "où", "quand",
    "dépêche", "vite", "j'attends", "réponds", "pourquoi",
    // Spanish
    "ahora", "envía", "muéstrame", "quiero", "necesito", "dame", "dónde", "cuándo",
    "rápido", "espero", "contesta", "responde", "por qué",
    // German
    "jetzt", "schick", "zeig mir", "will", "brauche", "gib mir", "wo", "wann",
    "schnell", "warte", "antworte", "warum",
    // Italian
    "adesso", "ora", "invia", "mostrami", "voglio", "ho bisogno", "dammi",
    "dove", "quando", "veloce", "aspetto", "rispondi", "perché",
    // Portuguese
    "agora", "envia", "mostra", "quero", "preciso", "me dá", "onde", "quando",
    "rápido", "espero", "responde", "por quê",
    // Emojis
    "⏰", "⌛", "❗", "❓", "😤", "😠",
  ],
};

// Minimum confidence threshold for tone switch
const TONE_CONFIDENCE_THRESHOLD = 0.4;

// Minimum messages to analyze for tone detection
const MIN_MESSAGES_FOR_TONE = 3;

/**
 * Select a personality for a new conversation using weighted random based on trafficShare
 * If a language is provided, it will prefer personalities matching that language
 */
export async function selectPersonalityForConversation(
  creatorSlug: string,
  options?: { language?: string | null }
): Promise<string | null> {
  // Get all active personalities for this creator
  const personalities = await prisma.creatorAiPersonality.findMany({
    where: {
      creatorSlug,
      isActive: true,
    },
  });

  if (personalities.length === 0) {
    return null; // No personality = AI disabled
  }

  // If language is provided, try to find matching personalities first
  if (options?.language) {
    const languageMatchingPersonalities = personalities.filter(
      (p) => p.language === options.language
    );

    if (languageMatchingPersonalities.length > 0) {
      // Use weighted random among language-matching personalities
      return selectFromPersonalities(languageMatchingPersonalities);
    }

    // Fallback to personalities with no specific language (universal)
    const universalPersonalities = personalities.filter((p) => !p.language);
    if (universalPersonalities.length > 0) {
      return selectFromPersonalities(universalPersonalities);
    }
  }

  // Default: weighted random from all personalities
  return selectFromPersonalities(personalities);
}

/**
 * Helper function to select from a list of personalities using weighted random
 */
function selectFromPersonalities(
  personalities: Array<{ id: string; trafficShare: number }>
): string | null {
  if (personalities.length === 0) {
    return null;
  }

  // Calculate total traffic share
  const totalShare = personalities.reduce((sum, p) => sum + p.trafficShare, 0);

  if (totalShare === 0) {
    return personalities[0].id;
  }

  // Weighted random selection
  const random = Math.random() * totalShare;
  let cumulative = 0;

  for (const personality of personalities) {
    cumulative += personality.trafficShare;
    if (random <= cumulative) {
      return personality.id;
    }
  }

  // Fallback to first personality
  return personalities[0].id;
}

/**
 * Find the best personality for a given language
 */
export async function findPersonalityForLanguage(
  creatorSlug: string,
  language: string
): Promise<string | null> {
  // First try exact language match
  const matchingPersonality = await prisma.creatorAiPersonality.findFirst({
    where: {
      creatorSlug,
      isActive: true,
      language,
    },
    orderBy: {
      trafficShare: "desc",
    },
  });

  if (matchingPersonality) {
    return matchingPersonality.id;
  }

  // Fallback to universal personality (no language set)
  const universalPersonality = await prisma.creatorAiPersonality.findFirst({
    where: {
      creatorSlug,
      isActive: true,
      language: null,
    },
    orderBy: {
      trafficShare: "desc",
    },
  });

  return universalPersonality?.id || null;
}

/**
 * Detect language from fan messages and update fan profile
 */
export async function detectAndStoreFanLanguage(
  fanUserId: string,
  creatorSlug: string,
  messages: string[]
): Promise<string | null> {
  // Detect language from multiple messages for better accuracy
  const detectedLanguage = detectLanguageFromMessages(messages);

  if (detectedLanguage) {
    // Update fan profile with detected language
    await prisma.fanProfile.upsert({
      where: {
        fanUserId_creatorSlug: { fanUserId, creatorSlug },
      },
      update: {
        language: detectedLanguage,
      },
      create: {
        fanUserId,
        creatorSlug,
        language: detectedLanguage,
      },
    });
  }

  return detectedLanguage;
}

/**
 * Check if conversation should switch personality based on language
 */
export async function checkForLanguageSwitch(
  conversationId: string,
  messages: Array<{ text: string | null; senderId: string }>,
  fanUserId: string
): Promise<string | null> {
  // Get conversation details
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      creatorSlug: true,
      aiPersonalityId: true,
      aiPersonality: {
        select: { language: true },
      },
    },
  });

  if (!conversation || !conversation.aiPersonalityId) {
    return null;
  }

  // Get last 5 fan messages for language detection
  const fanMessages = messages
    .filter((m) => m.senderId === fanUserId && m.text)
    .slice(-5)
    .map((m) => m.text!);

  if (fanMessages.length < 2) {
    return null; // Need at least 2 messages for detection
  }

  // Detect language
  const detectedLanguage = detectLanguageFromMessages(fanMessages);

  if (!detectedLanguage) {
    return null;
  }

  // Store in fan profile
  await detectAndStoreFanLanguage(fanUserId, conversation.creatorSlug, fanMessages);

  // Check if current personality matches the language
  const currentPersonalityLanguage = conversation.aiPersonality?.language;

  // If current personality is universal (no language) or matches, no need to switch
  if (!currentPersonalityLanguage || currentPersonalityLanguage === detectedLanguage) {
    return null;
  }

  // Find a personality matching the detected language
  const newPersonalityId = await findPersonalityForLanguage(
    conversation.creatorSlug,
    detectedLanguage
  );

  if (!newPersonalityId || newPersonalityId === conversation.aiPersonalityId) {
    return null;
  }

  return newPersonalityId;
}

/**
 * Detect the dominant tone of a conversation based on recent messages
 */
export function detectConversationTone(
  messages: Array<{ text: string | null; senderId: string }>,
  fanUserId: string
): { tone: ConversationTone | null; confidence: number } {
  // Only analyze fan messages
  const fanMessages = messages
    .filter((m) => m.senderId === fanUserId && m.text)
    .slice(-10); // Last 10 fan messages

  if (fanMessages.length < MIN_MESSAGES_FOR_TONE) {
    return { tone: null, confidence: 0 };
  }

  // Combine all text for analysis
  const combinedText = fanMessages
    .map((m) => m.text!.toLowerCase())
    .join(" ");

  // Count keyword matches per tone
  const toneCounts: Record<ConversationTone, number> = {
    romantic: 0,
    playful: 0,
    explicit: 0,
    casual: 0,
    demanding: 0,
  };

  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    for (const keyword of keywords) {
      // Count occurrences of each keyword
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = combinedText.match(regex);
      if (matches) {
        toneCounts[tone as ConversationTone] += matches.length;
      }
    }
  }

  // Find dominant tone
  let maxCount = 0;
  let dominantTone: ConversationTone | null = null;

  for (const [tone, count] of Object.entries(toneCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantTone = tone as ConversationTone;
    }
  }

  // Calculate confidence (relative to total matches)
  const totalMatches = Object.values(toneCounts).reduce((a, b) => a + b, 0);
  const confidence = totalMatches > 0 ? maxCount / totalMatches : 0;

  // Only return if confidence is above threshold
  if (confidence < TONE_CONFIDENCE_THRESHOLD) {
    return { tone: null, confidence: 0 };
  }

  return { tone: dominantTone, confidence };
}

/**
 * Find the best personality for a given tone
 */
export async function findPersonalityForTone(
  creatorSlug: string,
  tone: ConversationTone
): Promise<string | null> {
  // First, try to find a personality with matching primaryTone
  const matchingPersonality = await prisma.creatorAiPersonality.findFirst({
    where: {
      creatorSlug,
      isActive: true,
      primaryTone: tone,
    },
    orderBy: {
      trafficShare: "desc",
    },
  });

  if (matchingPersonality) {
    return matchingPersonality.id;
  }

  // Fallback: search in toneKeywords
  const personalities = await prisma.creatorAiPersonality.findMany({
    where: {
      creatorSlug,
      isActive: true,
      toneKeywords: { not: null },
    },
  });

  for (const personality of personalities) {
    try {
      const keywords = JSON.parse(personality.toneKeywords || "[]");
      if (Array.isArray(keywords) && keywords.includes(tone)) {
        return personality.id;
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return null;
}

/**
 * Switch personality for a conversation and log the switch
 */
export async function switchPersonality(
  conversationId: string,
  toPersonalityId: string,
  reason: "auto_tone" | "auto_language" | "manual" | "initial_assignment",
  options?: {
    detectedTone?: string;
    detectedLanguage?: string;
    triggeredBy?: string;
  }
): Promise<void> {
  // Get current conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { aiPersonalityId: true },
  });

  const fromPersonalityId = conversation?.aiPersonalityId;

  // Don't log if it's the same personality
  if (fromPersonalityId === toPersonalityId && reason !== "initial_assignment") {
    return;
  }

  // Update conversation and create switch log in transaction
  await prisma.$transaction([
    // Update conversation
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiPersonalityId: toPersonalityId,
        detectedTone: options?.detectedTone || null,
        lastToneCheck: new Date(),
      },
    }),
    // Create switch log
    prisma.personalitySwitch.create({
      data: {
        conversationId,
        fromPersonalityId,
        toPersonalityId,
        reason,
        detectedTone: options?.detectedTone,
        triggeredBy: options?.triggeredBy,
      },
    }),
  ]);
}

/**
 * Check if a conversation should switch personality based on detected tone
 * Returns the new personality ID if a switch should happen, null otherwise
 */
export async function checkForToneSwitch(
  conversationId: string,
  messages: Array<{ text: string | null; senderId: string }>,
  fanUserId: string
): Promise<string | null> {
  // Get conversation details
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      creatorSlug: true,
      aiPersonalityId: true,
      autoToneSwitch: true,
      detectedTone: true,
      lastToneCheck: true,
    },
  });

  if (!conversation || !conversation.autoToneSwitch || !conversation.aiPersonalityId) {
    return null;
  }

  // Don't check too frequently (minimum 5 minutes between checks)
  if (conversation.lastToneCheck) {
    const timeSinceLastCheck = Date.now() - conversation.lastToneCheck.getTime();
    if (timeSinceLastCheck < 5 * 60 * 1000) {
      return null;
    }
  }

  // Detect current tone
  const { tone, confidence } = detectConversationTone(messages, fanUserId);

  if (!tone || tone === conversation.detectedTone) {
    // Update lastToneCheck even if no switch
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastToneCheck: new Date(),
        toneConfidence: confidence,
      },
    });
    return null;
  }

  // Find personality matching the new tone
  const newPersonalityId = await findPersonalityForTone(conversation.creatorSlug, tone);

  if (!newPersonalityId || newPersonalityId === conversation.aiPersonalityId) {
    // Update tone tracking but don't switch
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        detectedTone: tone,
        toneConfidence: confidence,
        lastToneCheck: new Date(),
      },
    });
    return null;
  }

  return newPersonalityId;
}

/**
 * Get personality statistics for analytics
 */
export async function getPersonalityStats(
  creatorSlug: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  switchesByPersonality: Record<string, number>;
  switchesByReason: Record<string, number>;
  switchesByTone: Record<string, number>;
  totalSwitches: number;
}> {
  const whereClause: any = {
    toPersonality: { creatorSlug },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const switches = await prisma.personalitySwitch.findMany({
    where: whereClause,
    include: {
      toPersonality: { select: { name: true } },
    },
  });

  const switchesByPersonality: Record<string, number> = {};
  const switchesByReason: Record<string, number> = {};
  const switchesByTone: Record<string, number> = {};

  for (const s of switches) {
    // By personality
    const name = s.toPersonality?.name || "Unknown";
    switchesByPersonality[name] = (switchesByPersonality[name] || 0) + 1;

    // By reason
    switchesByReason[s.reason] = (switchesByReason[s.reason] || 0) + 1;

    // By tone (if auto_tone)
    if (s.detectedTone) {
      switchesByTone[s.detectedTone] = (switchesByTone[s.detectedTone] || 0) + 1;
    }
  }

  return {
    switchesByPersonality,
    switchesByReason,
    switchesByTone,
    totalSwitches: switches.length,
  };
}
