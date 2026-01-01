import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePayGateCallback } from "@/lib/paygate";
import { addCredits } from "@/lib/credits";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const nonce = searchParams.get("nonce");
    const txidOut = searchParams.get("txid_out");
    const valueCoin = searchParams.get("value_coin");

    console.log(`[PAYGATE WEBHOOK] Received callback - orderId: ${orderId}, txid: ${txidOut}, value: ${valueCoin}`);

    if (!orderId || !nonce) {
      return NextResponse.json(
        { error: "Missing order_id or nonce" },
        { status: 400 }
      );
    }

    // Find the payment by tracking address (providerTxId contains tracking address)
    const payment = await prisma.payment.findFirst({
      where: {
        provider: "PAYGATE",
        status: "PENDING",
        metadata: {
          contains: orderId,
        },
      },
    });

    if (!payment) {
      console.error(`[PAYGATE WEBHOOK] Payment not found for orderId: ${orderId}`);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const metadata = JSON.parse(payment.metadata as string || "{}");

    // Validate the callback
    const validation = validatePayGateCallback({
      orderId,
      nonce,
      txidOut: txidOut || "",
      valueCoin: valueCoin || "0",
      expectedNonce: metadata.nonce,
      expectedAmount: payment.amount,
    });

    if (!validation.isValid) {
      console.error(`[PAYGATE WEBHOOK] Invalid nonce for payment ${payment.id}`);
      return NextResponse.json(
        { error: "Invalid nonce" },
        { status: 403 }
      );
    }

    if (!validation.isPaid) {
      // Payment too low - mark as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: JSON.stringify({
            ...metadata,
            failedAt: new Date().toISOString(),
            failReason: "Payment amount too low",
            paidAmount: validation.paidAmount,
            txid: validation.txid,
          }),
        },
      });

      console.log(`[PAYGATE WEBHOOK] Payment ${payment.id} failed - amount too low: ${validation.paidAmount}`);
      return NextResponse.json({ message: "Payment failed - amount too low" });
    }

    // Payment successful - update status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        providerTxId: validation.txid,
        metadata: JSON.stringify({
          ...metadata,
          completedAt: new Date().toISOString(),
          paidAmount: validation.paidAmount,
          txid: validation.txid,
          isPartial: validation.isPartial,
        }),
      },
    });

    // Process the payment based on type
    const paymentType = metadata.type;

    switch (paymentType) {
      case "credits":
        // Add credits to user - paid credits first
        if (metadata.paidCredits) {
          await addCredits(
            payment.userId,
            metadata.paidCredits,
            "PURCHASE",
            { description: `PayGate purchase - $${payment.amount}`, creditType: "PAID" }
          );
        }
        // Then bonus credits
        if (metadata.bonusCredits && metadata.bonusCredits > 0) {
          await addCredits(
            payment.userId,
            metadata.bonusCredits,
            "PURCHASE_BONUS",
            { description: `PayGate bonus - $${payment.amount}`, creditType: "BONUS" }
          );
        }
        console.log(`[PAYGATE WEBHOOK] Added ${metadata.paidCredits} paid + ${metadata.bonusCredits || 0} bonus credits to user ${payment.userId}`);
        break;

      case "subscription":
        // Handle subscription purchase
        await handleSubscriptionPurchase(payment, metadata);
        break;

      case "ppv":
      case "tip":
        // Handle PPV/tip - credits already handled via frontend
        console.log(`[PAYGATE WEBHOOK] ${paymentType} payment completed for ${payment.userId}`);
        break;

      default:
        console.log(`[PAYGATE WEBHOOK] Payment type ${paymentType} completed`);
    }

    console.log(`[PAYGATE WEBHOOK] Payment ${payment.id} completed successfully`);
    return NextResponse.json({ message: "Order marked as paid and status changed." });

  } catch (error) {
    console.error("PayGate webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionPurchase(payment: any, metadata: any) {
  try {
    const { creatorSlug, planId, billingInterval } = metadata;
    const userId = payment.userId;

    if (!creatorSlug) {
      console.error("[PAYGATE] No creatorSlug for subscription");
      return;
    }

    // Find the subscription plan
    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { id: planId },
          { slug: planId },
          { name: planId }
        ]
      },
    });

    if (!plan) {
      console.error(`[PAYGATE] Plan not found: ${planId}`);
      return;
    }

    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (billingInterval === "yearly" || billingInterval === "annual") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorSlug,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: plan.id,
          status: "ACTIVE",
          billingInterval: billingInterval === "yearly" || billingInterval === "annual" ? "ANNUAL" : "MONTHLY",
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          paymentProvider: "PAYGATE",
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          creatorSlug,
          status: "ACTIVE",
          paymentProvider: "PAYGATE",
          billingInterval: billingInterval === "yearly" || billingInterval === "annual" ? "ANNUAL" : "MONTHLY",
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
        },
      });
    }

    console.log(`[PAYGATE] Subscription created/updated for user ${userId} to creator ${creatorSlug}`);
  } catch (error) {
    console.error("[PAYGATE] Subscription handling error:", error);
  }
}
