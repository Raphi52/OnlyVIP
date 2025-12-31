import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: Card payments via ChangeHero are no longer supported.
 *
 * Why? ChangeHero redirects users to buy crypto externally with no webhook
 * confirmation, leading to unreliable payment processing.
 *
 * Solution: Use direct crypto payments via NOWPayments instead.
 * - POST /api/payments/crypto/create
 * - Supports: USDT, USDC, BTC, ETH, LTC, SOL, TRX
 * - Reliable webhooks + polling backup
 * - Zero KYC for merchant and users
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Card payments are no longer available",
      message: "Please use crypto payment instead. We accept USDT, USDC, BTC, ETH, and more.",
      redirect: "/checkout?method=crypto",
      supportedCryptos: [
        { id: "usdttrc20", name: "USDT (TRC20)", recommended: true },
        { id: "usdcsol", name: "USDC (Solana)", recommended: true },
        { id: "btc", name: "Bitcoin" },
        { id: "eth", name: "Ethereum" },
      ],
    },
    { status: 410 } // 410 Gone
  );
}
