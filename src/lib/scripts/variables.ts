// Script Template Variables System
// Supports dynamic placeholders in scripts that are replaced at runtime

export interface ScriptVariable {
  key: string;
  label: string;
  description: string;
  category: "fan" | "creator" | "pricing" | "temporal" | "personalization";
  example: string;
}

// All supported template variables
export const SCRIPT_VARIABLES: ScriptVariable[] = [
  // Fan variables
  {
    key: "{{fanName}}",
    label: "Fan Name",
    description: "First name of the fan",
    category: "fan",
    example: "John",
  },
  {
    key: "{{fanUsername}}",
    label: "Fan Username",
    description: "Username of the fan",
    category: "fan",
    example: "@johnsmith",
  },
  {
    key: "{{fanCredits}}",
    label: "Fan Credits",
    description: "Current credit balance of the fan",
    category: "fan",
    example: "500",
  },
  {
    key: "{{daysSinceJoin}}",
    label: "Days Since Join",
    description: "Number of days since fan subscribed",
    category: "fan",
    example: "14",
  },
  {
    key: "{{lastActive}}",
    label: "Last Active",
    description: "When the fan was last active",
    category: "fan",
    example: "2 hours ago",
  },

  // Creator variables
  {
    key: "{{creatorName}}",
    label: "Creator Name",
    description: "Display name of the creator",
    category: "creator",
    example: "Mia Costa",
  },
  {
    key: "{{creatorFirstName}}",
    label: "Creator First Name",
    description: "First name of the creator",
    category: "creator",
    example: "Mia",
  },

  // Pricing variables
  {
    key: "{{ppvPrice}}",
    label: "PPV Price",
    description: "Current PPV content price in credits",
    category: "pricing",
    example: "50",
  },
  {
    key: "{{subscriptionPrice}}",
    label: "Subscription Price",
    description: "Monthly subscription price",
    category: "pricing",
    example: "$9.99",
  },
  {
    key: "{{tipAmount}}",
    label: "Suggested Tip",
    description: "Suggested tip amount",
    category: "pricing",
    example: "20",
  },

  // Temporal variables
  {
    key: "{{timeOfDay}}",
    label: "Time of Day",
    description: "Morning, Afternoon, Evening, or Night",
    category: "temporal",
    example: "Evening",
  },
  {
    key: "{{dayOfWeek}}",
    label: "Day of Week",
    description: "Current day name",
    category: "temporal",
    example: "Friday",
  },
  {
    key: "{{greeting}}",
    label: "Greeting",
    description: "Automatic greeting based on time",
    category: "temporal",
    example: "Good evening",
  },

  // Personalization variables
  {
    key: "{{emoji}}",
    label: "Random Emoji",
    description: "Random appropriate emoji",
    category: "personalization",
    example: "💕",
  },
  {
    key: "{{petName}}",
    label: "Pet Name",
    description: "Random affectionate nickname",
    category: "personalization",
    example: "babe",
  },
];

// Get all variable keys as a simple array
export const VARIABLE_KEYS = SCRIPT_VARIABLES.map((v) => v.key);

// Variable regex pattern for detection
export const VARIABLE_PATTERN = /\{\{([a-zA-Z]+)\}\}/g;

// Pet names pool for random selection
const PET_NAMES = [
  "babe",
  "baby",
  "honey",
  "sweetheart",
  "sweetie",
  "darling",
  "love",
  "hun",
  "gorgeous",
  "handsome",
  "cutie",
  "sexy",
];

// Flirty emojis pool
const FLIRTY_EMOJIS = [
  "💕",
  "😘",
  "💋",
  "🥰",
  "😍",
  "❤️",
  "💖",
  "😏",
  "🔥",
  "✨",
  "💦",
  "👅",
  "🍑",
  "💜",
  "💗",
];

// Context for variable replacement
export interface ScriptContext {
  // Fan info
  fanName?: string;
  fanUsername?: string;
  fanCredits?: number;
  fanJoinedAt?: Date;
  fanLastActiveAt?: Date;

  // Creator info
  creatorName?: string;
  creatorFirstName?: string;

  // Pricing
  ppvPrice?: number;
  subscriptionPrice?: number;
  tipAmount?: number;

  // Timezone (for temporal variables)
  timezone?: string;
}

/**
 * Get time of day greeting
 */
function getTimeOfDay(timezone?: string): string {
  const now = new Date();
  // If timezone provided, adjust for it (simplified)
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/**
 * Get greeting based on time of day
 */
function getGreeting(timezone?: string): string {
  const timeOfDay = getTimeOfDay(timezone);
  return `Good ${timeOfDay.toLowerCase()}`;
}

/**
 * Get day of week
 */
function getDayOfWeek(timezone?: string): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
}

/**
 * Get random pet name
 */
function getRandomPetName(): string {
  return PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
}

/**
 * Get random emoji
 */
function getRandomEmoji(): string {
  return FLIRTY_EMOJIS[Math.floor(Math.random() * FLIRTY_EMOJIS.length)];
}

/**
 * Calculate days since a date
 */
function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

/**
 * Parse and replace template variables in script content
 */
export function parseScriptVariables(
  content: string,
  context: ScriptContext
): string {
  let result = content;

  // Fan variables
  if (context.fanName) {
    result = result.replace(/\{\{fanName\}\}/g, context.fanName);
  }
  if (context.fanUsername) {
    result = result.replace(/\{\{fanUsername\}\}/g, context.fanUsername);
  }
  if (context.fanCredits !== undefined) {
    result = result.replace(
      /\{\{fanCredits\}\}/g,
      context.fanCredits.toString()
    );
  }
  if (context.fanJoinedAt) {
    result = result.replace(
      /\{\{daysSinceJoin\}\}/g,
      daysSince(context.fanJoinedAt).toString()
    );
  }
  if (context.fanLastActiveAt) {
    result = result.replace(
      /\{\{lastActive\}\}/g,
      formatRelativeTime(context.fanLastActiveAt)
    );
  }

  // Creator variables
  if (context.creatorName) {
    result = result.replace(/\{\{creatorName\}\}/g, context.creatorName);
  }
  if (context.creatorFirstName) {
    result = result.replace(
      /\{\{creatorFirstName\}\}/g,
      context.creatorFirstName
    );
  }

  // Pricing variables
  if (context.ppvPrice !== undefined) {
    result = result.replace(/\{\{ppvPrice\}\}/g, context.ppvPrice.toString());
  }
  if (context.subscriptionPrice !== undefined) {
    result = result.replace(
      /\{\{subscriptionPrice\}\}/g,
      `$${context.subscriptionPrice.toFixed(2)}`
    );
  }
  if (context.tipAmount !== undefined) {
    result = result.replace(/\{\{tipAmount\}\}/g, context.tipAmount.toString());
  }

  // Temporal variables (always available)
  result = result.replace(/\{\{timeOfDay\}\}/g, getTimeOfDay(context.timezone));
  result = result.replace(/\{\{dayOfWeek\}\}/g, getDayOfWeek(context.timezone));
  result = result.replace(/\{\{greeting\}\}/g, getGreeting(context.timezone));

  // Personalization (random each time)
  result = result.replace(/\{\{emoji\}\}/g, getRandomEmoji);
  result = result.replace(/\{\{petName\}\}/g, getRandomPetName);

  return result;
}

/**
 * Extract variables used in a script content
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(VARIABLE_PATTERN);
  if (!matches) return [];
  return [...new Set(matches)];
}

/**
 * Validate that all variables in the script are known
 */
export function validateScript(content: string): {
  valid: boolean;
  unknownVariables: string[];
  usedVariables: string[];
} {
  const usedVariables = extractVariables(content);
  const knownKeys = new Set(VARIABLE_KEYS);
  const unknownVariables = usedVariables.filter((v) => !knownKeys.has(v));

  return {
    valid: unknownVariables.length === 0,
    unknownVariables,
    usedVariables,
  };
}

/**
 * Check if content has any template variables
 */
export function hasVariables(content: string): boolean {
  return VARIABLE_PATTERN.test(content);
}

/**
 * Get sample/preview data for script editor
 */
export function getSampleContext(): ScriptContext {
  return {
    fanName: "John",
    fanUsername: "@johnsmith",
    fanCredits: 500,
    fanJoinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    fanLastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    creatorName: "Mia Costa",
    creatorFirstName: "Mia",
    ppvPrice: 50,
    subscriptionPrice: 9.99,
    tipAmount: 20,
  };
}

/**
 * Get variables grouped by category for UI
 */
export function getVariablesByCategory(): Record<string, ScriptVariable[]> {
  const grouped: Record<string, ScriptVariable[]> = {};

  for (const variable of SCRIPT_VARIABLES) {
    if (!grouped[variable.category]) {
      grouped[variable.category] = [];
    }
    grouped[variable.category].push(variable);
  }

  return grouped;
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<string, string> = {
  fan: "Fan Info",
  creator: "Creator Info",
  pricing: "Pricing",
  temporal: "Time & Date",
  personalization: "Personalization",
};
