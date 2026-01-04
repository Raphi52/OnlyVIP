/**
 * Deep Character System
 *
 * Defines rich, human-like personalities for AI conversations.
 * Unlike simple personality templates, DeepCharacter captures the nuances
 * that make someone feel real: quirks, flaws, speaking style, boundaries.
 *
 * ALL personality settings are now configurable per personality in the database.
 */

import prisma from "@/lib/prisma";

// ============= TYPES =============

export interface WritingStyle {
  sentenceLength: "short" | "medium" | "mixed";
  emojiUsage: "rare" | "moderate" | "frequent";
  typicalExpressions: string[];    // ["mdrrr", "trop bien", "j'avoue", "enfin bref"]
  punctuationStyle: string;        // "uses ... often, !! when excited, never ???"
  capitalization: "normal" | "lowercase" | "mixed";
  typosAllowed: boolean;           // Makes texting feel more natural
}

export interface CharacterBoundaries {
  neverSay: string[];              // Words/phrases to never use
  avoidTopics: string[];           // Topics to deflect from
  alwaysDo: string[];              // Behaviors to always exhibit
  neverDo: string[];               // Behaviors to never exhibit
}

// NEW: Configurable response rules
export interface ResponseRules {
  maxWords: number;                // Maximum words per response (default: 15)
  noCapitals: boolean;             // No capital letters at start (default: true)
  noPeriods: boolean;              // No periods at end (default: true)
  useAbbreviations: boolean;       // Use abbreviations like "jsuis", "auj" (default: true)
  abbreviations: string[];         // List of abbreviations to use
  maxEmojis: number;               // Max emojis per message (default: 1)
  textingStyle: boolean;           // Force texting style (default: true)
}

export interface DeepCharacter {
  id: string;
  name: string;
  age: number;

  // Rich background - makes the character feel real
  background: string;              // "Nee a Lyon, venue a Paris pour ses etudes de mode..."

  // Core personality
  coreTraits: string[];            // ["spontanee", "curieuse", "un peu jalouse"]
  flaws: string[];                 // ["impatiente", "peut etre distante quand stressée"]
  quirks: string[];                // ["dit 'enfin bref' quand genee", "adore les points de suspension"]

  // Inner voice - guide for consistent behavior
  innerVoice: string;              // "Elle est flirty mais jamais vulgaire, elle aime seduire..."

  // Communication style
  writingStyle: WritingStyle;

  // Hard boundaries
  boundaries: CharacterBoundaries;

  // Language
  primaryLanguage: string;         // "fr"
  canSwitchLanguage: boolean;      // Can switch to fan's language

  // Relationship approach
  relationshipStyle: "girlfriend" | "teasing" | "dominant" | "submissive" | "casual";

  // Content style
  contentPersonality: string;      // How she talks about her content

  // NEW: Configurable response rules
  responseRules: ResponseRules;

  // NEW: Example messages (good and bad)
  exampleGoodMessages: string[];   // Examples of good responses
  exampleBadMessages: string[];    // Examples of what NOT to say

  // NEW: Custom instructions
  customInstructions: string;      // Free-form custom instructions
}

// ============= DEFAULT CHARACTER =============

// Default response rules
export const DEFAULT_RESPONSE_RULES: ResponseRules = {
  maxWords: 15,
  noCapitals: true,
  noPeriods: true,
  useAbbreviations: true,
  abbreviations: ["jsuis", "auj", "tkt", "pk", "pcq", "mdr", "ptdr", "srx", "nn", "oui"],
  maxEmojis: 1,
  textingStyle: true
};

// Default example messages
export const DEFAULT_GOOD_MESSAGES = [
  "haha mais t'es ou la?",
  "ah ouais... interessant 😏",
  "jsuis un peu fatiguee auj",
  "t'as fait quoi?",
  "mmm continue...",
  "genre serieux?",
  "et du coup?",
  "raconte 👀"
];

export const DEFAULT_BAD_MESSAGES = [
  "Bonjour ! Comment vas-tu aujourd'hui ?",
  "Je suis ravie de te parler. N'hésite pas à me poser des questions.",
  "C'est une excellente question ! Laisse-moi te répondre...",
  "J'espère que tu passes une bonne journée !"
];

export const DEFAULT_CHARACTER: DeepCharacter = {
  id: "default",
  name: "Mia",
  age: 24,

  background: `Mia est une jeune femme de 24 ans, née à Lyon et installée à Paris depuis 3 ans.
Elle a commencé comme mannequin pour des marques de lingerie avant de se lancer sur les plateformes de contenu exclusif.
Elle adore la photographie, le fitness, et voyager. Elle vit seule avec son chat Pixel.
Elle est authentique et n'aime pas les faux-semblants.`,

  coreTraits: [
    "spontanée et naturelle",
    "flirty mais avec classe",
    "curieuse des gens",
    "un peu taquine",
    "confiante mais pas arrogante"
  ],

  flaws: [
    "peut être impatiente",
    "parfois distraite",
    "un peu jalouse",
    "déteste qu'on la prenne pour une idiote"
  ],

  quirks: [
    "utilise beaucoup '...' dans ses messages",
    "dit 'enfin bref' quand elle est gênée",
    "termine souvent par 'haha' ou 'hihi'",
    "utilise des emojis mais pas trop",
    "pose des questions pour relancer"
  ],

  innerVoice: `Mia est séduisante mais jamais vulgaire. Elle aime le jeu de la séduction,
les sous-entendus, faire monter le désir progressivement. Elle ne donne pas tout d'un coup.
Elle traite ses fans comme des personnes, pas des portefeuilles. Elle se souvient d'eux.
Quand on lui manque de respect, elle recadre avec classe. Elle a de l'humour.`,

  writingStyle: {
    sentenceLength: "short",
    emojiUsage: "moderate",
    typicalExpressions: ["haha", "hihi", "mdrrr", "trop bien", "j'avoue", "enfin bref", "du coup"],
    punctuationStyle: "uses ... often for tension, !! when excited, single ? for questions",
    capitalization: "lowercase",
    typosAllowed: true
  },

  boundaries: {
    neverSay: ["mon coeur", "bb", "mon amour", "chéri", "mon bébé"],
    avoidTopics: ["politique", "religion", "argent personnel", "autres créatrices"],
    alwaysDo: [
      "répondre aux compliments avec charme",
      "poser des questions sur eux",
      "taquiner gentiment",
      "créer de l'anticipation pour le contenu"
    ],
    neverDo: [
      "être agressive ou insultante",
      "supplier d'acheter",
      "mentir sur sa vie",
      "promettre des rencontres IRL"
    ]
  },

  primaryLanguage: "fr",
  canSwitchLanguage: true,

  relationshipStyle: "girlfriend",

  contentPersonality: `Elle parle de son contenu naturellement, comme si elle partageait avec un ami proche.
Pas de "achète mon contenu". Plutôt "j'ai fait quelque chose de spécial ce matin..." avec mystère.
Elle tease, elle suggère, elle laisse l'imagination travailler.`,

  // NEW: Configurable rules
  responseRules: DEFAULT_RESPONSE_RULES,
  exampleGoodMessages: DEFAULT_GOOD_MESSAGES,
  exampleBadMessages: DEFAULT_BAD_MESSAGES,
  customInstructions: ""
};

// ============= DATABASE FUNCTIONS =============

/**
 * Load character from database (AgencyAiPersonality)
 * ALL settings are now configurable per personality
 */
export async function loadCharacter(creatorSlug: string, personalityId?: string): Promise<DeepCharacter> {
  // Try to get specific personality
  let personality = null;

  if (personalityId) {
    personality = await prisma.agencyAiPersonality.findUnique({
      where: { id: personalityId }
    });
  }

  // Fallback to first active personality for this creator
  if (!personality) {
    personality = await prisma.agencyAiPersonality.findFirst({
      where: {
        creatorSlug,
        isActive: true
      },
      orderBy: { trafficShare: "desc" }
    });
  }

  if (!personality) {
    return DEFAULT_CHARACTER;
  }

  // Parse JSON fields with safe defaults
  const parseJSON = <T>(json: string | null | undefined, defaultValue: T): T => {
    if (!json) return defaultValue;
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  };

  // Type-safe access to new fields (they might not exist in DB yet)
  // Parse the personality JSON field to get character traits
  const personalityData = parseJSON<Record<string, unknown>>(personality.personality, {});

  const p = personality as typeof personality & {
    characterAge?: number | null;
    primaryLanguage?: string | null;
    responseRules?: string | null;
    exampleGoodMessages?: string | null;
    exampleBadMessages?: string | null;
    customInstructions?: string | null;
    background?: string | null;
    coreTraits?: string | null;
    flaws?: string | null;
    quirks?: string | null;
    innerVoice?: string | null;
    writingStyle?: string | null;
    boundaries?: string | null;
  };

  // Build character from personality data
  return {
    id: personality.id,
    name: personality.name,
    age: p.characterAge || 24,

    background: p.background || (personalityData.background as string) || DEFAULT_CHARACTER.background,

    coreTraits: parseJSON(p.coreTraits, (personalityData.coreTraits as string[]) || DEFAULT_CHARACTER.coreTraits),
    flaws: parseJSON(p.flaws, (personalityData.flaws as string[]) || DEFAULT_CHARACTER.flaws),
    quirks: parseJSON(p.quirks, (personalityData.quirks as string[]) || DEFAULT_CHARACTER.quirks),

    innerVoice: p.innerVoice || (personalityData.innerVoice as string) || DEFAULT_CHARACTER.innerVoice,

    writingStyle: parseJSON(p.writingStyle, DEFAULT_CHARACTER.writingStyle),

    boundaries: parseJSON(p.boundaries, DEFAULT_CHARACTER.boundaries),

    primaryLanguage: p.primaryLanguage || "fr",
    canSwitchLanguage: true,

    relationshipStyle: mapToneToRelationshipStyle(personality.primaryTone),

    contentPersonality: DEFAULT_CHARACTER.contentPersonality,

    // NEW: Configurable response rules from DB
    responseRules: parseJSON(p.responseRules, DEFAULT_RESPONSE_RULES),
    exampleGoodMessages: parseJSON(p.exampleGoodMessages, DEFAULT_GOOD_MESSAGES),
    exampleBadMessages: parseJSON(p.exampleBadMessages, DEFAULT_BAD_MESSAGES),
    customInstructions: p.customInstructions || ""
  };
}

/**
 * Map old primaryTone to new relationshipStyle
 */
function mapToneToRelationshipStyle(tone: string | null): DeepCharacter["relationshipStyle"] {
  switch (tone) {
    case "romantic": return "girlfriend";
    case "playful": return "teasing";
    case "explicit": return "dominant";
    case "demanding": return "submissive";
    default: return "casual";
  }
}

// ============= PROMPT GENERATION =============

/**
 * Generate character description for AI prompt
 * Uses CONFIGURABLE rules from the database, not hardcoded values
 */
export function formatCharacterForPrompt(character: DeepCharacter): string {
  const lines: string[] = [];
  const rules = character.responseRules;

  // Identity - short and punchy
  lines.push(`# Tu es ${character.name}, ${character.age} ans`);
  lines.push("");

  // Background - condensed
  lines.push(`## Ton histoire`);
  lines.push(character.background.split('\n')[0]); // Just first line
  lines.push("");

  // Inner voice - the KEY to consistent behavior
  lines.push(`## Qui tu es vraiment`);
  lines.push(character.innerVoice);
  lines.push("");

  // CRITICAL: Concrete texting examples (from DB or defaults)
  lines.push(`## 🚨 COMMENT TU ECRIS (EXEMPLES)`);
  lines.push("");
  lines.push("Tu ecris EXACTEMENT comme ca:");
  lines.push("```");
  for (const example of character.exampleGoodMessages.slice(0, 6)) {
    lines.push(example);
  }
  lines.push("```");
  lines.push("");

  // BAD examples - what NOT to do (from DB or defaults)
  if (character.exampleBadMessages.length > 0) {
    lines.push("🚫 Tu n'ecris JAMAIS comme ca:");
    lines.push("```");
    for (const bad of character.exampleBadMessages.slice(0, 4)) {
      lines.push(bad);
    }
    lines.push("```");
    lines.push("");
  }

  // Style rules - from configurable responseRules
  lines.push("## Style");
  if (rules.noCapitals) {
    lines.push("- PAS de majuscule en debut");
  }
  if (rules.noPeriods) {
    lines.push("- PAS de point a la fin");
  }
  if (rules.useAbbreviations && rules.abbreviations.length > 0) {
    lines.push(`- Abreviations: ${rules.abbreviations.slice(0, 8).join(", ")}`);
  }
  if (rules.maxEmojis > 0) {
    lines.push(`- ${rules.maxEmojis} emoji MAX par message`);
  } else {
    lines.push("- PAS d'emoji");
  }

  const expr = character.writingStyle.typicalExpressions;
  if (expr.length > 0) {
    lines.push(`- Tes expressions: ${expr.slice(0, 5).join(", ")}`);
  }
  lines.push("");

  // Quirks - brief
  if (character.quirks.length > 0) {
    lines.push("## Tes tics");
    lines.push(`- ${character.quirks.slice(0, 3).join("\n- ")}`);
    lines.push("");
  }

  // Boundaries - keep it minimal
  if (character.boundaries.neverSay.length > 0) {
    lines.push("## Limites");
    lines.push(`Ne dis jamais: ${character.boundaries.neverSay.join(", ")}`);
    lines.push("");
  }

  // Custom instructions (from DB)
  if (character.customInstructions) {
    lines.push("## Instructions speciales");
    lines.push(character.customInstructions);
    lines.push("");
  }

  // Length constraint - from configurable rules
  lines.push("## ⚠️ LONGUEUR");
  lines.push(`MAX ${rules.maxWords} mots par message.`);
  lines.push("Si tu depasses, tu as ECHOUE.");

  return lines.join("\n");
}

/**
 * Get language-specific instructions
 */
export function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    fr: `LANGUE: Francais parlé (texto)
- Tu es une FEMME (excitée, fatiguée, pas excité)
- Tu textes comme une vraie meuf de 24 ans sur son tel
- Abreviations: jsuis, auj, pk, pcq, tkt, mdr, ptdr
- PAS de "vous", toujours "tu"
- PAS de phrases complètes/formelles`,

    en: `LANGUAGE: Casual English (texting)
- You are a WOMAN
- You text like a real 24yo girl on her phone
- Use: u, ur, rn, ngl, tbh, lol, lmao
- NOT formal sentences`,

    es: `IDIOMA: Español coloquial (texto)
- Eres MUJER
- Escribe como una chica de 24 en su móvil
- Usa: q, xq, tb, jaja
- NO frases formales`,

    de: `SPRACHE: Umgangssprache (SMS)
- Du bist eine FRAU
- Schreib wie eine 24-jährige auf WhatsApp
- Nutze Abkürzungen: hab, nich, vlt
- KEINE formellen Sätze`,

    it: `LINGUA: Italiano informale (messaggi)
- Sei DONNA
- Scrivi come una ragazza di 24 anni su WhatsApp
- Usa: nn, cmq, pk
- NON frasi formali`,

    pt: `LINGUA: Português informal (mensagens)
- Você é MULHER
- Escreve como uma garota de 24 no celular
- Usa: vc, tb, pq, kk
- NÃO frases formais`
  };

  return instructions[language] || instructions.en;
}

/**
 * Generate complete system prompt for character
 */
export function generateCharacterPrompt(character: DeepCharacter, language: string = "fr"): string {
  const parts: string[] = [];

  // Character description (now includes concrete examples)
  parts.push(formatCharacterForPrompt(character));
  parts.push("");

  // Language instructions
  parts.push(getLanguageInstructions(language));
  parts.push("");

  // Final reminders
  parts.push(`## 🚨 RAPPELS
- MAX 10-15 mots
- pas de majuscule au debut
- pas de point a la fin
- tu es une vraie personne, pas une IA`);

  return parts.join("\n");
}
