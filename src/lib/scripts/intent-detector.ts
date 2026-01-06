/**
 * Intent Detection System
 * Analyzes messages to detect user intent for script matching
 */

// All supported intents with their trigger patterns
export const SCRIPT_INTENTS = {
  // ============= GREETINGS =============
  GREETING_NEW_FAN: {
    keywords: ["first time", "new here", "just joined", "just subscribed", "nouveau", "première fois"],
    patterns: [],
    category: "GREETING",
    description: "First contact with new fan",
    priority: 10,
  },
  GREETING_RETURNING: {
    keywords: ["hey", "hi", "hello", "coucou", "salut", "bonjour", "bonsoir", "yo", "cc", "slt"],
    patterns: [/^(hey|hi|hello|coucou|salut|bonjour|bonsoir|yo|cc|slt)\s*[!.,💕😘]?$/i],
    category: "GREETING",
    description: "Returning fan saying hi",
    priority: 5,
  },
  GREETING_COMPLIMENT: {
    keywords: ["beautiful", "gorgeous", "sexy", "hot", "belle", "magnifique", "canon", "bombe"],
    patterns: [/(t'?es|tu es|you'?re|you are)\s+(si\s+)?(belle|sexy|hot|gorgeous|beautiful|canon)/i],
    category: "GREETING",
    description: "Fan opens with compliment",
    priority: 7,
  },

  // ============= PPV REQUESTS =============
  PPV_SOFT_REQUEST: {
    keywords: ["content", "photos", "pics", "videos", "see more", "voir plus", "contenu", "montrer"],
    patterns: [/(show|montre|envoie|send)\s+(me|moi)/i, /(want|veux)\s+(to\s+)?(see|voir)/i],
    category: "PPV_PITCH",
    description: "Soft content request",
    priority: 8,
  },
  PPV_EXPLICIT_REQUEST: {
    keywords: ["nude", "naked", "nue", "nues", "explicit", "uncensored", "tout", "chatte", "pussy", "boobs", "seins", "ass", "cul", "fesses"],
    patterns: [/(nude|naked|nue|explicit|sans\s+censure)/i, /(montre|envoie|show|send)\s+(ta|ton|tes|your)\s+(chatte|pussy|cul|ass|seins|boobs)/i],
    category: "PPV_PITCH",
    description: "Explicit content request",
    priority: 10,
  },
  PPV_VIDEO_REQUEST: {
    keywords: ["video", "vidéo", "clip", "film", "watch"],
    patterns: [/(une?\s+)?vid[ée]o/i, /watch\s+(you|something)/i],
    category: "PPV_PITCH",
    description: "Video content request",
    priority: 9,
  },

  // ============= OBJECTIONS =============
  OBJECTION_PRICE: {
    keywords: ["expensive", "cher", "chère", "too much", "trop", "can't afford", "pas les moyens", "broke", "money", "argent", "budget"],
    patterns: [/(trop|too)\s+(cher|expensive|much)/i, /(pas|no|can'?t)\s+(les\s+)?(moyens|afford|money)/i, /(c'?est|it'?s)\s+cher/i],
    category: "OBJECTION",
    description: "Price objection",
    priority: 10,
  },
  OBJECTION_TIMING: {
    keywords: ["later", "plus tard", "maybe", "peut-être", "not now", "pas maintenant", "demain", "tomorrow", "wait", "attends"],
    patterns: [/(plus\s+tard|later|maybe|peut-?être|tomorrow|demain)/i, /(not|pas)\s+(now|maintenant)/i],
    category: "OBJECTION",
    description: "Timing/delay objection",
    priority: 9,
  },
  OBJECTION_TRUST: {
    keywords: ["fake", "scam", "real", "vraie", "prove", "preuve", "arnaque", "faux"],
    patterns: [/(is\s+this|c'?est)\s+(real|fake|vrai|faux)/i, /(prove|prouve)/i, /es-?tu\s+(vraie|réelle)/i],
    category: "OBJECTION",
    description: "Trust/authenticity doubt",
    priority: 10,
  },
  OBJECTION_SEEN_BEFORE: {
    keywords: ["already", "déjà", "same", "même", "seen", "vu", "bought", "acheté"],
    patterns: [/(already|déjà)\s+(seen|vu|have|bought|acheté)/i, /(même|same)\s+(photo|video|content)/i],
    category: "OBJECTION",
    description: "Already seen/bought objection",
    priority: 8,
  },
  OBJECTION_NOT_INTERESTED: {
    keywords: ["not interested", "pas intéressé", "no thanks", "non merci", "pass", "passe"],
    patterns: [/(not|pas)\s+interest/i, /(no|non)\s+(thanks|merci)/i],
    category: "OBJECTION",
    description: "Direct rejection",
    priority: 7,
  },

  // ============= ENGAGEMENT =============
  ENGAGEMENT_POSITIVE: {
    keywords: ["love", "amazing", "adore", "incredible", "perfect", "parfait", "incroyable", "magnifique", "wow", "omg"],
    patterns: [/(j'?adore|i\s+love|amazing|incredible|perfect|parfait)/i, /^(wow|omg|oh\s*my)/i],
    category: "ENGAGEMENT",
    description: "Positive reaction - opportunity to upsell",
    priority: 6,
  },
  ENGAGEMENT_QUESTION: {
    keywords: ["what", "how", "why", "when", "where", "quoi", "comment", "pourquoi", "quand", "où"],
    patterns: [/^(what|how|why|when|where|quoi|comment|pourquoi|quand|où)\s/i, /\?$/],
    category: "ENGAGEMENT",
    description: "Fan asking questions",
    priority: 4,
  },
  ENGAGEMENT_FLIRTY: {
    keywords: ["miss you", "tu me manques", "thinking of you", "je pense à toi", "want you", "je te veux", "dream", "rêve", "je t'aime", "i love you", "love you", "manqué", "bisou", "kiss", "câlin", "hug", "envie de toi"],
    patterns: [
      /(miss|manque)\s+(you|toi|me)/i,
      /(thinking|pense)\s+(of|à)\s+(you|toi)/i,
      /je\s+t'?aime/i,
      /i\s+love\s+you/i,
      /tu\s+m'?as\s+manqué/i,
      /t'?as\s+manqué/i,
      /(envie|besoin)\s+(de\s+)?toi/i,
      /(gros\s+)?bisou/i,
    ],
    category: "ENGAGEMENT",
    description: "Flirty/romantic message",
    priority: 8, // Increased priority to beat greetings
  },

  // ============= REENGAGEMENT =============
  REENGAGEMENT_RETURN: {
    keywords: ["back", "de retour", "missed you", "tu m'as manqué", "long time", "longtemps"],
    patterns: [/(i'?m\s+back|de\s+retour)/i, /(long\s+time|longtemps)/i],
    category: "REENGAGEMENT",
    description: "Fan returning after absence",
    priority: 8,
  },

  // ============= CLOSING SIGNALS =============
  CLOSING_READY: {
    keywords: ["ok", "d'accord", "fine", "alright", "deal", "marché", "je prends", "i'll take", "send it", "envoie"],
    patterns: [/(ok|d'?accord|fine|deal|marché)/i, /(je\s+prends|i'?ll\s+take)/i, /(send|envoie)\s+(it|le|la)/i],
    category: "CLOSING",
    description: "Fan ready to buy",
    priority: 10,
  },
  CLOSING_HESITANT: {
    keywords: ["hmm", "hum", "idk", "je sais pas", "not sure", "pas sûr"],
    patterns: [/^(hmm+|hum+|idk)/i, /(not\s+sure|pas\s+sûr|je\s+sais\s+pas)/i],
    category: "CLOSING",
    description: "Fan hesitating - needs push",
    priority: 8,
  },
} as const;

export type IntentType = keyof typeof SCRIPT_INTENTS;

export interface DetectedIntent {
  intent: IntentType | null;
  confidence: number;
  matchedKeywords: string[];
  matchedPattern: boolean;
  category: string | null;
}

/**
 * Detect intent from a user message
 */
export function detectIntent(message: string): DetectedIntent {
  const messageLower = message.toLowerCase().trim();

  let bestMatch: DetectedIntent = {
    intent: null,
    confidence: 0,
    matchedKeywords: [],
    matchedPattern: false,
    category: null,
  };

  for (const [intentName, config] of Object.entries(SCRIPT_INTENTS)) {
    let score = 0;
    const matchedKeywords: string[] = [];
    let matchedPattern = false;

    // Check keywords
    for (const keyword of config.keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += 0.3;
        matchedKeywords.push(keyword);
      }
    }

    // Check patterns (stronger signal)
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        score += 0.5;
        matchedPattern = true;
      }
    }

    // Bonus for priority intents
    score += config.priority * 0.02;

    // Normalize score to 0-1
    const confidence = Math.min(1, score);

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        intent: intentName as IntentType,
        confidence,
        matchedKeywords,
        matchedPattern,
        category: config.category,
      };
    }
  }

  // Minimum threshold
  if (bestMatch.confidence < 0.25) {
    return {
      intent: null,
      confidence: 0,
      matchedKeywords: [],
      matchedPattern: false,
      category: null,
    };
  }

  return bestMatch;
}

/**
 * Get all intents for a category
 */
export function getIntentsForCategory(category: string): IntentType[] {
  return Object.entries(SCRIPT_INTENTS)
    .filter(([_, config]) => config.category === category)
    .map(([name]) => name as IntentType);
}

/**
 * Check if message contains explicit content request
 */
export function isExplicitRequest(message: string): boolean {
  const detected = detectIntent(message);
  return detected.intent === "PPV_EXPLICIT_REQUEST";
}

/**
 * Check if message is an objection
 */
export function isObjection(message: string): boolean {
  const detected = detectIntent(message);
  return detected.category === "OBJECTION";
}

/**
 * Get intent description
 */
export function getIntentDescription(intent: IntentType): string {
  return SCRIPT_INTENTS[intent]?.description || "Unknown intent";
}

// ============= RESPONSE OUTCOME DETECTION =============

export type ResponseOutcome = "positive" | "negative" | "neutral";

interface OutcomePattern {
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

const POSITIVE_SIGNALS: OutcomePattern = {
  keywords: [
    // Purchase intent
    "ok", "d'accord", "oui", "yes", "yeah", "yep", "ouais", "deal", "marché",
    "je prends", "i'll take", "send it", "envoie", "achète", "buy", "paid", "payé",
    // Enthusiasm
    "love", "j'adore", "amazing", "incroyable", "parfait", "perfect", "wow", "omg",
    "magnifique", "trop bien", "génial", "great", "awesome", "super",
    // Interest
    "more", "encore", "plus", "show me", "montre", "j'ai hâte", "can't wait",
    "intéressé", "interested", "curious", "curieux",
    // Positive emotional
    "haha", "lol", "mdr", "hihi", "😍", "🥰", "😘", "❤️", "🔥", "💕",
    "tu me plais", "i like you", "you're amazing", "t'es géniale",
  ],
  patterns: [
    /^(ok|oui|yes|yeah|ouais|d'?acc|deal|yep|yup)$/i,
    /(je\s+prends|i'?ll\s+take|i'?ll\s+buy)/i,
    /(send|envoie)\s+(it|le|la|moi)/i,
    /(c'?est|it'?s)\s+(parfait|perfect|génial|great|amazing)/i,
    /(j'?adore|i\s+love|trop\s+bien)/i,
    /(trop|really)\s+(sexy|hot|belle|beautiful)/i,
    /^(wow|omg|damn|putain|oh\s*my)/i,
    /(je\s+veux|i\s+want)\s+(voir|see|ça|this|it)/i,
    /(combien|how\s+much)\s*(pour|for)?/i, // Asking price = interest
    /(show|montre)\s+(me|moi)/i,
  ],
  weight: 1.0,
};

const NEGATIVE_SIGNALS: OutcomePattern = {
  keywords: [
    // Direct rejection
    "non", "no", "nope", "pas", "never", "jamais", "no thanks", "non merci",
    "not interested", "pas intéressé", "pass", "passe",
    // Price objection
    "trop cher", "expensive", "can't afford", "pas les moyens", "broke",
    "too much", "c'est cher",
    // Timing objection
    "plus tard", "later", "maybe", "peut-être", "not now", "pas maintenant",
    "demain", "tomorrow", "une autre fois", "another time",
    // Trust objection
    "fake", "scam", "arnaque", "faux", "bot", "pas vraie", "not real",
    // Seen before
    "déjà vu", "already seen", "same", "même", "boring", "ennuyeux",
    // Disinterest
    "bof", "meh", "whatever", "peu importe", "m'en fiche", "don't care",
  ],
  patterns: [
    /^(non|no|nope|nah|nan)$/i,
    /(no|non)\s+(thanks|merci)/i,
    /(not|pas)\s+(interested|intéressé)/i,
    /(trop|too)\s+(cher|expensive|much)/i,
    /(pas|no|can'?t)\s+(les\s+)?(moyens|afford|money)/i,
    /(plus\s+tard|later|maybe|peut-?être)/i,
    /(not|pas)\s+(now|maintenant)/i,
    /(fake|scam|arnaque|bot)/i,
    /(déjà|already)\s+(vu|seen|have)/i,
    /^(bof|meh|ok\.{3,}|hmm\.{3,})$/i,
    /(je|i)\s+(sais|know)\s+(pas|not)/i,
  ],
  weight: 1.0,
};

/**
 * Detect if fan response is positive, negative, or neutral
 * Used for flow branching (nextScriptOnSuccess vs nextScriptOnReject)
 */
export function detectResponseOutcome(message: string): {
  outcome: ResponseOutcome;
  confidence: number;
  signals: string[];
} {
  const messageLower = message.toLowerCase().trim();

  let positiveScore = 0;
  let negativeScore = 0;
  const signals: string[] = [];

  // Check positive keywords
  for (const keyword of POSITIVE_SIGNALS.keywords) {
    if (messageLower.includes(keyword.toLowerCase())) {
      positiveScore += 0.15 * POSITIVE_SIGNALS.weight;
      signals.push(`+keyword:${keyword}`);
    }
  }

  // Check positive patterns
  for (const pattern of POSITIVE_SIGNALS.patterns) {
    if (pattern.test(message)) {
      positiveScore += 0.3 * POSITIVE_SIGNALS.weight;
      signals.push(`+pattern`);
    }
  }

  // Check negative keywords
  for (const keyword of NEGATIVE_SIGNALS.keywords) {
    if (messageLower.includes(keyword.toLowerCase())) {
      negativeScore += 0.15 * NEGATIVE_SIGNALS.weight;
      signals.push(`-keyword:${keyword}`);
    }
  }

  // Check negative patterns
  for (const pattern of NEGATIVE_SIGNALS.patterns) {
    if (pattern.test(message)) {
      negativeScore += 0.3 * NEGATIVE_SIGNALS.weight;
      signals.push(`-pattern`);
    }
  }

  // Normalize scores
  positiveScore = Math.min(1, positiveScore);
  negativeScore = Math.min(1, negativeScore);

  // Determine outcome
  const diff = positiveScore - negativeScore;

  if (diff >= 0.2) {
    return {
      outcome: "positive",
      confidence: Math.min(1, positiveScore),
      signals,
    };
  } else if (diff <= -0.2) {
    return {
      outcome: "negative",
      confidence: Math.min(1, negativeScore),
      signals,
    };
  }

  // Neutral if no clear signal
  return {
    outcome: "neutral",
    confidence: Math.max(positiveScore, negativeScore, 0.3),
    signals,
  };
}

/**
 * Check if fan responded to a PPV/sale pitch
 * Returns true if they seem interested in buying
 */
export function isPurchaseIntent(message: string): boolean {
  const detected = detectIntent(message);
  const outcome = detectResponseOutcome(message);

  return (
    detected.intent === "CLOSING_READY" ||
    (outcome.outcome === "positive" && outcome.confidence >= 0.5)
  );
}
