/**
 * Multi-Level Memory System
 *
 * Three levels of memory for human-like conversations:
 * 1. Short-Term: Current conversation state
 * 2. Long-Term: Relationship with this fan
 * 3. Summaries: Archived conversation highlights
 */

import prisma from "@/lib/prisma";

// ============= TYPES =============

export interface ShortTermMemory {
  // Current conversation state
  conversationId: string;
  recentTopics: string[];           // Topics discussed recently
  currentMood: "flirty" | "casual" | "emotional" | "playful" | "frustrated";
  lastMediaSent: { type: string; context: string; timestamp: Date } | null;
  unansweredQuestions: string[];    // Questions from fan we haven't addressed
  conversationFlow: "opening" | "engaged" | "closing" | "stalled";
  lastMessageTimestamp: Date | null;
  messagesSinceLastMedia: number;
}

export interface LongTermMemory {
  // Facts about the fan
  fanFacts: {
    name?: string;
    age?: number;
    job?: string;
    location?: string;
    timezone?: string;
    interests: string[];
    importantDates: Array<{ date: string; event: string }>;
  };

  // Personal note - AI-generated rich summary of everything known about the fan
  personalNote?: string;

  // Relationship tracking
  relationshipStage: "new" | "getting_to_know" | "regular" | "vip" | "cooling_off";
  firstContact: Date;
  totalMessages: number;
  totalSpent: number;

  // Discovered preferences
  contentPreferences: string[];     // ["photos lingerie", "videos"]
  communicationStyle: string;       // "aime les taquineries"
  responsiveness: "fast" | "slow" | "varies";

  // Memorable moments
  sharedMoments: Array<{
    date: Date;
    summary: string;                // "Premier PPV achete - tres content"
    sentiment: "positive" | "negative" | "neutral";
  }>;
}

export interface ConversationSummaryData {
  date: Date;
  messageCount: number;
  topics: string[];
  outcome: "sale" | "engagement" | "neutral" | "negative";
  keyMoments: string[];
  nextSteps?: string;
  fanMood?: string;
}

// ============= SHORT-TERM MEMORY =============

/**
 * Get short-term memory for current conversation
 */
export async function getShortTermMemory(conversationId: string): Promise<ShortTermMemory> {
  // Get recent messages to analyze current state
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      media: true,
      sender: { select: { id: true, isCreator: true } }
    }
  });

  if (recentMessages.length === 0) {
    return getEmptyShortTermMemory(conversationId);
  }

  // Analyze recent messages
  const reversed = [...recentMessages].reverse();
  const topics = extractTopics(reversed.map(m => m.text || ""));
  const mood = detectMood(reversed);
  const flow = detectFlow(reversed);
  const unanswered = findUnansweredQuestions(reversed);

  // Find last media sent by creator
  const lastMediaMessage = recentMessages.find(
    m => m.sender.isCreator && m.media.length > 0
  );
  const lastMediaSent = lastMediaMessage
    ? {
        type: lastMediaMessage.media[0].type,
        context: lastMediaMessage.text || "",
        timestamp: lastMediaMessage.createdAt
      }
    : null;

  // Count messages since last media
  let messagesSinceLastMedia = 0;
  for (const msg of recentMessages) {
    if (msg.sender.isCreator && msg.media.length > 0) break;
    messagesSinceLastMedia++;
  }

  return {
    conversationId,
    recentTopics: topics,
    currentMood: mood,
    lastMediaSent,
    unansweredQuestions: unanswered,
    conversationFlow: flow,
    lastMessageTimestamp: recentMessages[0]?.createdAt || null,
    messagesSinceLastMedia
  };
}

function getEmptyShortTermMemory(conversationId: string): ShortTermMemory {
  return {
    conversationId,
    recentTopics: [],
    currentMood: "casual",
    lastMediaSent: null,
    unansweredQuestions: [],
    conversationFlow: "opening",
    lastMessageTimestamp: null,
    messagesSinceLastMedia: 0
  };
}

/**
 * Extract topics from messages
 */
function extractTopics(messages: string[]): string[] {
  const topics: string[] = [];
  const text = messages.join(" ").toLowerCase();

  // Topic patterns
  const topicPatterns: Record<string, RegExp[]> = {
    "travail": [/travail|boulot|job|boss|collegue/i],
    "voyage": [/voyage|vacances|partir|avion|hotel/i],
    "photos": [/photo|pic|image|selfie/i],
    "videos": [/video|clip|film/i],
    "contenu explicite": [/nude|naked|nu|nue|sexy|hot|chaud/i],
    "relation": [/copine|copain|ex|celibataire|marie/i],
    "humeur": [/triste|content|enerve|fatigue|excite/i],
    "compliments": [/belle|beau|magnifique|gorgeous|sexy/i],
  };

  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    if (patterns.some(p => p.test(text))) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 5); // Max 5 topics
}

/**
 * Detect current mood from messages
 */
function detectMood(messages: Array<{ text: string | null; sender: { isCreator: boolean } }>): ShortTermMemory["currentMood"] {
  const fanMessages = messages
    .filter(m => !m.sender.isCreator && m.text)
    .map(m => m.text!.toLowerCase());

  const text = fanMessages.join(" ");

  // Mood detection patterns
  if (/frustre|enerve|marre|nul|arnaque|fake/i.test(text)) return "frustrated";
  if (/je t'aime|tu me manques|miss you|love|coeur/i.test(text)) return "emotional";
  if (/haha|lol|mdr|ptdr|rigole|drole/i.test(text)) return "playful";
  if (/sexy|hot|chaud|envie|excite/i.test(text)) return "flirty";

  return "casual";
}

/**
 * Detect conversation flow state
 */
function detectFlow(messages: Array<{ text: string | null; sender: { isCreator: boolean }; createdAt: Date }>): ShortTermMemory["conversationFlow"] {
  if (messages.length < 3) return "opening";

  const lastMessage = messages[messages.length - 1];
  const timeSinceLastMessage = Date.now() - lastMessage.createdAt.getTime();

  // If over 2 hours since last message, stalled
  if (timeSinceLastMessage > 2 * 60 * 60 * 1000) return "stalled";

  // Check for closing signals
  const lastFewTexts = messages.slice(-3).map(m => m.text?.toLowerCase() || "");
  const closingPatterns = /bye|a plus|bisou|bonne nuit|good night|a demain/i;
  if (lastFewTexts.some(t => closingPatterns.test(t))) return "closing";

  return "engaged";
}

/**
 * Find questions from fan that weren't answered
 */
function findUnansweredQuestions(messages: Array<{ text: string | null; sender: { isCreator: boolean } }>): string[] {
  const unanswered: string[] = [];
  let lastCreatorIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender.isCreator) {
      lastCreatorIndex = i;
      break;
    }
  }

  // Look for questions after last creator message
  for (let i = lastCreatorIndex + 1; i < messages.length; i++) {
    const text = messages[i].text;
    if (text && text.includes("?") && !messages[i].sender.isCreator) {
      // Extract the question
      const questions = text.split(/[.!]/).filter(s => s.includes("?"));
      unanswered.push(...questions.map(q => q.trim()));
    }
  }

  return unanswered.slice(0, 3); // Max 3 unanswered questions
}

// ============= LONG-TERM MEMORY =============

/**
 * Get long-term memory for a fan-creator relationship
 */
export async function getLongTermMemory(fanUserId: string, creatorSlug: string): Promise<LongTermMemory> {
  // Get fan profile with personal note
  const fanProfile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug }
    },
    select: {
      firstSeen: true,
      totalMessages: true,
      totalSpent: true,
      activityLevel: true,
      preferredTone: true,
      personalNote: true,
      spendingTier: true,
    }
  });

  // Get fan memories
  const memories = await prisma.fanMemory.findMany({
    where: {
      fanUserId,
      creatorSlug,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  // Build fan facts from memories
  const fanFacts: LongTermMemory["fanFacts"] = {
    interests: [],
    importantDates: []
  };

  for (const memory of memories) {
    switch (memory.key) {
      case "name":
        fanFacts.name = memory.value;
        break;
      case "age":
        fanFacts.age = parseInt(memory.value);
        break;
      case "job":
        fanFacts.job = memory.value;
        break;
      case "location":
        fanFacts.location = memory.value;
        break;
      case "timezone":
        fanFacts.timezone = memory.value;
        break;
      case "birthday":
        fanFacts.importantDates.push({ date: memory.value, event: "birthday" });
        break;
      default:
        if (memory.category === "preference") {
          fanFacts.interests.push(memory.value);
        }
    }
  }

  // Parse shared moments from profile (field may not exist in older DB schemas)
  let sharedMoments: LongTermMemory["sharedMoments"] = [];
  const fp = fanProfile as typeof fanProfile & { sharedMoments?: string | null; relationshipStage?: string | null };
  if (fp?.sharedMoments) {
    try {
      sharedMoments = JSON.parse(fp.sharedMoments);
    } catch {}
  }

  // Determine responsiveness based on activity
  let responsiveness: LongTermMemory["responsiveness"] = "varies";
  if (fanProfile?.activityLevel === "daily") responsiveness = "fast";
  else if (fanProfile?.activityLevel === "occasional") responsiveness = "slow";

  // Get content preferences from memories
  const contentPreferences = memories
    .filter(m => m.category === "preference" && m.key.includes("content"))
    .map(m => m.value);

  // Compute relationship stage from spending tier
  const computedStage = fanProfile?.spendingTier === "whale" ? "vip"
    : (fanProfile?.totalMessages || 0) > 20 ? "regular"
    : (fanProfile?.totalMessages || 0) > 5 ? "getting_to_know"
    : "new";

  return {
    fanFacts,
    personalNote: fanProfile?.personalNote || undefined,
    relationshipStage: computedStage as LongTermMemory["relationshipStage"],
    firstContact: fanProfile?.firstSeen || new Date(),
    totalMessages: fanProfile?.totalMessages || 0,
    totalSpent: fanProfile?.totalSpent || 0,
    contentPreferences,
    communicationStyle: fanProfile?.preferredTone || "casual",
    responsiveness,
    sharedMoments
  };
}

/**
 * Update relationship stage based on activity
 * Note: relationshipStage field not yet in schema - function is a no-op
 */
export async function updateRelationshipStage(
  _fanUserId: string,
  _creatorSlug: string
): Promise<void> {
  // TODO: Add relationshipStage field to FanProfile schema
  // This function is a no-op until the schema is updated
}

/**
 * Add a shared moment
 * Note: sharedMoments field not yet in schema - function is a no-op
 */
export async function addSharedMoment(
  _fanUserId: string,
  _creatorSlug: string,
  _summary: string,
  _sentiment: "positive" | "negative" | "neutral"
): Promise<void> {
  // TODO: Add sharedMoments field to FanProfile schema
  // This function is a no-op until the schema is updated
}

// ============= CONVERSATION SUMMARIES =============

/**
 * Get recent conversation summaries
 * Note: ConversationSummary model not yet in schema - returns empty array
 */
export async function getConversationSummaries(
  _conversationId: string,
  _limit: number = 5
): Promise<ConversationSummaryData[]> {
  // TODO: Add ConversationSummary model to schema
  return [];
}

/**
 * Save a conversation summary
 * Note: ConversationSummary model not yet in schema - function is a no-op
 */
export async function saveConversationSummary(
  _conversationId: string,
  _summary: ConversationSummaryData,
  _firstMessageId?: string,
  _lastMessageId?: string
): Promise<void> {
  // TODO: Add ConversationSummary model to schema
}

// ============= FORMATTING FOR PROMPTS =============

/**
 * Format short-term memory for AI prompt
 */
export function formatShortTermForPrompt(memory: ShortTermMemory): string {
  const lines: string[] = [];

  lines.push("## Cette conversation");

  if (memory.recentTopics.length > 0) {
    lines.push(`Sujets abordes: ${memory.recentTopics.join(", ")}`);
  }

  lines.push(`Ambiance: ${memory.currentMood}`);
  lines.push(`Flow: ${memory.conversationFlow}`);

  if (memory.lastMediaSent) {
    lines.push(`Dernier media envoye: ${memory.lastMediaSent.type} (${memory.lastMediaSent.context})`);
  }

  if (memory.unansweredQuestions.length > 0) {
    lines.push(`Questions sans reponse: ${memory.unansweredQuestions.join(" | ")}`);
  }

  lines.push(`Messages depuis dernier media: ${memory.messagesSinceLastMedia}`);

  return lines.join("\n");
}

/**
 * Format long-term memory for AI prompt
 */
export function formatLongTermForPrompt(memory: LongTermMemory): string {
  const lines: string[] = [];

  lines.push("## Ce que tu sais sur ce fan");

  // Personal note - AI-generated rich summary (highest priority)
  if (memory.personalNote) {
    lines.push(`📝 Notes: ${memory.personalNote}`);
    lines.push("");
  }

  // Fan facts
  const facts: string[] = [];
  if (memory.fanFacts.name) facts.push(`Prenom: ${memory.fanFacts.name}`);
  if (memory.fanFacts.age) facts.push(`Age: ${memory.fanFacts.age} ans`);
  if (memory.fanFacts.job) facts.push(`Travail: ${memory.fanFacts.job}`);
  if (memory.fanFacts.location) facts.push(`Lieu: ${memory.fanFacts.location}`);

  if (facts.length > 0) {
    lines.push(facts.join(" | "));
  }

  if (memory.fanFacts.interests.length > 0) {
    lines.push(`Interets: ${memory.fanFacts.interests.join(", ")}`);
  }

  // Relationship
  const stageDescriptions: Record<string, string> = {
    new: "Nouveau fan - fais bonne impression",
    getting_to_know: "En train de creer un lien",
    regular: "Fan regulier - il te connait bien",
    vip: "Fan VIP - super fidele, traite-le bien",
    cooling_off: "S'eloigne - essaie de le reconquerir"
  };
  lines.push(`Relation: ${stageDescriptions[memory.relationshipStage] || memory.relationshipStage}`);

  if (memory.totalSpent > 0) {
    lines.push(`A depense: ${memory.totalSpent.toFixed(0)} EUR`);
  }

  // Content preferences
  if (memory.contentPreferences.length > 0) {
    lines.push(`Prefere: ${memory.contentPreferences.join(", ")}`);
  }

  // Shared moments
  if (memory.sharedMoments.length > 0) {
    const recentMoments = memory.sharedMoments.slice(-3);
    lines.push(`Moments partages: ${recentMoments.map(m => m.summary).join(" | ")}`);
  }

  return lines.join("\n");
}

/**
 * Format summaries for AI prompt
 */
export function formatSummariesForPrompt(summaries: ConversationSummaryData[]): string {
  if (summaries.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Conversations precedentes");

  for (const summary of summaries.slice(0, 3)) {
    const date = summary.date.toLocaleDateString("fr-FR");
    lines.push(`- ${date}: ${summary.topics.join(", ")} (${summary.outcome})`);
    if (summary.nextSteps) {
      lines.push(`  A faire: ${summary.nextSteps}`);
    }
  }

  return lines.join("\n");
}

// ============= PERSONAL NOTE UPDATES =============

/**
 * Update personal note for a fan
 * Called by AI after extracting facts from conversation
 */
export async function updatePersonalNote(
  fanUserId: string,
  creatorSlug: string,
  newFacts: Array<{ key: string; value: string }>,
  updatedBy: "ai" | string = "ai"
): Promise<string | null> {
  if (newFacts.length === 0) return null;

  // Get current profile
  const profile = await prisma.fanProfile.findUnique({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug }
    },
    select: {
      personalNote: true,
    }
  });

  // Build updated note
  const currentNote = profile?.personalNote || "";
  const newInfo = newFacts.map(f => `${f.key}: ${f.value}`).join(", ");

  // Append new info (keep it concise)
  let updatedNote: string;
  if (currentNote) {
    // Check if we already have this info to avoid duplicates
    const noteWords = currentNote.toLowerCase();
    const trulyNewFacts = newFacts.filter(f =>
      !noteWords.includes(f.value.toLowerCase())
    );

    if (trulyNewFacts.length === 0) return currentNote;

    const newAdditions = trulyNewFacts.map(f => `${f.key}: ${f.value}`).join(", ");
    updatedNote = `${currentNote} | ${newAdditions}`;
  } else {
    updatedNote = newInfo;
  }

  // Limit note length (max ~500 chars)
  if (updatedNote.length > 500) {
    updatedNote = updatedNote.substring(0, 497) + "...";
  }

  // Update in database
  await prisma.fanProfile.upsert({
    where: {
      fanUserId_creatorSlug: { fanUserId, creatorSlug }
    },
    update: {
      personalNote: updatedNote,
      personalNoteUpdatedAt: new Date(),
      personalNoteUpdatedBy: updatedBy,
    },
    create: {
      fanUserId,
      creatorSlug,
      personalNote: updatedNote,
      personalNoteUpdatedAt: new Date(),
      personalNoteUpdatedBy: updatedBy,
    }
  });

  console.log(`[Memory] Updated personal note for fan ${fanUserId}: "${newInfo}"`);
  return updatedNote;
}

/**
 * Generate personal note update from message
 * Uses pattern matching to extract facts
 */
export function extractFactsFromMessage(message: string): Array<{ key: string; value: string }> {
  const facts: Array<{ key: string; value: string }> = [];
  const lower = message.toLowerCase();

  // Name patterns (multiple languages)
  const namePatterns = [
    /(?:je m'appelle|i'm|my name is|moi c'est|je suis|call me)\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]+)\s+(?:ici|here)$/i,
  ];
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 2 && match[1].length < 20) {
      facts.push({ key: "prénom", value: match[1] });
      break;
    }
  }

  // Age patterns
  const agePatterns = [
    /(?:j'ai|i'm|i am|je suis)\s+(\d{2})\s*(?:ans|years|yo)/i,
    /(\d{2})\s*(?:ans|years old)/i,
  ];
  for (const pattern of agePatterns) {
    const match = message.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 18 && age <= 99) {
        facts.push({ key: "âge", value: `${age} ans` });
        break;
      }
    }
  }

  // Job patterns
  const jobPatterns = [
    /(?:je suis|i'm a|i work as|je travaille comme)\s+(?:un|une|a)?\s*([a-zéèêëàâäùûüôöîïç]+(?:\s+[a-zéèêëàâäùûüôöîïç]+)?)/i,
    /(?:mon boulot|my job|my work).*?(?:c'est|is)\s+([a-zéèêëàâäùûüôöîïç]+)/i,
  ];
  for (const pattern of jobPatterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 3 && match[1].length < 30) {
      // Exclude common false positives
      const excluded = ["un", "une", "le", "la", "très", "super", "trop", "vraiment"];
      if (!excluded.includes(match[1].toLowerCase())) {
        facts.push({ key: "travail", value: match[1] });
        break;
      }
    }
  }

  // Location patterns
  const locationPatterns = [
    /(?:je vis a|i live in|je suis de|i'm from|j'habite a|j'habite à)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i,
    /(?:de|from)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)(?:\s|$|,)/i,
  ];
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 2 && match[1].length < 30) {
      facts.push({ key: "ville", value: match[1] });
      break;
    }
  }

  // Interests/hobbies patterns
  const interestPatterns = [
    /(?:j'aime|j'adore|i love|i like|je kiffe)\s+(?:le|la|les|the)?\s*([a-zéèêëàâäùûüôöîïç]+(?:\s+[a-zéèêëàâäùûüôöîïç]+)?)/i,
    /(?:ma passion|my passion|mon hobby)\s+(?:c'est|is)\s+(?:le|la|les|the)?\s*([a-zéèêëàâäùûüôöîïç]+)/i,
  ];
  for (const pattern of interestPatterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 2) {
      facts.push({ key: "aime", value: match[1] });
      break;
    }
  }

  // Relationship status
  if (/célibataire|single|pas de copine|pas de copain|seul/i.test(lower)) {
    facts.push({ key: "statut", value: "célibataire" });
  } else if (/marié|married|en couple|girlfriend|boyfriend|copine|copain/i.test(lower)) {
    facts.push({ key: "statut", value: "en couple" });
  }

  // Special dates
  const birthdayPatterns = [
    /(?:mon anniv|my birthday|née le|né le|born on)\s+(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  ];
  for (const pattern of birthdayPatterns) {
    const match = message.match(pattern);
    if (match) {
      facts.push({ key: "anniversaire", value: `${match[1]} ${match[2]}` });
      break;
    }
  }

  return facts;
}
