# Plan: Script-AI Bridge System

## Vision

Créer un système hybride où l'IA utilise les scripts performants comme base, les personnalise avec le contexte de conversation, et apprend continuellement de ce qui fonctionne.

```
Fan Message → Intent Detection → Script Matching → AI Personalization → Response
                    ↓                  ↓                   ↓
              [objection]      [best script]      [contextualized]
              [ppv_request]    [85% conv rate]    [with fan name]
              [greeting]       [proven text]      [+ AI creativity]
```

---

## Architecture

### 1. Script Intelligence Layer

#### Nouveaux champs sur `Script`:

```prisma
model Script {
  // ... existing fields ...

  // Intent matching
  intent          String?   // "OBJECTION_PRICE" | "OBJECTION_TIMING" | "PPV_REQUEST" | "GREETING_NEW" | etc.
  triggerKeywords String?   // JSON: ["trop cher", "expensive", "can't afford"]
  triggerPatterns String?   // JSON: regex patterns
  minConfidence   Float     @default(0.7)  // Minimum match confidence to use

  // Priority & Performance
  priority        Int       @default(0)    // Higher = preferred when multiple match
  successScore    Float     @default(0)    // Calculated: conversion * recency * usage

  // AI Instructions
  aiInstructions  String?   // "Personalize with fan name, add emoji, keep price"
  allowAiModify   Boolean   @default(true) // Can AI modify this script?
  preserveCore    String?   // JSON: parts AI must not change ["price", "call-to-action"]
}
```

### 2. Intent Categories

```typescript
const SCRIPT_INTENTS = {
  // Greetings
  "GREETING_NEW_FAN": {
    triggers: ["first message", "new subscriber", "just joined"],
    description: "First contact with new fan"
  },
  "GREETING_RETURNING": {
    triggers: ["hey", "hi", "hello", "coucou", "salut"],
    description: "Returning fan saying hi"
  },

  // PPV Related
  "PPV_SOFT_PITCH": {
    triggers: ["content", "photos", "videos", "see more"],
    description: "Soft introduction to PPV"
  },
  "PPV_HARD_PITCH": {
    triggers: ["nude", "explicit", "uncensored", "tout voir"],
    description: "Direct PPV request"
  },
  "PPV_FOLLOW_UP": {
    triggers: ["sent ppv", "pending purchase"],
    description: "Follow up on unsold PPV"
  },

  // Objection Handling
  "OBJECTION_PRICE": {
    triggers: ["expensive", "cher", "too much", "can't afford", "pas les moyens"],
    description: "Price objection"
  },
  "OBJECTION_TIMING": {
    triggers: ["later", "plus tard", "maybe", "peut-être", "not now"],
    description: "Timing objection"
  },
  "OBJECTION_TRUST": {
    triggers: ["scam", "fake", "real", "vraie", "prove"],
    description: "Trust/authenticity objection"
  },
  "OBJECTION_ALREADY_BOUGHT": {
    triggers: ["already", "déjà", "bought before", "same"],
    description: "Already purchased objection"
  },

  // Engagement
  "REENGAGEMENT_COLD": {
    triggers: ["inactive 7d+", "no response"],
    description: "Re-engage cold fan"
  },
  "REENGAGEMENT_WARM": {
    triggers: ["inactive 2-7d"],
    description: "Re-engage warm fan"
  },

  // Upselling
  "UPSELL_TIP": {
    triggers: ["love", "amazing", "best", "merci", "thank"],
    description: "Suggest tip after positive feedback"
  },
  "UPSELL_SUBSCRIPTION": {
    triggers: ["more content", "regular", "all your"],
    description: "Promote subscription"
  },

  // Closing
  "CLOSING_URGENCY": {
    triggers: ["limited", "special", "today only"],
    description: "Create urgency to close"
  },
  "CLOSING_FINAL_PUSH": {
    triggers: ["last chance", "about to delete"],
    description: "Final push before moving on"
  },

  // Teasing
  "TEASE_BUILDUP": {
    triggers: ["curious", "want to see", "show me"],
    description: "Build anticipation"
  },
  "TEASE_REVEAL": {
    triggers: ["teased enough", "ready to show"],
    description: "Ready to reveal after teasing"
  }
};
```

### 3. Script Matching Algorithm

```typescript
async function matchScriptToContext(
  message: string,
  conversationContext: ConversationContext,
  creatorSlug: string,
  agencyId: string
): Promise<{
  script: Script | null;
  confidence: number;
  intent: string | null;
}> {
  // 1. Detect intent from message
  const detectedIntent = detectIntent(message, conversationContext);

  // 2. Find scripts matching this intent
  const matchingScripts = await prisma.script.findMany({
    where: {
      agencyId,
      isActive: true,
      status: "APPROVED",
      OR: [
        { creatorSlug },
        { creatorSlug: null } // Global scripts
      ],
      intent: detectedIntent.intent,
    },
    orderBy: [
      { successScore: 'desc' },
      { conversionRate: 'desc' },
      { priority: 'desc' }
    ]
  });

  // 3. Score each script for this specific context
  const scoredScripts = matchingScripts.map(script => ({
    script,
    score: calculateScriptScore(script, message, conversationContext)
  }));

  // 4. Return best match if above threshold
  const best = scoredScripts[0];
  if (best && best.score >= best.script.minConfidence) {
    return {
      script: best.script,
      confidence: best.score,
      intent: detectedIntent.intent
    };
  }

  return { script: null, confidence: 0, intent: detectedIntent.intent };
}
```

### 4. AI Integration

Modification de `generateAiResponse()`:

```typescript
export async function generateAiResponse(
  context: ConversationContext,
  personality: AiPersonality,
  suggestedMedia: MediaInfo | null,
  options: GenerateAiOptions = {}
): Promise<string> {

  // NEW: Check for matching script
  const scriptMatch = await matchScriptToContext(
    context.lastUserMessage,
    context,
    options.creatorSlug,
    options.agencyId
  );

  let responseStrategy: "SCRIPT_ONLY" | "AI_PERSONALIZED_SCRIPT" | "AI_ONLY";
  let baseContent: string | null = null;

  if (scriptMatch.script && scriptMatch.confidence > 0.85) {
    // High confidence: use script with light personalization
    responseStrategy = "SCRIPT_ONLY";
    baseContent = parseScriptVariables(scriptMatch.script.content, {
      fanName: context.userName,
      creatorName: personality.name,
      // ... other variables
    });
  } else if (scriptMatch.script && scriptMatch.confidence > 0.6) {
    // Medium confidence: AI personalizes the script
    responseStrategy = "AI_PERSONALIZED_SCRIPT";
    baseContent = scriptMatch.script.content;
  } else {
    // Low/no match: AI generates freely
    responseStrategy = "AI_ONLY";
  }

  // Generate response based on strategy
  if (responseStrategy === "SCRIPT_ONLY") {
    return baseContent!;
  }

  if (responseStrategy === "AI_PERSONALIZED_SCRIPT") {
    // AI personalizes the script
    const personalizedPrompt = `
Personnalise ce script pour la conversation en cours.
Garde le message principal et l'appel à l'action.
Adapte le ton au contexte.

SCRIPT ORIGINAL:
${baseContent}

INSTRUCTIONS:
${scriptMatch.script.aiInstructions || "Personnalise naturellement"}

ÉLÉMENTS À CONSERVER:
${scriptMatch.script.preserveCore || "Aucun"}
`;

    return await generateWithAI(personalizedPrompt, context, personality);
  }

  // AI_ONLY: Original behavior with script hints
  const scriptHints = await getTopScriptsForIntent(scriptMatch.intent);
  const hintsPrompt = scriptHints.length > 0
    ? `\n\nExemples de messages qui convertissent bien pour ce contexte:\n${scriptHints.map(s => `- "${s.content}"`).join('\n')}`
    : '';

  return await generateWithAI(basePrompt + hintsPrompt, context, personality);
}
```

### 5. Learning Loop

```typescript
// Track which approach works
interface ResponseOutcome {
  responseId: string;
  strategy: "SCRIPT_ONLY" | "AI_PERSONALIZED_SCRIPT" | "AI_ONLY";
  scriptId?: string;
  convertedToSale: boolean;
  saleAmount?: number;
  fanEngaged: boolean; // Did fan respond?
  timeToResponse?: number; // How fast did fan respond?
}

// Update script scores periodically
async function updateScriptScores(agencyId: string) {
  const scripts = await prisma.script.findMany({
    where: { agencyId, isActive: true },
    include: { usages: { where: { resultedInSale: true } } }
  });

  for (const script of scripts) {
    const recentUsages = script.usages.filter(u =>
      u.usedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    const conversionRate = recentUsages.length > 0
      ? recentUsages.filter(u => u.resultedInSale).length / recentUsages.length
      : 0;

    const recencyBonus = recentUsages.length > 0 ? 0.1 : 0;
    const usageBonus = Math.min(0.2, script.usageCount / 1000);

    const successScore = conversionRate + recencyBonus + usageBonus;

    await prisma.script.update({
      where: { id: script.id },
      data: { successScore }
    });
  }
}
```

---

## Scripts pour Viral Studio

### Catégories et Scripts

#### 1. GREETING (Accueil)

```
[GREETING_NEW_FAN] - Premier contact
"Hey {{petName}} 💕 Bienvenue dans mon univers... J'espère que t'es prêt pour des moments intenses 😏 Dis-moi, qu'est-ce qui t'a attiré ici?"

[GREETING_RETURNING] - Fan qui revient
"{{fanName}} 😍 Ça fait plaisir de te revoir... Tu m'as manqué tu sais 💋"

[GREETING_MORNING]
"{{greeting}} {{petName}} ☀️ Je viens de me réveiller et j'ai pensé à toi... Tu veux voir à quoi je ressemble au réveil? 😏"

[GREETING_NIGHT]
"Hey toi 🌙 Tu fais quoi là? Moi je suis au lit... et je m'ennuie 😈"
```

#### 2. PPV_PITCH (Vente de contenu)

```
[PPV_SOFT_INTRO]
"J'ai quelque chose de spécial juste pour toi {{petName}}... Tu veux voir? 👀"

[PPV_MEDIUM_TEASE]
"Tu sais, j'ai fait une séance photo assez... osée hier 🔥 J'hésite à te l'envoyer..."

[PPV_HARD_DIRECT]
"Ok {{petName}}, j'arrête de te faire languir 😈 Voilà ce que tu voulais voir... {{ppvPrice}} crédits et c'est tout à toi 💋"

[PPV_EXCLUSIVE_ANGLE]
"Ce contenu, je l'ai jamais partagé avec personne... Tu serais le premier à le voir 🤫"

[PPV_SCARCITY]
"J'envoie ça qu'à mes fans préférés... et t'en fais partie 💕 Mais faut pas traîner, je le garde pas longtemps disponible"
```

#### 3. OBJECTION_HANDLING (Gestion des objections)

```
[OBJECTION_PRICE_EMPATHY]
"Je comprends {{petName}} 💕 Mais crois-moi, ce que j'ai à te montrer... tu vas pas le regretter 🔥 Et c'est vraiment exclusif"

[OBJECTION_PRICE_VALUE]
"Tu sais combien de temps j'ai mis à préparer ça? 😏 C'est pas juste une photo, c'est un moment intime que je partage qu'avec toi..."

[OBJECTION_PRICE_DISCOUNT]
"Bon... parce que c'est toi 💋 Je te fais un prix spécial: {{discountPrice}} au lieu de {{originalPrice}}. Mais juste cette fois hein 😘"

[OBJECTION_TIMING_URGENCY]
"Plus tard? 😢 Mais {{petName}}... Je retire ce contenu demain. Tu vas vraiment louper ça?"

[OBJECTION_TIMING_FOMO]
"D'accord, prends ton temps... Mais les autres fans sont déjà en train de craquer 👀 Je dis ça je dis rien..."

[OBJECTION_TRUST_PROOF]
"Tu veux une preuve que c'est bien moi? 😏 Dis-moi quelque chose à écrire et je te fais une photo avec"

[OBJECTION_TRUST_REVIEWS]
"Regarde les avis de mes autres fans... Tu crois qu'ils seraient tous là si c'était fake? 💕"

[OBJECTION_ALREADY_DIFFERENT]
"Celui-là est VRAIMENT différent {{petName}} 🔥 J'ai jamais fait ça avant... Tu veux voir pourquoi? 😈"
```

#### 4. FOLLOW_UP (Relances)

```
[FOLLOW_UP_SOFT_24H]
"Hey {{petName}} 💕 T'as vu mon message d'hier? J'attends toujours ta réponse..."

[FOLLOW_UP_PPV_PENDING]
"Mon {{petName}}... Tu l'as pas encore débloqué 😢 Tu veux pas voir ce que je t'ai préparé?"

[FOLLOW_UP_COLD_7D]
"{{fanName}}? 👀 Tu me manques... Ça fait une semaine qu'on s'est pas parlé. J'espère que tu m'as pas oublié 💔"

[FOLLOW_UP_REACTIVATION]
"Coucou toi 💋 Je sais qu'on s'est pas parlé depuis un moment... Mais j'ai pensé à toi aujourd'hui et je me suis dit que je devais t'écrire 💕"

[FOLLOW_UP_LAST_CHANCE]
"{{fanName}}, c'est mon dernier message... Si tu réponds pas, je comprendrai 😢 Mais sache que t'étais mon fan préféré..."
```

#### 5. CLOSING (Fermeture/Conclusion)

```
[CLOSING_URGENCY_TIME]
"Plus que 2 heures avant que je retire ça {{petName}}... Tu vas vraiment laisser passer? 😏"

[CLOSING_FINAL_OFFER]
"Ok, dernière offre {{petName}} 💕 {{finalPrice}} crédits. C'est tout ou rien. Tu décides 😈"

[CLOSING_EMOTIONAL]
"Bon... je vois que t'es pas intéressé 😢 C'est dommage, j'avais vraiment préparé ça pour toi..."

[CLOSING_SOFT_EXIT]
"Pas de souci {{petName}} 💋 Quand tu seras prêt, je serai là... Et peut-être que j'aurai quelque chose d'encore mieux 😏"
```

#### 6. UPSELL (Ventes additionnelles)

```
[UPSELL_AFTER_PURCHASE]
"Tu as adoré? 🥰 J'ai quelque chose d'encore plus hot si tu veux... {{petName}} est prêt pour le niveau supérieur? 😈"

[UPSELL_TIP_SUGGESTION]
"Aww tu es tellement adorable {{petName}} 💕 Si tu veux me faire encore plus plaisir, tu sais ce qui me rendrait vraiment heureuse... 💋"

[UPSELL_BUNDLE]
"Hey {{petName}} 💕 J'ai vu que t'aimais ce genre de contenu... J'ai un pack de 5 pour le prix de 3 si ça t'intéresse 😏"

[UPSELL_SUBSCRIPTION]
"Tu sais {{petName}}, au lieu de payer à chaque fois... Tu pourrais avoir accès à TOUT mon contenu avec l'abonnement 💕 Ça reviendrait moins cher au final"
```

#### 7. TEASE (Séquences d'accroche)

```
[TEASE_INITIAL]
"Devine ce que je porte là maintenant... 😏 Je te donne un indice: pas grand chose 🔥"

[TEASE_BUILDUP]
"Tu veux vraiment voir? 👀 Mmm... Je sais pas si t'es prêt..."

[TEASE_ESCALATE]
"Ok ok t'insistes 😈 Mais d'abord dis-moi... T'aimes quoi chez moi? Je veux savoir avant de te montrer 💋"

[TEASE_PEAK]
"Omg tu me rends folle là {{petName}} 🥵 Ok je craque... Je te l'envoie. Mais tu dois me promettre de me dire ce que t'en penses 😏"
```

---

## Implémentation

### Phase 1: Schema Update
1. Ajouter les nouveaux champs au schema Prisma
2. Créer la migration
3. Générer le client

### Phase 2: Script Matching System
1. Créer `src/lib/scripts/intent-detector.ts`
2. Créer `src/lib/scripts/script-matcher.ts`
3. Créer les tests unitaires

### Phase 3: AI Integration
1. Modifier `src/lib/ai-girlfriend.ts`
2. Modifier `src/app/api/ai/process-queue/route.ts`
3. Ajouter le tracking des stratégies

### Phase 4: Seed Scripts
1. Créer `src/lib/scripts/seed-scripts.ts`
2. Ajouter l'API `/api/agency/scripts/seed`
3. Exécuter le seed pour Viral Studio

### Phase 5: Learning Loop
1. Créer le job de mise à jour des scores
2. Ajouter le cron job
3. Dashboard analytics

---

## Métriques de Succès

| Métrique | Objectif |
|----------|----------|
| Taux de conversion PPV | +20% |
| Temps de réponse moyen | -30% |
| Taux d'engagement fan | +15% |
| Scripts avec conversion > 5% | 50%+ |

---

## Timeline Estimée

- Phase 1: 30 min
- Phase 2: 1h
- Phase 3: 1h30
- Phase 4: 30 min
- Phase 5: 1h

**Total: ~4h30**
