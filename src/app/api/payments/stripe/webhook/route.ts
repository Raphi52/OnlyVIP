import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, verifyWebhookSignature } from "@/lib/stripe";
import { sendToAccounting } from "@/lib/crypto-accounting";
import { calculateFees } from "@/lib/fees";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) return;

  const { userId, type } = metadata;

  if (type === "subscription") {
    // Subscription is handled by subscription.created event
    return;
  }

  if (type === "media_purchase") {
    const { mediaId } = metadata;

    // Create media purchase record
    await prisma.mediaPurchase.create({
      data: {
        userId,
        mediaId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        provider: "STRIPE",
        providerTxId: session.payment_intent as string,
        status: "COMPLETED",
      },
    });

    // Calculate platform fee
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const { platformFee, netAmount } = calculateFees(amount);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        platformFee,
        netAmount,
        currency: session.currency?.toUpperCase() || "USD",
        status: "COMPLETED",
        provider: "STRIPE",
        providerTxId: session.payment_intent as string,
        type: "MEDIA_PURCHASE",
        metadata: JSON.stringify({ mediaId }),
      },
    });

    // Send to accounting
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendToAccounting({
      externalId: payment.id,
      amountUsd: payment.amount,
      amountCrypto: payment.amount,
      cryptoCurrency: payment.currency,
      productType: "MEDIA_PURCHASE",
      productName: mediaId,
      status: "COMPLETED",
      paymentDate: payment.createdAt.toISOString(),
      userEmail: user?.email,
      userId: userId,
      metadata: { mediaId, provider: "STRIPE", platformFee, netAmount },
    });
  }

  if (type === "ppv_unlock") {
    const { messageId } = metadata;

    // Get current message to update unlocked list
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (message) {
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
    }

    // Calculate platform fee
    const ppvAmount = session.amount_total ? session.amount_total / 100 : 0;
    const ppvFees = calculateFees(ppvAmount);

    // Create message payment record
    await prisma.messagePayment.create({
      data: {
        messageId,
        userId,
        type: "PPV_UNLOCK",
        amount: ppvAmount,
        status: "COMPLETED",
        provider: "STRIPE",
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: ppvAmount,
        platformFee: ppvFees.platformFee,
        netAmount: ppvFees.netAmount,
        currency: session.currency?.toUpperCase() || "USD",
        status: "COMPLETED",
        provider: "STRIPE",
        providerTxId: session.payment_intent as string,
        type: "PPV_UNLOCK",
        metadata: JSON.stringify({ messageId }),
      },
    });

    // Send to accounting
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendToAccounting({
      externalId: payment.id,
      amountUsd: payment.amount,
      amountCrypto: payment.amount,
      cryptoCurrency: payment.currency,
      productType: "PPV_UNLOCK",
      productName: messageId,
      status: "COMPLETED",
      paymentDate: payment.createdAt.toISOString(),
      userEmail: user?.email,
      userId: userId,
      metadata: { messageId, provider: "STRIPE", platformFee: ppvFees.platformFee, netAmount: ppvFees.netAmount },
    });
  }

  if (type === "tip") {
    const { messageId, recipientId } = metadata;

    // Calculate platform fee
    const tipAmount = session.amount_total ? session.amount_total / 100 : 0;
    const tipFees = calculateFees(tipAmount);

    // Create message payment record if message-specific
    if (messageId) {
      await prisma.messagePayment.create({
        data: {
          messageId,
          userId,
          type: "TIP",
          amount: tipAmount,
          status: "COMPLETED",
          provider: "STRIPE",
        },
      });

      // Update tip amount on message
      await prisma.message.update({
        where: { id: messageId },
        data: {
          totalTips: {
            increment: tipAmount,
          },
        },
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: tipAmount,
        platformFee: tipFees.platformFee,
        netAmount: tipFees.netAmount,
        currency: session.currency?.toUpperCase() || "USD",
        status: "COMPLETED",
        provider: "STRIPE",
        providerTxId: session.payment_intent as string,
        type: "TIP",
        metadata: JSON.stringify({ messageId, recipientId }),
      },
    });

    // Send to accounting
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendToAccounting({
      externalId: payment.id,
      amountUsd: payment.amount,
      amountCrypto: payment.amount,
      cryptoCurrency: payment.currency,
      productType: "TIP",
      status: "COMPLETED",
      paymentDate: payment.createdAt.toISOString(),
      userEmail: user?.email,
      userId: userId,
      metadata: { messageId, recipientId, provider: "STRIPE", platformFee: tipFees.platformFee, netAmount: tipFees.netAmount },
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  if (!metadata?.userId) return;

  const { userId, planId, billingInterval, creatorSlug } = metadata;

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    trialing: "ACTIVE",
  };

  const status = statusMap[subscription.status] || "PENDING";

  // Find subscription plan
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { name: planId },
  });

  if (!plan) {
    console.error(`Subscription plan not found: ${planId}`);
    return;
  }

  // Get subscription period dates (handle different Stripe API versions)
  const subData = subscription as any;
  const periodStart = subData.current_period_start || subData.currentPeriodStart;
  const periodEnd = subData.current_period_end || subData.currentPeriodEnd;

  // Check if this is a NEW subscription (not an update)
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  const isNewSubscription = !existingSubscription && status === "ACTIVE";

  // Upsert subscription
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    create: {
      userId,
      planId: plan.id,
      creatorSlug: creatorSlug || undefined,
      status: status as any,
      stripeSubscriptionId: subscription.id,
      paymentProvider: "STRIPE",
      billingInterval: billingInterval as any,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    },
    update: {
      status: status as any,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    },
  });

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

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription;
  const customerId = invoiceData.customer;

  if (!subscriptionId || !customerId) return;

  const customerIdStr = typeof customerId === "string"
    ? customerId
    : customerId.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerIdStr },
  });

  if (!user) return;

  // Calculate platform fee
  const subAmount = (invoiceData.amount_paid || 0) / 100;
  const subFees = calculateFees(subAmount);

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      amount: subAmount,
      platformFee: subFees.platformFee,
      netAmount: subFees.netAmount,
      currency: (invoiceData.currency || "usd").toUpperCase(),
      status: "COMPLETED",
      provider: "STRIPE",
      providerTxId: invoiceData.payment_intent as string,
      type: "SUBSCRIPTION",
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        subscriptionId: subscriptionId,
      }),
    },
  });

  // Send to accounting
  await sendToAccounting({
    externalId: payment.id,
    amountUsd: payment.amount,
    amountCrypto: payment.amount,
    cryptoCurrency: payment.currency,
    productType: "SUBSCRIPTION",
    status: "COMPLETED",
    paymentDate: payment.createdAt.toISOString(),
    userEmail: user.email,
    userId: user.id,
    metadata: { invoiceId: invoice.id, subscriptionId, provider: "STRIPE", platformFee: subFees.platformFee, netAmount: subFees.netAmount },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription;

  if (!subscriptionId) return;

  // Update subscription status
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId as string,
    },
    data: {
      status: "PAST_DUE",
    },
  });
}
