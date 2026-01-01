import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMixPayPaymentResult, mapMixPayStatus } from "@/lib/mixpay";
import { addCredits } from "@/lib/credits";

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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        provider: "MIXPAY",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Already completed?
    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        status: "COMPLETED",
        message: "Payment already processed",
      });
    }

    // Get metadata
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    const { orderId, traceId } = metadata;

    if (!orderId && !traceId) {
      return NextResponse.json({
        status: payment.status,
        message: "Missing order/trace ID",
      });
    }

    // Check with MixPay API
    const result = await getMixPayPaymentResult(orderId, traceId);

    if (!result.success) {
      return NextResponse.json({
        status: payment.status,
        message: result.message || "Failed to check payment status",
      });
    }

    const newStatus = mapMixPayStatus(result.data.status);

    // Update payment if status changed
    if (newStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus as any,
          metadata: JSON.stringify({
            ...metadata,
            mixpayStatus: result.data.status,
            txid: result.data.txid,
            settlementAmount: result.data.settlementAmount,
            checkedAt: new Date().toISOString(),
          }),
        },
      });

      // Process if completed
      if (newStatus === "COMPLETED") {
        await processCompletedPayment(payment, metadata);
      }
    }

    return NextResponse.json({
      status: newStatus,
      mixpayStatus: result.data.status,
      txid: result.data.txid,
    });
  } catch (error) {
    console.error("MixPay status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}

async function processCompletedPayment(payment: any, metadata: Record<string, any>) {
  console.log(`[MIXPAY STATUS] Processing completed payment ${payment.id} type ${payment.type}`);

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

      console.log(`[MIXPAY STATUS] Added ${paidCredits} + ${bonusCredits} bonus credits to user ${payment.userId}`);
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
        console.log(`[MIXPAY STATUS] Subscription activated for user ${payment.userId}`);
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
        console.log(`[MIXPAY STATUS] Media purchase completed for user ${payment.userId}`);
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
          console.log(`[MIXPAY STATUS] PPV unlock completed for user ${payment.userId}`);
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
        console.log(`[MIXPAY STATUS] Tip processed for user ${payment.userId}`);
      }
      break;
  }
}
