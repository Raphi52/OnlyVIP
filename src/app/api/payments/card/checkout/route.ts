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

    const body = await request.json();
    const { type, amount, planId, billingInterval, mediaId, messageId, creatorSlug, credits } = body;

    // Fetch wallet address - use creator wallet if creatorSlug provided, otherwise use platform wallet
    let walletBtc: string | null = null;
    let walletEth: string | null = null;

    if (creatorSlug) {
      // For creator-specific payments
      const creator = await prisma.creator.findUnique({
        where: { slug: creatorSlug },
        select: { walletBtc: true, walletEth: true },
      });
      if (creator) {
        walletBtc = creator.walletBtc;
        walletEth = creator.walletEth;
      }
    }

    // If no creator wallet or no creatorSlug (like credits purchase), use platform wallet
    if (!walletBtc && !walletEth) {
      const siteSettings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
        select: { platformWalletBtc: true, platformWalletEth: true },
      });
      if (siteSettings) {
        walletBtc = siteSettings.platformWalletBtc;
        walletEth = siteSettings.platformWalletEth;
      }
    }

    if (!isChangeHeroConfigured(walletBtc, walletEth)) {
      return NextResponse.json(
        { error: "Card payments not configured - wallet address missing" },
        { status: 500 }
      );
    }

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
      walletAddress = getWalletAddress(cryptoCurrency, walletBtc);
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
          credits: credits || null,
        }),
      },
    });

    // Generate ChangeHero URL with the payment amount
    const changeHeroUrl = generateChangeHeroUrl({
      cryptoCurrency: "btc",
      fiatAmount: amount,
      fiatCurrency: "eur",
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
    credits: "CREDITS_PURCHASE",
  };
  return mapping[type] || "OTHER";
}
