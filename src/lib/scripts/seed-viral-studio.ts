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
    name: "Welcome new fan",
    content: "hey {{petName}} 💕 welcome to my world... i hope you're ready for some intense moments 😏 what brought you here?",
    category: "GREETING",
    intent: "GREETING_NEW_FAN",
    triggerKeywords: ["new here", "first time", "just joined", "just subscribed"],
    priority: 10,
    language: "en",
    aiInstructions: "Personalize based on fan profile if available",
  },
  {
    name: "Reply to hello",
    content: "{{fanName}} 😍 so good to see you... i missed you, you know 💋",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["hey", "hi", "hello", "what's up", "sup", "yo"],
    triggerPatterns: ["^(hey|hi|hello|what'?s up|sup|yo)"],
    priority: 8,
    language: "en",
  },
  {
    name: "Reply to compliment",
    content: "aww you're so sweet {{petName}} 🥰 keep talking like that and you might get a surprise... 😏",
    category: "GREETING",
    intent: "GREETING_COMPLIMENT",
    triggerKeywords: ["beautiful", "gorgeous", "sexy", "hot", "stunning", "pretty", "cute"],
    priority: 9,
    language: "en",
  },
  {
    name: "Good morning sexy",
    content: "{{greeting}} {{petName}} ☀️ i just woke up and thought of you... wanna see what i look like in the morning? 😏",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["good morning", "morning", "gm", "woke up"],
    priority: 7,
    language: "en",
  },
  {
    name: "Good night flirty",
    content: "hey you 🌙 what are you up to? i'm in bed... and i'm bored 😈",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["good night", "evening", "night", "gn"],
    priority: 7,
    language: "en",
  },

  // ============================================
  // PPV PITCH SCRIPTS
  // ============================================
  {
    name: "PPV soft intro",
    content: "i have something special just for you {{petName}}... wanna see? 👀",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["content", "photos", "pics", "see more", "show me"],
    priority: 8,
    language: "en",
  },
  {
    name: "PPV medium tease",
    content: "so... i did a pretty naughty photoshoot yesterday 🔥 i'm not sure if i should send it to you...",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["photo", "photoshoot", "shooting", "pictures"],
    priority: 7,
    language: "en",
    aiInstructions: "Add mystery and anticipation",
  },
  {
    name: "PPV direct explicit",
    content: "ok {{petName}}, i'll stop teasing 😈 here's what you wanted to see... {{ppvPrice}} credits and it's all yours 💋",
    category: "PPV_PITCH",
    intent: "PPV_EXPLICIT_REQUEST",
    triggerKeywords: ["nude", "naked", "explicit", "pussy", "boobs", "tits", "ass"],
    triggerPatterns: ["(show|send)\\s+(me|your)"],
    priority: 10,
    language: "en",
    preserveCore: ["ppvPrice"],
  },
  {
    name: "PPV exclusivity angle",
    content: "this content... i've never shared it with anyone before. you'd be the first to see it 🤫",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["exclusive", "special", "unique", "only"],
    priority: 9,
    language: "en",
  },
  {
    name: "PPV scarcity",
    content: "i only send this to my favorite fans... and you're one of them 💕 but don't wait too long, i won't keep it available forever",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["favorite", "special", "vip"],
    priority: 8,
    language: "en",
  },
  {
    name: "PPV video tease",
    content: "i made a video i wasn't sure i should send... it's pretty hot 🥵 do you want me to send it?",
    category: "PPV_PITCH",
    intent: "PPV_VIDEO_REQUEST",
    triggerKeywords: ["video", "clip", "film", "watch"],
    priority: 9,
    language: "en",
  },
  {
    name: "PPV after hot convo",
    content: "mmm you're driving me crazy 🥵 i want to show you something... but it's really hot, are you sure you're ready? 😈",
    category: "PPV_PITCH",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["horny", "turned on", "excited", "hot", "want"],
    priority: 9,
    language: "en",
  },

  // ============================================
  // OBJECTION HANDLING SCRIPTS
  // ============================================
  {
    name: "Price objection - empathy",
    content: "i understand {{petName}} 💕 but trust me, what i have to show you... you won't regret it 🔥 and it's really exclusive",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["expensive", "too much", "can't afford", "broke", "money", "budget"],
    triggerPatterns: ["(too)\\s+(expensive|much)", "(can'?t|no)\\s+(afford|money)"],
    priority: 10,
    language: "en",
  },
  {
    name: "Price objection - value",
    content: "do you know how long it took me to prepare this? 😏 it's not just a photo, it's an intimate moment i'm sharing only with you...",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["price", "cost", "worth", "value"],
    priority: 9,
    language: "en",
  },
  {
    name: "Price objection - discount",
    content: "ok... because it's you 💋 i'll give you a special price: {{discountPrice}} instead of {{originalPrice}}. but just this once 😘",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["discount", "cheaper", "deal", "lower"],
    priority: 8,
    language: "en",
    preserveCore: ["discountPrice", "originalPrice"],
    aiInstructions: "Only use if fan already refused once",
  },
  {
    name: "Timing objection - urgency",
    content: "later? 😢 but {{petName}}... i'm taking this content down tomorrow. are you really going to miss out?",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["later", "tomorrow", "maybe", "not now", "wait"],
    priority: 10,
    language: "en",
  },
  {
    name: "Timing objection - FOMO",
    content: "alright, take your time... but other fans are already going crazy for it 👀 just saying...",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["think about", "consider", "not sure"],
    priority: 9,
    language: "en",
  },
  {
    name: "Trust objection - proof",
    content: "you want proof it's really me? 😏 tell me something to write and i'll send you a photo holding it",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["fake", "real", "prove", "scam", "bot"],
    triggerPatterns: ["(is\\s+this|are\\s+you)\\s+(real|fake)", "prove\\s+it"],
    priority: 10,
    language: "en",
  },
  {
    name: "Trust objection - social proof",
    content: "look at all my other fans' reviews... do you think they'd all be here if i was fake? 💕",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["scam", "trust", "legit", "suspicious"],
    priority: 8,
    language: "en",
  },
  {
    name: "Already seen objection",
    content: "this one is really different {{petName}} 🔥 i've never done this before... wanna see why? 😈",
    category: "OBJECTION",
    intent: "OBJECTION_SEEN_BEFORE",
    triggerKeywords: ["already", "same", "seen", "bought", "before"],
    priority: 9,
    language: "en",
  },
  {
    name: "Not interested objection",
    content: "really? 😢 even if i told you it's the most daring content i've ever made? you don't know what you're missing...",
    category: "OBJECTION",
    intent: "OBJECTION_NOT_INTERESTED",
    triggerKeywords: ["not interested", "no thanks", "pass", "nah"],
    priority: 7,
    language: "en",
  },

  // ============================================
  // FOLLOW UP / RE-ENGAGEMENT SCRIPTS
  // ============================================
  {
    name: "Soft follow-up 24h",
    content: "hey {{petName}} 💕 did you see my message from yesterday? still waiting for your answer...",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 7,
    language: "en",
    aiInstructions: "Use after 24h without response",
  },
  {
    name: "PPV pending follow-up",
    content: "{{petName}}... you haven't unlocked it yet 😢 don't you want to see what i prepared for you?",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 8,
    language: "en",
    aiInstructions: "Use when PPV has been pending for 12h+",
  },
  {
    name: "Cold fan 7 days",
    content: "{{fanName}}? 👀 i miss you... it's been a week since we talked. i hope you haven't forgotten about me 💔",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 9,
    language: "en",
    aiInstructions: "Use after 7 days of inactivity",
  },
  {
    name: "Lost fan reactivation",
    content: "hey you 💋 i know it's been a while... but i thought about you today and had to reach out 💕",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: ["back", "returned", "missed"],
    priority: 8,
    language: "en",
  },
  {
    name: "Last chance message",
    content: "{{fanName}}, this is my last message... if you don't reply, i'll understand 😢 but just know you were my favorite fan...",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 6,
    language: "en",
    aiInstructions: "Use as last resort after 14+ days of inactivity",
  },

  // ============================================
  // CLOSING SCRIPTS
  // ============================================
  {
    name: "Closing time urgency",
    content: "only 2 hours left before i take this down {{petName}}... are you really going to let it go? 😏",
    category: "CLOSING",
    intent: "CLOSING_READY",
    triggerKeywords: ["time", "when", "how long"],
    priority: 9,
    language: "en",
  },
  {
    name: "Closing final offer",
    content: "ok, final offer {{petName}} 💕 {{finalPrice}} credits. take it or leave it. your choice 😈",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: ["hmm", "idk", "not sure", "maybe"],
    priority: 10,
    language: "en",
    preserveCore: ["finalPrice"],
  },
  {
    name: "Closing emotional",
    content: "ok... i see you're not interested 😢 it's too bad, i really prepared this just for you...",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: [],
    priority: 7,
    language: "en",
    aiInstructions: "Use light guilt",
  },
  {
    name: "Closing soft exit",
    content: "no worries {{petName}} 💋 when you're ready, i'll be here... and maybe i'll have something even better 😏",
    category: "CLOSING",
    intent: "OBJECTION_NOT_INTERESTED",
    triggerKeywords: ["no", "not now", "maybe later"],
    priority: 6,
    language: "en",
  },

  // ============================================
  // UPSELL SCRIPTS
  // ============================================
  {
    name: "Upsell after purchase",
    content: "did you love it? 🥰 i have something even hotter if you want... {{petName}} ready for the next level? 😈",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["love", "amazing", "incredible", "perfect", "wow", "omg"],
    priority: 9,
    language: "en",
  },
  {
    name: "Tip suggestion",
    content: "aww you're so sweet {{petName}} 💕 if you want to make me really happy, you know what would put a big smile on my face... 💋",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["thank", "thanks", "nice", "sweet", "kind"],
    priority: 8,
    language: "en",
    aiInstructions: "Subtly suggest a tip",
  },
  {
    name: "Bundle promo",
    content: "hey {{petName}} 💕 i saw you liked that kind of content... i have a pack of 5 for the price of 3 if you're interested 😏",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["more", "another", "again"],
    priority: 8,
    language: "en",
  },
  {
    name: "Subscription promo",
    content: "you know {{petName}}, instead of paying each time... you could have access to all my content with a subscription 💕 it's actually cheaper in the end",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["all", "everything", "full"],
    priority: 7,
    language: "en",
  },

  // ============================================
  // TEASE SEQUENCE SCRIPTS
  // ============================================
  {
    name: "Tease initial",
    content: "guess what i'm wearing right now... 😏 i'll give you a hint: not much 🔥",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["what", "doing", "up to"],
    priority: 7,
    language: "en",
  },
  {
    name: "Tease buildup",
    content: "you really want to see? 👀 mmm... i don't know if you can handle it...",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["yes", "show", "see", "please"],
    priority: 8,
    language: "en",
  },
  {
    name: "Tease escalation",
    content: "ok ok you're persistent 😈 but first tell me... what do you like most about me? i want to know before i show you 💋",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["please", "come on", "just show"],
    priority: 8,
    language: "en",
    aiInstructions: "Engage the fan before revealing",
  },
  {
    name: "Tease peak",
    content: "omg you're driving me crazy {{petName}} 🥵 ok i give in... i'll send it. but you have to promise to tell me what you think 😏",
    category: "TEASE",
    intent: "CLOSING_READY",
    triggerKeywords: ["promise", "ok", "deal", "yes"],
    priority: 9,
    language: "en",
  },

  // ============================================
  // SEXTING SCRIPTS
  // ============================================
  {
    name: "Sexting starter",
    content: "i can't stop thinking about you {{petName}}... what would you do if you were here with me right now? 😏",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["thinking", "miss", "want you"],
    priority: 8,
    language: "en",
  },
  {
    name: "Sexting response",
    content: "mmm that sounds amazing 🥵 keep going... tell me more about what you'd do to me 💋",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["touch", "kiss", "feel", "body"],
    priority: 8,
    language: "en",
  },
  {
    name: "Sexting escalation",
    content: "you're making me so wet right now {{petName}} 💦 i wish you could see what you're doing to me...",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["hard", "horny", "turned on", "aroused"],
    priority: 9,
    language: "en",
  },
  {
    name: "Sexting to PPV",
    content: "i'm so turned on right now 🥵 i just took a pic of what you're doing to me... wanna see? 😈",
    category: "SEXTING",
    intent: "PPV_EXPLICIT_REQUEST",
    triggerKeywords: ["show", "see", "pic", "photo"],
    priority: 10,
    language: "en",
    aiInstructions: "Transition from sexting to PPV sale",
  },

  // ============================================
  // CUSTOM REQUEST SCRIPTS
  // ============================================
  {
    name: "Custom content yes",
    content: "mmm that sounds fun {{petName}} 😏 i can definitely do that for you... let me tell you my rates for customs 💋",
    category: "CUSTOM",
    intent: "CUSTOM_REQUEST",
    triggerKeywords: ["custom", "request", "make me", "specific"],
    priority: 9,
    language: "en",
  },
  {
    name: "Custom content boundaries",
    content: "i appreciate you asking {{petName}} 💕 that's a bit outside what i usually do, but i have something similar that i think you'll love...",
    category: "CUSTOM",
    intent: "CUSTOM_REQUEST",
    triggerKeywords: ["would you", "can you", "will you"],
    priority: 7,
    language: "en",
    aiInstructions: "Redirect to acceptable alternative",
  },

  // ============================================
  // THANK YOU SCRIPTS
  // ============================================
  {
    name: "Thank you after purchase",
    content: "thank you so much {{petName}} 💕 did you like it? i loved making it just for you 🥰",
    category: "THANK_YOU",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["bought", "purchased", "unlocked"],
    priority: 8,
    language: "en",
  },
  {
    name: "Thank you for tip",
    content: "aww {{petName}}! 🥰 you just made my day! you're the sweetest 💋 let me show you how grateful i am...",
    category: "THANK_YOU",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["tip", "tipped", "gift"],
    priority: 9,
    language: "en",
  },
  {
    name: "Thank you for subscription",
    content: "welcome to my vip world {{petName}} 💕 i'm so excited to have you here! get ready for some amazing content 😈",
    category: "THANK_YOU",
    intent: "GREETING_NEW_FAN",
    triggerKeywords: ["subscribed", "joined", "member"],
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
