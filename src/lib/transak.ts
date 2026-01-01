/**
 * Transak Integration - Fiat to Crypto On-Ramp
 *
 * Flow:
 * 1. User initiates purchase → Widget opens
 * 2. User pays with card via Transak
 * 3. Transak sends crypto to platform wallet
 * 4. Webhook notifies completion → Credits added
 *
 * Benefits:
 * - Embedded widget (no redirect)
 * - Reliable webhooks
 * - Handles KYC/AML
 * - Multiple fiat currencies
 */

export interface TransakConfig {
  apiKey: string;
  environment: 'STAGING' | 'PRODUCTION';
  walletAddress: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  fiatAmount: number;
  email?: string;
  userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  partnerOrderId: string;
  partnerCustomerId: string;
}

export interface TransakWebhookPayload {
  webhookData: {
    id: string;
    partnerOrderId: string;
    partnerCustomerId: string;
    status: TransakStatus;
    fiatCurrency: string;
    fiatAmount: number;
    cryptoCurrency: string;
    cryptoAmount: number;
    walletAddress: string;
    network: string;
    transactionHash?: string;
    transactionLink?: string;
    createdAt: string;
    completedAt?: string;
    paymentMethod?: string;
    totalFeeInFiat: number;
  };
}

export type TransakStatus =
  | 'AWAITING_PAYMENT_FROM_USER'
  | 'PAYMENT_DONE_MARKED_BY_USER'
  | 'PROCESSING'
  | 'PENDING_DELIVERY_FROM_TRANSAK'
  | 'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

// Transak widget URL
const TRANSAK_WIDGET_URL = {
  STAGING: 'https://global-stg.transak.com',
  PRODUCTION: 'https://global.transak.com',
};

/**
 * Generate Transak widget configuration for client-side
 */
export function generateTransakWidgetConfig(config: TransakConfig): Record<string, string> {
  const environment = config.environment || 'PRODUCTION';

  return {
    apiKey: config.apiKey,
    environment,
    cryptoCurrencyCode: config.cryptoCurrency,
    fiatCurrency: config.fiatCurrency,
    fiatAmount: config.fiatAmount.toString(),
    walletAddress: config.walletAddress,
    disableWalletAddressForm: 'true',
    hideMenu: 'true',
    themeColor: '7c3aed', // Purple theme
    partnerOrderId: config.partnerOrderId,
    partnerCustomerId: config.partnerCustomerId,
    ...(config.email && { email: config.email }),
    ...(config.userData?.firstName && { firstName: config.userData.firstName }),
    ...(config.userData?.lastName && { lastName: config.userData.lastName }),
  };
}

/**
 * Generate Transak widget URL
 */
export function generateTransakWidgetUrl(config: TransakConfig): string {
  const environment = config.environment || 'PRODUCTION';
  const baseUrl = TRANSAK_WIDGET_URL[environment];

  const params = new URLSearchParams(generateTransakWidgetConfig(config));

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Verify Transak webhook signature
 */
export function verifyTransakWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Check if Transak is configured
 */
export function isTransakConfigured(): boolean {
  return !!(
    process.env.TRANSAK_API_KEY &&
    process.env.TRANSAK_WEBHOOK_SECRET
  );
}

/**
 * Map USD amount to credits
 * $1 = 100 credits
 */
export function calculateCreditsFromUsd(usdAmount: number): { paidCredits: number; bonusCredits: number } {
  const baseCredits = Math.floor(usdAmount * 100);

  // Bonus tiers
  let bonusPercent = 0;
  if (usdAmount >= 100) bonusPercent = 30;
  else if (usdAmount >= 50) bonusPercent = 25;
  else if (usdAmount >= 25) bonusPercent = 20;
  else if (usdAmount >= 10) bonusPercent = 15;
  else if (usdAmount >= 5) bonusPercent = 10;

  const bonusCredits = Math.floor(baseCredits * (bonusPercent / 100));

  return {
    paidCredits: baseCredits,
    bonusCredits,
  };
}

/**
 * Status check helper
 */
export function isPaymentComplete(status: TransakStatus): boolean {
  return status === 'COMPLETED';
}

export function isPaymentPending(status: TransakStatus): boolean {
  return [
    'AWAITING_PAYMENT_FROM_USER',
    'PAYMENT_DONE_MARKED_BY_USER',
    'PROCESSING',
    'PENDING_DELIVERY_FROM_TRANSAK',
    'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK',
  ].includes(status);
}

export function isPaymentFailed(status: TransakStatus): boolean {
  return ['CANCELLED', 'FAILED', 'REFUNDED', 'EXPIRED'].includes(status);
}
