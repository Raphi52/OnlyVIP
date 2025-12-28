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
 * Generate ChangeHero buy URL
 * User will buy crypto on ChangeHero and send to our wallet
 */
export function generateChangeHeroUrl(params: ChangeHeroParams): string {
  const cryptoPath = params.cryptoCurrency.toLowerCase();
  const queryParams = new URLSearchParams();

  // Set default amount
  if (params.fiatAmount) {
    queryParams.set("amount", params.fiatAmount.toString());
  }

  // Set fiat currency (default EUR)
  queryParams.set("from", params.fiatCurrency?.toLowerCase() || "eur");

  const queryString = queryParams.toString();
  return `${CHANGEHERO_BUY_URL}/${cryptoPath}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Check if ChangeHero payments are configured
 * @param creatorWalletBtc - Optional creator BTC wallet from database
 * @param creatorWalletEth - Optional creator ETH wallet from database
 */
export function isChangeHeroConfigured(creatorWalletBtc?: string | null, creatorWalletEth?: string | null): boolean {
  return !!(creatorWalletBtc || creatorWalletEth || process.env.WALLET_BTC || process.env.WALLET_ETH);
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
