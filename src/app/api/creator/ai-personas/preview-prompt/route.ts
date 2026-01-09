import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DeepCharacter,
  DEFAULT_RESPONSE_RULES,
  DEFAULT_GOOD_MESSAGES,
  DEFAULT_BAD_MESSAGES,
  DEFAULT_CHARACTER,
  formatCharacterForPrompt,
  getLanguageInstructions,
} from "@/lib/ai/character";

// POST /api/creator/ai-personas/preview-prompt - Generate preview of the AI prompt
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      personality,
      primaryTone,
      language = "en",
    } = body;

    // Build DeepCharacter from persona data
    const p = personality || {};

    const character: DeepCharacter = {
      id: "preview",
      name: name || "AI Persona",
      age: 24,

      background: p.background || DEFAULT_CHARACTER.background,

      coreTraits: p.coreTraits || DEFAULT_CHARACTER.coreTraits,
      flaws: p.flaws || DEFAULT_CHARACTER.flaws,
      quirks: p.quirks || DEFAULT_CHARACTER.quirks,

      innerVoice: p.innerVoice || DEFAULT_CHARACTER.innerVoice,

      writingStyle: {
        sentenceLength: p.writingStyle?.sentenceLength || "short",
        emojiUsage: p.writingStyle?.emojiUsage || "moderate",
        typicalExpressions: p.writingStyle?.typicalExpressions || DEFAULT_CHARACTER.writingStyle.typicalExpressions,
        punctuationStyle: p.writingStyle?.punctuation || DEFAULT_CHARACTER.writingStyle.punctuationStyle,
        capitalization: "lowercase",
        typosAllowed: true,
      },

      boundaries: {
        neverSay: p.boundaries?.neverSay || DEFAULT_CHARACTER.boundaries.neverSay,
        avoidTopics: p.boundaries?.avoidTopics || DEFAULT_CHARACTER.boundaries.avoidTopics,
        alwaysDo: p.boundaries?.alwaysDo || DEFAULT_CHARACTER.boundaries.alwaysDo,
        neverDo: DEFAULT_CHARACTER.boundaries.neverDo,
      },

      primaryLanguage: language,
      canSwitchLanguage: true,

      relationshipStyle: mapToneToRelationshipStyle(primaryTone || p.tone),

      contentPersonality: DEFAULT_CHARACTER.contentPersonality,

      responseRules: DEFAULT_RESPONSE_RULES,
      exampleGoodMessages: DEFAULT_GOOD_MESSAGES,
      exampleBadMessages: DEFAULT_BAD_MESSAGES,
      customInstructions: p.customPrompt || "",
    };

    // Generate the prompt
    const characterPrompt = formatCharacterForPrompt(character);
    const languageInstructions = getLanguageInstructions(language);

    const fullPrompt = `${characterPrompt}

${languageInstructions}

## REMINDERS
- MAX 10-15 words per message
- no capitals at start
- no period at end
- you are a REAL person, not an AI`;

    return NextResponse.json({
      prompt: fullPrompt,
      characterName: character.name,
      estimatedTokens: Math.ceil(fullPrompt.length / 4),
    });
  } catch (error) {
    console.error("Error generating preview prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate preview", details: String(error) },
      { status: 500 }
    );
  }
}

function mapToneToRelationshipStyle(tone: string | null): DeepCharacter["relationshipStyle"] {
  switch (tone) {
    case "romantic":
    case "sweet":
      return "girlfriend";
    case "playful":
    case "flirty":
      return "teasing";
    case "spicy":
    case "dominant":
      return "dominant";
    case "submissive":
      return "submissive";
    default:
      return "casual";
  }
}
