import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateChangeHeroUrl,
  getWalletAddress,
  isChangeHeroConfigured,
} from "@/lib/changehero";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isChangeHeroConfigured()) {
      return NextResponse.json(
        { error: "Card payments not configured - wallet address missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { type, amount, planId, billingInterval, mediaId, messageId } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Valid amount required" },
        { status: 400 }
      );
    }

    // Use BTC by default for card payments
    const cryptoCurrency = "BTC";

    let walletAddress: string;
    try {
      walletAddress = getWalletAddress(cryptoCurrency);
    } catch (error) {
      return NextResponse.json(
        { error: "Wallet not configured" },
        { status: 500 }
      );
    }

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: amount,
        currency: "EUR",
        status: "PENDING",
        provider: "CHANGEHERO",
        type: mapPaymentType(type),
        metadata: JSON.stringify({
          planId,
          billingInterval,
          mediaId,
          messageId,
          cryptoCurrency,
          walletAddress,
        }),
      },
    });

    // Generate ChangeHero URL
    const changeHeroUrl = generateChangeHeroUrl({
      cryptoCurrency: "btc",
    });

    return NextResponse.json({
      paymentId: payment.id,
      walletAddress,
      cryptoCurrency,
      changeHeroUrl,
      amount,
    });
  } catch (error) {
    console.error("Card checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}

function mapPaymentType(type: string): string {
  const mapping: Record<string, string> = {
    subscription: "SUBSCRIPTION",
    media: "MEDIA_PURCHASE",
    ppv: "PPV_UNLOCK",
    tip: "TIP",
  };
  return mapping[type] || "OTHER";
}
