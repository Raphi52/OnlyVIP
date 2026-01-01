// Creator category tags for filtering and discovery

// Unified gold style for all category tags
const TAG_STYLE = "bg-black/80 text-[var(--gold)] border border-[var(--gold)]/50";

export const CREATOR_CATEGORIES = [
  // Content type
  { id: "solo", label: "Solo", color: TAG_STYLE },
  { id: "couple", label: "Couple", color: TAG_STYLE },
  { id: "group", label: "Group", color: TAG_STYLE },
  { id: "gay", label: "Gay", color: TAG_STYLE },
  { id: "lesbian", label: "Lesbian", color: TAG_STYLE },

  // Style/Niche
  { id: "cosplay", label: "Cosplay", color: TAG_STYLE },
  { id: "tattoo", label: "Tattoo", color: TAG_STYLE },

  // Body type
  { id: "curvy", label: "Curvy", color: TAG_STYLE },
  { id: "petite", label: "Petite", color: TAG_STYLE },
  { id: "thick", label: "Thick", color: TAG_STYLE },
  { id: "slim", label: "Slim", color: TAG_STYLE },
  { id: "teen", label: "-25", color: TAG_STYLE },
  { id: "mature", label: "Mature", color: TAG_STYLE },
  { id: "smalltits", label: "Small Tits", color: TAG_STYLE },
  { id: "bigtits", label: "Big Tits", color: TAG_STYLE },
  { id: "bigass", label: "Big Ass", color: TAG_STYLE },
  { id: "natural", label: "Natural", color: TAG_STYLE },
  { id: "blonde", label: "Blonde", color: TAG_STYLE },
  { id: "brunette", label: "Brunette", color: TAG_STYLE },

  // Personality/Kink
  { id: "dominant", label: "Dominant", color: TAG_STYLE },
  { id: "submissive", label: "Submissive", color: TAG_STYLE },
  { id: "fetish", label: "Fetish", color: TAG_STYLE },
  { id: "feet", label: "Feet", color: TAG_STYLE },
  { id: "anal", label: "Anal", color: TAG_STYLE },
  { id: "outdoor", label: "Outdoor", color: TAG_STYLE },

  // Services
  { id: "videocall", label: "Video Call", color: TAG_STYLE },
  { id: "live", label: "Live Shows", color: TAG_STYLE },

  // Ethnicity
  { id: "latina", label: "Latina", color: TAG_STYLE },
  { id: "asian", label: "Asian", color: TAG_STYLE },
  { id: "ebony", label: "Ebony", color: TAG_STYLE },
  { id: "european", label: "European", color: TAG_STYLE },
  { id: "arabic", label: "Arabic", color: TAG_STYLE },
  { id: "mixed", label: "Mixed", color: TAG_STYLE },
] as const;

export type CreatorCategory = typeof CREATOR_CATEGORIES[number]["id"];

export function getCategoryById(id: string) {
  return CREATOR_CATEGORIES.find(cat => cat.id === id);
}

export function getCategoriesFromJson(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
