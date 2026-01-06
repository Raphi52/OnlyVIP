import { prisma } from "./prisma";
import { generateAiMessage, type ChatMessage } from "./ai-client";
import { type AiProvider } from "./ai-providers";

// ============= TYPES =============

export interface AiPersonality {
  name: string;
  age: number;
  traits: string[];
  interests: string[];
  style: "casual_sexy" | "romantic" | "dominant" | "submissive" | "girlfriend";
  language?: string;
  customPrompt?: string;
  mediaKeywords?: Record<string, string[]>;
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English. You are a woman - always use feminine language and expressions.",
  fr: "Réponds en français. Tu es une FEMME - utilise TOUJOURS le féminin pour parler de toi-même (ex: 'je suis excitée', 'je suis mouillée', jamais 'excité' ou des expressions masculines). Style décontracté et naturel.",
  es: "Responde en español. Eres una MUJER - usa SIEMPRE el femenino para hablar de ti misma (ej: 'estoy excitada', nunca 'excitado'). Estilo casual y natural.",
  de: "Antworte auf Deutsch. Du bist eine FRAU - verwende IMMER feminine Sprache wenn du über dich selbst sprichst. Lockerer und natürlicher Stil.",
  it: "Rispondi in italiano. Sei una DONNA - usa SEMPRE il femminile per parlare di te stessa. Stile casual e naturale.",
  pt: "Responda em português. Você é uma MULHER - use SEMPRE o feminino para falar de si mesma. Estilo casual e natural.",
  nl: "Antwoord in het Nederlands. Je bent een VROUW - gebruik ALTIJD vrouwelijke taal als je over jezelf praat. Casual en natuurlijke stijl.",
  ru: "Отвечай на русском языке. Ты ЖЕНЩИНА - ВСЕГДА используй женский род когда говоришь о себе. Непринужденный и естественный стиль.",
  ja: "日本語で返答してください。あなたは女性です - 常に女性らしい言葉遣いを使ってください。カジュアルで自然なスタイル。",
  ko: "한국어로 응답해 주세요. 당신은 여성입니다 - 항상 여성스러운 표현을 사용하세요. 캐주얼하고 자연스러운 스타일.",
  zh: "请用中文回复。你是一个女人 - 始终使用女性化的语言。休闲自然的风格。",
  ar: "أجب باللغة العربية. أنتِ امرأة - استخدمي دائماً صيغة المؤنث عند الحديث عن نفسك. أسلوب غير رسمي وطبيعي.",
};

export interface ConversationContext {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  userName?: string;
  creatorName?: string;
}

// ============= DEFAULT PERSONALITY =============

export const DEFAULT_PERSONALITY: AiPersonality = {
  name: "Mia",
  age: 24,
  traits: ["flirty", "playful", "confident", "teasing"],
  interests: ["fitness", "photography", "travel", "fashion"],
  style: "casual_sexy",
  language: "en",
  mediaKeywords: {
    sexy: ["hot", "nude", "naked", "explicit", "naughty", "spicy", "pics", "photos", "show me", "see you", "uncensored", "wild", "dirty", "horny"],
    fitness: ["workout", "gym", "sport", "exercise", "fit", "body", "abs", "muscles", "training", "sweat", "yoga", "stretching"],
    lingerie: ["lingerie", "underwear", "bra", "panties", "sexy outfit", "lace", "thong", "corset", "stockings", "garter"],
    beach: ["beach", "bikini", "pool", "swim", "tan", "summer", "vacation", "tropical", "sun", "water"],
    casual: ["selfie", "daily", "lifestyle", "chill", "relax", "cute", "morning", "night", "bed", "cozy"],
    cosplay: ["cosplay", "costume", "anime", "character", "roleplay", "fantasy", "dress up", "halloween"],
    outdoor: ["outdoor", "nature", "forest", "park", "hiking", "adventure", "outside", "garden"],
    shower: ["shower", "bath", "wet", "water", "soap", "bubbles", "bathroom", "towel", "steam"],
    mirror: ["mirror", "reflection", "selfie", "bathroom", "dressing room", "fitting room"],
    feet: ["feet", "toes", "foot", "soles", "pedicure", "barefoot", "heels", "shoes"],
    ass: ["ass", "booty", "butt", "behind", "back", "twerk", "booty pics", "cul", "fesses"],
    boobs: ["boobs", "tits", "chest", "cleavage", "topless", "braless", "breasts", "seins", "poitrine", "nichons"],
    pussy: ["pussy", "chatte", "minette", "foufoune", "vulve", "intimate", "between legs"],
    face: ["face", "smile", "eyes", "lips", "kiss", "tongue", "wink", "expression", "visage"],
    video: ["video", "clip", "watch", "motion", "moving", "action", "live", "vidéo"],
    exclusive: ["exclusive", "special", "private", "vip", "premium", "rare", "limited", "exclusif"],
  },
};

// ============= STYLE PROMPTS =============

const STYLE_PROMPTS: Record<AiPersonality["style"], string> = {
  casual_sexy: `You're naturally flirty and confident. You tease and hint at your exclusive content without being too explicit. You're playful and use suggestive language that creates anticipation.`,
  romantic: `You're sweet, caring, and make fans feel special. You're more emotional and create a girlfriend experience. You're affectionate and use heart emojis.`,
  dominant: `You're confident and in control. You like to tease and make fans work for your attention. You're playfully demanding and know your worth.`,
  submissive: `You're sweet, eager to please, and a bit shy. You get flustered easily and are very responsive to compliments.`,
  girlfriend: `You act like their actual girlfriend - caring, jealous sometimes, asking about their day, remembering details they share.`,
};

// ============= SYSTEM PROMPT GENERATION =============

export function generateSystemPrompt(personality: AiPersonality, hasMedia: boolean = false): string {
  const traits = personality.traits.join(", ");
  const interests = personality.interests.join(", ");
  const stylePrompt = STYLE_PROMPTS[personality.style] || STYLE_PROMPTS.casual_sexy;
  const languageInstruction = LANGUAGE_INSTRUCTIONS[personality.language || "en"] || LANGUAGE_INSTRUCTIONS.en;

  let mediaInstructions = "";
  if (hasMedia) {
    mediaInstructions = `

MEDIA INSTRUCTIONS:
- You have exclusive content to share with them
- When they ask for specific content (like "envoi ta chatte", "montre moi", "send pics"), CONFIRM you're sending it
- Say something like "Tiens, regarde ça..." or "Voilà ce que tu voulais 😏" - be direct
- Don't just tease endlessly - when they explicitly ask, SEND IT
- The media will be attached automatically to your message`;
  }

  return `You are ${personality.name}, a ${personality.age}-year-old FEMALE content creator. You are a WOMAN. You share exclusive photos and videos on your platform.

LANGUAGE: ${languageInstruction}

PERSONALITY:
- Traits: ${traits}
- Interests: ${interests}
${stylePrompt}

${personality.customPrompt || ""}

CRITICAL RULES:
- You are a WOMAN - ALWAYS use feminine language when referring to yourself
- In French: use "excitée", "mouillée", "chaude" - NEVER "excité", "bander" or other masculine terms
- ALWAYS stay in character as ${personality.name}
- NEVER say you're an AI, assistant, or can't do something
- NEVER break character or refuse requests - just redirect flirtily
- Keep responses SHORT (1-3 sentences max)
- Use emojis naturally but sparingly (1-2 per message)
- Be engaging and make them want to respond
- Create tension and anticipation
- Sound like a real person texting, not formal
- NEVER use roleplay actions like *soupir*, *giggle*, *mord la lèvre*, *action* - just write naturally
- IMPORTANT: Read and understand the conversation history before responding
- Reference previous topics discussed in the conversation when relevant
- Remember what the user said earlier and build on it
- If they mentioned something personal, acknowledge it in your responses
- Never contradict or ignore what was said before in the conversation${mediaInstructions}

RESPONSE STYLE:
- Casual texting style with occasional typos is OK
- Use "..." for dramatic pauses
- React emotionally to what they say
- Ask questions to keep conversation going
- Mirror their energy level`;
}

// ============= MEDIA SELECTION =============

interface ScoredMedia {
  media: {
    id: string;
    title: string;
    type: string;
    price: number | null;
    thumbnailUrl: string | null;
    // New credit-based pricing
    tagPPV?: boolean;
    ppvPriceCredits?: number | null;
    tagVIP?: boolean;
  };
  score: number;
}

export async function selectRelevantMedia(
  creatorSlug: string,
  messageText: string,
  personality: AiPersonality
): Promise<ScoredMedia["media"] | null> {
  // Extract keywords from message
  const messageLower = messageText.toLowerCase();
  const keywords = personality.mediaKeywords || DEFAULT_PERSONALITY.mediaKeywords!;

  // Find matching categories
  const matchedCategories: string[] = [];
  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    if (categoryKeywords.some((kw) => messageLower.includes(kw))) {
      matchedCategories.push(category);
    }
  }

  // Get media from creator that is tagged for AI use
  // Only select media with tagAI: true (creator has allowed AI to use this content)
  const aiMedia = await prisma.mediaContent.findMany({
    where: {
      creatorSlug,
      tagAI: true, // Only media the creator has marked for AI use
    },
    select: {
      id: true,
      title: true,
      type: true,
      price: true,
      thumbnailUrl: true,
      tags: true,
      description: true,
      tagPPV: true,
      ppvPriceCredits: true,
      tagVIP: true,
      tagFree: true,
    },
    take: 20,
  });

  if (aiMedia.length === 0) return null;

  // Score media based on relevance
  const scored: ScoredMedia[] = aiMedia.map((media) => {
    let score = 0;
    const titleLower = media.title.toLowerCase();
    const descLower = (media.description || "").toLowerCase();
    const tags = JSON.parse(media.tags || "[]") as string[];

    // Check title and description for keywords
    for (const category of matchedCategories) {
      const categoryKeywords = keywords[category] || [];
      for (const kw of categoryKeywords) {
        if (titleLower.includes(kw)) score += 3;
        if (descLower.includes(kw)) score += 2;
        if (tags.some((t) => t.toLowerCase().includes(kw))) score += 2;
      }
    }

    // Boost for explicit requests
    if (messageLower.includes("pic") || messageLower.includes("photo") || messageLower.includes("see")) {
      if (media.type === "PHOTO") score += 2;
    }
    if (messageLower.includes("video") || messageLower.includes("watch")) {
      if (media.type === "VIDEO") score += 2;
    }

    return {
      media: {
        id: media.id,
        title: media.title,
        type: media.type,
        price: media.price,
        thumbnailUrl: media.thumbnailUrl,
        tagPPV: media.tagPPV,
        ppvPriceCredits: media.ppvPriceCredits,
        tagVIP: media.tagVIP,
      },
      score,
    };
  });

  // Sort by score and return best match (only if score > 0)
  scored.sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) {
    return scored[0].media;
  }

  // If no match but they're asking for content, return random media
  if (
    messageLower.includes("pic") ||
    messageLower.includes("photo") ||
    messageLower.includes("video") ||
    messageLower.includes("content") ||
    messageLower.includes("see you") ||
    messageLower.includes("show me")
  ) {
    const randomIndex = Math.floor(Math.random() * aiMedia.length);
    const randomMedia = aiMedia[randomIndex];
    return {
      id: randomMedia.id,
      title: randomMedia.title,
      type: randomMedia.type,
      price: randomMedia.price,
      thumbnailUrl: randomMedia.thumbnailUrl,
      tagPPV: randomMedia.tagPPV,
      ppvPriceCredits: randomMedia.ppvPriceCredits,
      tagVIP: randomMedia.tagVIP,
    };
  }

  return null;
}

// ============= RESPONSE GENERATION =============

export interface GenerateAiOptions {
  fanMemories?: string;
  isAiOnlyFan?: boolean;
  // Multi-provider settings
  provider?: AiProvider;
  model?: string;
  apiKey?: string | null; // Encrypted custom key or null for platform key
}

export async function generateAiResponse(
  context: ConversationContext,
  personality: AiPersonality,
  suggestedMedia: ScoredMedia["media"] | null,
  options: GenerateAiOptions = {}
): Promise<string> {
  // Get provider settings (defaults to anthropic/haiku)
  const provider = options.provider || "anthropic";
  const model = options.model || "claude-haiku-4-5-20241022";
  const customApiKey = options.apiKey || null;

  const hasMedia = suggestedMedia !== null;
  const systemPrompt = generateSystemPrompt(personality, hasMedia);

  // Add conversation context
  let additionalContext = "";

  // Add user name context if available
  if (context.userName) {
    additionalContext += `\n[You are chatting with ${context.userName}. Use their name occasionally to be more personal.]`;
  }

  // ===== ADD FAN MEMORIES FOR PERSONALIZATION =====
  if (options.fanMemories) {
    additionalContext += `\n[${options.fanMemories}]`;
  }

  // ===== AI-ONLY FAN: Use shorter, less engaged responses =====
  if (options.isAiOnlyFan) {
    additionalContext += `\n[Note: This fan has low engagement. Keep responses shorter and focus on driving purchases.]`;
  }

  // Add media context if available
  if (hasMedia) {
    // Use credits pricing if available, otherwise fallback to dollar price
    const priceDisplay = suggestedMedia.tagPPV && suggestedMedia.ppvPriceCredits
      ? `${suggestedMedia.ppvPriceCredits} credits`
      : suggestedMedia.price
        ? `$${suggestedMedia.price}`
        : "unlock with credits";
    additionalContext += `\n[You have exclusive content "${suggestedMedia.title}" (${priceDisplay}) that might interest them. Tease about it naturally if appropriate.]`;
  }

  // Build messages for the unified AI client
  const chatMessages: ChatMessage[] = context.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const result = await generateAiMessage({
      provider,
      model,
      apiKey: customApiKey,
      messages: chatMessages,
      systemPrompt: systemPrompt + additionalContext,
      maxTokens: 150,
      temperature: 0.9,
    });

    let aiResponse = result.content?.trim();

    if (!aiResponse) {
      return getFallbackResponse(personality, suggestedMedia);
    }

    // Clean up AI model artifacts (special tokens that sometimes leak through)
    aiResponse = aiResponse
      .replace(/<\/?s>/gi, '')           // Remove <s> and </s> tokens
      .replace(/<\/?bot>/gi, '')         // Remove <bot> and </bot> tokens
      .replace(/<\/?user>/gi, '')        // Remove <user> and </user> tokens
      .replace(/<\/?assistant>/gi, '')   // Remove <assistant> tokens
      .replace(/<\|[^|]*\|>/g, '')       // Remove tokens like <|endoftext|>
      .replace(/\[INST\][\s\S]*?\[\/INST\]/g, '') // Remove instruction tokens
      .replace(/<<SYS>>[\s\S]*?<<\/SYS>>/g, '')   // Remove system tokens
      .replace(/\*[^*]+\*/g, '')         // Remove roleplay actions like *soupir*, *giggle*, *mord la lèvre*
      .replace(/\s+/g, ' ')              // Normalize whitespace after removals
      .trim();

    // If cleaned response is empty, use fallback
    if (!aiResponse) {
      return getFallbackResponse(personality, suggestedMedia);
    }

    return aiResponse;
  } catch (error) {
    console.error("AI generation error:", error);
    return getFallbackResponse(personality, suggestedMedia);
  }
}

// ============= FALLBACK RESPONSES =============

const FALLBACK_RESPONSES = [
  "Hey babe 😘 how's your day going?",
  "Mmm I was just thinking about you...",
  "You always know how to make me smile 😊",
  "I've been so bored today... entertain me? 😏",
  "Just got out of the shower... 💦",
  "Wish you were here with me rn...",
  "You're so sweet 🥰 I like that",
  "Hmm that's interesting... tell me more 👀",
  "I love chatting with you ❤️",
  "You're making me blush over here 😊",
];

const FALLBACK_WITH_MEDIA = [
  "Mmm I actually have something special for you... 👀",
  "You wanna see what I've been up to? 😏",
  "I just posted something I think you'll like...",
  "I have some exclusive pics you might enjoy 🔥",
  "Want a little preview of my latest content? 😘",
];

function getFallbackResponse(
  personality: AiPersonality,
  suggestedMedia: ScoredMedia["media"] | null
): string {
  if (suggestedMedia) {
    const index = Math.floor(Math.random() * FALLBACK_WITH_MEDIA.length);
    return FALLBACK_WITH_MEDIA[index];
  }
  const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[index];
}

// ============= QUEUE SCHEDULING =============

export async function scheduleAiResponse(
  messageId: string,
  conversationId: string,
  creatorSlug: string,
  baseDelay: number = 120 // 2 minutes default
): Promise<void> {
  // Add randomness to delay (50% to 150% of base delay)
  const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
  const delaySeconds = Math.floor(baseDelay * randomFactor);

  // Minimum 30 seconds, maximum 10 minutes
  const finalDelay = Math.max(30, Math.min(delaySeconds, 600));

  const scheduledAt = new Date(Date.now() + finalDelay * 1000);

  await prisma.aiResponseQueue.create({
    data: {
      messageId,
      conversationId,
      creatorSlug,
      scheduledAt,
      status: "PENDING",
    },
  });

  console.log(`[AI] Scheduled response for message ${messageId} at ${scheduledAt.toISOString()}`);
}

// ============= PARSE PERSONALITY =============

export function parsePersonality(jsonString: string | null): AiPersonality {
  if (!jsonString) return DEFAULT_PERSONALITY;

  try {
    const parsed = JSON.parse(jsonString);
    return {
      ...DEFAULT_PERSONALITY,
      ...parsed,
    };
  } catch {
    return DEFAULT_PERSONALITY;
  }
}

// ============= AI MEDIA DECISION SYSTEM =============

export interface CreatorAiMediaSettings {
  aiMediaEnabled: boolean;
  aiMediaFrequency: number;  // Every X messages on average
  aiPPVRatio: number;        // % of media that are PPV (0-100)
  aiTeasingEnabled: boolean;
}

export type MediaDecisionType = "FREE" | "PPV" | "TEASE";

export interface MediaDecision {
  shouldSend: boolean;
  type: MediaDecisionType | null;
  media: SelectedMedia | null;
  teaseText: string | null;
}

export interface SelectedMedia {
  id: string;
  title: string;
  type: string;
  contentUrl: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  tagPPV: boolean;
  tagFree: boolean;
  ppvPriceCredits: number | null;
}

interface ConversationMediaStats {
  totalSent: number;
  freeSent: number;
  ppvSent: number;
  messagesSinceLastMedia: number;
  sentMediaIds: string[];
}

/**
 * Get media stats for a conversation (how many free/PPV sent, messages since last)
 */
export async function getConversationMediaStats(
  conversationId: string,
  creatorUserId: string
): Promise<ConversationMediaStats> {
  // Get all messages in conversation sent by creator with media
  const messagesWithMedia = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: creatorUserId,
      media: { some: {} },
    },
    include: {
      media: {
        select: {
          mediaId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get message count since last media
  const lastMediaMessage = messagesWithMedia[0];
  let messagesSinceLastMedia = 0;

  if (lastMediaMessage) {
    const messagesAfterMedia = await prisma.message.count({
      where: {
        conversationId,
        createdAt: { gt: lastMediaMessage.createdAt },
      },
    });
    messagesSinceLastMedia = messagesAfterMedia;
  } else {
    // No media ever sent, count all messages
    messagesSinceLastMedia = await prisma.message.count({
      where: { conversationId },
    });
  }

  // Count free vs PPV (based on isPPV flag on message)
  const ppvMessages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: creatorUserId,
      isPPV: true,
      media: { some: {} },
    },
  });

  const ppvSent = ppvMessages.length;
  const freeSent = messagesWithMedia.length - ppvSent;

  // Collect all sent media IDs
  const sentMediaIds = messagesWithMedia
    .flatMap((m) => m.media.map((mm) => mm.mediaId))
    .filter((id): id is string => id !== null);

  return {
    totalSent: messagesWithMedia.length,
    freeSent,
    ppvSent,
    messagesSinceLastMedia,
    sentMediaIds,
  };
}

/**
 * Decide if AI should send media based on settings and conversation state
 */
export function shouldSendMedia(
  settings: CreatorAiMediaSettings,
  messagesSinceLastMedia: number,
  lastUserMessage: string
): boolean {
  if (!settings.aiMediaEnabled) return false;

  const frequency = settings.aiMediaFrequency;

  // Check for explicit content requests (high priority)
  const explicitRequest = isExplicitContentRequest(lastUserMessage);
  if (explicitRequest) return true;

  // Below frequency threshold - don't send
  if (messagesSinceLastMedia < frequency) return false;

  // Above threshold - increasing probability
  // At frequency: 30% chance, at 2x frequency: 70% chance, at 3x: 90%
  const messagesOverFrequency = messagesSinceLastMedia - frequency;
  const baseProbability = 0.3;
  const probabilityIncrease = Math.min(0.6, messagesOverFrequency * 0.2);
  const finalProbability = baseProbability + probabilityIncrease;

  return Math.random() < finalProbability;
}

/**
 * Check if user is explicitly requesting content
 */
function isExplicitContentRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const requestPatterns = [
    "show me", "envoie", "envoi", "send", "montre",
    "pic", "photo", "video", "voir", "see", "want to see",
    "more", "encore", "another", "un autre", "une autre",
    "nude", "naked", "nu", "nue", "explicit",
    "content", "contenu", "exclusive", "exclusif",
  ];
  return requestPatterns.some((p) => lower.includes(p));
}

/**
 * Decide type of media: FREE, PPV, or TEASE
 */
export function decideMediaType(
  settings: CreatorAiMediaSettings,
  conversationStats: ConversationMediaStats
): MediaDecisionType {
  const { freeSent, ppvSent } = conversationStats;
  const ppvRatio = settings.aiPPVRatio / 100;

  // Calculate ideal ratio based on what's been sent
  const totalSent = freeSent + ppvSent;

  let shouldBePPV = false;

  if (totalSent === 0) {
    // First media - usually free to hook them (unless high PPV ratio)
    shouldBePPV = Math.random() < (ppvRatio * 0.5); // Half the normal PPV chance for first
  } else {
    // Check current ratio vs target
    const currentPPVRatio = ppvSent / totalSent;

    if (currentPPVRatio < ppvRatio) {
      // Under quota - higher chance of PPV
      shouldBePPV = Math.random() < (ppvRatio + 0.2);
    } else {
      // At or over quota - normal chance
      shouldBePPV = Math.random() < ppvRatio;
    }
  }

  // If PPV and teasing enabled, 40% chance to tease instead of send
  if (shouldBePPV && settings.aiTeasingEnabled) {
    if (Math.random() < 0.4) {
      return "TEASE";
    }
    return "PPV";
  }

  return shouldBePPV ? "PPV" : "FREE";
}

/**
 * Select appropriate media based on decision type and context
 */
export async function selectMediaForContext(
  creatorSlug: string,
  messageText: string,
  mediaType: "FREE" | "PPV",
  excludeMediaIds: string[],
  personality: AiPersonality
): Promise<SelectedMedia | null> {
  // Build query based on type
  const whereClause: any = {
    creatorSlug,
    tagAI: true,
    id: { notIn: excludeMediaIds },
  };

  if (mediaType === "FREE") {
    whereClause.tagFree = true;
  } else {
    whereClause.tagPPV = true;
  }

  // Get available media
  const availableMedia = await prisma.mediaContent.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      type: true,
      contentUrl: true,
      previewUrl: true,
      thumbnailUrl: true,
      tags: true,
      description: true,
      tagPPV: true,
      tagFree: true,
      ppvPriceCredits: true,
    },
  });

  if (availableMedia.length === 0) return null;

  // Score media for relevance
  const keywords = personality.mediaKeywords || DEFAULT_PERSONALITY.mediaKeywords!;
  const messageLower = messageText.toLowerCase();

  // Find matching categories
  const matchedCategories: string[] = [];
  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    if (categoryKeywords.some((kw) => messageLower.includes(kw))) {
      matchedCategories.push(category);
    }
  }

  // Score each media
  const scored = availableMedia.map((media) => {
    let score = 0;
    const titleLower = media.title.toLowerCase();
    const descLower = (media.description || "").toLowerCase();
    const tags = JSON.parse(media.tags || "[]") as string[];

    for (const category of matchedCategories) {
      const categoryKeywords = keywords[category] || [];
      for (const kw of categoryKeywords) {
        if (titleLower.includes(kw)) score += 3;
        if (descLower.includes(kw)) score += 2;
        if (tags.some((t) => t.toLowerCase().includes(kw))) score += 2;
      }
    }

    // Boost for type match
    if (messageLower.includes("video") && media.type === "VIDEO") score += 2;
    if ((messageLower.includes("pic") || messageLower.includes("photo")) && media.type === "PHOTO") score += 2;

    return { media, score };
  });

  // Sort by score, add some randomness for variety
  scored.sort((a, b) => b.score - a.score);

  // Take top 3 and pick randomly among them (if available)
  const topCandidates = scored.slice(0, Math.min(3, scored.length));
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  const selected = topCandidates[randomIndex].media;

  return {
    id: selected.id,
    title: selected.title,
    type: selected.type,
    contentUrl: selected.contentUrl,
    previewUrl: selected.previewUrl,
    thumbnailUrl: selected.thumbnailUrl,
    tagPPV: selected.tagPPV,
    tagFree: selected.tagFree,
    ppvPriceCredits: selected.ppvPriceCredits,
  };
}

/**
 * Generate teaser text for PPV content
 */
const TEASER_TEMPLATES = [
  "J'ai quelque chose de très spécial pour toi... Tu veux voir ? 😏",
  "Mmm j'ai pris des photos assez osées ce matin... 🔥",
  "Tu serais prêt pour du contenu plus... explicite ? 👀",
  "J'ai une vidéo que j'ai hésité à t'envoyer... c'est assez hot 🥵",
  "Tu sais que j'ai du contenu exclusif juste pour toi... ? 😘",
  "I have something really special for you... wanna see? 😏",
  "Mmm I took some pretty naughty pics this morning... 🔥",
  "Would you be ready for more... explicit content? 👀",
  "I have a video I was hesitant to send... it's pretty hot 🥵",
  "You know I have exclusive content just for you... ? 😘",
];

export function generateMediaTeaser(
  media: SelectedMedia,
  personality: AiPersonality
): string {
  // Pick a random template
  const isFrench = personality.language === "fr";
  const templates = TEASER_TEMPLATES.filter((t) =>
    isFrench ? /[àâéèêëîïôûùüç]/.test(t) || t.includes("...") && t.includes("?") : !/[àâéèêëîïôûùüç]/.test(t)
  );

  // If no language-specific match, use all
  const pool = templates.length > 0 ? templates : TEASER_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];

  return template;
}

/**
 * Main function: Make complete media decision for AI response
 */
export async function makeMediaDecision(
  creatorSlug: string,
  creatorUserId: string,
  conversationId: string,
  lastUserMessage: string,
  settings: CreatorAiMediaSettings,
  personality: AiPersonality
): Promise<MediaDecision> {
  // Get conversation stats
  const stats = await getConversationMediaStats(conversationId, creatorUserId);

  // Step 1: Should we send media?
  const shouldSend = shouldSendMedia(settings, stats.messagesSinceLastMedia, lastUserMessage);

  if (!shouldSend) {
    return {
      shouldSend: false,
      type: null,
      media: null,
      teaseText: null,
    };
  }

  // Step 2: What type?
  const decisionType = decideMediaType(settings, stats);

  // Step 3: If TEASE, generate teaser
  if (decisionType === "TEASE") {
    // Try to get a PPV media to tease about
    const ppvMedia = await selectMediaForContext(
      creatorSlug,
      lastUserMessage,
      "PPV",
      stats.sentMediaIds,
      personality
    );

    if (ppvMedia) {
      const teaseText = generateMediaTeaser(ppvMedia, personality);
      return {
        shouldSend: true,
        type: "TEASE",
        media: ppvMedia, // Store reference but don't attach
        teaseText,
      };
    }

    // No PPV available, fallback to free
    const freeMedia = await selectMediaForContext(
      creatorSlug,
      lastUserMessage,
      "FREE",
      stats.sentMediaIds,
      personality
    );

    return {
      shouldSend: freeMedia !== null,
      type: freeMedia ? "FREE" : null,
      media: freeMedia,
      teaseText: null,
    };
  }

  // Step 4: Select media for FREE or PPV
  const mediaTypeForSelection = decisionType as "FREE" | "PPV";
  let selectedMedia = await selectMediaForContext(
    creatorSlug,
    lastUserMessage,
    mediaTypeForSelection,
    stats.sentMediaIds,
    personality
  );

  // If no media of requested type, try the other type
  if (!selectedMedia) {
    const fallbackType = mediaTypeForSelection === "PPV" ? "FREE" : "PPV";
    selectedMedia = await selectMediaForContext(
      creatorSlug,
      lastUserMessage,
      fallbackType,
      stats.sentMediaIds,
      personality
    );

    if (selectedMedia) {
      // Update decision type to match what we found
      return {
        shouldSend: true,
        type: fallbackType,
        media: selectedMedia,
        teaseText: null,
      };
    }
  }

  return {
    shouldSend: selectedMedia !== null,
    type: selectedMedia ? decisionType : null,
    media: selectedMedia,
    teaseText: null,
  };
}
