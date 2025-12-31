import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, mapPaymentStatus } from "@/lib/nowpayments";
import { sendToAccounting, mapCryptoCurrency, mapPaymentStatus as mapAccountingStatus } from "@/lib/crypto-accounting";
import { addCredits } from "@/lib/credits";

interface IPNPayload {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: IPNPayload = await request.json();
    const headersList = await headers();
    const signature = headersList.get("x-nowpayments-sig");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const paymentStatus = mapPaymentStatus(body.payment_status);
    const paymentId = String(body.payment_id);

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: { providerTxId: paymentId },
    });

    if (!payment) {
      console.error(`Payment not found: ${paymentId}`);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Security: Verify payment hasn't already been processed
    if (payment.status === "COMPLETED") {
      console.log(`[WEBHOOK] Payment ${paymentId} already completed, skipping`);
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // Security: Verify payment amount matches (with 1% tolerance)
    const expectedAmount = Number(payment.amount);
    const actualAmount = body.price_amount;
    const tolerance = expectedAmount * 0.01;
    if (actualAmount < expectedAmount - tolerance) {
      console.error(`[WEBHOOK] Payment amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
      // Still update status but don't fulfill order
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || "{}"),
            error: "Amount mismatch",
            expectedAmount,
            actualAmount,
          }),
        },
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Update payment status
    const existingMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus as any,
        metadata: JSON.stringify({
          ...existingMetadata,
          actuallyPaid: body.actually_paid,
          outcomeAmount: body.outcome_amount,
          lastUpdated: new Date().toISOString(),
        }),
      },
    });

    // Get user email for accounting
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { email: true },
    });

    // Send to accounting system
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    await sendToAccounting({
      externalId: payment.id,
      amountUsd: Number(payment.amount),
      amountCrypto: body.pay_amount,
      cryptoCurrency: mapCryptoCurrency(body.pay_currency),
      productType: payment.type,
      productName: metadata.planId || metadata.mediaId || undefined,
      status: mapAccountingStatus(body.payment_status),
      paymentDate: payment.createdAt.toISOString(),
      userEmail: user?.email,
      userId: payment.userId,
      walletAddress: body.pay_address,
      exchangeRate: body.pay_amount > 0 ? body.price_amount / body.pay_amount : 0,
      nowPaymentsId: String(body.payment_id),
      actuallyPaid: body.actually_paid,
      metadata: metadata,
    });

    // If payment completed, process the order
    if (paymentStatus === "COMPLETED") {
      const parsedMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};

      switch (payment.type) {
        case "SUBSCRIPTION":
          await handleSubscriptionPayment(payment.userId, parsedMetadata);
          break;
        case "MEDIA_PURCHASE":
          await handleMediaPurchase(payment.userId, parsedMetadata, payment.amount);
          break;
        case "PPV_UNLOCK":
          await handlePPVUnlock(payment.userId, parsedMetadata, payment.amount);
          break;
        case "TIP":
          await handleTip(payment.userId, parsedMetadata, payment.amount);
          break;
        case "CREDITS":
          await handleCreditsPayment(payment.userId, parsedMetadata, payment.id);
          break;
      }

      console.log(`[WEBHOOK] Successfully processed ${payment.type} payment ${payment.id} for user ${payment.userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Crypto webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionPayment(
  userId: string,
  metadata: Record<string, any>
) {
  const { planId, billingInterval, creatorSlug } = metadata;

  // Find subscription plan
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { name: planId },
  });

  if (!plan) {
    console.error(`Subscription plan not found: ${planId}`);
    return;
  }

  // Calculate period dates
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingInterval === "ANNUAL") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Check if this is a NEW subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      planId: plan.id,
      paymentProvider: "NOWPAYMENTS",
    },
  });

  const isNewSubscription = !existingSubscription;

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        creatorSlug: creatorSlug || null,
        status: "ACTIVE",
        paymentProvider: "NOWPAYMENTS",
        billingInterval: billingInterval as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  // Send welcome message for new subscriptions
  if (isNewSubscription && creatorSlug) {
    await sendWelcomeMessage(userId, creatorSlug);
  }
}

// Send welcome message to new subscriber
async function sendWelcomeMessage(userId: string, creatorSlug: string) {
  try {
    // Get site settings with welcome message
    const settings = await prisma.siteSettings.findFirst({
      where: { creatorSlug },
    });

    if (!settings?.welcomeMessage || !settings.welcomeMessage.trim()) {
      return; // No welcome message configured
    }

    // Get creator user ID
    const creator = await prisma.creator.findFirst({
      where: { slug: creatorSlug },
    });

    if (!creator?.userId) {
      console.error(`Creator not found for slug: ${creatorSlug}`);
      return;
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        creatorSlug,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: creator.userId } } },
        ],
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          creatorSlug,
          participants: {
            create: [
              { userId },
              { userId: creator.userId },
            ],
          },
        },
      });
    }

    // Send welcome message from creator
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: creator.userId,
        receiverId: userId,
        text: settings.welcomeMessage,
        isRead: false,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    console.log(`Welcome message sent to user ${userId} from creator ${creatorSlug}`);
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
}

async function handleMediaPurchase(
  userId: string,
  metadata: Record<string, any>,
  amount: number | any
) {
  const { mediaId } = metadata;

  // Check if already purchased
  const existingPurchase = await prisma.mediaPurchase.findUnique({
    where: {
      userId_mediaId: {
        userId,
        mediaId,
      },
    },
  });

  if (existingPurchase) {
    return; // Already purchased
  }

  // Create purchase record
  await prisma.mediaPurchase.create({
    data: {
      userId,
      mediaId,
      amount: Number(amount),
      provider: "NOWPAYMENTS",
      providerTxId: `crypto_${Date.now()}`,
      status: "COMPLETED",
    },
  });
}

async function handlePPVUnlock(
  userId: string,
  metadata: Record<string, any>,
  amount: number | any
) {
  const { messageId } = metadata;

  // Get current message to update unlocked list
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) return;

  // Parse and update the unlocked list
  const unlockedBy = JSON.parse(message.ppvUnlockedBy || "[]");
  if (!unlockedBy.includes(userId)) {
    unlockedBy.push(userId);
  }

  // Add user to unlocked list
  await prisma.message.update({
    where: { id: messageId },
    data: {
      ppvUnlockedBy: JSON.stringify(unlockedBy),
    },
  });

  // Create message payment record
  await prisma.messagePayment.create({
    data: {
      messageId,
      userId,
      type: "PPV_UNLOCK",
      amount: Number(amount),
      status: "COMPLETED",
      provider: "NOWPAYMENTS",
    },
  });
}

async function handleTip(
  userId: string,
  metadata: Record<string, any>,
  amount: number | any
) {
  const { messageId } = metadata;

  if (messageId) {
    // Create message payment record
    await prisma.messagePayment.create({
      data: {
        messageId,
        userId,
        type: "TIP",
        amount: Number(amount),
        status: "COMPLETED",
        provider: "NOWPAYMENTS",
      },
    });

    // Update tip amount on message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        totalTips: {
          increment: Number(amount),
        },
      },
    });
  }
}

// Calculate bonus credits based on purchase amount
function calculateBonusCredits(dollarAmount: number): { paidCredits: number; bonusCredits: number } {
  const paidCredits = Math.floor(dollarAmount * 100);

  let bonusPercent = 0;
  if (dollarAmount >= 100) bonusPercent = 30;      // 3000 bonus for $100
  else if (dollarAmount >= 50) bonusPercent = 25;  // 1250 bonus for $50
  else if (dollarAmount >= 25) bonusPercent = 20;  // 500 bonus for $25
  else if (dollarAmount >= 10) bonusPercent = 15;  // 150 bonus for $10
  else if (dollarAmount >= 5) bonusPercent = 10;   // 50 bonus for $5

  const bonusCredits = Math.floor(paidCredits * (bonusPercent / 100));

  return { paidCredits, bonusCredits };
}

// Handle credits purchase - INSTANT attribution upon payment confirmation
async function handleCreditsPayment(
  userId: string,
  metadata: Record<string, any>,
  paymentId: string
) {
  const dollarAmount = metadata.dollarAmount || 0;

  // Calculate paid + bonus credits
  const { paidCredits, bonusCredits } = calculateBonusCredits(dollarAmount);

  if (paidCredits <= 0) {
    console.error(`[CREDITS] Invalid credit amount for payment ${paymentId}`);
    return;
  }

  // Add PAID credits to user account (usable everywhere)
  const paidResult = await addCredits(
    userId,
    paidCredits,
    "PURCHASE",
    {
      creditType: "PAID",
      description: `Crypto purchase - ${paidCredits} credits for $${dollarAmount}`,
    }
  );

  let totalBalance = paidResult.newBalance;

  // Add BONUS credits if any (PPV catalog only)
  if (bonusCredits > 0) {
    const bonusResult = await addCredits(
      userId,
      bonusCredits,
      "PURCHASE_BONUS",
      {
        creditType: "BONUS",
        description: `Bonus ${bonusCredits} credits (PPV catalog only)`,
      }
    );
    totalBalance = bonusResult.newBalance;
    console.log(`[CREDITS] Added ${bonusCredits} BONUS credits to user ${userId}`);
  }

  console.log(`[CREDITS] Added ${paidCredits} paid + ${bonusCredits} bonus credits to user ${userId}. Balance: ${totalBalance}`);

  // Update user's credit balance in user table for quick access
  await prisma.user.update({
    where: { id: userId },
    data: {
      creditBalance: totalBalance,
    },
  });
}
