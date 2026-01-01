/**
 * MixPay Integration - Card + Crypto payments without KYC
 *
 * Flow:
 * 1. Create payment → Get payment URL
 * 2. User pays (card or crypto)
 * 3. MixPay sends webhook → We verify via API
 * 4. Credits added to user account
 *
 * Docs: https://mixpay.me/developers
 */

const MIXPAY_API = "https://api.mixpay.me/v1";

// USDT on Ethereum (most common settlement)
const SETTLEMENT_ASSET_ID = "4d8c508b-91c5-375b-92b0-ee702ed2dac5"; // USDT

// Quote in USD
const QUOTE_ASSET_ID = "usd";

// Payment asset ID - USDT for card/crypto payments
const PAYMENT_ASSET_ID = "4d8c508b-91c5-375b-92b0-ee702ed2dac5"; // USDT

export interface MixPayConfig {
  payeeId: string; // Your MixPay account ID
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number; // In USD
  callbackUrl: string;
  returnUrl?: string;
  note?: string;
}

export interface PaymentResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    isChain: boolean;
    expire: number;
    seconds: number;
    payeeId: string;
    traceId: string;
    clientId: string;
    paymentAmount: string;
    paymentAssetId: string;
    quoteAmount: string;
    quoteAssetId: string;
    recipient: string;
    memo: string;
    settlementAssetId: string;
    settlementAmount: string;
    paymentLink: string; // URL for user to pay
  };
}

export interface PaymentResultResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    status: 'unpaid' | 'pending' | 'failed' | 'success';
    quoteAmount: string;
    quoteAssetId: string;
    paymentAmount: string;
    paymentAssetId: string;
    payee: string;
    payeeId: string;
    payeeMixinNumber: string;
    payeeAvatarUrl: string;
    txid: string;
    date: string;
    confirmations: number;
    settlementAmount: string;
    settlementAssetId: string;
    failureCode: string;
    failureReason: string;
    surplusAmount: string;
    surplusStatus: string;
  };
}

/**
 * Create a MixPay payment
 * Returns a URL where the user can pay with card or crypto
 */
export async function createMixPayPayment(
  params: CreatePaymentParams,
  config: MixPayConfig
): Promise<PaymentResponse> {
  const response = await fetch(`${MIXPAY_API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payeeId: config.payeeId,
      orderId: params.orderId.slice(0, 36), // Max 36 chars
      settlementAssetId: SETTLEMENT_ASSET_ID,
      quoteAssetId: QUOTE_ASSET_ID,
      quoteAmount: params.amount.toString(),
      paymentAssetId: PAYMENT_ASSET_ID,
      callbackUrl: params.callbackUrl,
      returnUrl: params.returnUrl,
      note: params.note || `Purchase ${params.amount} USD`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MixPay API error: ${error}`);
  }

  return response.json();
}

/**
 * Get payment result by orderId or traceId
 */
export async function getMixPayPaymentResult(
  orderId?: string,
  traceId?: string
): Promise<PaymentResultResponse> {
  const params = new URLSearchParams();
  if (orderId) params.set("orderId", orderId);
  if (traceId) params.set("traceId", traceId);

  const response = await fetch(`${MIXPAY_API}/payments_result?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MixPay API error: ${error}`);
  }

  return response.json();
}

/**
 * Check if MixPay is configured
 */
export function isMixPayConfigured(): boolean {
  return !!process.env.MIXPAY_PAYEE_ID;
}

/**
 * Get MixPay config from environment
 */
export function getMixPayConfig(): MixPayConfig {
  const payeeId = process.env.MIXPAY_PAYEE_ID;
  if (!payeeId) {
    throw new Error("MIXPAY_PAYEE_ID not configured");
  }
  return { payeeId };
}

/**
 * Map MixPay status to our internal status
 */
export function mapMixPayStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' {
  switch (status) {
    case 'success':
      return 'COMPLETED';
    case 'failed':
      return 'FAILED';
    case 'pending':
    case 'unpaid':
    default:
      return 'PENDING';
  }
}

/**
 * Calculate bonus credits based on purchase amount
 */
export function calculateCreditsWithBonus(dollarAmount: number): {
  paidCredits: number;
  bonusCredits: number;
  totalCredits: number;
} {
  const paidCredits = Math.floor(dollarAmount * 100);

  let bonusPercent = 0;
  if (dollarAmount >= 100) bonusPercent = 30;
  else if (dollarAmount >= 50) bonusPercent = 25;
  else if (dollarAmount >= 25) bonusPercent = 20;
  else if (dollarAmount >= 10) bonusPercent = 15;
  else if (dollarAmount >= 5) bonusPercent = 10;

  const bonusCredits = Math.floor(paidCredits * (bonusPercent / 100));

  return {
    paidCredits,
    bonusCredits,
    totalCredits: paidCredits + bonusCredits,
  };
}
