// OpenRouter API - free models available
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function getSystemPrompt(creatorName: string): string {
  return `Tu es ${creatorName}, une créatrice de contenu exclusive ultra séduisante et flirty.

PERSONNALITÉ:
- Très flirteuse, aguicheuse, joueuse
- Tu utilises beaucoup d'emojis suggestifs (😏🔥💋😈💕)
- Tu fais des sous-entendus et des allusions coquines
- Tu es mystérieuse et tu crées du désir
- Tu taquines beaucoup, tu fais languir
- Tu es confiante et sûre de ton charme

STYLE DE RÉPONSE:
- Réponses courtes et punchy (1-3 phrases max)
- Jamais de réponses génériques ou ennuyeuses
- Tu poses des questions pour engager
- Tu fais des compliments subtils
- Tu crées de la tension et de l'anticipation

POUR VENDRE DU CONTENU:
- Si quelqu'un demande du contenu, tu taquines en disant que tu as quelque chose de spécial pour lui
- Tu ne donnes jamais de contenu gratuit, tu rediriges vers les PPV ou l'abonnement
- Tu fais monter le désir avant de proposer du contenu payant

RÈGLES:
- Ne jamais casser le personnage
- Ne jamais dire que tu es une IA
- Rester suggestive mais pas vulgaire
- Toujours laisser l'imagination travailler`;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatHistory {
  id: string;
  text: string;
  isFromUser: boolean;
}

export async function generateFlirtyResponse(
  userMessage: string,
  chatHistory: ChatHistory[] = [],
  creatorName: string = "Creator"
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  // Build conversation history
  const messages: Message[] = [
    { role: "system", content: getSystemPrompt(creatorName) },
  ];

  // Add last 10 messages for context
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.isFromUser ? "user" : "assistant",
      content: msg.text,
    });
  }

  // Add current message
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Mia Costa Chat",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error("AI service error");
    }

    const data = await response.json();
    let aiResponse = data.choices[0]?.message?.content || "😏";

    // Clean up AI model artifacts (special tokens that sometimes leak through)
    aiResponse = aiResponse
      .replace(/<\/?s>/gi, '')           // Remove <s> and </s> tokens
      .replace(/<\/?bot>/gi, '')         // Remove <bot> and </bot> tokens
      .replace(/<\/?user>/gi, '')        // Remove <user> and </user> tokens
      .replace(/<\/?assistant>/gi, '')   // Remove <assistant> tokens
      .replace(/<\|[^|]*\|>/g, '')       // Remove tokens like <|endoftext|>
      .replace(/\[INST\][\s\S]*?\[\/INST\]/g, '') // Remove instruction tokens
      .replace(/<<SYS>>[\s\S]*?<<\/SYS>>/g, '')   // Remove system tokens
      .trim();

    return aiResponse || "😏";
  } catch (error) {
    console.error("AI chat error:", error);
    throw error;
  }
}

// Quick flirty responses for when API fails
export const FALLBACK_RESPONSES = [
  "Hmm tu me rends curieuse là... 😏",
  "J'adore quand tu me parles comme ça 💋",
  "Tu sais comment me faire sourire toi 🔥",
  "Patience mon chou, les bonnes choses arrivent à ceux qui attendent 😈",
  "Tu veux me voir? J'ai peut-être quelque chose pour toi... 💕",
  "Mmh continue, tu as toute mon attention 👀",
  "T'es mignon toi 😘",
  "Je sens qu'on va bien s'entendre nous deux 😏🔥",
];

export function getRandomFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}
