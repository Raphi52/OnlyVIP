/**
 * Viral Studio Scripts Seed Data
 * Complete set of high-converting scripts for AI integration
 */

export interface ScriptSeed {
  name: string;
  content: string;
  category: string;
  intent: string;
  triggerKeywords: string[];
  triggerPatterns?: string[];
  priority: number;
  language: string;
  aiInstructions?: string;
  preserveCore?: string[];
}

export const VIRAL_STUDIO_SCRIPTS: ScriptSeed[] = [
  // ============================================
  // GREETING SCRIPTS
  // ============================================
  {
    name: "Accueil nouveau fan",
    content: "Hey {{petName}} 💕 Bienvenue dans mon univers... J'espère que t'es prêt pour des moments intenses 😏 Dis-moi, qu'est-ce qui t'a attiré ici?",
    category: "GREETING",
    intent: "GREETING_NEW_FAN",
    triggerKeywords: ["nouveau", "première fois", "just joined", "new here"],
    priority: 10,
    language: "fr",
    aiInstructions: "Personnalise en fonction du profil du fan si disponible",
  },
  {
    name: "Réponse au coucou",
    content: "{{fanName}} 😍 Ça fait plaisir de te voir... Tu m'as manqué tu sais 💋",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["hey", "hi", "hello", "coucou", "salut", "bonjour"],
    triggerPatterns: ["^(hey|hi|hello|coucou|salut|bonjour)"],
    priority: 8,
    language: "fr",
  },
  {
    name: "Réponse au compliment",
    content: "Aww t'es trop mignon {{petName}} 🥰 Continue comme ça et tu vas avoir droit à une surprise... 😏",
    category: "GREETING",
    intent: "GREETING_COMPLIMENT",
    triggerKeywords: ["belle", "sexy", "gorgeous", "beautiful", "canon", "bombe", "magnifique"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Good morning sexy",
    content: "{{greeting}} {{petName}} ☀️ Je viens de me réveiller et j'ai pensé à toi... Tu veux voir à quoi je ressemble au réveil? 😏",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["bonjour", "good morning", "réveil", "matin"],
    priority: 7,
    language: "fr",
  },
  {
    name: "Bonsoir coquin",
    content: "Hey toi 🌙 Tu fais quoi là? Moi je suis au lit... et je m'ennuie 😈",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["bonsoir", "good evening", "soir", "nuit"],
    priority: 7,
    language: "fr",
  },

  // ============================================
  // PPV PITCH SCRIPTS
  // ============================================
  {
    name: "PPV intro douce",
    content: "J'ai quelque chose de spécial juste pour toi {{petName}}... Tu veux voir? 👀",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["content", "photos", "pics", "voir", "montrer"],
    priority: 8,
    language: "fr",
  },
  {
    name: "PPV tease medium",
    content: "Tu sais, j'ai fait une séance photo assez... osée hier 🔥 J'hésite à te l'envoyer...",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["photo", "séance", "shooting"],
    priority: 7,
    language: "fr",
    aiInstructions: "Ajoute un élément de mystère",
  },
  {
    name: "PPV direct explicite",
    content: "Ok {{petName}}, j'arrête de te faire languir 😈 Voilà ce que tu voulais voir... {{ppvPrice}} crédits et c'est tout à toi 💋",
    category: "PPV_PITCH",
    intent: "PPV_EXPLICIT_REQUEST",
    triggerKeywords: ["nude", "nue", "explicit", "chatte", "pussy", "seins", "boobs", "cul", "ass"],
    triggerPatterns: ["(montre|envoie|show|send)\\s+(ta|ton|tes|your)"],
    priority: 10,
    language: "fr",
    preserveCore: ["ppvPrice"],
  },
  {
    name: "PPV angle exclusivité",
    content: "Ce contenu, je l'ai jamais partagé avec personne... Tu serais le premier à le voir 🤫",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["exclusif", "exclusive", "special", "spécial"],
    priority: 9,
    language: "fr",
  },
  {
    name: "PPV rareté",
    content: "J'envoie ça qu'à mes fans préférés... et t'en fais partie 💕 Mais faut pas traîner, je le garde pas longtemps disponible",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["préféré", "favorite", "special"],
    priority: 8,
    language: "fr",
  },
  {
    name: "PPV vidéo tease",
    content: "J'ai une vidéo que j'ai hésité à t'envoyer... c'est assez hot 🥵 Tu veux que je te l'envoie?",
    category: "PPV_PITCH",
    intent: "PPV_VIDEO_REQUEST",
    triggerKeywords: ["video", "vidéo", "clip", "film"],
    priority: 9,
    language: "fr",
  },
  {
    name: "PPV après conversation chaude",
    content: "Mmm tu me rends folle là 🥵 J'ai envie de te montrer quelque chose... Mais c'est vraiment hot, t'es sûr que t'es prêt? 😈",
    category: "PPV_PITCH",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["envie", "excité", "chaud", "hot", "want"],
    priority: 9,
    language: "fr",
  },

  // ============================================
  // OBJECTION HANDLING SCRIPTS
  // ============================================
  {
    name: "Objection prix - empathie",
    content: "Je comprends {{petName}} 💕 Mais crois-moi, ce que j'ai à te montrer... tu vas pas le regretter 🔥 Et c'est vraiment exclusif",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["cher", "expensive", "trop", "moyens", "afford", "budget"],
    triggerPatterns: ["(trop|too)\\s+(cher|expensive|much)", "(pas|no|can't)\\s+(les\\s+)?(moyens|afford)"],
    priority: 10,
    language: "fr",
  },
  {
    name: "Objection prix - valeur",
    content: "Tu sais combien de temps j'ai mis à préparer ça? 😏 C'est pas juste une photo, c'est un moment intime que je partage qu'avec toi...",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["prix", "price", "coût", "cost", "valeur"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Objection prix - réduction",
    content: "Bon... parce que c'est toi 💋 Je te fais un prix spécial: {{discountPrice}} au lieu de {{originalPrice}}. Mais juste cette fois hein 😘",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["réduction", "discount", "moins cher", "deal"],
    priority: 8,
    language: "fr",
    preserveCore: ["discountPrice", "originalPrice"],
    aiInstructions: "Utilise seulement si le fan a déjà refusé une fois",
  },
  {
    name: "Objection timing - urgence",
    content: "Plus tard? 😢 Mais {{petName}}... Je retire ce contenu demain. Tu vas vraiment louper ça?",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["plus tard", "later", "demain", "tomorrow", "attends", "wait"],
    priority: 10,
    language: "fr",
  },
  {
    name: "Objection timing - FOMO",
    content: "D'accord, prends ton temps... Mais les autres fans sont déjà en train de craquer 👀 Je dis ça je dis rien...",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["peut-être", "maybe", "réfléchir", "think about"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Objection confiance - preuve",
    content: "Tu veux une preuve que c'est bien moi? 😏 Dis-moi quelque chose à écrire et je te fais une photo avec",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["fake", "faux", "vraie", "real", "preuve", "prove"],
    triggerPatterns: ["(is\\s+this|c'est)\\s+(real|fake|vrai|faux)", "es-?tu\\s+(vraie|réelle)"],
    priority: 10,
    language: "fr",
  },
  {
    name: "Objection confiance - social proof",
    content: "Regarde les avis de mes autres fans... Tu crois qu'ils seraient tous là si c'était fake? 💕",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["arnaque", "scam", "confiance", "trust"],
    priority: 8,
    language: "fr",
  },
  {
    name: "Objection déjà vu - différence",
    content: "Celui-là est VRAIMENT différent {{petName}} 🔥 J'ai jamais fait ça avant... Tu veux voir pourquoi? 😈",
    category: "OBJECTION",
    intent: "OBJECTION_SEEN_BEFORE",
    triggerKeywords: ["déjà", "already", "même", "same", "vu", "seen"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Objection pas intéressé - intrigue",
    content: "Vraiment? 😢 Même si je te dis que c'est le contenu le plus osé que j'ai jamais fait? Tu sais pas ce que tu rates...",
    category: "OBJECTION",
    intent: "OBJECTION_NOT_INTERESTED",
    triggerKeywords: ["pas intéressé", "not interested", "non merci", "no thanks"],
    priority: 7,
    language: "fr",
  },

  // ============================================
  // FOLLOW UP / RELANCE SCRIPTS
  // ============================================
  {
    name: "Relance douce 24h",
    content: "Hey {{petName}} 💕 T'as vu mon message d'hier? J'attends toujours ta réponse...",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 7,
    language: "fr",
    aiInstructions: "À utiliser après 24h sans réponse",
  },
  {
    name: "Relance PPV en attente",
    content: "Mon {{petName}}... Tu l'as pas encore débloqué 😢 Tu veux pas voir ce que je t'ai préparé?",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 8,
    language: "fr",
    aiInstructions: "À utiliser quand un PPV est en attente depuis 12h+",
  },
  {
    name: "Relance fan froid 7j",
    content: "{{fanName}}? 👀 Tu me manques... Ça fait une semaine qu'on s'est pas parlé. J'espère que tu m'as pas oublié 💔",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 9,
    language: "fr",
    aiInstructions: "À utiliser après 7 jours d'inactivité",
  },
  {
    name: "Réactivation fan perdu",
    content: "Coucou toi 💋 Je sais qu'on s'est pas parlé depuis un moment... Mais j'ai pensé à toi aujourd'hui et je me suis dit que je devais t'écrire 💕",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: ["back", "retour", "revenu"],
    priority: 8,
    language: "fr",
  },
  {
    name: "Dernière chance",
    content: "{{fanName}}, c'est mon dernier message... Si tu réponds pas, je comprendrai 😢 Mais sache que t'étais mon fan préféré...",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 6,
    language: "fr",
    aiInstructions: "À utiliser en dernier recours après 14j+ d'inactivité",
  },

  // ============================================
  // CLOSING SCRIPTS
  // ============================================
  {
    name: "Closing urgence temps",
    content: "Plus que 2 heures avant que je retire ça {{petName}}... Tu vas vraiment laisser passer? 😏",
    category: "CLOSING",
    intent: "CLOSING_READY",
    triggerKeywords: ["temps", "time", "quand", "when"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Closing offre finale",
    content: "Ok, dernière offre {{petName}} 💕 {{finalPrice}} crédits. C'est tout ou rien. Tu décides 😈",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: ["hmm", "hum", "je sais pas", "not sure"],
    priority: 10,
    language: "fr",
    preserveCore: ["finalPrice"],
  },
  {
    name: "Closing émotionnel",
    content: "Bon... je vois que t'es pas intéressé 😢 C'est dommage, j'avais vraiment préparé ça pour toi...",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: [],
    priority: 7,
    language: "fr",
    aiInstructions: "Utilise la culpabilité légère",
  },
  {
    name: "Closing sortie douce",
    content: "Pas de souci {{petName}} 💋 Quand tu seras prêt, je serai là... Et peut-être que j'aurai quelque chose d'encore mieux 😏",
    category: "CLOSING",
    intent: "OBJECTION_NOT_INTERESTED",
    triggerKeywords: ["non", "no", "pas maintenant", "not now"],
    priority: 6,
    language: "fr",
  },

  // ============================================
  // UPSELL SCRIPTS
  // ============================================
  {
    name: "Upsell après achat",
    content: "Tu as adoré? 🥰 J'ai quelque chose d'encore plus hot si tu veux... {{petName}} est prêt pour le niveau supérieur? 😈",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["love", "adore", "amazing", "incroyable", "wow", "omg"],
    priority: 9,
    language: "fr",
  },
  {
    name: "Suggestion tip",
    content: "Aww tu es tellement adorable {{petName}} 💕 Si tu veux me faire encore plus plaisir, tu sais ce qui me rendrait vraiment heureuse... 💋",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["merci", "thank", "gentil", "sweet", "nice"],
    priority: 8,
    language: "fr",
    aiInstructions: "Suggère un tip de façon subtile",
  },
  {
    name: "Bundle promo",
    content: "Hey {{petName}} 💕 J'ai vu que t'aimais ce genre de contenu... J'ai un pack de 5 pour le prix de 3 si ça t'intéresse 😏",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["encore", "more", "autre", "another"],
    priority: 8,
    language: "fr",
  },
  {
    name: "Promo abonnement",
    content: "Tu sais {{petName}}, au lieu de payer à chaque fois... Tu pourrais avoir accès à TOUT mon contenu avec l'abonnement 💕 Ça reviendrait moins cher au final",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["tout", "all", "everything", "complet"],
    priority: 7,
    language: "fr",
  },

  // ============================================
  // TEASE SEQUENCE SCRIPTS
  // ============================================
  {
    name: "Tease initial",
    content: "Devine ce que je porte là maintenant... 😏 Je te donne un indice: pas grand chose 🔥",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["quoi", "what", "fais quoi", "doing"],
    priority: 7,
    language: "fr",
  },
  {
    name: "Tease buildup",
    content: "Tu veux vraiment voir? 👀 Mmm... Je sais pas si t'es prêt...",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["oui", "yes", "voir", "see", "montre"],
    priority: 8,
    language: "fr",
  },
  {
    name: "Tease escalade",
    content: "Ok ok t'insistes 😈 Mais d'abord dis-moi... T'aimes quoi chez moi? Je veux savoir avant de te montrer 💋",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["s'il te plait", "please", "allez", "come on"],
    priority: 8,
    language: "fr",
    aiInstructions: "Engage le fan avant de révéler",
  },
  {
    name: "Tease peak",
    content: "Omg tu me rends folle là {{petName}} 🥵 Ok je craque... Je te l'envoie. Mais tu dois me promettre de me dire ce que t'en penses 😏",
    category: "TEASE",
    intent: "CLOSING_READY",
    triggerKeywords: ["promis", "promise", "d'accord", "ok"],
    priority: 9,
    language: "fr",
  },

  // ============================================
  // ENGLISH VERSIONS
  // ============================================
  {
    name: "Welcome new fan (EN)",
    content: "Hey {{petName}} 💕 Welcome to my world... I hope you're ready for some intense moments 😏 What brought you here?",
    category: "GREETING",
    intent: "GREETING_NEW_FAN",
    triggerKeywords: ["new here", "first time", "just joined", "just subscribed"],
    priority: 10,
    language: "en",
  },
  {
    name: "Price objection (EN)",
    content: "I understand {{petName}} 💕 But trust me, what I have to show you... you won't regret it 🔥 And it's really exclusive",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["expensive", "too much", "can't afford", "broke", "money"],
    priority: 10,
    language: "en",
  },
  {
    name: "PPV direct (EN)",
    content: "Ok {{petName}}, I'll stop teasing 😈 Here's what you wanted to see... {{ppvPrice}} credits and it's all yours 💋",
    category: "PPV_PITCH",
    intent: "PPV_EXPLICIT_REQUEST",
    triggerKeywords: ["nude", "naked", "explicit", "show me", "send me"],
    priority: 10,
    language: "en",
    preserveCore: ["ppvPrice"],
  },
  {
    name: "Timing objection (EN)",
    content: "Later? 😢 But {{petName}}... I'm removing this content tomorrow. Are you really going to miss out?",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["later", "tomorrow", "maybe", "not now", "wait"],
    priority: 10,
    language: "en",
  },
];

/**
 * Get scripts by language
 */
export function getScriptsByLanguage(language: string): ScriptSeed[] {
  return VIRAL_STUDIO_SCRIPTS.filter((s) => s.language === language);
}

/**
 * Get scripts by category
 */
export function getScriptsByCategory(category: string): ScriptSeed[] {
  return VIRAL_STUDIO_SCRIPTS.filter((s) => s.category === category);
}

/**
 * Get scripts by intent
 */
export function getScriptsByIntent(intent: string): ScriptSeed[] {
  return VIRAL_STUDIO_SCRIPTS.filter((s) => s.intent === intent);
}
