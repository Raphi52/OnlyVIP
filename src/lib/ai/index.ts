/**
 * AI System - Human-Like Conversation Engine
 *
 * This module provides a complete AI conversation system that generates
 * natural, human-like responses with deep memory and personality.
 *
 * Main exports:
 * - generateHumanResponse: Main function to generate responses
 * - loadCharacter: Load a deep character personality
 * - Memory functions: Short-term, long-term, and summaries
 */

// Main generator
export {
  generateHumanResponse,
  type GeneratorParams,
  type GeneratorResult
} from "./generator";

// Character system
export {
  loadCharacter,
  formatCharacterForPrompt,
  generateCharacterPrompt,
  getLanguageInstructions,
  DEFAULT_CHARACTER,
  type DeepCharacter,
  type WritingStyle,
  type CharacterBoundaries
} from "./character";

// Memory system
export {
  getShortTermMemory,
  getLongTermMemory,
  getConversationSummaries,
  saveConversationSummary,
  updateRelationshipStage,
  addSharedMoment,
  formatShortTermForPrompt,
  formatLongTermForPrompt,
  formatSummariesForPrompt,
  type ShortTermMemory,
  type LongTermMemory,
  type ConversationSummaryData
} from "./memory";

// Prompt building
export {
  buildConversationPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  buildQuickPrompt,
  truncateMessages,
  estimateTokens,
  type PromptContext,
  type MediaContext,
  type Message
} from "./prompt-builder";

// Script references
export {
  getScriptReferences,
  getObjectionScripts,
  getGreetingScripts,
  getPPVScripts,
  type ScriptReference
} from "./script-reference";
