/**
 * Memory Extractor - Conversational Memory System
 *
 * UNIQUE FEATURE vs Substy
 *
 * Extracts and stores key information from conversations:
 * - Personal details (name, job, location)
 * - Preferences (content types, communication style)
 * - Events (birthday, anniversary, travel)
 * - Relationship context (breakup, lonely, excited)
 *
 * Uses LLM to extract structured data from messages.
 */

import { prisma } from "@/lib/prisma";
import { generateWithClaude, type LLMContext } from "@/lib/llm-router";

// Types
export type MemoryCategory =
  | "personal"
  | "preference"
  | "event"
  | "purchase"
  | "relationship";

export interface ExtractedMemory {
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
}

export interface FanMemoryContext {
  name?: string;
  birthday?: string;
  job?: string;
  location?: string;
  favoriteContent?: string[];
  recentEvents?: string[];
  relationshipStatus?: string;
  interests?: string[];
}

// Memory extraction patterns (for quick extraction without LLM)
const QUICK_PATTERNS = {
  name: [
    /(?:my name is|i'm|i am|call me|it's)\s+([A-Z][a-z]+)/i,
    /(?:je m'appelle|moi c'est|appelle-moi)\s+([A-Z][a-zéèêë]+)/i,
  ],
  age: [
    /(?:i'm|i am|je suis)\s+(\d{2})\s*(?:years? old|ans)/i,
    /(\d{2})\s*(?:years? old|ans)/i,
  ],
  job: [
    /(?:i work as|i'm a|i am a|je suis|je travaille comme)\s+(?:a\s+)?([a-z]+(?:\s+[a-z]+)?)/i,
  ],
  location: [
    /(?:i live in|i'm from|i am from|je vis à|je suis de)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ],
  birthday: [
    /(?:my birthday is|born on|anniversaire le)\s+(\d{1,2}[\/\-]\d{1,2})/i,
    /(?:birthday|anniversaire).*?(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i,
  ],
};

/**
 * Quick pattern-based extraction (fast, no LLM cost)
 */
function quickExtract(text: string): ExtractedMemory[] {
  const memories: ExtractedMemory[] = [];

  for (const [key, patterns] of Object.entries(QUICK_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        memories.push({
          category: key === "birthday" ? "event" : "personal",
          key,
          value: match[1].trim(),
          confidence: 0.9,
        });
        break;
      }
    }
  }

  return memories;
}

/**
 * LLM-based extraction for complex memories
 */
async function llmExtract(
  messages: string[],
  existingMemories: FanMemoryContext
): Promise<ExtractedMemory[]> {
  const conversationText = messages.slice(-10).join("\n");

  const systemPrompt = `You are a memory extraction assistant. Extract personal information from the conversation.

Existing known info:
${JSON.stringify(existingMemories, null, 2)}

Extract any NEW information not already known. Return JSON array:
[
  {"category": "personal|preference|event|relationship", "key": "name|job|birthday|favorite_type|etc", "value": "extracted value", "confidence": 0.5-1.0}
]

Categories:
- personal: name, age, job, location
- preference: favorite content type, preferred style, interests
- event: birthday, anniversary, vacation, special occasions
- relationship: single, taken, breakup, lonely

Only extract if clearly stated. Return empty array [] if nothing new to extract.`;

  const userPrompt = `Conversation:\n${conversationText}\n\nExtract memories as JSON array:`;

  try {
    const llmContext: LLMContext = { conversationType: "normal" };
    const response = await generateWithClaude(systemPrompt, userPrompt, llmContext);

    // Parse JSON from response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.filter(
        (m: ExtractedMemory) => m.category && m.key && m.value && m.confidence >= 0.5
      );
    }
  } catch (error) {
    console.error("LLM memory extraction failed:", error);
  }

  return [];
}

/**
 * Extract memories from a conversation
 */
export async function extractMemories(
  conversationId: string,
  fanUserId: string,
  creatorSlug: string,
  options: {
    useLLM?: boolean;
    sourceMessageId?: string;
  } = {}
): Promise<ExtractedMemory[]> {
  const { useLLM = true, sourceMessageId } = options;

  // Get recent fan messages
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: fanUserId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { text: true },
  });

  const messageTexts = messages.map((m) => m.text || "").filter(Boolean);
  const allText = messageTexts.join("\n");

  // Quick extraction first
  const quickMemories = quickExtract(allText);

  // Get existing memories
  const existingMemories = await getMemoryContext(fanUserId, creatorSlug);

  // Filter out already known info
  const newQuickMemories = quickMemories.filter((m) => {
    const existingValue = existingMemories[m.key as keyof FanMemoryContext];
    return !existingValue || existingValue !== m.value;
  });

  // Save quick memories
  for (const memory of newQuickMemories) {
    await saveMemory(fanUserId, creatorSlug, memory, sourceMessageId);
  }

  // LLM extraction for complex patterns
  let llmMemories: ExtractedMemory[] = [];
  if (useLLM && messageTexts.length >= 5) {
    llmMemories = await llmExtract(messageTexts, existingMemories);

    // Filter and save LLM memories
    for (const memory of llmMemories) {
      const existingValue = existingMemories[memory.key as keyof FanMemoryContext];
      if (!existingValue) {
        await saveMemory(fanUserId, creatorSlug, memory, sourceMessageId, "ai");
      }
    }
  }

  return [...newQuickMemories, ...llmMemories];
}

/**
 * Save a memory to the database
 */
async function saveMemory(
  fanUserId: string,
  creatorSlug: string,
  memory: ExtractedMemory,
  sourceMessageId?: string,
  extractedBy: string = "pattern"
): Promise<void> {
  // Check for temporary memories (should expire)
  let expiresAt: Date | undefined;
  if (
    memory.key === "traveling" ||
    memory.key === "vacation" ||
    memory.key === "busy"
  ) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // Expire in 2 weeks
  }

  await prisma.fanMemory.upsert({
    where: {
      fanUserId_creatorSlug_key: {
        fanUserId,
        creatorSlug,
        key: memory.key,
      },
    },
    update: {
      value: memory.value,
      confidence: memory.confidence,
      sourceMessageId,
      extractedBy,
      lastConfirmed: new Date(),
      expiresAt,
    },
    create: {
      fanUserId,
      creatorSlug,
      category: memory.category,
      key: memory.key,
      value: memory.value,
      confidence: memory.confidence,
      sourceMessageId,
      extractedBy,
      expiresAt,
    },
  });
}

/**
 * Get memory context for a fan (for AI prompts)
 */
export async function getMemoryContext(
  fanUserId: string,
  creatorSlug: string
): Promise<FanMemoryContext> {
  const memories = await prisma.fanMemory.findMany({
    where: {
      fanUserId,
      creatorSlug,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  const context: FanMemoryContext = {};

  for (const m of memories) {
    switch (m.key) {
      case "name":
        context.name = m.value;
        break;
      case "birthday":
        context.birthday = m.value;
        break;
      case "job":
        context.job = m.value;
        break;
      case "location":
        context.location = m.value;
        break;
      case "favorite_type":
      case "content_preference":
        if (!context.favoriteContent) context.favoriteContent = [];
        context.favoriteContent.push(m.value);
        break;
      case "relationship_status":
        context.relationshipStatus = m.value;
        break;
      default:
        if (m.category === "event") {
          if (!context.recentEvents) context.recentEvents = [];
          context.recentEvents.push(`${m.key}: ${m.value}`);
        } else if (m.category === "preference") {
          if (!context.interests) context.interests = [];
          context.interests.push(m.value);
        }
    }
  }

  return context;
}

/**
 * Format memories for AI prompt
 */
export async function formatMemoriesForPrompt(
  fanUserId: string,
  creatorSlug: string
): Promise<string> {
  const context = await getMemoryContext(fanUserId, creatorSlug);

  const parts: string[] = [];

  if (context.name) {
    parts.push(`Their name is ${context.name}`);
  }

  if (context.job) {
    parts.push(`They work as a ${context.job}`);
  }

  if (context.location) {
    parts.push(`They live in ${context.location}`);
  }

  if (context.relationshipStatus) {
    parts.push(`Relationship status: ${context.relationshipStatus}`);
  }

  if (context.favoriteContent && context.favoriteContent.length > 0) {
    parts.push(`They like: ${context.favoriteContent.join(", ")}`);
  }

  if (context.recentEvents && context.recentEvents.length > 0) {
    parts.push(`Recent events: ${context.recentEvents.join(", ")}`);
  }

  if (context.interests && context.interests.length > 0) {
    parts.push(`Interests: ${context.interests.join(", ")}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `Fan info: ${parts.join(". ")}.`;
}

/**
 * Manually add a memory (by chatter)
 */
export async function addMemory(
  fanUserId: string,
  creatorSlug: string,
  category: MemoryCategory,
  key: string,
  value: string,
  chatterId?: string
): Promise<void> {
  await prisma.fanMemory.upsert({
    where: {
      fanUserId_creatorSlug_key: {
        fanUserId,
        creatorSlug,
        key,
      },
    },
    update: {
      value,
      category,
      confidence: 1.0, // Manual = high confidence
      extractedBy: chatterId ? "chatter" : "manual",
      lastConfirmed: new Date(),
    },
    create: {
      fanUserId,
      creatorSlug,
      category,
      key,
      value,
      confidence: 1.0,
      extractedBy: chatterId ? "chatter" : "manual",
    },
  });
}

/**
 * Delete a memory
 */
export async function deleteMemory(
  fanUserId: string,
  creatorSlug: string,
  key: string
): Promise<void> {
  await prisma.fanMemory.update({
    where: {
      fanUserId_creatorSlug_key: {
        fanUserId,
        creatorSlug,
        key,
      },
    },
    data: {
      isActive: false,
    },
  });
}

/**
 * Get all memories for a fan
 */
export async function getFanMemories(
  fanUserId: string,
  creatorSlug: string
): Promise<
  Array<{
    category: string;
    key: string;
    value: string;
    confidence: number;
    extractedAt: Date;
  }>
> {
  const memories = await prisma.fanMemory.findMany({
    where: {
      fanUserId,
      creatorSlug,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return memories.map((m) => ({
    category: m.category,
    key: m.key,
    value: m.value,
    confidence: m.confidence,
    extractedAt: m.createdAt,
  }));
}

/**
 * Clean up expired memories
 */
export async function cleanExpiredMemories(): Promise<number> {
  const result = await prisma.fanMemory.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(
  creatorSlug: string
): Promise<{
  totalMemories: number;
  fansWithMemories: number;
  byCategory: Record<MemoryCategory, number>;
  mostCommonKeys: Array<{ key: string; count: number }>;
}> {
  const memories = await prisma.fanMemory.findMany({
    where: {
      creatorSlug,
      isActive: true,
    },
  });

  const uniqueFans = new Set(memories.map((m) => m.fanUserId));

  const byCategory: Record<MemoryCategory, number> = {
    personal: 0,
    preference: 0,
    event: 0,
    purchase: 0,
    relationship: 0,
  };

  const keyCount: Record<string, number> = {};

  for (const m of memories) {
    byCategory[m.category as MemoryCategory]++;
    keyCount[m.key] = (keyCount[m.key] || 0) + 1;
  }

  const mostCommonKeys = Object.entries(keyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }));

  return {
    totalMemories: memories.length,
    fansWithMemories: uniqueFans.size,
    byCategory,
    mostCommonKeys,
  };
}
