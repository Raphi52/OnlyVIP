import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCryptoPayment, CRYPTO_CURRENCIES } from "@/lib/nowpayments";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe";

// Rate limit: max payments per user per hour
const RATE_LIMIT = {
  maxPayments: 10,
  windowMs: 3600000, // 1 hour
};

// Check rate limit for user
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const recentPayments = await prisma.payment.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT.windowMs) },
    },
  });

  return {
    allowed: recentPayments < RATE_LIMIT.maxPayments,
    remaining: Math.max(0, RATE_LIMIT.maxPayments - recentPayments),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, currency, planId, billingInterval, mediaId, messageId, amount, creatorSlug } = body;

    // Validate currency
    const validCurrency = CRYPTO_CURRENCIES.find(c => c.id === currency);
    if (!validCurrency) {
      return NextResponse.json(
        { error: "Invalid cryptocurrency" },
        { status: 400 }
      );
    }

    let priceAmount: number;
    let orderId: string;
    let orderDescription: string;
    let metadata: Record<string, any>;
    let paymentType: string;

    if (type === "subscription") {
      // Subscription payment
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return NextResponse.json(
          { error: "Invalid plan" },
          { status: 400 }
        );
      }

      priceAmount = billingInterval === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
      orderId = `sub_${session.user.id}_${planId}_${Date.now()}`;
      orderDescription = `${plan.name} Subscription (${billingInterval})`;
      paymentType = "SUBSCRIPTION";
      metadata = {
        type: "subscription",
        userId: session.user.id,
        planId,
        billingInterval,
      };
    } else if (type === "media") {
      // Media purchase
      if (!mediaId) {
        return NextResponse.json(
          { error: "Media ID required" },
          { status: 400 }
        );
      }

      const media = await prisma.mediaContent.findUnique({
        where: { id: mediaId },
      });

      if (!media || !media.isPurchaseable || !media.price) {
        return NextResponse.json(
          { error: "Media not available for purchase" },
          { status: 400 }
        );
      }

      // Check if already purchased
      const existingPurchase = await prisma.mediaPurchase.findUnique({
        where: {
          userId_mediaId: {
            userId: session.user.id,
            mediaId: media.id,
          },
        },
      });

      if (existingPurchase) {
        return NextResponse.json(
          { error: "Already purchased" },
          { status: 400 }
        );
      }

      priceAmount = Number(media.price);
      orderId = `media_${session.user.id}_${mediaId}_${Date.now()}`;
      orderDescription = `Purchase: ${media.title}`;
      paymentType = "MEDIA_PURCHASE";
      metadata = {
        type: "media_purchase",
        userId: session.user.id,
        mediaId,
        creatorSlug: media.creatorSlug,
      };
    } else if (type === "ppv") {
      // PPV message unlock
      if (!messageId || !amount) {
        return NextResponse.json(
          { error: "Message ID and amount required" },
          { status: 400 }
        );
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || !message.isPPV) {
        return NextResponse.json(
          { error: "Message not available for unlock" },
          { status: 400 }
        );
      }

      if (message.ppvUnlockedBy.includes(session.user.id)) {
        return NextResponse.json(
          { error: "Already unlocked" },
          { status: 400 }
        );
      }

      priceAmount = amount;
      orderId = `ppv_${session.user.id}_${messageId}_${Date.now()}`;
      orderDescription = "Unlock PPV Content";
      paymentType = "PPV_UNLOCK";
      metadata = {
        type: "ppv_unlock",
        userId: session.user.id,
        messageId,
        creatorSlug,
      };
    } else if (type === "tip") {
      // Tip payment
      if (!amount || amount < 1) {
        return NextResponse.json(
          { error: "Valid tip amount required" },
          { status: 400 }
        );
      }

      priceAmount = amount;
      orderId = `tip_${session.user.id}_${Date.now()}`;
      orderDescription = "Tip";
      paymentType = "TIP";
      metadata = {
        type: "tip",
        userId: session.user.id,
        messageId: messageId || null,
        creatorSlug,
      };
    } else if (type === "credits") {
      // Credits purchase - ALL crypto credit purchases go through NOWPayments
      if (!amount || amount < 1) {
        return NextResponse.json(
          { error: "Valid amount required" },
          { status: 400 }
        );
      }

      const credits = body.credits || amount * 100; // 100 credits per dollar
      priceAmount = amount;
      orderId = `credits_${session.user.id}_${Date.now()}`;
      orderDescription = `Purchase ${credits.toLocaleString()} credits`;
      paymentType = "CREDITS";
      metadata = {
        type: "credits_purchase",
        userId: session.user.id,
        credits,
        dollarAmount: amount,
      };
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    // Create payment via NOWPayments (secure, verified payments)
    // NOWPayments handles:
    // - Unique deposit addresses per transaction
    // - Blockchain verification
    // - Webhook notifications
    // - Funds consolidation to configured wallet (in NOWPayments dashboard)
    const payment = await createCryptoPayment({
      priceAmount,
      priceCurrency: "usd",
      payCurrency: currency,
      orderId,
      orderDescription,
    });

    // Store pending payment in database with all tracking info
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: session.user.id,
        creatorSlug: creatorSlug || null,
        amount: priceAmount,
        currency: "USD",
        status: "PENDING",
        provider: "NOWPAYMENTS",
        providerTxId: payment.payment_id,
        type: paymentType as any,
        metadata: JSON.stringify({
          ...metadata,
          cryptoCurrency: currency,
          payAmount: payment.pay_amount,
          payAddress: payment.pay_address,
          orderId,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[CRYPTO] Created payment ${paymentRecord.id} for user ${session.user.id}: ${orderDescription}`);

    return NextResponse.json({
      paymentId: payment.payment_id,
      internalId: paymentRecord.id,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      rateLimitRemaining: rateLimit.remaining - 1,
    });
  } catch (error) {
    console.error("Crypto payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
