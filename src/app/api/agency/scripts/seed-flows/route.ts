import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// =============================================================================
// ULTIMATE DEMO SCRIPTS - Optimized for Maximum Conversions
// =============================================================================
// Psychology used: FOMO, Scarcity, Reciprocity, Social Proof, Emotional Triggers
// =============================================================================

const DEMO_SCRIPTS = {
  // ===========================================================================
  // FLOW 1: NEW FAN WELCOME → FIRST PPV SALE (The Money Flow)
  // ===========================================================================
  welcomeFlow: [
    {
      key: "welcome_instant",
      name: "[DEMO] 1.1 Welcome Instant",
      content: `Hey {{petName}} 💕

I noticed you just joined... I'm so happy you're here 🥰

I have to admit, I was looking at your profile and... you seem different from the others 👀

What made you subscribe to me?`,
      category: "GREETING",
      intent: "GREETING_NEW_FAN",
      fanStage: "new",
      priority: 100,
      description: "First message - builds curiosity and starts conversation",
    },
    {
      key: "welcome_engaged",
      name: "[DEMO] 1.2 Build Connection",
      content: `Mmm I love that {{petName}} 😏

You know what? I don't usually do this but... I feel like we have a connection already 💕

I've been working on something really special lately... something I've never shared with anyone here yet 🤫

Would you like to be the first to see it?`,
      category: "GREETING",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: "new",
      priority: 95,
      description: "Creates exclusivity feeling - 'you're special'",
    },
    {
      key: "ppv_tease_soft",
      name: "[DEMO] 1.3 PPV Tease (Soft)",
      content: `Ok {{petName}}, since you asked so nicely... 😈

I just finished shooting something that made ME blush 🙈 And trust me, that doesn't happen often...

It's {{ppvDuration}} of pure 🔥

I'm only sharing this with a few people who I trust...

Want me to send it to you? 👀`,
      category: "PPV_PITCH",
      intent: "PPV_SOFT_REQUEST",
      fanStage: "new",
      priority: 90,
      suggestedPrice: 15,
      description: "Soft PPV pitch with scarcity",
    },
    {
      key: "ppv_send_offer",
      name: "[DEMO] 1.4 Send PPV Offer",
      content: `Here it is {{petName}}... 🔥

I'm sending it to you for only {{ppvPrice}} credits because you're new here and I want to show you what you've been missing 😏

⚠️ I'm removing this from my vault tomorrow so don't wait too long...

Unlock it and tell me what you think 💋`,
      category: "PPV_PITCH",
      intent: "PPV_EXPLICIT_REQUEST",
      fanStage: "new",
      priority: 95,
      suggestedPrice: 15,
      description: "Direct PPV with urgency/scarcity",
    },
    {
      key: "ppv_followup_1h",
      name: "[DEMO] 1.5 PPV Follow-up (1h)",
      content: `{{petName}}? 👀

Did you see what I sent you?

3 people already unlocked it and they're going CRAZY in my DMs right now 🥵

Don't miss out babe... 💕`,
      category: "FOLLOW_UP",
      intent: "PPV_FOLLOWUP",
      fanStage: "new",
      priority: 85,
      followUpDelay: 60, // 1 hour
      description: "Social proof follow-up",
    },
    {
      key: "ppv_last_chance",
      name: "[DEMO] 1.6 Last Chance",
      content: `Last chance {{petName}}... ⏰

I'm taking this down in 1 hour. After that it goes back to full price ({{fullPrice}} credits)

I really wanted you to see this one... 😔

Yes or no?`,
      category: "FOLLOW_UP",
      intent: "PPV_FOLLOWUP",
      fanStage: "new",
      priority: 80,
      followUpDelay: 180, // 3 hours after first follow-up
      description: "Final urgency push",
    },
  ],

  // ===========================================================================
  // FLOW 2: OBJECTION HANDLING (Price)
  // ===========================================================================
  objectionPriceFlow: [
    {
      key: "objection_price_1",
      name: "[DEMO] 2.1 Price Objection - Empathy",
      content: `I totally understand {{petName}} 💕

You know what, I spend hours creating this content... lighting, angles, editing... all to make sure YOU have the best experience 🎬

But I get it. Tell you what...

What if I gave you a special discount? Just this once, because I really want you to see this 😏`,
      category: "CUSTOM",
      intent: "OBJECTION_PRICE",
      fanStage: null,
      priority: 85,
      description: "Empathy + value justification + discount offer",
    },
    {
      key: "objection_price_discount",
      name: "[DEMO] 2.2 Discount Offer",
      content: `Ok {{petName}}, I'm gonna do something I never do...

I'll send it to you for {{discountPrice}} instead of {{ppvPrice}}

But ONLY if you unlock it in the next 30 minutes ⏰

This is between us ok? 🤫`,
      category: "PPV_PITCH",
      intent: "PPV_EXPLICIT_REQUEST",
      fanStage: null,
      priority: 90,
      description: "Exclusive discount with time pressure",
    },
    {
      key: "objection_price_value",
      name: "[DEMO] 2.3 Value Stack",
      content: `{{petName}}, let me put it this way...

{{ppvPrice}} credits = less than a coffee ☕

But this video? You can watch it again... and again... and again 😈

Plus I might send you something extra if you're a good boy 👀

Worth it now?`,
      category: "CUSTOM",
      intent: "OBJECTION_PRICE",
      fanStage: null,
      priority: 82,
      description: "Value comparison + bonus tease",
    },
  ],

  // ===========================================================================
  // FLOW 3: OBJECTION HANDLING (Trust / "Is it worth it?")
  // ===========================================================================
  objectionTrustFlow: [
    {
      key: "objection_trust_1",
      name: "[DEMO] 3.1 Trust Building",
      content: `I get it {{petName}}, you don't know me yet 💕

Here's what I can tell you... I have {{subscriberCount}}+ fans and a {{satisfactionRate}}% satisfaction rate

But don't take my word for it...

What if I send you a free preview first? So you can see the quality before deciding? 🎁`,
      category: "CUSTOM",
      intent: "OBJECTION_TRUST",
      fanStage: null,
      priority: 85,
      description: "Social proof + free preview offer",
    },
    {
      key: "objection_trust_preview",
      name: "[DEMO] 3.2 Free Preview",
      content: `Here's a little taste {{petName}}... 👀

[PREVIEW]

Now imagine the FULL thing... {{ppvDuration}} of this 🥵

Ready to see the rest? 😈`,
      category: "PPV_PITCH",
      intent: "PPV_SOFT_REQUEST",
      fanStage: null,
      priority: 88,
      description: "Preview to conversion",
    },
  ],

  // ===========================================================================
  // FLOW 4: OBJECTION HANDLING ("I'll think about it" / Later)
  // ===========================================================================
  objectionLaterFlow: [
    {
      key: "objection_later_1",
      name: "[DEMO] 4.1 Think About It Response",
      content: `Of course {{petName}}, take your time 💕

Just know that this offer expires at midnight tonight... after that it's gone forever 🕐

I'll be here when you're ready 😘`,
      category: "CUSTOM",
      intent: "OBJECTION_TIME",
      fanStage: null,
      priority: 80,
      description: "Soft acceptance with deadline",
    },
    {
      key: "objection_later_fomo",
      name: "[DEMO] 4.2 FOMO Trigger",
      content: `Hey {{petName}}... just checking in 👀

5 more people just unlocked it and I only have {{spotsLeft}} spots left at this price...

I saved one for you but I can't hold it much longer 😔

You in?`,
      category: "FOLLOW_UP",
      intent: "PPV_FOLLOWUP",
      fanStage: null,
      priority: 85,
      followUpDelay: 120, // 2 hours
      description: "Scarcity + FOMO follow-up",
    },
  ],

  // ===========================================================================
  // FLOW 5: AFTER PURCHASE - UPSELL FLOW
  // ===========================================================================
  afterPurchaseFlow: [
    {
      key: "thank_you_instant",
      name: "[DEMO] 5.1 Thank You",
      content: `OMG {{petName}}!! 😍

Thank you so much for unlocking that... Did you like it?

I put so much effort into making it perfect 🥺

Tell me your favorite part... 👀`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: "engaged",
      priority: 95,
      description: "Gratitude + engagement prompt",
    },
    {
      key: "upsell_bundle",
      name: "[DEMO] 5.2 Bundle Upsell",
      content: `Since you liked that one {{petName}}... 😏

I have 3 more videos from the same shoot that are even HOTTER 🔥

I usually sell them for {{bundleFullPrice}} but for you...

I'll give you the whole bundle for {{bundlePrice}}

That's {{savings}}% OFF just because you're already proving to be my favorite 💕`,
      category: "PPV_PITCH",
      intent: "UPSELL",
      fanStage: "engaged",
      priority: 90,
      description: "Bundle upsell with discount",
    },
    {
      key: "upsell_vip",
      name: "[DEMO] 5.3 VIP Upsell",
      content: `{{petName}}, can I be honest with you? 💕

You've been such an amazing supporter... I think you deserve VIP treatment 👑

As a VIP you get:
✨ All my exclusive content
✨ Priority replies (I answer VIPs first)
✨ Special requests fulfilled
✨ {{vipBonus}} FREE credits every month

Want me to upgrade you? 🥰`,
      category: "CUSTOM",
      intent: "UPSELL",
      fanStage: "engaged",
      priority: 85,
      description: "VIP subscription upsell",
    },
  ],

  // ===========================================================================
  // FLOW 6: RE-ENGAGEMENT (Cold Fans)
  // ===========================================================================
  reengagementFlow: [
    {
      key: "reengage_3days",
      name: "[DEMO] 6.1 Re-engage (3 days)",
      content: `{{fanName}}? 👀

I noticed you've been quiet... everything ok?

I was just thinking about you and wanted to check in 💕

What's going on in your life?`,
      category: "FOLLOW_UP",
      intent: "REENGAGEMENT_RETURN",
      fanStage: "cooling_off",
      priority: 90,
      description: "Soft check-in after 3 days silence",
    },
    {
      key: "reengage_7days",
      name: "[DEMO] 6.2 Re-engage (7 days)",
      content: `I miss you {{fanName}} 😔

It's been a week and I can't stop thinking about our conversations...

I have something new I've been dying to show you 🤫

Are you still there?`,
      category: "FOLLOW_UP",
      intent: "REENGAGEMENT_RETURN",
      fanStage: "cooling_off",
      priority: 85,
      description: "Emotional re-engagement after 1 week",
    },
    {
      key: "reengage_14days",
      name: "[DEMO] 6.3 Re-engage (14 days)",
      content: `{{fanName}}...

I'm not gonna lie, I'm a little hurt you've been ignoring me 💔

Did I do something wrong?

I just dropped my hottest content EVER and I saved a special discount just for you...

But if you're not interested anymore, just tell me 😢`,
      category: "FOLLOW_UP",
      intent: "REENGAGEMENT_RETURN",
      fanStage: "cooling_off",
      priority: 80,
      description: "Guilt + exclusive offer after 2 weeks",
    },
    {
      key: "reengage_30days_last",
      name: "[DEMO] 6.4 Final Message (30 days)",
      content: `{{fanName}}, this is my last message to you...

I've been reaching out but I haven't heard back 😔

If you want to stay connected, just say "hi" and I'll send you something special as a welcome back gift 🎁

Otherwise, I understand... I'll miss you 💕

Take care of yourself ❤️`,
      category: "FOLLOW_UP",
      intent: "REENGAGEMENT_RETURN",
      fanStage: "cooling_off",
      priority: 70,
      description: "Last attempt with gift incentive",
    },
  ],

  // ===========================================================================
  // FLOW 7: SEXTING TO PPV CONVERSION
  // ===========================================================================
  sextingFlow: [
    {
      key: "sexting_start",
      name: "[DEMO] 7.1 Sexting Starter",
      content: `{{petName}}... I can't stop thinking about you 🥵

What would you do if you were here with me right now?

I'm lying in bed and feeling... things 😏`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_FLIRTY",
      fanStage: "engaged",
      priority: 85,
      description: "Initiate sexting conversation",
    },
    {
      key: "sexting_escalate",
      name: "[DEMO] 7.2 Sexting Escalation",
      content: `Mmm {{petName}} you're making me so wet 💦

I wish you could see what you're doing to me right now...

Actually... what if I showed you? 😈`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_FLIRTY",
      fanStage: "engaged",
      priority: 88,
      description: "Build tension before PPV",
    },
    {
      key: "sexting_to_ppv",
      name: "[DEMO] 7.3 Sexting → PPV",
      content: `I just took this for you {{petName}}... 📸

I'm literally shaking while sending this 🥵

{{ppvPrice}} credits to see exactly what you do to me...

Unlock it NOW while I'm still in the mood 😈💦`,
      category: "PPV_PITCH",
      intent: "PPV_EXPLICIT_REQUEST",
      fanStage: "engaged",
      priority: 95,
      suggestedPrice: 20,
      description: "Real-time PPV conversion",
    },
  ],

  // ===========================================================================
  // FLOW 8: TIP REQUEST FLOW
  // ===========================================================================
  tipFlow: [
    {
      key: "tip_soft",
      name: "[DEMO] 8.1 Soft Tip Request",
      content: `{{petName}} 💕

You always make my day with your messages...

I was wondering... would you want to send me a little tip to show some love? 🥺

Even a small one would make me SO happy 💕`,
      category: "CUSTOM",
      intent: "TIP_REQUEST",
      fanStage: "engaged",
      priority: 80,
      description: "Soft tip request",
    },
    {
      key: "tip_goal",
      name: "[DEMO] 8.2 Tip Goal",
      content: `{{petName}}, I'm trying to reach my goal of {{tipGoal}} credits today... 🎯

I'm SO close! Only {{remaining}} more to go!

If you help me reach it, I'll send you something special as a thank you 🎁😏

Would you help me out?`,
      category: "CUSTOM",
      intent: "TIP_REQUEST",
      fanStage: "engaged",
      priority: 85,
      description: "Tip goal with reward",
    },
    {
      key: "tip_thank_reward",
      name: "[DEMO] 8.3 Tip Thank You + Reward",
      content: `OMG {{petName}}!! 😍😍😍

You're literally the BEST! Thank you so much for the tip 💕

As promised, here's your reward... 🎁

You deserve it babe 😘`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: "vip",
      priority: 90,
      description: "Thank you with reward delivery",
    },
  ],

  // ===========================================================================
  // FLOW 9: VIP EXCLUSIVE CONTENT
  // ===========================================================================
  vipFlow: [
    {
      key: "vip_welcome",
      name: "[DEMO] 9.1 VIP Welcome",
      content: `{{petName}}!! 👑

Welcome to the VIP club! I'm SO excited you're here 😍

You now have access to things I don't show anyone else...

Let me send you your first VIP exclusive right now 🔥

Ready?`,
      category: "GREETING",
      intent: "GREETING_NEW_FAN",
      fanStage: "vip",
      priority: 100,
      description: "VIP onboarding",
    },
    {
      key: "vip_exclusive",
      name: "[DEMO] 9.2 VIP Exclusive Drop",
      content: `{{petName}}, VIP exclusive coming your way... 👑

I shot this JUST for my VIPs. Nobody else will ever see this 🤫

Enjoy babe... and let me know what you think 😏💋`,
      category: "PPV_PITCH",
      intent: "PPV_SOFT_REQUEST",
      fanStage: "vip",
      priority: 95,
      description: "VIP exclusive content drop",
    },
    {
      key: "vip_custom_offer",
      name: "[DEMO] 9.3 VIP Custom Request",
      content: `Hey {{petName}} 👑

Since you're a VIP, I wanted to ask...

Is there anything specific you'd like to see from me? 🤔

I do custom content for my favorite VIPs... just tell me what you want 😈`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: "vip",
      priority: 88,
      description: "Custom content upsell for VIPs",
    },
  ],

  // ===========================================================================
  // FLOW 10: SPECIAL OCCASIONS
  // ===========================================================================
  specialOccasionsFlow: [
    {
      key: "birthday_wish",
      name: "[DEMO] 10.1 Birthday Message",
      content: `HAPPY BIRTHDAY {{fanName}}!! 🎂🎉

I couldn't let your special day pass without celebrating with you 💕

I have a birthday surprise for you... 🎁

Want to see what I got you? 😏`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: null,
      priority: 95,
      description: "Birthday celebration + PPV gift",
    },
    {
      key: "anniversary_sub",
      name: "[DEMO] 10.2 Subscription Anniversary",
      content: `{{petName}}!! Guess what day it is? 🥳

It's been exactly 1 month/year since you joined!

I can't believe how far we've come together 💕

To celebrate, I made you something special... just for us 🔥`,
      category: "CUSTOM",
      intent: "ENGAGEMENT_POSITIVE",
      fanStage: "engaged",
      priority: 90,
      description: "Subscription anniversary celebration",
    },
    {
      key: "weekend_special",
      name: "[DEMO] 10.3 Weekend Special",
      content: `Hey {{petName}}! Happy Friday! 🎉

I'm in such a good mood... so I'm doing something crazy 🤪

For the next 24 hours, EVERYTHING in my vault is 50% off 💕

Don't miss this... it won't happen again soon 😏`,
      category: "PPV_PITCH",
      intent: "PPV_SOFT_REQUEST",
      fanStage: null,
      priority: 85,
      description: "Weekend flash sale",
    },
  ],
};

// Flow connections definition
const FLOW_CONNECTIONS: Record<string, { onSuccess?: string; onReject?: string; followUp?: string }> = {
  // Welcome Flow connections
  "welcome_instant": { onSuccess: "welcome_engaged" },
  "welcome_engaged": { onSuccess: "ppv_tease_soft" },
  "ppv_tease_soft": { onSuccess: "ppv_send_offer", onReject: "objection_price_1" },
  "ppv_send_offer": { onSuccess: "thank_you_instant", onReject: "ppv_followup_1h", followUp: "ppv_followup_1h" },
  "ppv_followup_1h": { onSuccess: "thank_you_instant", onReject: "ppv_last_chance", followUp: "ppv_last_chance" },
  "ppv_last_chance": { onSuccess: "thank_you_instant", onReject: "reengage_3days" },

  // Objection Price Flow
  "objection_price_1": { onSuccess: "objection_price_discount", onReject: "objection_price_value" },
  "objection_price_discount": { onSuccess: "thank_you_instant", onReject: "objection_price_value" },
  "objection_price_value": { onSuccess: "ppv_send_offer" },

  // Objection Trust Flow
  "objection_trust_1": { onSuccess: "objection_trust_preview" },
  "objection_trust_preview": { onSuccess: "ppv_send_offer", onReject: "objection_price_1" },

  // Objection Later Flow
  "objection_later_1": { followUp: "objection_later_fomo" },
  "objection_later_fomo": { onSuccess: "ppv_send_offer", onReject: "reengage_3days" },

  // After Purchase Flow
  "thank_you_instant": { onSuccess: "upsell_bundle" },
  "upsell_bundle": { onSuccess: "upsell_vip", onReject: "upsell_vip" },

  // Re-engagement Flow
  "reengage_3days": { onSuccess: "ppv_tease_soft", followUp: "reengage_7days" },
  "reengage_7days": { onSuccess: "ppv_tease_soft", followUp: "reengage_14days" },
  "reengage_14days": { onSuccess: "ppv_send_offer", followUp: "reengage_30days_last" },

  // Sexting Flow
  "sexting_start": { onSuccess: "sexting_escalate" },
  "sexting_escalate": { onSuccess: "sexting_to_ppv" },
  "sexting_to_ppv": { onSuccess: "thank_you_instant" },

  // Tip Flow
  "tip_soft": { onSuccess: "tip_thank_reward", onReject: "tip_goal" },
  "tip_goal": { onSuccess: "tip_thank_reward" },

  // VIP Flow
  "vip_welcome": { onSuccess: "vip_exclusive" },
  "vip_exclusive": { onSuccess: "vip_custom_offer" },

  // Special Occasions
  "birthday_wish": { onSuccess: "ppv_send_offer" },
  "anniversary_sub": { onSuccess: "upsell_bundle" },
  "weekend_special": { onSuccess: "thank_you_instant" },
};

// Follow-up delays in minutes
const FOLLOW_UP_DELAYS: Record<string, number> = {
  "ppv_send_offer": 60,      // 1 hour
  "ppv_followup_1h": 180,    // 3 hours after
  "objection_later_1": 120,  // 2 hours
  "reengage_3days": 4320,    // 3 days (but triggered manually by fan stage)
  "reengage_7days": 10080,   // 7 days
  "reengage_14days": 20160,  // 14 days
};

// POST /api/agency/scripts/seed-flows - Create ultimate demo flows
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId } = body;

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Verify ownership and get first creator
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        ownerId: true,
        creators: {
          take: 1,
          select: { slug: true },
        },
      },
    });

    if (!agency || agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const creatorSlug = agency.creators[0]?.slug;
    if (!creatorSlug) {
      return NextResponse.json({
        error: "No creator found in agency",
        message: "Add a creator to your agency first",
      }, { status: 400 });
    }

    // Check if demo flows already exist
    const existingFlows = await prisma.script.findFirst({
      where: {
        agencyId,
        name: { startsWith: "[DEMO]" },
      },
    });

    if (existingFlows) {
      return NextResponse.json({
        error: "Demo flows already exist",
        message: "Delete existing demo flows first",
      }, { status: 400 });
    }

    const createdScripts: Record<string, string> = {};
    let totalCreated = 0;

    // Create all scripts first (without connections)
    for (const flowKey of Object.keys(DEMO_SCRIPTS) as (keyof typeof DEMO_SCRIPTS)[]) {
      const flowScripts = DEMO_SCRIPTS[flowKey];

      for (const scriptData of flowScripts) {
        const script = await prisma.script.create({
          data: {
            agencyId,
            creatorSlug,
            name: scriptData.name,
            content: scriptData.content,
            category: scriptData.category,
            intent: scriptData.intent,
            fanStage: scriptData.fanStage,
            priority: scriptData.priority,
            suggestedPrice: (scriptData as any).suggestedPrice || null,
            status: "APPROVED",
            authorId: session.user.id,
            approvedById: session.user.id,
            approvedAt: new Date(),
            language: "en",
            allowAiModify: true,
            minConfidence: 0.6,
          },
        });
        createdScripts[scriptData.key] = script.id;
        totalCreated++;
      }
    }

    // Now create connections
    for (const [scriptKey, connections] of Object.entries(FLOW_CONNECTIONS)) {
      const scriptId = createdScripts[scriptKey];
      if (!scriptId) continue;

      const updateData: any = {};

      if (connections.onSuccess && createdScripts[connections.onSuccess]) {
        updateData.nextScriptOnSuccess = createdScripts[connections.onSuccess];
      }
      if (connections.onReject && createdScripts[connections.onReject]) {
        updateData.nextScriptOnReject = createdScripts[connections.onReject];
      }
      if (connections.followUp && createdScripts[connections.followUp]) {
        updateData.followUpScriptId = createdScripts[connections.followUp];
        updateData.followUpDelay = FOLLOW_UP_DELAYS[scriptKey] || 60;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.script.update({
          where: { id: scriptId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ultimate demo flows created successfully",
      flows: [
        { name: "Welcome → First Sale", scripts: 6, description: "New fan to first PPV purchase" },
        { name: "Objection - Price", scripts: 3, description: "Handle price concerns" },
        { name: "Objection - Trust", scripts: 2, description: "Build trust with preview" },
        { name: "Objection - Later", scripts: 2, description: "Handle 'I'll think about it'" },
        { name: "After Purchase", scripts: 3, description: "Thank you + upsell bundle + VIP" },
        { name: "Re-engagement", scripts: 4, description: "Win back cold fans (3d→30d)" },
        { name: "Sexting → PPV", scripts: 3, description: "Convert flirty chat to sale" },
        { name: "Tips", scripts: 3, description: "Request tips with rewards" },
        { name: "VIP Exclusive", scripts: 3, description: "VIP onboarding + retention" },
        { name: "Special Occasions", scripts: 3, description: "Birthday, anniversary, weekend" },
      ],
      totalScripts: totalCreated,
      psychology: [
        "FOMO (Fear of Missing Out)",
        "Scarcity (Limited time/spots)",
        "Social Proof (Others are buying)",
        "Reciprocity (Free preview → purchase)",
        "Emotional Connection (Personal messages)",
        "Value Stacking (Bundle discounts)",
        "Urgency (Deadlines)",
      ],
    });
  } catch (error) {
    console.error("Error seeding flows:", error);
    return NextResponse.json(
      { error: "Failed to seed flows" },
      { status: 500 }
    );
  }
}

// DELETE /api/agency/scripts/seed-flows - Remove demo flows
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { ownerId: true },
    });

    if (!agency || agency.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.script.deleteMany({
      where: {
        agencyId,
        name: { startsWith: "[DEMO]" },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting demo flows:", error);
    return NextResponse.json(
      { error: "Failed to delete demo flows" },
      { status: 500 }
    );
  }
}
