import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPayGatePayment,
  getPayGateConfig,
  isPayGateConfigured,
  calculateCreditsWithBonus,
} from "@/lib/paygate";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isPayGateConfigured()) {
      return NextResponse.json(
        { error: "PayGate not configured" },
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

    // Generate unique order ID and nonce
    const orderId = randomUUID().slice(0, 32);
    const nonce = randomUUID();
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paygate/webhook?order_id=${orderId}&nonce=${nonce}`;

    // Determine payment type and metadata
    let paymentType: string;
    let metadata: Record<string, any> = {
      type,
      userId: session.user.id,
      dollarAmount: amount,
      nonce,
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

    // Create PayGate payment
    const config = getPayGateConfig();
    const payGateResponse = await createPayGatePayment(
      {
        orderId,
        amount,
        currency: "USD",
        callbackUrl,
        email: session.user.email || undefined,
      },
      config
    );

    if (!payGateResponse.success) {
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store pending payment in database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        ...(creatorSlug ? { creatorSlug } : {}),
        amount: amount,
        currency: "USD",
        status: "PENDING",
        provider: "PAYGATE",
        providerTxId: payGateResponse.trackingAddress,
        type: paymentType as any,
        metadata: JSON.stringify({
          ...metadata,
          orderId,
          trackingAddress: payGateResponse.trackingAddress,
          polygonAddress: payGateResponse.polygonAddress,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[PAYGATE] Created payment ${payment.id} for user ${session.user.id}: $${amount}`);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderId,
      trackingAddress: payGateResponse.trackingAddress,
      checkoutUrl: payGateResponse.checkoutUrl,
      amount,
    });
  } catch (error) {
    console.error("PayGate payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
