import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendToAccounting } from "@/lib/crypto-accounting";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get("paymentId");
    const transactionStatus = searchParams.get("transactionStatus");
    const transactionId = searchParams.get("transactionId");

    if (!paymentId) {
      return NextResponse.redirect(`${BASE_URL}/checkout?error=missing_payment`);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.redirect(`${BASE_URL}/checkout?error=payment_not_found`);
    }

    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { id: true, email: true },
    });

    // MoonPay returns transactionStatus in the redirect URL
    // Possible values: completed, failed, pending
    if (transactionStatus === "completed" || transactionId) {
      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          providerTxId: transactionId || undefined,
        },
      });

      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

      // Process the completed payment
      await processCompletedPayment(payment, metadata, user);

      return NextResponse.redirect(`${BASE_URL}/checkout/success?paymentId=${paymentId}`);
    } else if (transactionStatus === "failed") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(`${BASE_URL}/checkout/failed?paymentId=${paymentId}`);
    } else {
      // Pending or unknown - show pending page
      return NextResponse.redirect(`${BASE_URL}/checkout/pending?paymentId=${paymentId}`);
    }
  } catch (error) {
    console.error("Fiat callback error:", error);
    return NextResponse.redirect(`${BASE_URL}/checkout?error=callback_failed`);
  }
}

async function processCompletedPayment(
  payment: any,
  metadata: any,
  user: { id: string; email: string | null } | null
) {
  switch (payment.type) {
    case "MEDIA_PURCHASE":
      if (metadata.mediaId) {
        const existing = await prisma.mediaPurchase.findUnique({
          where: { userId_mediaId: { userId: payment.userId, mediaId: metadata.mediaId } },
        });
        if (!existing) {
          await prisma.mediaPurchase.create({
            data: {
              userId: payment.userId,
              mediaId: metadata.mediaId,
              amount: payment.amount,
              provider: "MOONPAY",
              providerTxId: payment.providerTxId,
              status: "COMPLETED",
            },
          });
        }
      }
      break;

    case "PPV_UNLOCK":
      if (metadata.messageId) {
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

          await prisma.messagePayment.create({
            data: {
              messageId: metadata.messageId,
              userId: payment.userId,
              type: "PPV_UNLOCK",
              amount: payment.amount,
              status: "COMPLETED",
              provider: "MOONPAY",
            },
          });
        }
      }
      break;

    case "TIP":
      if (metadata.messageId) {
        await prisma.messagePayment.create({
          data: {
            messageId: metadata.messageId,
            userId: payment.userId,
            type: "TIP",
            amount: payment.amount,
            status: "COMPLETED",
            provider: "MOONPAY",
          },
        });

        await prisma.message.update({
          where: { id: metadata.messageId },
          data: {
            totalTips: {
              increment: payment.amount,
            },
          },
        });
      }
      break;
  }

  // Send to accounting
  await sendToAccounting({
    externalId: payment.id,
    amountUsd: payment.amount,
    amountCrypto: metadata.estimatedCrypto || 0,
    cryptoCurrency: metadata.cryptoCurrency || "BTC",
    productType: payment.type,
    productName: metadata.mediaId || metadata.messageId || metadata.planId,
    status: "COMPLETED",
    paymentDate: payment.createdAt.toISOString(),
    userEmail: user?.email || undefined,
    userId: payment.userId,
    exchangeRate: metadata.exchangeRate || 0,
    metadata: {
      ...metadata,
      provider: "MOONPAY",
      moonpayTxId: payment.providerTxId,
    },
  });
}
