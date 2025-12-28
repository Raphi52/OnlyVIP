/**
 * MoonPay Widget Integration
 * Users buy crypto directly, sent to your wallet
 * No merchant KYC required - users do their own KYC with MoonPay
 */

const MOONPAY_API_KEY = process.env.NEXT_PUBLIC_MOONPAY_API_KEY || "";
const MOONPAY_BASE_URL = "https://buy.moonpay.com";

export interface MoonPayWidgetParams {
  walletAddress: string;
  cryptoCurrency: string; // btc, eth
  fiatCurrency?: string; // eur, usd
  fiatAmount?: number;
  externalTransactionId?: string;
  redirectUrl?: string;
  email?: string;
}

/**
 * Get wallet address for receiving payments
 * @param currency - BTC or ETH
 * @param creatorWallet - Optional creator wallet from database (takes precedence)
 */
export function getWalletAddress(currency: string, creatorWallet?: string | null): string {
  // Use creator wallet if provided
  if (creatorWallet) {
    return creatorWallet;
  }

  // Fallback to env for backward compatibility
  const addresses: Record<string, string | undefined> = {
    BTC: process.env.WALLET_BTC,
    ETH: process.env.WALLET_ETH,
  };

  const address = addresses[currency.toUpperCase()];
  if (!address) {
    throw new Error(`No wallet configured for ${currency}`);
  }
  return address;
}

/**
 * Generate MoonPay widget URL
 * User is redirected here to buy crypto
 */
export function generateMoonPayUrl(params: MoonPayWidgetParams): string {
  const queryParams = new URLSearchParams();

  // API key (publishable)
  if (MOONPAY_API_KEY) {
    queryParams.set("apiKey", MOONPAY_API_KEY);
  }

  // Crypto to buy
  queryParams.set("currencyCode", params.cryptoCurrency.toLowerCase());

  // Your wallet address (where crypto goes)
  queryParams.set("walletAddress", params.walletAddress);

  // Fiat currency
  if (params.fiatCurrency) {
    queryParams.set("baseCurrencyCode", params.fiatCurrency.toLowerCase());
  }

  // Amount in fiat
  if (params.fiatAmount) {
    queryParams.set("baseCurrencyAmount", params.fiatAmount.toString());
  }

  // Track which order this is for
  if (params.externalTransactionId) {
    queryParams.set("externalTransactionId", params.externalTransactionId);
  }

  // Redirect after purchase
  if (params.redirectUrl) {
    queryParams.set("redirectURL", params.redirectUrl);
  }

  // Pre-fill email
  if (params.email) {
    queryParams.set("email", params.email);
  }

  // Lock the amount so user can't change it
  if (params.fiatAmount) {
    queryParams.set("lockAmount", "true");
  }

  // Show only the crypto we want
  queryParams.set("showOnlyCurrencies", params.cryptoCurrency.toLowerCase());

  return `${MOONPAY_BASE_URL}?${queryParams.toString()}`;
}

/**
 * Check if MoonPay is configured
 * @param creatorWalletBtc - Optional creator BTC wallet from database
 * @param creatorWalletEth - Optional creator ETH wallet from database
 */
export function isMoonPayConfigured(creatorWalletBtc?: string | null, creatorWalletEth?: string | null): boolean {
  return !!(creatorWalletBtc || creatorWalletEth || process.env.WALLET_BTC || process.env.WALLET_ETH);
}

/**
 * Map currency to MoonPay currency code
 */
export function getMoonPayCurrencyCode(currency: string): string {
  const mapping: Record<string, string> = {
    BTC: "btc",
    ETH: "eth",
    BITCOIN: "btc",
    ETHEREUM: "eth",
  };
  return mapping[currency.toUpperCase()] || currency.toLowerCase();
}
