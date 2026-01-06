/**
 * Language Detection Utility
 * Detects the language of a text based on common words and patterns
 * Supports: en, es, fr, de, it, pt, zh, ja, ko, ar, ru, hi
 */

// Common words for each language (high frequency words)
const LANGUAGE_PATTERNS: Record<string, { words: string[]; patterns?: RegExp[] }> = {
  en: {
    words: [
      "the", "and", "you", "that", "was", "for", "are", "with", "his", "they",
      "this", "have", "from", "one", "had", "not", "but", "what", "all", "were",
      "when", "your", "can", "said", "there", "use", "each", "which", "she", "how",
      "their", "will", "other", "about", "out", "many", "then", "them", "these", "so",
      "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
      "two", "more", "write", "see", "number", "way", "could", "people", "my", "than",
      "first", "water", "been", "call", "who", "oil", "its", "now", "find", "long",
      "down", "day", "did", "get", "come", "made", "may", "part", "hello", "hi",
      "hey", "yeah", "yes", "no", "okay", "love", "want", "need", "know", "think",
      "baby", "babe", "honey", "dear", "please", "thanks", "sorry", "miss", "cute"
    ],
  },
  es: {
    words: [
      "que", "de", "no", "a", "la", "el", "es", "y", "en", "lo", "un", "por",
      "qué", "me", "una", "te", "los", "se", "con", "para", "mi", "está",
      "si", "bien", "pero", "yo", "eso", "las", "sí", "su", "tu", "aquí",
      "del", "al", "como", "le", "más", "esto", "ya", "todo", "esta", "vamos",
      "muy", "también", "fue", "ser", "tiene", "era", "hay", "él", "ella",
      "hola", "amor", "cariño", "guapa", "guapo", "besos", "quiero", "mucho",
      "bonita", "bonito", "gracias", "perdón", "disculpa", "tengo", "puedo",
      "donde", "cuando", "porque", "siempre", "nunca", "ahora", "después"
    ],
  },
  fr: {
    words: [
      "je", "de", "est", "pas", "le", "vous", "la", "tu", "que", "un", "il",
      "et", "à", "ne", "les", "ce", "en", "on", "ça", "une", "ai", "pour",
      "que", "qui", "dans", "du", "elle", "au", "moi", "mon", "lui", "nous",
      "mais", "tout", "bien", "avec", "oui", "non", "suis", "été", "comme",
      "cette", "ou", "son", "faire", "sur", "quoi", "dit", "si", "leur",
      "bonjour", "salut", "merci", "pardon", "bisous", "amour", "chéri",
      "chérie", "beau", "belle", "veux", "peux", "aime", "très", "aussi"
    ],
  },
  de: {
    words: [
      "ich", "sie", "das", "ist", "du", "nicht", "die", "und", "es", "der",
      "was", "wir", "zu", "ein", "er", "in", "mir", "mit", "ja", "wie",
      "den", "so", "dir", "mich", "auf", "wenn", "aber", "für", "hat", "sind",
      "doch", "war", "haben", "eine", "noch", "da", "wird", "schon", "auch",
      "kann", "ihm", "ihr", "nein", "nur", "von", "bei", "nach", "sich",
      "hallo", "danke", "bitte", "entschuldigung", "liebe", "lieber", "süß",
      "schön", "gut", "schlecht", "groß", "klein", "neu", "alt", "heute"
    ],
  },
  it: {
    words: [
      "che", "non", "di", "è", "e", "la", "il", "un", "a", "per", "sono",
      "mi", "si", "lo", "ma", "ti", "ho", "le", "cosa", "tu", "hai", "io",
      "con", "no", "ci", "da", "se", "una", "questo", "come", "qui", "suo",
      "del", "al", "li", "nel", "bene", "mio", "lei", "lui", "dei", "essere",
      "ciao", "grazie", "prego", "scusa", "amore", "bello", "bella", "caro",
      "cara", "tesoro", "dolce", "voglio", "posso", "molto", "sempre", "mai"
    ],
  },
  pt: {
    words: [
      "que", "não", "de", "o", "eu", "a", "é", "você", "uma", "para", "me",
      "se", "no", "com", "por", "um", "isso", "ele", "como", "mas", "em",
      "do", "tem", "te", "os", "da", "na", "ela", "está", "muito", "meu",
      "seu", "aqui", "só", "mais", "bem", "foi", "tudo", "já", "quando",
      "olá", "oi", "obrigado", "obrigada", "desculpa", "amor", "lindo",
      "linda", "querido", "querida", "beijos", "saudade", "gosto", "quero"
    ],
  },
  zh: {
    words: [],
    patterns: [/[\u4e00-\u9fff]/], // Chinese characters
  },
  ja: {
    words: [],
    patterns: [/[\u3040-\u309f\u30a0-\u30ff]/], // Hiragana and Katakana
  },
  ko: {
    words: [],
    patterns: [/[\uac00-\ud7af\u1100-\u11ff]/], // Korean Hangul
  },
  ar: {
    words: [],
    patterns: [/[\u0600-\u06ff]/], // Arabic script
  },
  ru: {
    words: [
      "и", "в", "не", "на", "я", "что", "он", "с", "это", "как", "а", "то",
      "все", "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы",
      "за", "бы", "по", "только", "её", "мне", "было", "вот", "от", "меня",
      "привет", "спасибо", "пожалуйста", "извини", "люблю", "хочу", "могу"
    ],
    patterns: [/[\u0400-\u04ff]/], // Cyrillic script
  },
  hi: {
    words: [],
    patterns: [/[\u0900-\u097f]/], // Devanagari script
  },
};

interface LanguageScore {
  language: string;
  score: number;
  confidence: number;
}

/**
 * Detect the language of a text
 * @param text The text to analyze
 * @returns The detected language code (e.g., "en", "es") or null if unknown
 */
export function detectLanguage(text: string): string | null {
  if (!text || text.trim().length < 3) {
    return null;
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) {
    return null;
  }

  const scores: LanguageScore[] = [];

  for (const [lang, { words: langWords, patterns }] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;

    // Check patterns first (for non-Latin scripts)
    if (patterns) {
      for (const pattern of patterns) {
        const matches = normalizedText.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          // Strong indicator - script-based detection
          score += matches.length * 10;
        }
      }
    }

    // Check word matches
    if (langWords.length > 0) {
      for (const word of words) {
        // Clean word from punctuation
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
        if (langWords.includes(cleanWord)) {
          score += 1;
        }
      }
    }

    if (score > 0) {
      const confidence = Math.min(100, (score / words.length) * 100);
      scores.push({ language: lang, score, confidence });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the best match if confidence is above threshold
  if (scores.length > 0 && scores[0].score >= 2) {
    return scores[0].language;
  }

  // Default to English if no clear match (most common on the platform)
  return null;
}

/**
 * Detect language with confidence score
 * @param text The text to analyze
 * @returns Language code and confidence (0-100)
 */
export function detectLanguageWithConfidence(text: string): { language: string | null; confidence: number } {
  if (!text || text.trim().length < 3) {
    return { language: null, confidence: 0 };
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(w => w.length > 1);

  if (words.length === 0) {
    return { language: null, confidence: 0 };
  }

  const scores: LanguageScore[] = [];

  for (const [lang, { words: langWords, patterns }] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    let matches = 0;

    // Check patterns first (for non-Latin scripts)
    if (patterns) {
      for (const pattern of patterns) {
        const patternMatches = normalizedText.match(new RegExp(pattern.source, 'g'));
        if (patternMatches) {
          score += patternMatches.length * 10;
          matches += patternMatches.length;
        }
      }
    }

    // Check word matches
    if (langWords.length > 0) {
      for (const word of words) {
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
        if (langWords.includes(cleanWord)) {
          score += 1;
          matches += 1;
        }
      }
    }

    if (score > 0) {
      // Confidence based on matches vs total words
      const confidence = Math.min(100, Math.round((matches / Math.max(words.length, 1)) * 100));
      scores.push({ language: lang, score, confidence });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length > 0 && scores[0].score >= 2) {
    return { language: scores[0].language, confidence: scores[0].confidence };
  }

  return { language: null, confidence: 0 };
}

/**
 * Detect language from multiple messages (more accurate for conversation context)
 * @param messages Array of message texts
 * @returns The most likely language code
 */
export function detectLanguageFromMessages(messages: string[]): string | null {
  const languageCounts: Record<string, number> = {};

  for (const message of messages) {
    const detected = detectLanguage(message);
    if (detected) {
      languageCounts[detected] = (languageCounts[detected] || 0) + 1;
    }
  }

  // Find the most common language
  let maxCount = 0;
  let mostCommon: string | null = null;

  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = lang;
    }
  }

  return mostCommon;
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    zh: "中文",
    ja: "日本語",
    ko: "한국어",
    ar: "العربية",
    ru: "Русский",
    hi: "हिन्दी",
  };
  return names[code] || code;
}

/**
 * Supported languages list
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
] as const;
