import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMixPayPayment,
  getMixPayConfig,
  isMixPayConfigured,
  calculateCreditsWithBonus,
} from "@/lib/mixpay";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isMixPayConfigured()) {
      return NextResponse.json(
        { error: "MixPay not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, amount, planId, billingInterval, mediaId, messageId, creatorSlug } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Valid amount required (min $1)" },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `${type}_${session.user.id}_${Date.now()}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mixpay/webhook`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`;

    // Determine payment type and metadata
    let paymentType: string;
    let metadata: Record<string, any> = {
      type,
      userId: session.user.id,
      dollarAmount: amount,
    };

    switch (type) {
      case "credits":
        paymentType = "CREDITS";
        const credits = calculateCreditsWithBonus(amount);
        metadata.credits = credits.totalCredits;
        metadata.paidCredits = credits.paidCredits;
        metadata.bonusCredits = credits.bonusCredits;
        break;
      case "subscription":
        paymentType = "SUBSCRIPTION";
        metadata.planId = planId;
        metadata.billingInterval = billingInterval;
        metadata.creatorSlug = creatorSlug;
        break;
      case "media":
        paymentType = "MEDIA_PURCHASE";
        metadata.mediaId = mediaId;
        break;
      case "ppv":
        paymentType = "PPV_UNLOCK";
        metadata.messageId = messageId;
        metadata.creatorSlug = creatorSlug;
        break;
      case "tip":
        paymentType = "TIP";
        metadata.messageId = messageId;
        metadata.creatorSlug = creatorSlug;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid payment type" },
          { status: 400 }
        );
    }

    // Create MixPay payment
    const config = getMixPayConfig();
    const mixPayResponse = await createMixPayPayment(
      {
        orderId,
        amount,
        callbackUrl,
        returnUrl,
        note: `${paymentType} - $${amount}`,
      },
      config
    );

    if (!mixPayResponse.success) {
      return NextResponse.json(
        { error: mixPayResponse.message || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store pending payment in database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        creatorSlug: creatorSlug || null,
        amount: amount,
        currency: "USD",
        status: "PENDING",
        provider: "MIXPAY",
        providerTxId: mixPayResponse.data.traceId,
        type: paymentType as any,
        metadata: JSON.stringify({
          ...metadata,
          orderId,
          traceId: mixPayResponse.data.traceId,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[MIXPAY] Created payment ${payment.id} for user ${session.user.id}: $${amount}`);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderId,
      traceId: mixPayResponse.data.traceId,
      paymentUrl: mixPayResponse.data.paymentLink, // URL where user pays
      amount,
      expiresIn: mixPayResponse.data.seconds,
    });
  } catch (error) {
    console.error("MixPay payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
