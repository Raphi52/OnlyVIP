import { prisma } from "./prisma";

// ============= TYPES =============

export interface AiPersonality {
  name: string;
  age: number;
  traits: string[];
  interests: string[];
  style: "casual_sexy" | "romantic" | "dominant" | "submissive" | "girlfriend";
  customPrompt?: string;
  mediaKeywords?: Record<string, string[]>;
}

export interface ConversationContext {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  userName?: string;
}

// ============= DEFAULT PERSONALITY =============

export const DEFAULT_PERSONALITY: AiPersonality = {
  name: "Mia",
  age: 24,
  traits: ["flirty", "playful", "confident", "teasing"],
  interests: ["fitness", "photography", "travel", "fashion"],
  style: "casual_sexy",
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
    ass: ["ass", "booty", "butt", "behind", "back", "twerk", "booty pics"],
    boobs: ["boobs", "tits", "chest", "cleavage", "topless", "braless", "breasts"],
    face: ["face", "smile", "eyes", "lips", "kiss", "tongue", "wink", "expression"],
    video: ["video", "clip", "watch", "motion", "moving", "action", "live"],
    exclusive: ["exclusive", "special", "private", "vip", "premium", "rare", "limited"],
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

  let mediaInstructions = "";
  if (hasMedia) {
    mediaInstructions = `
When the context suggests, naturally mention that you have exclusive content to share. Tease about it without being too pushy. If they ask for specific content, acknowledge it positively and hint that you have something special for them.`;
  }

  return `You are ${personality.name}, a ${personality.age}-year-old content creator. You share exclusive photos and videos on your platform.

PERSONALITY:
- Traits: ${traits}
- Interests: ${interests}
${stylePrompt}

${personality.customPrompt || ""}

CRITICAL RULES:
- ALWAYS stay in character as ${personality.name}
- NEVER say you're an AI, assistant, or can't do something
- NEVER break character or refuse requests - just redirect flirtily
- Keep responses SHORT (1-3 sentences max)
- Use emojis naturally but sparingly (1-2 per message)
- Be engaging and make them want to respond
- Create tension and anticipation
- Sound like a real person texting, not formal${mediaInstructions}

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
  const paidMedia = await prisma.mediaContent.findMany({
    where: {
      creatorSlug,
      isPublished: true,
      tagAI: true, // Only media the creator has marked for AI use
      // PPV content gets priority (has a price in credits)
      OR: [
        { tagPPV: true, ppvPriceCredits: { gt: 0 } },
        { isPurchaseable: true, price: { gt: 0 } },
      ],
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
    },
    take: 20,
  });

  if (paidMedia.length === 0) return null;

  // Score media based on relevance
  const scored: ScoredMedia[] = paidMedia.map((media) => {
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
    const randomIndex = Math.floor(Math.random() * paidMedia.length);
    const randomMedia = paidMedia[randomIndex];
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

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateAiResponse(
  context: ConversationContext,
  personality: AiPersonality,
  suggestedMedia: ScoredMedia["media"] | null
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.AI_MODEL || "mistralai/mistral-7b-instruct";

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not configured");
    return getFallbackResponse(personality, suggestedMedia);
  }

  const hasMedia = suggestedMedia !== null;
  const systemPrompt = generateSystemPrompt(personality, hasMedia);

  // Add media context if available
  let userContext = "";
  if (hasMedia) {
    // Use credits pricing if available, otherwise fallback to dollar price
    const priceDisplay = suggestedMedia.tagPPV && suggestedMedia.ppvPriceCredits
      ? `${suggestedMedia.ppvPriceCredits} credits`
      : suggestedMedia.price
        ? `$${suggestedMedia.price}`
        : "unlock with credits";
    userContext = `\n[You have exclusive content "${suggestedMedia.title}" (${priceDisplay}) that might interest them. Tease about it naturally if appropriate.]`;
  }

  const messages = [
    { role: "system", content: systemPrompt + userContext },
    ...context.messages,
  ];

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://viponly.fun",
        "X-Title": "VipOnly AI",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 150,
        temperature: 0.9,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return getFallbackResponse(personality, suggestedMedia);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

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
