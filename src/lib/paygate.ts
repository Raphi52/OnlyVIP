/**
 * PayGate.to Integration - Credit Card + Crypto payments without KYC
 *
 * Flow:
 * 1. Generate temporary wallet via API
 * 2. Redirect user to checkout page
 * 3. User pays with card/crypto
 * 4. PayGate.to forwards payment to merchant wallet + calls webhook
 * 5. Credits added to user account
 *
 * Docs: https://paygate.to/
 */

const PAYGATE_API = "https://api.paygate.to/control";
const PAYGATE_CHECKOUT = "https://checkout.paygate.to";

export interface PayGateConfig {
  walletAddress: string; // USDC Polygon wallet to receive payments
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number; // In USD
  currency: string;
  callbackUrl: string;
  email?: string;
}

export interface WalletResponse {
  address_in: string; // Temporary address for tracking
  polygon_address_in: string;
  callback_url: string;
}

export interface ConversionResponse {
  value_coin: string;
  from: string;
  to: string;
}

/**
 * Convert currency to USD
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string
): Promise<number> {
  if (fromCurrency.toUpperCase() === "USD") {
    return amount;
  }

  const response = await fetch(
    `${PAYGATE_API}/convert.php?value=${amount}&from=${fromCurrency.toLowerCase()}`
  );

  if (!response.ok) {
    throw new Error(`PayGate conversion error: ${response.statusText}`);
  }

  const data: ConversionResponse = await response.json();
  return parseFloat(data.value_coin);
}

/**
 * Generate a temporary wallet for payment tracking
 */
export async function generatePaymentWallet(
  merchantWallet: string,
  callbackUrl: string
): Promise<WalletResponse> {
  const response = await fetch(
    `${PAYGATE_API}/wallet.php?address=${merchantWallet}&callback=${encodeURIComponent(callbackUrl)}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayGate wallet error: ${error}`);
  }

  const data = await response.json();

  if (!data.address_in) {
    throw new Error("PayGate: Failed to generate payment wallet");
  }

  return data;
}

/**
 * Create a PayGate payment
 * Returns a checkout URL where the user can pay
 */
export async function createPayGatePayment(
  params: CreatePaymentParams,
  config: PayGateConfig
): Promise<{
  success: boolean;
  checkoutUrl: string;
  trackingAddress: string;
  polygonAddress: string;
  callbackUrl: string;
}> {
  // Generate temporary wallet
  const walletData = await generatePaymentWallet(
    config.walletAddress,
    params.callbackUrl
  );

  // Build checkout URL - address_in is already URL-encoded from API
  // Don't use URLSearchParams for address to avoid double-encoding
  let checkoutUrl = `${PAYGATE_CHECKOUT}/pay.php?address=${walletData.address_in}&amount=${params.amount}&currency=${params.currency}`;

  if (params.email) {
    checkoutUrl += `&email=${encodeURIComponent(params.email)}`;
  }

  return {
    success: true,
    checkoutUrl,
    trackingAddress: walletData.address_in,
    polygonAddress: walletData.polygon_address_in,
    callbackUrl: walletData.callback_url,
  };
}

/**
 * Check if PayGate is configured
 */
export function isPayGateConfigured(): boolean {
  const wallet = process.env.PAYGATE_WALLET_ADDRESS;
  if (!wallet) return false;
  // Accept ETH/Polygon (0x...) or BTC (bc1.../1.../3...) addresses
  return wallet.startsWith("0x") || wallet.startsWith("bc1") || wallet.startsWith("1") || wallet.startsWith("3");
}

/**
 * Get PayGate config from environment
 */
export function getPayGateConfig(): PayGateConfig {
  const walletAddress = process.env.PAYGATE_WALLET_ADDRESS;
  if (!walletAddress) {
    throw new Error("PAYGATE_WALLET_ADDRESS not configured");
  }
  // Validate wallet address format (ETH/Polygon or BTC)
  const isValidEth = walletAddress.startsWith("0x") && walletAddress.length === 42;
  const isValidBtc = walletAddress.startsWith("bc1") || walletAddress.startsWith("1") || walletAddress.startsWith("3");
  if (!isValidEth && !isValidBtc) {
    throw new Error("PAYGATE_WALLET_ADDRESS must be a valid ETH (0x...) or BTC (bc1.../1.../3...) address");
  }
  return { walletAddress };
}

/**
 * Validate webhook callback
 */
export function validatePayGateCallback(params: {
  orderId: string;
  nonce: string;
  txidOut: string;
  valueCoin: string;
  expectedNonce: string;
  expectedAmount: number;
}): {
  isValid: boolean;
  isPaid: boolean;
  isPartial: boolean;
  paidAmount: number;
  txid: string;
} {
  const { nonce, txidOut, valueCoin, expectedNonce, expectedAmount } = params;

  // Verify nonce
  if (nonce !== expectedNonce) {
    return {
      isValid: false,
      isPaid: false,
      isPartial: false,
      paidAmount: 0,
      txid: txidOut,
    };
  }

  const paidAmount = parseFloat(valueCoin);
  const threshold = 0.60 * expectedAmount; // 60% threshold

  return {
    isValid: true,
    isPaid: paidAmount >= threshold,
    isPartial: paidAmount < expectedAmount && paidAmount >= threshold,
    paidAmount,
    txid: txidOut,
  };
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
