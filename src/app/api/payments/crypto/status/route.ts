import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentStatus, mapPaymentStatus } from "@/lib/nowpayments";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

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

    // Get our payment record
    const payment = await prisma.payment.findFirst({
      where: { providerTxId: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Security: verify this payment belongs to the user
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // If already completed, return immediately
    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        status: "finished",
        internalStatus: "COMPLETED",
        processed: true,
        message: "Payment already processed",
      });
    }

    // Get payment status from NOWPayments
    const status = await getPaymentStatus(paymentId);
    const mappedStatus = mapPaymentStatus(status.payment_status);

    // If payment is completed but not yet processed in our DB
    if (mappedStatus === "COMPLETED" && payment.status !== "COMPLETED") {
      console.log(`[STATUS] Processing completed payment ${payment.id} for user ${session.user.id}`);

      // Parse metadata
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          metadata: JSON.stringify({
            ...metadata,
            actuallyPaid: status.actually_paid,
            processedAt: new Date().toISOString(),
            processedBy: "status_check",
          }),
        },
      });

      // Process the payment based on type
      let creditsAdded = 0;
      let bonusAdded = 0;

      switch (payment.type) {
        case "CREDITS":
          const dollarAmount = metadata.dollarAmount || Number(payment.amount);
          const { paidCredits, bonusCredits } = calculateBonusCredits(dollarAmount);

          // Add PAID credits
          const paidResult = await addCredits(
            session.user.id,
            paidCredits,
            "PURCHASE",
            {
              creditType: "PAID",
              description: `Crypto purchase - ${paidCredits} credits for $${dollarAmount}`,
            }
          );
          creditsAdded = paidCredits;

          let totalBalance = paidResult.newBalance;

          // Add BONUS credits if any
          if (bonusCredits > 0) {
            const bonusResult = await addCredits(
              session.user.id,
              bonusCredits,
              "PURCHASE_BONUS",
              {
                creditType: "BONUS",
                description: `Bonus ${bonusCredits} credits (PPV catalog only)`,
              }
            );
            totalBalance = bonusResult.newBalance;
            bonusAdded = bonusCredits;
          }

          // Update user's credit balance
          await prisma.user.update({
            where: { id: session.user.id },
            data: { creditBalance: totalBalance },
          });

          console.log(`[STATUS] Added ${paidCredits} + ${bonusCredits} bonus credits to user ${session.user.id}`);
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
              where: { userId: session.user.id, planId: plan.id },
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
                  userId: session.user.id,
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
          }
          break;

        case "MEDIA_PURCHASE":
          const { mediaId } = metadata;
          if (mediaId) {
            await prisma.mediaPurchase.upsert({
              where: {
                userId_mediaId: { userId: session.user.id, mediaId },
              },
              update: { status: "COMPLETED" },
              create: {
                userId: session.user.id,
                mediaId,
                amount: Number(payment.amount),
                provider: "NOWPAYMENTS",
                providerTxId: paymentId,
                status: "COMPLETED",
              },
            });
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
              if (!unlockedBy.includes(session.user.id)) {
                unlockedBy.push(session.user.id);
                await prisma.message.update({
                  where: { id: messageId },
                  data: { ppvUnlockedBy: JSON.stringify(unlockedBy) },
                });
              }
            }
          }
          break;
      }

      return NextResponse.json({
        status: status.payment_status,
        internalStatus: "COMPLETED",
        processed: true,
        creditsAdded,
        bonusAdded,
        message: "Payment processed successfully!",
      });
    }

    // Update status in DB if changed
    if (mappedStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: mappedStatus as any },
      });
    }

    return NextResponse.json({
      status: status.payment_status,
      internalStatus: mappedStatus,
      processed: false,
      payAmount: status.pay_amount,
      actuallyPaid: status.actually_paid || 0,
      payAddress: status.pay_address,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
