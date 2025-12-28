import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "VipOnly <noreply@viponly.fun>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://viponly.fun";
const APP_NAME = "VipOnly";

// ============= EMAIL TEMPLATES =============

function getBaseStyles() {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 16px; padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h1 { color: #ffffff; font-size: 24px; margin: 0 0 20px 0; }
    p { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000000 !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .button-container { text-align: center; margin: 30px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; }
    .footer p { color: #666; font-size: 14px; }
    .highlight { color: #FFD700; }
    .amount { font-size: 32px; font-weight: bold; color: #FFD700; text-align: center; margin: 20px 0; }
    .details { background: #1a1a1a; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }
    .details-row:last-child { border-bottom: none; }
    .details-label { color: #888; }
    .details-value { color: #fff; font-weight: 500; }
  `;
}

function emailTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">${APP_NAME}</span>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ============= EMAIL FUNCTIONS =============

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;

  const html = emailTemplate(`
    <h1>Verify your email</h1>
    <p>Hi ${name || "there"},</p>
    <p>Thanks for signing up for ${APP_NAME}! Please verify your email address to complete your registration.</p>
    <div class="button-container">
      <a href="${verifyUrl}" class="button">Verify Email</a>
    </div>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #FFD700;">${verifyUrl}</p>
    <p>This link will expire in 24 hours.</p>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Verify your ${APP_NAME} account`,
      html,
    });

    console.log("[Email] Verification email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send verification email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = emailTemplate(`
    <h1>Welcome to ${APP_NAME}! 🎉</h1>
    <p>Hi ${name || "there"},</p>
    <p>Your email has been verified and your account is now active. You're ready to explore exclusive content from your favorite creators!</p>
    <div class="button-container">
      <a href="${APP_URL}/creators" class="button">Explore Creators</a>
    </div>
    <p>If you have any questions, feel free to reply to this email.</p>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html,
    });

    console.log("[Email] Welcome email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = emailTemplate(`
    <h1>Reset your password</h1>
    <p>Hi ${name || "there"},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #FFD700;">${resetUrl}</p>
    <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html,
    });

    console.log("[Email] Password reset email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  details: {
    type: "subscription" | "purchase" | "tip";
    amount: number;
    currency: string;
    creatorName: string;
    planName?: string;
    itemName?: string;
  }
) {
  const typeLabels = {
    subscription: "Subscription",
    purchase: "Purchase",
    tip: "Tip",
  };

  const description =
    details.type === "subscription"
      ? `${details.planName} subscription to ${details.creatorName}`
      : details.type === "purchase"
      ? `${details.itemName} from ${details.creatorName}`
      : `Tip to ${details.creatorName}`;

  const html = emailTemplate(`
    <h1>Payment Confirmed ✓</h1>
    <p>Hi ${name || "there"},</p>
    <p>Thank you for your payment! Here are the details:</p>
    <div class="amount">$${details.amount.toFixed(2)} ${details.currency}</div>
    <div class="details">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #888; padding: 10px 0;">Type</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">${typeLabels[details.type]}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Description</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">${description}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Creator</td>
          <td style="color: #FFD700; text-align: right; padding: 10px 0;">${details.creatorName}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Date</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    <div class="button-container">
      <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
    </div>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Payment confirmed - $${details.amount.toFixed(2)} ${details.currency}`,
      html,
    });

    console.log("[Email] Payment confirmation sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send payment confirmation:", error);
    return { success: false, error };
  }
}

export async function sendSubscriptionRenewalEmail(
  email: string,
  name: string,
  details: {
    creatorName: string;
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: Date;
  }
) {
  const html = emailTemplate(`
    <h1>Subscription Renewed</h1>
    <p>Hi ${name || "there"},</p>
    <p>Your subscription has been successfully renewed.</p>
    <div class="details">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #888; padding: 10px 0;">Creator</td>
          <td style="color: #FFD700; text-align: right; padding: 10px 0;">${details.creatorName}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Plan</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">${details.planName}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Amount</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">$${details.amount.toFixed(2)} ${details.currency}</td>
        </tr>
        <tr>
          <td style="color: #888; padding: 10px 0;">Next billing</td>
          <td style="color: #fff; text-align: right; padding: 10px 0;">${details.nextBillingDate.toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
    <div class="button-container">
      <a href="${APP_URL}/dashboard/subscription" class="button">Manage Subscription</a>
    </div>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Subscription renewed - ${details.creatorName}`,
      html,
    });

    console.log("[Email] Subscription renewal email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send renewal email:", error);
    return { success: false, error };
  }
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string,
  details: {
    creatorName: string;
    planName: string;
    expiresAt: Date;
  }
) {
  const html = emailTemplate(`
    <h1>Subscription Cancelled</h1>
    <p>Hi ${name || "there"},</p>
    <p>Your subscription to <span class="highlight">${details.creatorName}</span> has been cancelled.</p>
    <p>You'll continue to have access until <strong>${details.expiresAt.toLocaleDateString()}</strong>.</p>
    <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
    <div class="button-container">
      <a href="${APP_URL}/creators" class="button">Explore Other Creators</a>
    </div>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Subscription cancelled - ${details.creatorName}`,
      html,
    });

    console.log("[Email] Subscription cancelled email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send cancellation email:", error);
    return { success: false, error };
  }
}

export async function sendFollowWelcomeEmail(
  email: string,
  name: string,
  details: {
    creatorName: string;
    creatorSlug: string;
    creatorAvatar?: string | null;
  }
) {
  const html = emailTemplate(`
    <h1>You're now following ${details.creatorName}! 💫</h1>
    <p>Hi ${name || "there"},</p>
    <p>Thanks for following <span class="highlight">${details.creatorName}</span> on ${APP_NAME}!</p>
    <p>You'll receive notifications when they post new exclusive content. Want to unlock everything?</p>
    <div class="button-container">
      <a href="${APP_URL}/${details.creatorSlug}/membership" class="button">🔓 Upgrade to VIP</a>
    </div>
    <p style="text-align: center; margin-top: 20px;">
      <a href="${APP_URL}/${details.creatorSlug}" style="color: #FFD700; text-decoration: none;">View ${details.creatorName}'s Profile →</a>
    </p>
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You're now following ${details.creatorName} on ${APP_NAME}!`,
      html,
    });

    console.log("[Email] Follow welcome email sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send follow welcome email:", error);
    return { success: false, error };
  }
}

export async function sendNewContentNotification(
  email: string,
  name: string,
  details: {
    creatorName: string;
    creatorSlug: string;
    contentTitle: string;
    contentType: string;
    thumbnailUrl?: string | null;
    isVipOnly: boolean;
  }
) {
  const contentTypeLabel = details.contentType === "VIDEO" ? "video" : "photo";
  const accessLabel = details.isVipOnly ? "🔒 VIP Exclusive" : "✨ New Content";

  const html = emailTemplate(`
    <h1>${details.creatorName} just posted! 🔥</h1>
    <p>Hi ${name || "there"},</p>
    <p><span class="highlight">${details.creatorName}</span> just shared a new ${contentTypeLabel}:</p>
    <div class="details" style="text-align: center;">
      ${details.thumbnailUrl ? `<img src="${APP_URL}${details.thumbnailUrl}" alt="${details.contentTitle}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;" />` : ''}
      <p style="font-size: 18px; color: #fff; font-weight: bold; margin: 10px 0;">${details.contentTitle}</p>
      <p style="color: ${details.isVipOnly ? '#FFD700' : '#4ade80'};">${accessLabel}</p>
    </div>
    <div class="button-container">
      <a href="${APP_URL}/${details.creatorSlug}/gallery" class="button">View Now</a>
    </div>
    ${details.isVipOnly ? `
    <p style="text-align: center; color: #888; font-size: 14px; margin-top: 15px;">
      This is VIP-only content. <a href="${APP_URL}/${details.creatorSlug}/membership" style="color: #FFD700;">Upgrade to access</a>
    </p>
    ` : ''}
  `);

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🔥 ${details.creatorName} just posted new content!`,
      html,
    });

    console.log("[Email] New content notification sent to:", email);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[Email] Failed to send content notification:", error);
    return { success: false, error };
  }
}

// Batch send to multiple followers
export async function notifyFollowersOfNewContent(
  creatorSlug: string,
  contentDetails: {
    title: string;
    type: string;
    thumbnailUrl?: string | null;
    accessTier: string;
  },
  prismaClient: any
) {
  try {
    // Get creator info
    const creator = await prismaClient.creator.findUnique({
      where: { slug: creatorSlug },
      select: { displayName: true, slug: true },
    });

    if (!creator) {
      console.log("[Email] Creator not found:", creatorSlug);
      return { success: false, error: "Creator not found" };
    }

    // Get all non-blocked followers
    const followers = await prismaClient.creatorMember.findMany({
      where: {
        creatorSlug,
        isBlocked: false,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Email] Notifying ${followers.length} followers of new content`);

    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    let sent = 0;

    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (follower: any) => {
          if (follower.user?.email) {
            await sendNewContentNotification(
              follower.user.email,
              follower.user.name || "",
              {
                creatorName: creator.displayName,
                creatorSlug: creator.slug,
                contentTitle: contentDetails.title,
                contentType: contentDetails.type,
                thumbnailUrl: contentDetails.thumbnailUrl,
                isVipOnly: contentDetails.accessTier !== "FREE",
              }
            );
            sent++;
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < followers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[Email] Sent ${sent} notifications for new content`);
    return { success: true, sent };
  } catch (error) {
    console.error("[Email] Failed to notify followers:", error);
    return { success: false, error };
  }
}
