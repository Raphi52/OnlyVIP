import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateMoonPayUrl,
  getWalletAddress,
  getMoonPayCurrencyCode,
  isMoonPayConfigured,
} from "@/lib/moonpay";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      amount,
      currency = "EUR",
      cryptoCurrency = "BTC",
      mediaId,
      messageId,
      recipientId,
      planId,
      creatorSlug,
    } = body;

    // Fetch creator wallet from database if creatorSlug provided
    let creatorWalletBtc: string | null = null;
    let creatorWalletEth: string | null = null;

    if (creatorSlug) {
      const creator = await prisma.creator.findUnique({
        where: { slug: creatorSlug },
        select: { walletBtc: true, walletEth: true },
      });
      if (creator) {
        creatorWalletBtc = creator.walletBtc;
        creatorWalletEth = creator.walletEth;
      }
    }

    if (!isMoonPayConfigured(creatorWalletBtc, creatorWalletEth)) {
      return NextResponse.json(
        { error: "Fiat payments not configured" },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Valid amount required" },
        { status: 400 }
      );
    }

    // Get wallet address - use creator wallet based on selected crypto
    const creatorWallet = cryptoCurrency.toUpperCase() === "ETH" ? creatorWalletEth : creatorWalletBtc;
    let walletAddress: string;
    try {
      walletAddress = getWalletAddress(cryptoCurrency, creatorWallet);
    } catch (error) {
      return NextResponse.json(
        { error: `Wallet not configured for ${cryptoCurrency}` },
        { status: 500 }
      );
    }

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user!.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
        provider: "MOONPAY",
        type: mapPaymentType(type),
        metadata: JSON.stringify({
          mediaId,
          messageId,
          recipientId,
          planId,
          cryptoCurrency,
          walletAddress,
        }),
      },
    });

    // Generate MoonPay widget URL
    const moonPayUrl = generateMoonPayUrl({
      walletAddress,
      cryptoCurrency: getMoonPayCurrencyCode(cryptoCurrency),
      fiatCurrency: currency,
      fiatAmount: amount,
      externalTransactionId: payment.id,
      redirectUrl: `${BASE_URL}/api/payments/fiat/callback?paymentId=${payment.id}`,
      email: user?.email || undefined,
    });

    return NextResponse.json({
      url: moonPayUrl,
      paymentId: payment.id,
      walletAddress,
      amount,
      currency,
      cryptoCurrency,
    });
  } catch (error) {
    console.error("Fiat checkout error:", error);
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
