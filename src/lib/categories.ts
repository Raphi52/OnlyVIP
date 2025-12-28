// Creator category tags for filtering and discovery

export const CREATOR_CATEGORIES = [
  // Content type
  { id: "solo", label: "Solo", color: "bg-pink-500/20 text-pink-400" },
  { id: "couple", label: "Couple", color: "bg-red-500/20 text-red-400" },
  { id: "group", label: "Group", color: "bg-orange-500/20 text-orange-400" },

  // Style/Niche
  { id: "amateur", label: "Amateur", color: "bg-amber-500/20 text-amber-400" },
  { id: "professional", label: "Pro", color: "bg-yellow-500/20 text-yellow-400" },
  { id: "cosplay", label: "Cosplay", color: "bg-purple-500/20 text-purple-400" },
  { id: "gamer", label: "Gamer", color: "bg-violet-500/20 text-violet-400" },
  { id: "fitness", label: "Fitness", color: "bg-green-500/20 text-green-400" },
  { id: "alternative", label: "Alternative", color: "bg-gray-500/20 text-gray-400" },
  { id: "tattoo", label: "Tattoo", color: "bg-slate-500/20 text-slate-400" },

  // Body type
  { id: "curvy", label: "Curvy", color: "bg-rose-500/20 text-rose-400" },
  { id: "petite", label: "Petite", color: "bg-pink-400/20 text-pink-300" },
  { id: "milf", label: "MILF", color: "bg-fuchsia-500/20 text-fuchsia-400" },
  { id: "teen", label: "18+", color: "bg-cyan-500/20 text-cyan-400" },
  { id: "mature", label: "Mature", color: "bg-indigo-500/20 text-indigo-400" },

  // Personality/Kink
  { id: "dominant", label: "Dominant", color: "bg-red-600/20 text-red-400" },
  { id: "submissive", label: "Submissive", color: "bg-blue-500/20 text-blue-400" },
  { id: "fetish", label: "Fetish", color: "bg-purple-600/20 text-purple-400" },
  { id: "feet", label: "Feet", color: "bg-orange-400/20 text-orange-300" },
  { id: "lingerie", label: "Lingerie", color: "bg-pink-600/20 text-pink-400" },

  // Ethnicity
  { id: "latina", label: "Latina", color: "bg-amber-600/20 text-amber-400" },
  { id: "asian", label: "Asian", color: "bg-rose-400/20 text-rose-300" },
  { id: "ebony", label: "Ebony", color: "bg-amber-700/20 text-amber-500" },
  { id: "european", label: "European", color: "bg-blue-400/20 text-blue-300" },

  // Special
  { id: "verified", label: "Verified", color: "bg-emerald-500/20 text-emerald-400" },
  { id: "new", label: "New", color: "bg-teal-500/20 text-teal-400" },
  { id: "top", label: "Top Creator", color: "bg-[var(--gold)]/20 text-[var(--gold)]" },
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
