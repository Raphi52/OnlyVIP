/**
 * Context-Aware Prompt Builder
 *
 * Assembles rich prompts for AI that include:
 * - Deep character personality
 * - Short-term conversation memory
 * - Long-term relationship memory
 * - Conversation history
 * - Available media context
 * - Script references for inspiration
 */

import { DeepCharacter, formatCharacterForPrompt, getLanguageInstructions } from "./character";
import {
  ShortTermMemory,
  LongTermMemory,
  ConversationSummaryData,
  formatShortTermForPrompt,
  formatLongTermForPrompt,
  formatSummariesForPrompt
} from "./memory";

// ============= TYPES =============

export interface MediaContext {
  id: string;
  type: "PHOTO" | "VIDEO";
  title: string;
  description?: string;
  mood?: string;
  backstory?: string;
  suggestedIntro?: string;
  isFree: boolean;
  ppvPrice?: number;
  // URLs for actual media delivery
  contentUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface ScriptReference {
  category: string;
  examples: Array<{
    situation: string;
    response: string;
    technique?: string;
    conversionRate?: number;
  }>;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface PromptContext {
  character: DeepCharacter;
  shortTermMemory: ShortTermMemory;
  longTermMemory: LongTermMemory;
  summaries: ConversationSummaryData[];
  recentMessages: Message[];
  currentMessage: string;
  availableMedia?: MediaContext[];
  scriptReferences?: ScriptReference[];
  language?: string;
}

// ============= PROMPT BUILDING =============

/**
 * Build complete conversation prompt
 */
export function buildConversationPrompt(context: PromptContext): string {
  const parts: string[] = [];

  // 1. Character identity and personality
  parts.push(formatCharacterForPrompt(context.character));
  parts.push("");

  // 2. Language instructions
  parts.push(getLanguageInstructions(context.language || context.character.primaryLanguage));
  parts.push("");

  // 3. Long-term memory (what we know about this fan)
  parts.push(formatLongTermForPrompt(context.longTermMemory));
  parts.push("");

  // 4. Conversation summaries (previous interactions)
  if (context.summaries.length > 0) {
    parts.push(formatSummariesForPrompt(context.summaries));
    parts.push("");
  }

  // 5. Short-term memory (current conversation state)
  parts.push(formatShortTermForPrompt(context.shortTermMemory));
  parts.push("");

  // 6. Available media (if any)
  if (context.availableMedia && context.availableMedia.length > 0) {
    parts.push(formatMediaForPrompt(context.availableMedia));
    parts.push("");
  }

  // 7. Script references (inspiration, not verbatim)
  if (context.scriptReferences && context.scriptReferences.length > 0) {
    parts.push(formatScriptReferencesForPrompt(context.scriptReferences));
    parts.push("");
  }

  // 8. Recent messages
  parts.push(formatMessagesForPrompt(context.recentMessages));
  parts.push("");

  // 9. Current message and instructions
  parts.push(formatCurrentMessagePrompt(context.currentMessage, context.shortTermMemory));

  return parts.join("\n");
}

/**
 * Build system prompt (character + rules only)
 * Uses CONFIGURABLE rules from the character, not hardcoded values
 */
export function buildSystemPrompt(character: DeepCharacter, language: string = "fr"): string {
  const parts: string[] = [];
  const rules = character.responseRules;

  // Character (already has concrete examples and configurable rules)
  parts.push(formatCharacterForPrompt(character));
  parts.push("");

  // Language
  parts.push(getLanguageInstructions(language));
  parts.push("");

  // Build rules dynamically from configurable settings
  const rulesList: string[] = [];
  rulesList.push(`MAX ${rules.maxWords} MOTS par reponse`);

  if (rules.noCapitals) {
    rulesList.push("JAMAIS de majuscule en debut (sauf noms)");
  }
  if (rules.noPeriods) {
    rulesList.push("JAMAIS de point final");
  }
  if (rules.textingStyle) {
    rulesList.push("JAMAIS de formule polie (\"Bonjour\", \"Comment vas-tu\")");
  }
  if (rules.useAbbreviations && rules.abbreviations.length > 0) {
    rulesList.push(`Utilise: ${rules.abbreviations.slice(0, 6).join(", ")}`);
  }
  if (rules.maxEmojis === 0) {
    rulesList.push("PAS d'emoji");
  } else if (rules.maxEmojis === 1) {
    rulesList.push("Un seul emoji MAX (souvent 0)");
  } else {
    rulesList.push(`${rules.maxEmojis} emojis MAX`);
  }

  if (rules.textingStyle) {
    rulesList.push("Tu reponds comme sur iMessage/WhatsApp");
  }

  parts.push(`## 🚨 REGLES OBLIGATOIRES

${rulesList.map((r, i) => `${i + 1}. ${r}`).join("\n")}

RAPPEL: Tu es une VRAIE personne qui texte sur son tel, pas une IA.`);

  return parts.join("\n");
}

/**
 * Build user prompt (context + current message)
 */
export function buildUserPrompt(context: Omit<PromptContext, "character">): string {
  const parts: string[] = [];

  // Memory context
  parts.push(formatLongTermForPrompt(context.longTermMemory));
  parts.push("");

  if (context.summaries.length > 0) {
    parts.push(formatSummariesForPrompt(context.summaries));
    parts.push("");
  }

  parts.push(formatShortTermForPrompt(context.shortTermMemory));
  parts.push("");

  // Media
  if (context.availableMedia && context.availableMedia.length > 0) {
    parts.push(formatMediaForPrompt(context.availableMedia));
    parts.push("");
  }

  // Scripts
  if (context.scriptReferences && context.scriptReferences.length > 0) {
    parts.push(formatScriptReferencesForPrompt(context.scriptReferences));
    parts.push("");
  }

  // Messages
  parts.push(formatMessagesForPrompt(context.recentMessages));
  parts.push("");

  // Current
  parts.push(formatCurrentMessagePrompt(context.currentMessage, context.shortTermMemory));

  return parts.join("\n");
}

// ============= FORMATTING HELPERS =============

/**
 * Format available media for prompt
 */
function formatMediaForPrompt(media: MediaContext[]): string {
  const lines: string[] = [];
  lines.push("## Medias disponibles");
  lines.push("Tu peux mentionner ces medias naturellement si c'est pertinent:");
  lines.push("");

  for (const m of media.slice(0, 3)) { // Max 3 media
    const priceInfo = m.isFree ? "(gratuit)" : `(${m.ppvPrice} credits)`;

    lines.push(`### ${m.type}: ${m.title} ${priceInfo}`);
    if (m.description) {
      lines.push(`Description: ${m.description}`);
    }
    if (m.mood) {
      lines.push(`Ambiance: ${m.mood}`);
    }
    if (m.backstory) {
      lines.push(`Histoire: ${m.backstory}`);
    }
    if (m.suggestedIntro) {
      lines.push(`Suggestion: "${m.suggestedIntro}"`);
    }
    lines.push("");
  }

  lines.push("Note: Parle du media naturellement, comme si c'etait ton contenu personnel.");
  lines.push("Ne dis pas 'voici mon PPV a X credits'. Intrigue, tease, fais desirer.");

  return lines.join("\n");
}

/**
 * Format script references for prompt
 */
function formatScriptReferencesForPrompt(scripts: ScriptReference[]): string {
  const lines: string[] = [];
  lines.push("## Exemples de reponses efficaces");
  lines.push("Inspire-toi du TON et des TECHNIQUES, mais cree ta propre reponse unique:");
  lines.push("");

  for (const script of scripts) {
    lines.push(`### Situation: ${script.category}`);
    for (const example of script.examples.slice(0, 2)) { // Max 2 examples per category
      lines.push(`- "${example.response}"`);
      if (example.technique) {
        lines.push(`  Technique: ${example.technique}`);
      }
      if (example.conversionRate && example.conversionRate > 30) {
        lines.push(`  (Taux de conversion: ${example.conversionRate.toFixed(0)}%)`);
      }
    }
    lines.push("");
  }

  lines.push("IMPORTANT: Ne copie PAS ces exemples mot pour mot. Adapte-les a ta personnalite.");

  return lines.join("\n");
}

/**
 * Format recent messages for prompt
 */
function formatMessagesForPrompt(messages: Message[]): string {
  const lines: string[] = [];
  lines.push("## Historique recent");
  lines.push("");

  // Take last 10-15 messages
  const recentMessages = messages.slice(-15);

  for (const msg of recentMessages) {
    const role = msg.role === "assistant" ? "Toi" : "Lui";
    lines.push(`${role}: ${msg.content}`);
  }

  return lines.join("\n");
}

/**
 * Format current message and final instructions
 * Note: maxWords comes from context.shortTermMemory (passed from character.responseRules)
 */
function formatCurrentMessagePrompt(currentMessage: string, shortTerm: ShortTermMemory, maxWords: number = 15): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push("");
  lines.push(`Son message: "${currentMessage}"`);
  lines.push("");

  // Context-aware instructions (brief)
  if (shortTerm.unansweredQuestions.length > 0) {
    lines.push(`[questions en attente: ${shortTerm.unansweredQuestions.slice(0, 2).join(" / ")}]`);
  }

  if (shortTerm.conversationFlow === "stalled") {
    lines.push("[convo en pause - relance]");
  }

  if (shortTerm.currentMood === "frustrated") {
    lines.push("[il est frustre - sois douce]");
  }

  lines.push("");
  lines.push(`Ta reponse (${maxWords} mots max, style texto):`);

  return lines.join("\n");
}

// ============= UTILITY FUNCTIONS =============

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ~ 4 characters for French/English
  return Math.ceil(text.length / 4);
}

/**
 * Truncate messages to fit token budget
 */
export function truncateMessages(messages: Message[], maxTokens: number = 2000): Message[] {
  let totalTokens = 0;
  const result: Message[] = [];

  // Start from most recent
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (totalTokens + msgTokens > maxTokens) break;
    result.unshift(messages[i]);
    totalTokens += msgTokens;
  }

  return result;
}

/**
 * Build a minimal prompt for quick responses
 */
export function buildQuickPrompt(
  character: DeepCharacter,
  currentMessage: string,
  lastFewMessages: Message[] = []
): string {
  const parts: string[] = [];

  parts.push(`Tu es ${character.name}. ${character.innerVoice}`);
  parts.push("");

  if (lastFewMessages.length > 0) {
    parts.push("Derniers messages:");
    for (const msg of lastFewMessages.slice(-5)) {
      const role = msg.role === "assistant" ? "Toi" : "Lui";
      parts.push(`${role}: ${msg.content}`);
    }
    parts.push("");
  }

  parts.push(`Il dit: "${currentMessage}"`);
  parts.push("");
  parts.push("Reponds en 1-2 phrases max:");

  return parts.join("\n");
}
