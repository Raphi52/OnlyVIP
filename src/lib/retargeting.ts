/**
 * Retargeting System - Multi-channel re-engagement
 *
 * Triggers:
 * - dormant_7d: Fan inactive for 7 days
 * - dormant_30d: Fan inactive for 30 days
 * - new_content: New content uploaded
 * - birthday: Fan's birthday
 * - anniversary: Subscription anniversary
 *
 * Channels:
 * - email: Via Resend
 * - in_app: Via Pusher
 */

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getMemoryContext } from "@/lib/memory-extractor";

// Types
export type RetargetingTrigger =
  | "dormant_7d"
  | "dormant_30d"
  | "new_content"
  | "birthday"
  | "anniversary";

export type RetargetingChannel = "email" | "push" | "in_app";

export type RetargetingStatus =
  | "PENDING"
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "CONVERTED"
  | "FAILED";

// Email templates
const EMAIL_TEMPLATES: Record<
  RetargetingTrigger,
  { subject: Record<string, string>; body: Record<string, string> }
> = {
  dormant_7d: {
    subject: {
      en: "{{creatorName}} misses you 💕",
      fr: "{{creatorName}} pense à toi 💕",
    },
    body: {
      en: `Hey {{fanName}}!

It's been a while since we talked... I've been thinking about you 💭

I have some new exclusive content waiting for you. Don't you want to see what I've been up to? 😏

Come back and say hi!

{{creatorName}} 💋

{{ctaButton}}`,
      fr: `Hey {{fanName}}!

Ça fait un moment qu'on ne s'est pas parlé... Je pensais à toi 💭

J'ai du nouveau contenu exclusif qui t'attend. Tu ne veux pas voir ce que je prépare? 😏

Reviens me faire coucou!

{{creatorName}} 💋

{{ctaButton}}`,
    },
  },
  dormant_30d: {
    subject: {
      en: "We need to talk... 🥺",
      fr: "Il faut qu'on parle... 🥺",
    },
    body: {
      en: `{{fanName}}...

It's been too long! Did I do something wrong? 🥺

I've missed our conversations. I've been creating some amazing content and I really want you to see it.

{{discountMessage}}

Come back to me?

{{creatorName}} 💔

{{ctaButton}}`,
      fr: `{{fanName}}...

Ça fait trop longtemps! J'ai fait quelque chose de mal? 🥺

Nos conversations me manquent. J'ai créé du contenu incroyable et je veux vraiment que tu le voies.

{{discountMessage}}

Tu reviens vers moi?

{{creatorName}} 💔

{{ctaButton}}`,
    },
  },
  new_content: {
    subject: {
      en: "🔥 New exclusive content just dropped!",
      fr: "🔥 Nouveau contenu exclusif!",
    },
    body: {
      en: `Hey {{fanName}}!

I just uploaded something special and I thought of you immediately 😏

You're gonna love this one... Trust me 💋

{{ctaButton}}

{{creatorName}}`,
      fr: `Hey {{fanName}}!

Je viens de poster quelque chose de spécial et j'ai tout de suite pensé à toi 😏

Tu vas adorer... Fais-moi confiance 💋

{{ctaButton}}

{{creatorName}}`,
    },
  },
  birthday: {
    subject: {
      en: "Happy Birthday! 🎂 I have something special for you",
      fr: "Joyeux anniversaire! 🎂 J'ai quelque chose de spécial pour toi",
    },
    body: {
      en: `Happy Birthday {{fanName}}! 🎉

Today is YOUR day and I wanted to make it special...

I have a birthday surprise waiting for you 🎁

{{discountMessage}}

Enjoy your special day!

{{creatorName}} 💕

{{ctaButton}}`,
      fr: `Joyeux anniversaire {{fanName}}! 🎉

Aujourd'hui c'est TON jour et je voulais le rendre spécial...

J'ai une surprise d'anniversaire qui t'attend 🎁

{{discountMessage}}

Profite bien de ta journée!

{{creatorName}} 💕

{{ctaButton}}`,
    },
  },
  anniversary: {
    subject: {
      en: "It's our anniversary! 💕",
      fr: "C'est notre anniversaire! 💕",
    },
    body: {
      en: `Hey {{fanName}}!

Can you believe it's been a year since we started talking? 💕

Thank you for being such an amazing supporter. To celebrate, I have something special for you...

{{discountMessage}}

Here's to many more!

{{creatorName}} 💋

{{ctaButton}}`,
      fr: `Hey {{fanName}}!

Tu te rends compte que ça fait un an qu'on se parle? 💕

Merci d'être un fan aussi incroyable. Pour fêter ça, j'ai quelque chose de spécial pour toi...

{{discountMessage}}

À notre prochaine année!

{{creatorName}} 💋

{{ctaButton}}`,
    },
  },
};

// Initialize Resend
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Create a retargeting campaign
 */
export async function createCampaign(
  fanUserId: string,
  creatorSlug: string,
  trigger: RetargetingTrigger,
  options: {
    channel?: RetargetingChannel;
    discountCode?: string;
    flashSaleId?: string;
    customContent?: string;
  } = {}
): Promise<string | null> {
  const {
    channel = "email",
    discountCode,
    flashSaleId,
    customContent,
  } = options;

  // Check if campaign already exists for this trigger (within cooldown)
  const cooldownDays = trigger === "dormant_7d" ? 7 : trigger === "dormant_30d" ? 30 : 1;
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

  const existingCampaign = await prisma.retargetingCampaign.findFirst({
    where: {
      fanUserId,
      creatorSlug,
      triggerType: trigger,
      createdAt: { gt: cooldownDate },
    },
  });

  if (existingCampaign) {
    return null; // Already sent recently
  }

  // Get fan and creator info
  const [user, creator] = await Promise.all([
    prisma.user.findUnique({ where: { id: fanUserId } }),
    prisma.creator.findUnique({ where: { slug: creatorSlug } }),
  ]);

  if (!user?.email || !creator) return null;

  // Get fan's language from memory
  const memory = await getMemoryContext(fanUserId, creatorSlug);
  const fanProfile = await prisma.fanProfile.findUnique({
    where: { fanUserId_creatorSlug: { fanUserId, creatorSlug } },
  });

  const language = fanProfile?.language || "en";

  // Generate content
  const template = EMAIL_TEMPLATES[trigger];
  const subject = template.subject[language] || template.subject["en"];
  let content = customContent || template.body[language] || template.body["en"];

  // Replace variables
  const variables: Record<string, string> = {
    fanName: memory?.name || user.name || "babe",
    creatorName: creator.displayName || creator.name,
    ctaButton: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/${creatorSlug}" style="display:inline-block;padding:12px 24px;background:#ff4d8d;color:white;text-decoration:none;border-radius:8px;">View Content 💕</a>`,
    discountMessage: discountCode
      ? `Use code ${discountCode} for a special discount! 🎁`
      : "",
  };

  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  const finalSubject = subject
    .replace("{{creatorName}}", variables.creatorName)
    .replace("{{fanName}}", variables.fanName);

  // Create campaign
  const campaign = await prisma.retargetingCampaign.create({
    data: {
      fanUserId,
      creatorSlug,
      triggerType: trigger,
      channel,
      subject: finalSubject,
      content,
      discountCodeId: discountCode,
      flashSaleId,
      status: "PENDING",
    },
  });

  return campaign.id;
}

/**
 * Send pending email campaigns
 */
export async function sendPendingCampaigns(limit: number = 50): Promise<number> {
  const resend = getResendClient();
  if (!resend) {
    console.error("Resend client not configured");
    return 0;
  }

  const pendingCampaigns = await prisma.retargetingCampaign.findMany({
    where: {
      status: "PENDING",
      channel: "email",
    },
    take: limit,
  });

  let sentCount = 0;

  for (const campaign of pendingCampaigns) {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: campaign.fanUserId },
      });

      if (!user?.email) {
        await prisma.retargetingCampaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED", error: "No email" },
        });
        continue;
      }

      // Get creator for from name
      const creator = await prisma.creator.findUnique({
        where: { slug: campaign.creatorSlug },
      });

      // Send email
      await resend.emails.send({
        from: `${creator?.displayName || "VipOnly"} <noreply@${process.env.RESEND_DOMAIN || "viponly.io"}>`,
        to: user.email,
        subject: campaign.subject || "You have a new message 💕",
        html: campaign.content,
      });

      await prisma.retargetingCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send campaign ${campaign.id}:`, error);
      await prisma.retargetingCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  return sentCount;
}

/**
 * Find dormant fans and create campaigns
 */
export async function createDormantCampaigns(
  creatorSlug: string,
  options: {
    dormantDays?: number;
    limit?: number;
    includeDiscount?: boolean;
  } = {}
): Promise<number> {
  const { dormantDays = 7, limit = 100, includeDiscount = false } = options;

  const trigger: RetargetingTrigger =
    dormantDays >= 30 ? "dormant_30d" : "dormant_7d";

  const dormantDate = new Date();
  dormantDate.setDate(dormantDate.getDate() - dormantDays);

  // Find dormant fans
  const dormantFans = await prisma.fanProfile.findMany({
    where: {
      creatorSlug,
      lastSeen: { lt: dormantDate },
      // Exclude AI-only fans
      aiOnlyMode: false,
      // Only fans who have shown some value
      OR: [
        { spendingTier: { in: ["whale", "regular"] } },
        { totalSpent: { gt: 0 } },
      ],
    },
    take: limit,
  });

  let created = 0;

  for (const fan of dormantFans) {
    // Generate discount for 30-day dormant
    let discountCode: string | undefined;
    if (includeDiscount && dormantDays >= 30) {
      // Create a comeback discount
      const code = `COMEBACK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await prisma.discountCode.create({
        data: {
          code,
          creatorSlug,
          discountType: "percent",
          discountValue: 25,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          fanUserId: fan.fanUserId,
          sourceType: "retargeting",
          maxUses: 1,
          isActive: true,
        },
      });
      discountCode = code;
    }

    const campaignId = await createCampaign(fan.fanUserId, creatorSlug, trigger, {
      discountCode,
    });

    if (campaignId) created++;
  }

  return created;
}

/**
 * Create birthday campaigns
 */
export async function createBirthdayCampaigns(): Promise<number> {
  // Find fans with birthday today
  const today = new Date();
  const monthDay = `${today.getMonth() + 1}/${today.getDate()}`;

  // Find memories with birthday key
  const birthdayMemories = await prisma.fanMemory.findMany({
    where: {
      key: "birthday",
      isActive: true,
      value: { contains: monthDay },
    },
  });

  let created = 0;

  for (const memory of birthdayMemories) {
    // Create birthday discount
    const code = `BDAY${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await prisma.discountCode.create({
      data: {
        code,
        creatorSlug: memory.creatorSlug,
        discountType: "percent",
        discountValue: 30,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        fanUserId: memory.fanUserId,
        sourceType: "retargeting",
        maxUses: 1,
        isActive: true,
      },
    });

    const campaignId = await createCampaign(
      memory.fanUserId,
      memory.creatorSlug,
      "birthday",
      { discountCode: code }
    );

    if (campaignId) created++;
  }

  return created;
}

/**
 * Create new content notifications
 */
export async function notifyNewContent(
  creatorSlug: string,
  mediaId: string,
  options: {
    targetTiers?: string[];
    limit?: number;
  } = {}
): Promise<number> {
  const { targetTiers = ["whale", "regular"], limit = 500 } = options;

  // Find interested fans
  const fans = await prisma.fanProfile.findMany({
    where: {
      creatorSlug,
      spendingTier: { in: targetTiers },
      aiOnlyMode: false,
    },
    take: limit,
  });

  let created = 0;

  for (const fan of fans) {
    const campaignId = await createCampaign(fan.fanUserId, creatorSlug, "new_content", {
      channel: "email",
    });

    if (campaignId) created++;
  }

  return created;
}

/**
 * Track email open
 */
export async function trackOpen(campaignId: string): Promise<void> {
  await prisma.retargetingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "OPENED",
      openedAt: new Date(),
    },
  });
}

/**
 * Track email click
 */
export async function trackClick(campaignId: string): Promise<void> {
  await prisma.retargetingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "CLICKED",
      clickedAt: new Date(),
    },
  });
}

/**
 * Track conversion
 */
export async function trackConversion(
  campaignId: string,
  revenue: number
): Promise<void> {
  await prisma.retargetingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      revenueGenerated: revenue,
    },
  });
}

/**
 * Get retargeting statistics
 */
export async function getRetargetingStats(
  creatorSlug: string,
  days: number = 30
): Promise<{
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  totalRevenue: number;
  byTrigger: Record<RetargetingTrigger, { count: number; converted: number }>;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const campaigns = await prisma.retargetingCampaign.findMany({
    where: {
      creatorSlug,
      createdAt: { gte: since },
    },
  });

  const sent = campaigns.filter((c) =>
    ["SENT", "OPENED", "CLICKED", "CONVERTED"].includes(c.status)
  );
  const opened = campaigns.filter((c) =>
    ["OPENED", "CLICKED", "CONVERTED"].includes(c.status)
  );
  const clicked = campaigns.filter((c) =>
    ["CLICKED", "CONVERTED"].includes(c.status)
  );
  const converted = campaigns.filter((c) => c.status === "CONVERTED");

  const totalRevenue = converted.reduce(
    (sum, c) => sum + (c.revenueGenerated || 0),
    0
  );

  const byTrigger: Record<RetargetingTrigger, { count: number; converted: number }> = {
    dormant_7d: { count: 0, converted: 0 },
    dormant_30d: { count: 0, converted: 0 },
    new_content: { count: 0, converted: 0 },
    birthday: { count: 0, converted: 0 },
    anniversary: { count: 0, converted: 0 },
  };

  for (const c of campaigns) {
    const trigger = c.triggerType as RetargetingTrigger;
    if (byTrigger[trigger]) {
      byTrigger[trigger].count++;
      if (c.status === "CONVERTED") {
        byTrigger[trigger].converted++;
      }
    }
  }

  return {
    total: campaigns.length,
    sent: sent.length,
    opened: opened.length,
    clicked: clicked.length,
    converted: converted.length,
    openRate: sent.length > 0 ? opened.length / sent.length : 0,
    clickRate: opened.length > 0 ? clicked.length / opened.length : 0,
    conversionRate: sent.length > 0 ? converted.length / sent.length : 0,
    totalRevenue,
    byTrigger,
  };
}
