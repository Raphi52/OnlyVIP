import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMixPayPaymentResult, mapMixPayStatus } from "@/lib/mixpay";
import { addCredits } from "@/lib/credits";

interface MixPayCallback {
  orderId: string;
  traceId: string;
  payeeId: string;
}

// Calculate bonus credits
function calculateBonusCredits(dollarAmount: number): { paidCredits: number; bonusCredits: number } {
  const paidCredits = Math.floor(dollarAmount * 100);
  let bonusPercent = 0;
  if (dollarAmount >= 100) bonusPercent = 30;
  else if (dollarAmount >= 50) bonusPercent = 25;
  else if (dollarAmount >= 25) bonusPercent = 20;
  else if (dollarAmount >= 10) bonusPercent = 15;
  else if (dollarAmount >= 5) bonusPercent = 10;
  const bonusCredits = Math.floor(paidCredits * (bonusPercent / 100));
  return { paidCredits, bonusCredits };
}

export async function POST(request: NextRequest) {
  try {
    const body: MixPayCallback = await request.json();
    const { orderId, traceId, payeeId } = body;

    console.log(`[MIXPAY WEBHOOK] Received callback for order ${orderId}, trace ${traceId}`);

    if (!orderId && !traceId) {
      return NextResponse.json({ code: "FAILED", message: "Missing orderId or traceId" });
    }

    // Find our payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { providerTxId: traceId },
          { metadata: { contains: orderId } },
        ],
        provider: "MIXPAY",
      },
    });

    if (!payment) {
      console.error(`[MIXPAY WEBHOOK] Payment not found for order ${orderId}`);
      return NextResponse.json({ code: "FAILED", message: "Payment not found" });
    }

    // Already processed?
    if (payment.status === "COMPLETED") {
      console.log(`[MIXPAY WEBHOOK] Payment ${payment.id} already completed`);
      return NextResponse.json({ code: "SUCCESS" });
    }

    // Verify payment status with MixPay API
    const result = await getMixPayPaymentResult(orderId, traceId);

    if (!result.success) {
      console.error(`[MIXPAY WEBHOOK] Failed to get payment result: ${result.message}`);
      return NextResponse.json({ code: "FAILED", message: result.message });
    }

    const status = mapMixPayStatus(result.data.status);
    console.log(`[MIXPAY WEBHOOK] Payment ${payment.id} status: ${result.data.status} -> ${status}`);

    // Update payment status
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status as any,
        metadata: JSON.stringify({
          ...metadata,
          mixpayStatus: result.data.status,
          txid: result.data.txid,
          settlementAmount: result.data.settlementAmount,
          processedAt: new Date().toISOString(),
        }),
      },
    });

    // If payment is completed, process it
    if (status === "COMPLETED") {
      await processCompletedPayment(payment, metadata);
    }

    // MixPay requires this exact response
    return NextResponse.json({ code: "SUCCESS" });
  } catch (error) {
    console.error("[MIXPAY WEBHOOK] Error:", error);
    return NextResponse.json({ code: "FAILED", message: "Internal error" });
  }
}

async function processCompletedPayment(payment: any, metadata: Record<string, any>) {
  console.log(`[MIXPAY] Processing completed payment ${payment.id} type ${payment.type}`);

  switch (payment.type) {
    case "CREDITS":
      const dollarAmount = metadata.dollarAmount || Number(payment.amount);
      const { paidCredits, bonusCredits } = calculateBonusCredits(dollarAmount);

      // Add PAID credits
      const paidResult = await addCredits(
        payment.userId,
        paidCredits,
        "PURCHASE",
        {
          creditType: "PAID",
          description: `MixPay purchase - ${paidCredits} credits for $${dollarAmount}`,
        }
      );

      let totalBalance = paidResult.newBalance;

      // Add BONUS credits if any
      if (bonusCredits > 0) {
        const bonusResult = await addCredits(
          payment.userId,
          bonusCredits,
          "PURCHASE_BONUS",
          {
            creditType: "BONUS",
            description: `Bonus ${bonusCredits} credits (PPV catalog only)`,
          }
        );
        totalBalance = bonusResult.newBalance;
      }

      // Update user balance
      await prisma.user.update({
        where: { id: payment.userId },
        data: { creditBalance: totalBalance },
      });

      console.log(`[MIXPAY] Added ${paidCredits} + ${bonusCredits} bonus credits to user ${payment.userId}`);
      break;

    case "SUBSCRIPTION":
      const { planId, billingInterval, creatorSlug } = metadata;
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: planId },
      });

      if (plan) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingInterval === "ANNUAL") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const existingSub = await prisma.subscription.findFirst({
          where: { userId: payment.userId, planId: plan.id },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: "ACTIVE",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId: payment.userId,
              planId: plan.id,
              creatorSlug: creatorSlug || null,
              status: "ACTIVE",
              paymentProvider: "MIXPAY",
              billingInterval: billingInterval as any,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        }
        console.log(`[MIXPAY] Subscription activated for user ${payment.userId}`);
      }
      break;

    case "MEDIA_PURCHASE":
      const { mediaId } = metadata;
      if (mediaId) {
        await prisma.mediaPurchase.upsert({
          where: {
            userId_mediaId: { userId: payment.userId, mediaId },
          },
          update: { status: "COMPLETED" },
          create: {
            userId: payment.userId,
            mediaId,
            amount: Number(payment.amount),
            provider: "MIXPAY",
            providerTxId: payment.providerTxId,
            status: "COMPLETED",
          },
        });
        console.log(`[MIXPAY] Media purchase completed for user ${payment.userId}`);
      }
      break;

    case "PPV_UNLOCK":
      const { messageId } = metadata;
      if (messageId) {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });
        if (message) {
          const unlockedBy = JSON.parse(message.ppvUnlockedBy || "[]");
          if (!unlockedBy.includes(payment.userId)) {
            unlockedBy.push(payment.userId);
            await prisma.message.update({
              where: { id: messageId },
              data: { ppvUnlockedBy: JSON.stringify(unlockedBy) },
            });
          }
          console.log(`[MIXPAY] PPV unlock completed for user ${payment.userId}`);
        }
      }
      break;

    case "TIP":
      const tipMessageId = metadata.messageId;
      if (tipMessageId) {
        await prisma.message.update({
          where: { id: tipMessageId },
          data: { totalTips: { increment: Number(payment.amount) } },
        });
        console.log(`[MIXPAY] Tip processed for user ${payment.userId}`);
      }
      break;
  }
}
