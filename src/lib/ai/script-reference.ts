/**
 * Script Reference System
 *
 * Loads agency scripts as REFERENCE material for AI.
 * The AI uses these as inspiration and examples, NOT as verbatim responses.
 *
 * NOTE: This feature requires additional fields in the Script model:
 * - intent, language, successScore, aiInstructions
 * All functions return empty arrays until schema is updated.
 */

import { ScriptReference } from "./prompt-builder";

// Re-export for convenience
export type { ScriptReference };

/**
 * Get relevant script references for the current context
 * Returns scripts as examples/inspiration, NOT as responses to send
 */
export async function getScriptReferences(_params: {
  agencyId: string;
  creatorSlug: string;
  currentMessage: string;
  language?: string;
}): Promise<ScriptReference[]> {
  // TODO: Add missing fields to Script model: intent, language, successScore, aiInstructions
  return [];
}

/**
 * Get objection handling scripts
 */
export async function getObjectionScripts(
  _agencyId: string,
  _creatorSlug: string,
  _objectionType: string,
  _language: string = "fr"
): Promise<ScriptReference[]> {
  return [];
}

/**
 * Get greeting scripts
 */
export async function getGreetingScripts(
  _agencyId: string,
  _creatorSlug: string,
  _isReturningFan: boolean,
  _language: string = "fr"
): Promise<ScriptReference[]> {
  return [];
}

/**
 * Get PPV pitch scripts
 */
export async function getPPVScripts(
  _agencyId: string,
  _creatorSlug: string,
  _isExplicit: boolean,
  _language: string = "fr"
): Promise<ScriptReference[]> {
  return [];
}
