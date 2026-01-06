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
    content: "Hey {{petName}} 💕 Welcome to my world... I hope you're ready for some intense moments 😏 What brought you here?",
    category: "GREETING",
    intent: "GREETING_NEW_FAN",
    triggerKeywords: ["new here", "first time", "just joined", "just subscribed"],
    priority: 10,
    language: "en",
    aiInstructions: "Personalize based on fan profile if available",
  },
  {
    name: "Reply to hello",
    content: "{{fanName}} 😍 So good to see you... I missed you, you know 💋",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["hey", "hi", "hello", "what's up", "sup", "yo"],
    triggerPatterns: ["^(hey|hi|hello|what'?s up|sup|yo)"],
    priority: 8,
    language: "en",
  },
  {
    name: "Reply to compliment",
    content: "Aww you're so sweet {{petName}} 🥰 Keep talking like that and you might get a surprise... 😏",
    category: "GREETING",
    intent: "GREETING_COMPLIMENT",
    triggerKeywords: ["beautiful", "gorgeous", "sexy", "hot", "stunning", "pretty", "cute"],
    priority: 9,
    language: "en",
  },
  {
    name: "Good morning sexy",
    content: "{{greeting}} {{petName}} ☀️ I just woke up and thought of you... Wanna see what I look like in the morning? 😏",
    category: "GREETING",
    intent: "GREETING_RETURNING",
    triggerKeywords: ["good morning", "morning", "gm", "woke up"],
    priority: 7,
    language: "en",
  },
  {
    name: "Good night flirty",
    content: "Hey you 🌙 What are you up to? I'm in bed... and I'm bored 😈",
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
    content: "I have something special just for you {{petName}}... Wanna see? 👀",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["content", "photos", "pics", "see more", "show me"],
    priority: 8,
    language: "en",
  },
  {
    name: "PPV medium tease",
    content: "So... I did a pretty naughty photoshoot yesterday 🔥 I'm not sure if I should send it to you...",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["photo", "photoshoot", "shooting", "pictures"],
    priority: 7,
    language: "en",
    aiInstructions: "Add mystery and anticipation",
  },
  {
    name: "PPV direct explicit",
    content: "Ok {{petName}}, I'll stop teasing 😈 Here's what you wanted to see... {{ppvPrice}} credits and it's all yours 💋",
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
    content: "This content... I've never shared it with anyone before. You'd be the first to see it 🤫",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["exclusive", "special", "unique", "only"],
    priority: 9,
    language: "en",
  },
  {
    name: "PPV scarcity",
    content: "I only send this to my favorite fans... and you're one of them 💕 But don't wait too long, I won't keep it available forever",
    category: "PPV_PITCH",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["favorite", "special", "vip"],
    priority: 8,
    language: "en",
  },
  {
    name: "PPV video tease",
    content: "I made a video I wasn't sure I should send... it's pretty hot 🥵 Do you want me to send it?",
    category: "PPV_PITCH",
    intent: "PPV_VIDEO_REQUEST",
    triggerKeywords: ["video", "clip", "film", "watch"],
    priority: 9,
    language: "en",
  },
  {
    name: "PPV after hot convo",
    content: "Mmm you're driving me crazy 🥵 I want to show you something... But it's really hot, are you sure you're ready? 😈",
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
    content: "I understand {{petName}} 💕 But trust me, what I have to show you... you won't regret it 🔥 And it's really exclusive",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["expensive", "too much", "can't afford", "broke", "money", "budget"],
    triggerPatterns: ["(too)\\s+(expensive|much)", "(can'?t|no)\\s+(afford|money)"],
    priority: 10,
    language: "en",
  },
  {
    name: "Price objection - value",
    content: "Do you know how long it took me to prepare this? 😏 It's not just a photo, it's an intimate moment I'm sharing only with you...",
    category: "OBJECTION",
    intent: "OBJECTION_PRICE",
    triggerKeywords: ["price", "cost", "worth", "value"],
    priority: 9,
    language: "en",
  },
  {
    name: "Price objection - discount",
    content: "Ok... because it's you 💋 I'll give you a special price: {{discountPrice}} instead of {{originalPrice}}. But just this once 😘",
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
    content: "Later? 😢 But {{petName}}... I'm taking this content down tomorrow. Are you really going to miss out?",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["later", "tomorrow", "maybe", "not now", "wait"],
    priority: 10,
    language: "en",
  },
  {
    name: "Timing objection - FOMO",
    content: "Alright, take your time... But other fans are already going crazy for it 👀 Just saying...",
    category: "OBJECTION",
    intent: "OBJECTION_TIMING",
    triggerKeywords: ["think about", "consider", "not sure"],
    priority: 9,
    language: "en",
  },
  {
    name: "Trust objection - proof",
    content: "You want proof it's really me? 😏 Tell me something to write and I'll send you a photo holding it",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["fake", "real", "prove", "scam", "bot"],
    triggerPatterns: ["(is\\s+this|are\\s+you)\\s+(real|fake)", "prove\\s+it"],
    priority: 10,
    language: "en",
  },
  {
    name: "Trust objection - social proof",
    content: "Look at all my other fans' reviews... Do you think they'd all be here if I was fake? 💕",
    category: "OBJECTION",
    intent: "OBJECTION_TRUST",
    triggerKeywords: ["scam", "trust", "legit", "suspicious"],
    priority: 8,
    language: "en",
  },
  {
    name: "Already seen objection",
    content: "This one is REALLY different {{petName}} 🔥 I've never done this before... Wanna see why? 😈",
    category: "OBJECTION",
    intent: "OBJECTION_SEEN_BEFORE",
    triggerKeywords: ["already", "same", "seen", "bought", "before"],
    priority: 9,
    language: "en",
  },
  {
    name: "Not interested objection",
    content: "Really? 😢 Even if I told you it's the most daring content I've ever made? You don't know what you're missing...",
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
    content: "Hey {{petName}} 💕 Did you see my message from yesterday? Still waiting for your answer...",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 7,
    language: "en",
    aiInstructions: "Use after 24h without response",
  },
  {
    name: "PPV pending follow-up",
    content: "{{petName}}... You haven't unlocked it yet 😢 Don't you want to see what I prepared for you?",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 8,
    language: "en",
    aiInstructions: "Use when PPV has been pending for 12h+",
  },
  {
    name: "Cold fan 7 days",
    content: "{{fanName}}? 👀 I miss you... It's been a week since we talked. I hope you haven't forgotten about me 💔",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: [],
    priority: 9,
    language: "en",
    aiInstructions: "Use after 7 days of inactivity",
  },
  {
    name: "Lost fan reactivation",
    content: "Hey you 💋 I know it's been a while... But I thought about you today and had to reach out 💕",
    category: "FOLLOW_UP",
    intent: "REENGAGEMENT_RETURN",
    triggerKeywords: ["back", "returned", "missed"],
    priority: 8,
    language: "en",
  },
  {
    name: "Last chance message",
    content: "{{fanName}}, this is my last message... If you don't reply, I'll understand 😢 But just know you were my favorite fan...",
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
    content: "Only 2 hours left before I take this down {{petName}}... Are you really going to let it go? 😏",
    category: "CLOSING",
    intent: "CLOSING_READY",
    triggerKeywords: ["time", "when", "how long"],
    priority: 9,
    language: "en",
  },
  {
    name: "Closing final offer",
    content: "Ok, final offer {{petName}} 💕 {{finalPrice}} credits. Take it or leave it. Your choice 😈",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: ["hmm", "idk", "not sure", "maybe"],
    priority: 10,
    language: "en",
    preserveCore: ["finalPrice"],
  },
  {
    name: "Closing emotional",
    content: "Ok... I see you're not interested 😢 It's too bad, I really prepared this just for you...",
    category: "CLOSING",
    intent: "CLOSING_HESITANT",
    triggerKeywords: [],
    priority: 7,
    language: "en",
    aiInstructions: "Use light guilt",
  },
  {
    name: "Closing soft exit",
    content: "No worries {{petName}} 💋 When you're ready, I'll be here... And maybe I'll have something even better 😏",
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
    content: "Did you love it? 🥰 I have something even hotter if you want... {{petName}} ready for the next level? 😈",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["love", "amazing", "incredible", "perfect", "wow", "omg"],
    priority: 9,
    language: "en",
  },
  {
    name: "Tip suggestion",
    content: "Aww you're so sweet {{petName}} 💕 If you want to make me really happy, you know what would put a big smile on my face... 💋",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["thank", "thanks", "nice", "sweet", "kind"],
    priority: 8,
    language: "en",
    aiInstructions: "Subtly suggest a tip",
  },
  {
    name: "Bundle promo",
    content: "Hey {{petName}} 💕 I saw you liked that kind of content... I have a pack of 5 for the price of 3 if you're interested 😏",
    category: "UPSELL",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["more", "another", "again"],
    priority: 8,
    language: "en",
  },
  {
    name: "Subscription promo",
    content: "You know {{petName}}, instead of paying each time... You could have access to ALL my content with a subscription 💕 It's actually cheaper in the end",
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
    content: "Guess what I'm wearing right now... 😏 I'll give you a hint: not much 🔥",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["what", "doing", "up to"],
    priority: 7,
    language: "en",
  },
  {
    name: "Tease buildup",
    content: "You really want to see? 👀 Mmm... I don't know if you can handle it...",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["yes", "show", "see", "please"],
    priority: 8,
    language: "en",
  },
  {
    name: "Tease escalation",
    content: "Ok ok you're persistent 😈 But first tell me... What do you like most about me? I want to know before I show you 💋",
    category: "TEASE",
    intent: "PPV_SOFT_REQUEST",
    triggerKeywords: ["please", "come on", "just show"],
    priority: 8,
    language: "en",
    aiInstructions: "Engage the fan before revealing",
  },
  {
    name: "Tease peak",
    content: "Omg you're driving me crazy {{petName}} 🥵 Ok I give in... I'll send it. But you have to promise to tell me what you think 😏",
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
    content: "I can't stop thinking about you {{petName}}... What would you do if you were here with me right now? 😏",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["thinking", "miss", "want you"],
    priority: 8,
    language: "en",
  },
  {
    name: "Sexting response",
    content: "Mmm that sounds amazing 🥵 Keep going... Tell me more about what you'd do to me 💋",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["touch", "kiss", "feel", "body"],
    priority: 8,
    language: "en",
  },
  {
    name: "Sexting escalation",
    content: "You're making me so wet right now {{petName}} 💦 I wish you could see what you're doing to me...",
    category: "SEXTING",
    intent: "ENGAGEMENT_FLIRTY",
    triggerKeywords: ["hard", "horny", "turned on", "aroused"],
    priority: 9,
    language: "en",
  },
  {
    name: "Sexting to PPV",
    content: "I'm so turned on right now 🥵 I just took a pic of what you're doing to me... Wanna see? 😈",
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
    content: "Mmm that sounds fun {{petName}} 😏 I can definitely do that for you... Let me tell you my rates for customs 💋",
    category: "CUSTOM",
    intent: "CUSTOM_REQUEST",
    triggerKeywords: ["custom", "request", "make me", "specific"],
    priority: 9,
    language: "en",
  },
  {
    name: "Custom content boundaries",
    content: "I appreciate you asking {{petName}} 💕 That's a bit outside what I usually do, but I have something similar that I think you'll love...",
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
    content: "Thank you so much {{petName}} 💕 Did you like it? I loved making it just for you 🥰",
    category: "THANK_YOU",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["bought", "purchased", "unlocked"],
    priority: 8,
    language: "en",
  },
  {
    name: "Thank you for tip",
    content: "Aww {{petName}}! 🥰 You just made my day! You're the sweetest 💋 Let me show you how grateful I am...",
    category: "THANK_YOU",
    intent: "ENGAGEMENT_POSITIVE",
    triggerKeywords: ["tip", "tipped", "gift"],
    priority: 9,
    language: "en",
  },
  {
    name: "Thank you for subscription",
    content: "Welcome to my VIP world {{petName}} 💕 I'm so excited to have you here! Get ready for some amazing content 😈",
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
