import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBTCTransactions, usdToSatoshis } from "@/lib/blockchain-monitor";
import { addCredits } from "@/lib/credits";

// This endpoint checks pending payments and activates subscriptions
// Can be called via cron job (e.g., every 5 minutes) or manually

export async function POST(req: Request) {
  try {
    // Optional: Add a secret key check for cron jobs
    const { authorization } = Object.fromEntries(req.headers);
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all pending payments from the last 24 hours
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        provider: "CHANGEHERO", // Only card payments (via ChangeHero)
      },
    });

    const results = {
      checked: 0,
      activated: 0,
      errors: [] as string[],
    };

    for (const payment of pendingPayments) {
      results.checked++;

      try {
        // Get the wallet address from env based on currency (default BTC)
        const walletAddress = process.env.WALLET_BTC;

        if (!walletAddress) {
          results.errors.push(`No wallet configured for payment ${payment.id}`);
          continue;
        }

        // Convert expected amount to satoshis
        const expectedSatoshis = await usdToSatoshis(payment.amount);

        if (expectedSatoshis === 0) {
          results.errors.push(`Could not convert amount for payment ${payment.id}`);
          continue;
        }

        // Check blockchain for incoming transactions
        const transactions = await getBTCTransactions(walletAddress);

        // Look for a matching transaction (within 10% tolerance for exchange rate fluctuations)
        const minAmount = expectedSatoshis * 0.9;
        const maxAmount = expectedSatoshis * 1.1;

        let matchingTx = null;
        for (const tx of transactions) {
          for (const output of tx.vout) {
            if (
              output.scriptpubkey_address === walletAddress &&
              output.value >= minAmount &&
              output.value <= maxAmount
            ) {
              // Check if this tx was created after the payment request
              matchingTx = tx;
              break;
            }
          }
          if (matchingTx) break;
        }

        if (matchingTx && matchingTx.status.confirmed) {
          // Payment confirmed! Activate the subscription/unlock content
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              providerTxId: matchingTx.txid,
            },
          });

          // Parse metadata
          const metadata = payment.metadata
            ? JSON.parse(payment.metadata as string)
            : {};

          // Handle based on payment type
          if (payment.type === "SUBSCRIPTION" && payment.userId) {
            // Find the plan
            const planSlug = (metadata.planId || "basic").toLowerCase();
            const plan = await prisma.subscriptionPlan.findFirst({
              where: { slug: planSlug },
            });

            if (plan) {
              const billingInterval = metadata.billingInterval || "MONTHLY";
              const duration = billingInterval === "ANNUAL" ? 365 : 30;

              await prisma.subscription.create({
                data: {
                  userId: payment.userId,
                  planId: plan.id,
                  creatorSlug: payment.creatorSlug,
                  paymentProvider: "CHANGEHERO",
                  billingInterval,
                  status: "ACTIVE",
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                },
              });
            }
          } else if (payment.type === "MEDIA_PURCHASE" && metadata.mediaId) {
            // Create media purchase record
            await prisma.mediaPurchase.create({
              data: {
                userId: payment.userId,
                mediaId: metadata.mediaId,
                amount: payment.amount,
                currency: payment.currency,
                provider: "CHANGEHERO",
                providerTxId: matchingTx.txid,
                status: "COMPLETED",
              },
            });
          } else if (payment.type === "PPV_UNLOCK" && metadata.messageId) {
            // Create message payment record for PPV unlock
            await prisma.messagePayment.create({
              data: {
                messageId: metadata.messageId,
                userId: payment.userId,
                type: "PPV_UNLOCK",
                amount: payment.amount,
                currency: payment.currency,
                provider: "CHANGEHERO",
                providerTxId: matchingTx.txid,
                status: "COMPLETED",
              },
            });

            // Update the message ppvUnlockedBy array
            const message = await prisma.message.findUnique({
              where: { id: metadata.messageId },
            });

            if (message) {
              const unlockedBy = JSON.parse(message.ppvUnlockedBy || "[]");
              if (!unlockedBy.includes(payment.userId)) {
                unlockedBy.push(payment.userId);
                await prisma.message.update({
                  where: { id: metadata.messageId },
                  data: { ppvUnlockedBy: JSON.stringify(unlockedBy) },
                });
              }
            }
          } else if (payment.type === "CREDITS" && payment.userId) {
            // Credits purchase - add credits to user account
            const creditsToAdd = metadata.credits || Math.floor(Number(payment.amount) * 100);

            if (creditsToAdd > 0) {
              const result = await addCredits(
                payment.userId,
                creditsToAdd,
                "PURCHASE",
                {
                  creditType: "PAID",
                  description: `Card purchase via ChangeHero - Payment ${payment.id}`,
                }
              );

              // Update user's credit balance
              await prisma.user.update({
                where: { id: payment.userId },
                data: { creditBalance: result.newBalance },
              });

              console.log(`[CHECK-PENDING] Added ${creditsToAdd} credits to user ${payment.userId}. New balance: ${result.newBalance}`);
            }
          }

          results.activated++;
        }
      } catch (error) {
        results.errors.push(
          `Error processing payment ${payment.id}: ${error}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Error checking pending payments:", error);
    return NextResponse.json(
      { error: "Failed to check pending payments" },
      { status: 500 }
    );
  }
}

// GET endpoint to manually check status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.json(
      { error: "Payment ID required" },
      { status: 400 }
    );
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: payment.status,
      confirmed: payment.status === "COMPLETED",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
