/**
 * Scripts Library
 * Centralized exports for script-related functionality
 */

// Variable system
export {
  SCRIPT_VARIABLES,
  VARIABLE_KEYS,
  parseScriptVariables,
  extractVariables,
  validateScript,
  hasVariables,
  getSampleContext,
  getVariablesByCategory,
  CATEGORY_NAMES,
  type ScriptVariable,
  type ScriptContext,
} from "./variables";

// Attribution system
export {
  attributeSaleToScript,
  recalculateConversionRate,
  recalculateAllScriptStats,
  updateSequenceStats,
  getAttributionStats,
} from "./attribution";

// Intent detection
export {
  SCRIPT_INTENTS,
  detectIntent,
  getIntentsForCategory,
  isExplicitRequest,
  isObjection,
  getIntentDescription,
  type IntentType,
  type DetectedIntent,
} from "./intent-detector";

// Script matching
export {
  matchScript,
  getTopScriptsForIntent,
  getScriptsForCategory,
  trackScriptUsage,
  updateAllScriptMetrics,
  type MatchedScript,
  type ConversationMatchContext,
} from "./script-matcher";
