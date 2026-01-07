/**
 * Human-Like Response Generator
 *
 * The core of the new AI conversation system.
 * Generates natural, contextual responses that feel like a real person.
 *
 * Flow:
 * 1. Load character (deep personality)
 * 2. Load memories (short-term, long-term, summaries)
 * 3. Load recent messages
 * 4. Analyze if media is relevant
 * 5. Load script references (inspiration)
 * 6. Build rich contextual prompt
 * 7. Generate response
 * 8. Post-process (clean, validate)
 * 9. Update memories
 */

import prisma from "@/lib/prisma";
import { generateAiMessage, type ChatMessage } from "../ai-client";
import { type AiProvider } from "../ai-providers";

import { loadCharacter, DeepCharacter, DEFAULT_CHARACTER } from "./character";
import {
  getShortTermMemory,
  getLongTermMemory,
  getConversationSummaries,
  updateRelationshipStage,
  addSharedMoment,
  ShortTermMemory,
  LongTermMemory,
  ConversationSummaryData
} from "./memory";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildQuickPrompt,
  truncateMessages,
  Message,
  MediaContext
} from "./prompt-builder";
import { getScriptReferences, ScriptReference } from "./script-reference";
import { matchScript, MatchedScript, buildMatchedScriptPrompt, getNextScript } from "../scripts/script-matcher";
import { detectResponseOutcome, ResponseOutcome } from "../scripts/intent-detector";

// ============= TYPES =============

export interface GeneratorParams {
  conversationId: string;
  fanUserId: string;
  creatorSlug: string;
  currentMessage: string;

  // Optional overrides
  personalityId?: string;
  language?: string;

  // AI provider settings
  provider?: AiProvider;
  model?: string;
  apiKey?: string | null;

  // Agency context for scripts
  agencyId?: string;
}

export interface GeneratorResult {
  text: string;
  shouldSendMedia: boolean;
  selectedMedia?: MediaContext;
  memoryUpdates: {
    shortTerm: Partial<ShortTermMemory>;
    extractedFacts: Array<{ key: string; value: string }>;
  };
  // Flow tracking for automatic script sequences
  flowUpdate?: {
    scriptId: string;
    hasNextOnSuccess: boolean;
    hasNextOnReject: boolean;
    hasFollowUp: boolean;
    followUpDelay?: number; // minutes
  };
  debugInfo?: {
    strategy: string;
    tokensUsed?: number;
    scriptsUsed: number;
    matchedScriptId?: string;
    matchedScriptName?: string;
    matchedScriptConfidence?: number;
    scriptMediaCount?: number;
    flowContinued?: boolean;
    fanResponseOutcome?: ResponseOutcome;
  };
}

// ============= MAIN GENERATOR =============

/**
 * Generate a human-like response
 */
export async function generateHumanResponse(params: GeneratorParams): Promise<GeneratorResult> {
  const {
    conversationId,
    fanUserId,
    creatorSlug,
    currentMessage,
    personalityId,
    language = "fr",
    provider = "openrouter",
    model = "mistralai/mistral-small-creative",
    apiKey,
    agencyId
  } = params;

  // 1. Load character
  const character = await loadCharacter(creatorSlug, personalityId);

  // 2. Load memories
  const [shortTerm, longTerm, summaries] = await Promise.all([
    getShortTermMemory(conversationId),
    getLongTermMemory(fanUserId, creatorSlug),
    getConversationSummaries(conversationId, 3)
  ]);

  // 3. Load recent messages
  const rawMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      sender: { select: { id: true, isCreator: true } }
    }
  });

  const recentMessages: Message[] = rawMessages
    .reverse()
    .map(m => ({
      role: m.sender.isCreator ? "assistant" : "user",
      content: m.text || "[media]",
      timestamp: m.createdAt
    })) as Message[];

  // 4. Check for flow continuation (if we sent a script and are awaiting fan response)
  let matchedScript: MatchedScript | null = null;
  let scriptMediaAvailable: MediaContext[] = [];
  let flowContinued = false;
  let fanResponseOutcome: ResponseOutcome | undefined;
  let flowScriptInfo: { id: string; followUpDelay?: number; followUpScriptId?: string } | null = null;

  // Load conversation to check flow state
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      lastScriptId: true,
      awaitingFanResponse: true,
    },
  });

  // Check if we're in a flow and awaiting response
  if (conversation?.awaitingFanResponse && conversation?.lastScriptId) {
    // Detect fan's response outcome
    const outcomeResult = detectResponseOutcome(currentMessage);
    fanResponseOutcome = outcomeResult.outcome;

    // Get next script based on outcome
    if (outcomeResult.outcome === "positive" || outcomeResult.outcome === "negative") {
      const nextScriptOutcome = outcomeResult.outcome === "positive" ? "success" : "reject";
      const nextScript = await getNextScript(conversation.lastScriptId, nextScriptOutcome);

      if (nextScript) {
        flowContinued = true;

        // Get full script with media
        const fullScript = await prisma.script.findUnique({
          where: { id: nextScript.id },
          select: {
            id: true,
            name: true,
            content: true,
            category: true,
            intent: true,
            conversionRate: true,
            successScore: true,
            aiInstructions: true,
            allowAiModify: true,
            preserveCore: true,
            language: true,
            suggestedPrice: true,
            nextScriptOnSuccess: true,
            nextScriptOnReject: true,
            followUpDelay: true,
            followUpScriptId: true,
            mediaItems: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                media: {
                  select: {
                    id: true,
                    type: true,
                    title: true,
                    description: true,
                    contentUrl: true,
                    previewUrl: true,
                    thumbnailUrl: true,
                    ppvPriceCredits: true,
                    tagFree: true,
                    tagPPV: true,
                  },
                },
              },
            },
          },
        });

        if (fullScript) {
          // Create MatchedScript from flow script
          matchedScript = {
            script: {
              id: fullScript.id,
              name: fullScript.name,
              content: fullScript.content,
              category: fullScript.category,
              intent: fullScript.intent,
              conversionRate: fullScript.conversionRate,
              successScore: fullScript.successScore,
              aiInstructions: fullScript.aiInstructions,
              allowAiModify: fullScript.allowAiModify,
              preserveCore: fullScript.preserveCore,
              language: fullScript.language,
              suggestedPrice: fullScript.suggestedPrice,
              nextScriptOnSuccess: fullScript.nextScriptOnSuccess,
              nextScriptOnReject: fullScript.nextScriptOnReject,
              mediaItems: fullScript.mediaItems,
            },
            confidence: 0.9, // High confidence for flow scripts
            intent: null,
            strategy: fullScript.allowAiModify ? "AI_PERSONALIZED_SCRIPT" : "SCRIPT_ONLY",
            parsedContent: fullScript.content,
            matchReason: "intent", // Flow continuation
          };

          flowScriptInfo = {
            id: fullScript.id,
            followUpDelay: fullScript.followUpDelay || undefined,
            followUpScriptId: fullScript.followUpScriptId || undefined,
          };

          // Convert script media
          if (fullScript.mediaItems.length > 0) {
            scriptMediaAvailable = fullScript.mediaItems.map(item => ({
              id: item.media.id,
              type: item.media.type as "PHOTO" | "VIDEO",
              title: item.media.title,
              description: item.media.description || undefined,
              isFree: item.media.tagFree,
              ppvPrice: item.media.ppvPriceCredits || fullScript.suggestedPrice || undefined,
              contentUrl: item.media.contentUrl,
              previewUrl: item.media.previewUrl || undefined,
              thumbnailUrl: item.media.thumbnailUrl || undefined,
            }));
          }
        }
      }
    }
  }

  // 5. Try to match a new script if no flow continuation
  if (!matchedScript && agencyId) {
    matchedScript = await matchScript({
      message: currentMessage,
      creatorSlug,
      agencyId,
      fanName: longTerm.fanFacts?.name || undefined,
      fanStage: longTerm.relationshipStage as "new" | "engaged" | "vip" | "cooling_off" | undefined,
      creatorName: character.name,
      language,
    });

    // Convert script media to MediaContext format
    if (matchedScript?.script.mediaItems && matchedScript.script.mediaItems.length > 0) {
      scriptMediaAvailable = matchedScript.script.mediaItems.map(item => ({
        id: item.media.id,
        type: item.media.type as "PHOTO" | "VIDEO",
        title: item.media.title,
        description: item.media.description || undefined,
        isFree: item.media.tagFree,
        ppvPrice: item.media.ppvPriceCredits || matchedScript!.script.suggestedPrice || undefined,
        contentUrl: item.media.contentUrl,
        previewUrl: item.media.previewUrl || undefined,
        thumbnailUrl: item.media.thumbnailUrl || undefined,
      }));

      // Store flow info for new matched script
      if (matchedScript) {
        const scriptDetails = await prisma.script.findUnique({
          where: { id: matchedScript.script.id },
          select: { followUpDelay: true, followUpScriptId: true },
        });
        if (scriptDetails) {
          flowScriptInfo = {
            id: matchedScript.script.id,
            followUpDelay: scriptDetails.followUpDelay || undefined,
            followUpScriptId: scriptDetails.followUpScriptId || undefined,
          };
        }
      }
    }
  }

  // 5. Analyze if media should be sent
  const mediaDecision = analyzeMediaRelevance(currentMessage, shortTerm, longTerm);

  // 6. Get available media - prioritize script media, fallback to library
  let availableMedia: MediaContext[] = [];
  if (scriptMediaAvailable.length > 0) {
    // Use media from matched script
    availableMedia = scriptMediaAvailable;
  } else if (mediaDecision.shouldConsider) {
    // Fallback to creator's media library
    availableMedia = await getAvailableMedia(creatorSlug, currentMessage);
  }

  // 7. Get script references (inspiration) - for additional context
  // Scripts are now tied to creators, not agencies
  const scriptReferences = await getScriptReferences({
    creatorSlug,
    agencyId: agencyId || null,
    currentMessage,
    language
  });

  // 8. Build prompts
  let systemPrompt = buildSystemPrompt(character, language);

  // Add matched script prompt if we have a high-confidence match
  if (matchedScript && matchedScript.confidence >= 0.5) {
    systemPrompt += buildMatchedScriptPrompt(matchedScript);
  }

  const userPrompt = buildUserPrompt({
    shortTermMemory: shortTerm,
    longTermMemory: longTerm,
    summaries,
    recentMessages: truncateMessages(recentMessages, 1500),
    currentMessage,
    availableMedia: availableMedia.slice(0, 3),
    scriptReferences: scriptReferences.slice(0, 2),
    language
  });

  // 8. Generate response
  const chatMessages: ChatMessage[] = [
    { role: "user", content: userPrompt }
  ];

  let responseText: string;

  try {
    const result = await generateAiMessage({
      provider,
      model,
      apiKey: apiKey || null,
      messages: chatMessages,
      systemPrompt,
      maxTokens: 100, // Shorter responses
      temperature: 0.95 // More creative and varied like real human
    });

    responseText = result.content?.trim() || "";
  } catch (error) {
    console.error("[Generator] AI generation error:", error);
    responseText = getFallbackResponse(character, shortTerm);
  }

  // 9. Post-process response
  responseText = postProcessResponse(responseText, character);

  // 10. Determine if we should send media
  let shouldSendMedia = false;
  let selectedMedia: MediaContext | undefined;

  // If script has media attached, strongly prefer sending it
  if (scriptMediaAvailable.length > 0 && matchedScript && matchedScript.confidence >= 0.5) {
    shouldSendMedia = true;
    // Use first media from script (ordered by priority)
    selectedMedia = scriptMediaAvailable[0];
  } else if (mediaDecision.shouldSend && availableMedia.length > 0) {
    shouldSendMedia = true;
    selectedMedia = selectBestMedia(availableMedia, currentMessage, mediaDecision.preferFree);
  }

  // 11. Extract memory updates
  const extractedFacts = extractFactsFromMessage(currentMessage);

  // 12. Update relationship stage (async)
  updateRelationshipStage(fanUserId, creatorSlug).catch(err =>
    console.error("[Generator] Failed to update relationship stage:", err)
  );

  // Build flow update info if we used a script
  let flowUpdate: GeneratorResult["flowUpdate"] | undefined;
  if (matchedScript && flowScriptInfo) {
    flowUpdate = {
      scriptId: flowScriptInfo.id,
      hasNextOnSuccess: !!matchedScript.script.nextScriptOnSuccess,
      hasNextOnReject: !!matchedScript.script.nextScriptOnReject,
      hasFollowUp: !!flowScriptInfo.followUpScriptId,
      followUpDelay: flowScriptInfo.followUpDelay,
    };
  }

  return {
    text: responseText,
    shouldSendMedia,
    selectedMedia,
    memoryUpdates: {
      shortTerm: {
        recentTopics: [...shortTerm.recentTopics, ...extractTopicsFromMessage(currentMessage)].slice(-5),
        currentMood: detectMoodFromMessage(currentMessage) || shortTerm.currentMood
      },
      extractedFacts
    },
    flowUpdate,
    debugInfo: {
      strategy: flowContinued
        ? `flow-continued:${matchedScript?.strategy}`
        : matchedScript
          ? `script-matched:${matchedScript.strategy}`
          : scriptReferences.length > 0
            ? "script-inspired"
            : "pure-ai",
      scriptsUsed: scriptReferences.reduce((sum, r) => sum + r.examples.length, 0),
      matchedScriptId: matchedScript?.script.id,
      matchedScriptName: matchedScript?.script.name,
      matchedScriptConfidence: matchedScript?.confidence,
      scriptMediaCount: scriptMediaAvailable.length,
      flowContinued,
      fanResponseOutcome,
    }
  };
}

// ============= MEDIA ANALYSIS =============

interface MediaDecision {
  shouldConsider: boolean;
  shouldSend: boolean;
  preferFree: boolean;
  reason: string;
}

function analyzeMediaRelevance(
  message: string,
  shortTerm: ShortTermMemory,
  longTerm: LongTermMemory
): MediaDecision {
  const lower = message.toLowerCase();

  // Explicit content requests
  const explicitPatterns = /nude|naked|nu|nue|photo|pic|video|montre|show|envoie|send|voir|see/i;
  if (explicitPatterns.test(lower)) {
    return {
      shouldConsider: true,
      shouldSend: true,
      preferFree: longTerm.relationshipStage === "new",
      reason: "explicit_request"
    };
  }

  // Too many messages without media
  if (shortTerm.messagesSinceLastMedia >= 6) {
    return {
      shouldConsider: true,
      shouldSend: Math.random() < 0.5, // 50% chance
      preferFree: longTerm.totalSpent < 10,
      reason: "engagement_boost"
    };
  }

  // Positive reactions (good time to upsell)
  const positivePatterns = /wow|amazing|incroyable|magnifique|j'adore|love|parfait|perfect/i;
  if (positivePatterns.test(lower)) {
    return {
      shouldConsider: true,
      shouldSend: Math.random() < 0.3, // 30% chance
      preferFree: false,
      reason: "positive_reaction"
    };
  }

  // Default: don't push media
  return {
    shouldConsider: false,
    shouldSend: false,
    preferFree: true,
    reason: "not_relevant"
  };
}

async function getAvailableMedia(creatorSlug: string, context: string): Promise<MediaContext[]> {
  const media = await prisma.mediaContent.findMany({
    where: {
      creatorSlug,
      tagAI: true
    },
    take: 10,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      tagFree: true,
      tagPPV: true,
      ppvPriceCredits: true,
      contentUrl: true,
      previewUrl: true,
      thumbnailUrl: true
    }
  });

  return media.map(m => ({
    id: m.id,
    type: m.type as "PHOTO" | "VIDEO",
    title: m.title,
    description: m.description || undefined,
    isFree: m.tagFree,
    ppvPrice: m.ppvPriceCredits || undefined,
    contentUrl: m.contentUrl,
    previewUrl: m.previewUrl || undefined,
    thumbnailUrl: m.thumbnailUrl || undefined
  }));
}

function selectBestMedia(
  media: MediaContext[],
  context: string,
  preferFree: boolean
): MediaContext {
  // Filter by free preference
  const filtered = preferFree
    ? media.filter(m => m.isFree) || media
    : media;

  if (filtered.length === 0) return media[0];

  // Score media by relevance to context
  const lower = context.toLowerCase();
  const scored = filtered.map(m => {
    let score = 0;

    // Type matching
    if (lower.includes("video") && m.type === "VIDEO") score += 5;
    if ((lower.includes("photo") || lower.includes("pic")) && m.type === "PHOTO") score += 5;

    // Title relevance
    const titleLower = m.title.toLowerCase();
    if (lower.includes("sexy") && titleLower.includes("sexy")) score += 3;
    if (lower.includes("nude") && (titleLower.includes("nude") || titleLower.includes("nu"))) score += 3;

    // Add randomness
    score += Math.random() * 2;

    return { media: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].media;
}

// ============= POST-PROCESSING =============

/**
 * Post-process AI response to enforce style rules
 * Uses CONFIGURABLE rules from character.responseRules
 */
function postProcessResponse(response: string, character: DeepCharacter): string {
  let text = response;
  const rules = character.responseRules;

  // Remove AI artifacts
  text = text
    .replace(/<\/?s>/gi, '')
    .replace(/<\/?bot>/gi, '')
    .replace(/<\/?user>/gi, '')
    .replace(/<\/?assistant>/gi, '')
    .replace(/<\|[^|]*\|>/g, '')
    .replace(/\[INST\][\s\S]*?\[\/INST\]/g, '')
    .replace(/<<SYS>>[\s\S]*?<<\/SYS>>/g, '')
    .replace(/\*[^*]+\*/g, '') // Remove *actions*
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce boundaries - remove forbidden words
  for (const forbidden of character.boundaries.neverSay) {
    const regex = new RegExp(forbidden, 'gi');
    text = text.replace(regex, '');
  }

  // Clean up double spaces
  text = text.replace(/\s+/g, ' ').trim();

  // If response is empty after cleaning, use fallback
  if (!text || text.length < 3) {
    return getFallbackResponse(character, null);
  }

  // ===== APPLY CONFIGURABLE RULES =====

  // 1. Remove trailing period (if noPeriods is enabled)
  if (rules.noPeriods) {
    text = text.replace(/\.+$/, '');
  }

  // 2. Lowercase first letter (if noCapitals is enabled)
  if (rules.noCapitals && text.length > 0 && /^[A-Z]/.test(text) && !/^[A-Z][a-z]+\s/.test(text)) {
    const firstChar = text[0];
    if (!'ÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ'.includes(firstChar)) {
      text = text[0].toLowerCase() + text.slice(1);
    }
  }

  // 3. Remove formal phrases (if textingStyle is enabled)
  if (rules.textingStyle) {
    const formalPatterns = [
      /^(bonjour|bonsoir|salut)\s*[!.,]?\s*/i,
      /^(hey|coucou)\s*[!.,]?\s*/i,
      /comment vas[- ]?tu\s*[?!.,]?\s*/i,
      /j'espère que (tu vas bien|tout va bien)[.,!]?\s*/i,
      /n'hésite pas à[^.!?]+[.!?]?\s*/i,
      /c'est une (bonne|excellente) question[.!]?\s*/i,
      /je suis (là|la) pour (toi|t'aider)[.!]?\s*/i,
    ];

    for (const pattern of formalPatterns) {
      text = text.replace(pattern, '');
    }
  }

  // 4. Remove multiple sentences - keep only first 2 for brevity
  const sentences = text.split(/(?<=[.!?])\s+(?=[a-zA-ZÀ-ÿ])/);
  if (sentences.length > 2) {
    text = sentences.slice(0, 2).join(' ');
  }

  // 5. Limit by word count (from configurable maxWords)
  const words = text.split(/\s+/);
  if (words.length > rules.maxWords * 1.5) { // Allow 50% overflow, then cut
    text = words.slice(0, rules.maxWords).join(' ');
    // Remove trailing punctuation that might be incomplete
    text = text.replace(/[.,;:!?]+$/, '');
  }

  // 6. Limit emojis (from configurable maxEmojis)
  if (rules.maxEmojis === 0) {
    // Remove all emojis
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  } else if (rules.maxEmojis > 0) {
    // Count and limit emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    if (emojis.length > rules.maxEmojis) {
      // Remove excess emojis (keep first N)
      let emojiCount = 0;
      text = text.replace(emojiRegex, (match) => {
        emojiCount++;
        return emojiCount <= rules.maxEmojis ? match : '';
      });
    }
  }

  // 7. Final cleanup
  text = text.replace(/\s+/g, ' ').trim();
  if (rules.noPeriods) {
    text = text.replace(/\.+$/, '');
  }

  // If response is now empty, use fallback
  if (!text || text.length < 3) {
    return getFallbackResponse(character, null);
  }

  return text;
}

// ============= FALLBACK RESPONSES =============

function getFallbackResponse(character: DeepCharacter, shortTerm: ShortTermMemory | null): string {
  // More natural, shorter fallbacks (like real textos)
  const responses = {
    fr: [
      "haha et toi t'en penses quoi?",
      "mmm interessant...",
      "ah ouais? raconte",
      "hihi t'es mignon 😏",
      "et du coup?",
      "jsuis curieuse la...",
      "ah bon? 👀",
      "mdrrr mais encore?",
      "genre serieux?",
      "continue continue..."
    ],
    en: [
      "haha tell me more",
      "mmm interesting...",
      "oh really? 👀",
      "you're cute haha",
      "and then?",
      "wait what?",
      "go on...",
      "lol seriously?",
      "hmm I'm curious now"
    ]
  };

  const lang = character.primaryLanguage === "fr" ? "fr" : "en";
  const pool = responses[lang];

  // If conversation is stalled, use more engaging response
  if (shortTerm?.conversationFlow === "stalled") {
    const stalledResponses = lang === "fr"
      ? ["hey t'es ou? 😘", "tu m'as oubliee? 😏", "coucou t'es la?"]
      : ["hey where are you? 😘", "did you forget me? 😏", "hello?"];
    return stalledResponses[Math.floor(Math.random() * stalledResponses.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ============= HELPER FUNCTIONS =============

function extractFactsFromMessage(message: string): Array<{ key: string; value: string }> {
  const facts: Array<{ key: string; value: string }> = [];
  const lower = message.toLowerCase();

  // Name patterns
  const nameMatch = message.match(/(?:je m'appelle|i'm|my name is|moi c'est)\s+([A-Z][a-z]+)/i);
  if (nameMatch) {
    facts.push({ key: "name", value: nameMatch[1] });
  }

  // Job patterns
  const jobMatch = message.match(/(?:je suis|i'm a|i work as)\s+(un|une|a)?\s*([a-z]+(?:\s+[a-z]+)?)/i);
  if (jobMatch && jobMatch[2].length > 3) {
    facts.push({ key: "job", value: jobMatch[2] });
  }

  // Location patterns
  const locationMatch = message.match(/(?:je vis a|i live in|je suis de|i'm from)\s+([A-Z][a-z]+)/i);
  if (locationMatch) {
    facts.push({ key: "location", value: locationMatch[1] });
  }

  return facts;
}

function extractTopicsFromMessage(message: string): string[] {
  const topics: string[] = [];
  const lower = message.toLowerCase();

  const topicPatterns: Record<string, RegExp> = {
    travail: /travail|boulot|job|boss/,
    voyage: /voyage|vacances|avion|hotel/,
    photo: /photo|pic|image/,
    video: /video|clip/,
    relation: /copine|copain|ex|celibataire/
  };

  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(lower)) {
      topics.push(topic);
    }
  }

  return topics;
}

function detectMoodFromMessage(message: string): ShortTermMemory["currentMood"] | null {
  const lower = message.toLowerCase();

  if (/frustre|enerve|marre|nul/i.test(lower)) return "frustrated";
  if (/je t'aime|tu me manques|miss you|love/i.test(lower)) return "emotional";
  if (/haha|lol|mdr|ptdr/i.test(lower)) return "playful";
  if (/sexy|hot|chaud|envie/i.test(lower)) return "flirty";

  return null;
}

// ============= FLOW TRACKING =============

/**
 * Update conversation flow state after sending a script
 * Call this after successfully sending a message with a script
 */
export async function updateConversationFlow(
  conversationId: string,
  flowUpdate: GeneratorResult["flowUpdate"]
): Promise<void> {
  if (!flowUpdate) return;

  const updateData: Record<string, unknown> = {
    lastScriptId: flowUpdate.scriptId,
    lastScriptSentAt: new Date(),
    awaitingFanResponse: flowUpdate.hasNextOnSuccess || flowUpdate.hasNextOnReject,
    followUpSent: false,
  };

  // Set up follow-up if configured
  if (flowUpdate.hasFollowUp && flowUpdate.followUpDelay) {
    const followUpTime = new Date();
    followUpTime.setMinutes(followUpTime.getMinutes() + flowUpdate.followUpDelay);

    updateData.pendingFollowUpId = flowUpdate.scriptId; // We'll look up the followUpScriptId later
    updateData.followUpDueAt = followUpTime;
  } else {
    updateData.pendingFollowUpId = null;
    updateData.followUpDueAt = null;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updateData,
  });
}

/**
 * Clear flow state when fan responds (no longer awaiting)
 * Call this when a fan sends a message
 */
export async function clearFlowAwaitingState(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      awaitingFanResponse: false,
      // Keep lastScriptId for flow continuation
      // Keep follow-up settings until they're sent
    },
  });
}

// ============= EXPORTS =============

export {
  loadCharacter,
  getShortTermMemory,
  getLongTermMemory,
  getConversationSummaries,
  buildSystemPrompt,
  buildUserPrompt
};
// Note: updateConversationFlow and clearFlowAwaitingState are already exported via their function declarations
