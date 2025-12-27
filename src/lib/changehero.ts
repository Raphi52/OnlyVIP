/**
 * ChangeHero Integration
 * Redirect users to buy crypto with credit card
 * No KYC required for merchant, light KYC for users under €700
 */

const CHANGEHERO_BUY_URL = "https://changehero.io/buy";

export interface ChangeHeroParams {
  cryptoCurrency: "btc" | "eth";
  fiatAmount?: number;
  fiatCurrency?: string;
}

/**
 * Get wallet address for receiving payments
 */
export function getWalletAddress(currency: string): string {
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
 * Generate ChangeHero buy URL
 * User will buy crypto on ChangeHero and send to our wallet
 */
export function generateChangeHeroUrl(params: ChangeHeroParams): string {
  const cryptoPath = params.cryptoCurrency.toLowerCase();
  return `${CHANGEHERO_BUY_URL}/${cryptoPath}`;
}

/**
 * Check if ChangeHero payments are configured
 */
export function isChangeHeroConfigured(): boolean {
  return !!(process.env.WALLET_BTC || process.env.WALLET_ETH);
}

/**
 * Get display name for crypto
 */
export function getCryptoDisplayName(currency: string): string {
  const names: Record<string, string> = {
    btc: "Bitcoin",
    eth: "Ethereum",
    BTC: "Bitcoin",
    ETH: "Ethereum",
  };
  return names[currency] || currency.toUpperCase();
}
