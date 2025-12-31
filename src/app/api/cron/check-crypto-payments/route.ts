import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus, mapPaymentStatus } from "@/lib/nowpayments";
import { getMixPayPaymentResult, mapMixPayStatus } from "@/lib/mixpay";
import { addCredits } from "@/lib/credits";

// This endpoint should be called by a cron job every 30-60 seconds
// to check for any missed webhooks from NOWPayments and MixPay

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find pending payments from the last 24 hours (both providers)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        provider: { in: ["NOWPAYMENTS", "MIXPAY"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 20, // Process max 20 at a time
      orderBy: { createdAt: "asc" },
    });

    if (pendingPayments.length === 0) {
      return NextResponse.json({ checked: 0, message: "No pending payments" });
    }

    const results: { id: string; provider: string; status: string; action?: string }[] = [];

    for (const payment of pendingPayments) {
      try {
        const existingMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};
        let mappedStatus: string;
        let updateData: Record<string, any> = {};

        if (payment.provider === "MIXPAY") {
          // Check MixPay payment
          const { orderId, traceId } = existingMetadata;
          if (!orderId && !traceId) {
            results.push({ id: payment.id, provider: "MIXPAY", status: "error", action: "missing_ids" });
            continue;
          }

          const result = await getMixPayPaymentResult(orderId, traceId);
          if (!result.success) {
            results.push({ id: payment.id, provider: "MIXPAY", status: "error", action: "api_failed" });
            continue;
          }

          mappedStatus = mapMixPayStatus(result.data.status);
          updateData = {
            mixpayStatus: result.data.status,
            txid: result.data.txid,
            settlementAmount: result.data.settlementAmount,
          };
        } else {
          // Check NOWPayments payment
          if (!payment.providerTxId) {
            results.push({ id: payment.id, provider: "NOWPAYMENTS", status: "error", action: "missing_txid" });
            continue;
          }

          const status = await getPaymentStatus(payment.providerTxId);
          mappedStatus = mapPaymentStatus(status.payment_status);
          updateData = {
            actuallyPaid: status.actually_paid,
          };
        }

        if (mappedStatus === payment.status) {
          results.push({ id: payment.id, provider: payment.provider, status: mappedStatus, action: "no_change" });
          continue;
        }

        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: mappedStatus as any,
            metadata: JSON.stringify({
              ...existingMetadata,
              ...updateData,
              lastChecked: new Date().toISOString(),
            }),
          },
        });

        // If payment is now completed, process it
        if (mappedStatus === "COMPLETED") {
          await processCompletedPayment(payment, existingMetadata);
          results.push({ id: payment.id, provider: payment.provider, status: mappedStatus, action: "processed" });
        } else {
          results.push({ id: payment.id, provider: payment.provider, status: mappedStatus, action: "updated" });
        }
      } catch (error) {
        console.error(`Error checking payment ${payment.id}:`, error);
        results.push({ id: payment.id, provider: payment.provider, status: "error", action: "failed" });
      }
    }

    return NextResponse.json({
      checked: pendingPayments.length,
      results,
    });
  } catch (error) {
    console.error("Crypto payment check error:", error);
    return NextResponse.json(
      { error: "Failed to check payments" },
      { status: 500 }
    );
  }
}

// Calculate bonus credits based on purchase amount
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

// Process a completed payment (same logic as webhook)
async function processCompletedPayment(
  payment: any,
  metadata: Record<string, any>
) {
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
          description: `${payment.provider} purchase - ${paidCredits} credits for $${dollarAmount}`,
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

      console.log(`[CRON] Added ${paidCredits} + ${bonusCredits} bonus credits to user ${payment.userId}`);
      break;

    case "SUBSCRIPTION":
      // Handle subscription activation
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

        // Check for existing subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            userId: payment.userId,
            planId: plan.id,
          },
        });

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
              userId: payment.userId,
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
        console.log(`[CRON] Activated subscription for user ${payment.userId}`);
      }
      break;

    case "MEDIA_PURCHASE":
      const { mediaId } = metadata;
      await prisma.mediaPurchase.upsert({
        where: {
          userId_mediaId: { userId: payment.userId, mediaId },
        },
        update: { status: "COMPLETED" },
        create: {
          userId: payment.userId,
          mediaId,
          amount: Number(payment.amount),
          provider: "NOWPAYMENTS",
          providerTxId: `crypto_${Date.now()}`,
          status: "COMPLETED",
        },
      });
      console.log(`[CRON] Media purchase completed for user ${payment.userId}`);
      break;

    case "PPV_UNLOCK":
      const { messageId } = metadata;
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
        console.log(`[CRON] PPV unlock completed for user ${payment.userId}`);
      }
      break;
  }
}
