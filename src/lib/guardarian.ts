/**
 * Guardarian Fiat-to-Crypto Payment Service
 * Documentation: https://guardarian.com/api-doc
 *
 * No KYC required under €150 per transaction
 */

const GUARDARIAN_API_URL = "https://api-payments.guardarian.com/v1";
const GUARDARIAN_API_KEY = process.env.GUARDARIAN_API_KEY;

export interface GuardarianTransaction {
  id: string;
  status: string;
  redirect_url: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  payout_address?: string;
  created_at: string;
  customer_email?: string;
}

export interface CreateTransactionParams {
  fromAmount: number;
  fromCurrency: string; // EUR, USD, etc.
  toCurrency: string;   // BTC, ETH
  toNetwork?: string;   // bitcoin, ethereum
  payoutAddress: string;
  customerEmail?: string;
  externalId?: string;
  successUrl?: string;
  failureUrl?: string;
}

export interface EstimateResult {
  from_amount: number;
  to_amount: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  fee: number;
}

/**
 * Check if Guardarian is configured
 */
export function isGuardarianConfigured(): boolean {
  return !!GUARDARIAN_API_KEY;
}

/**
 * Get exchange rate estimate
 */
export async function getEstimate(
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number
): Promise<EstimateResult | null> {
  if (!GUARDARIAN_API_KEY) {
    console.error("[Guardarian] API key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      from_currency: fromCurrency.toUpperCase(),
      to_currency: toCurrency.toUpperCase(),
      from_amount: fromAmount.toString(),
    });

    const response = await fetch(`${GUARDARIAN_API_URL}/estimate?${params}`, {
      headers: {
        "x-api-key": GUARDARIAN_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Guardarian] Estimate error:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Guardarian] Estimate failed:", error);
    return null;
  }
}

/**
 * Create a fiat-to-crypto transaction
 * Returns a redirect URL where user completes payment
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<GuardarianTransaction | null> {
  if (!GUARDARIAN_API_KEY) {
    console.error("[Guardarian] API key not configured");
    return null;
  }

  try {
    const body: Record<string, any> = {
      from_amount: params.fromAmount,
      from_currency: params.fromCurrency.toUpperCase(),
      to_currency: params.toCurrency.toUpperCase(),
      payout_info: {
        payout_address: params.payoutAddress,
      },
    };

    if (params.toNetwork) {
      body.to_network = params.toNetwork;
    }

    if (params.customerEmail) {
      body.customer = {
        contact_info: {
          email: params.customerEmail,
        },
      };
    }

    if (params.externalId) {
      body.external_partner_link_id = params.externalId;
    }

    if (params.successUrl || params.failureUrl) {
      body.redirects = {};
      if (params.successUrl) body.redirects.successful = params.successUrl;
      if (params.failureUrl) body.redirects.failed = params.failureUrl;
    }

    const response = await fetch(`${GUARDARIAN_API_URL}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GUARDARIAN_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Guardarian] Create transaction error:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Guardarian] Create transaction failed:", error);
    return null;
  }
}

/**
 * Get transaction status by ID
 */
export async function getTransaction(
  transactionId: string
): Promise<GuardarianTransaction | null> {
  if (!GUARDARIAN_API_KEY) {
    console.error("[Guardarian] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${GUARDARIAN_API_URL}/transaction/${transactionId}`,
      {
        headers: {
          "x-api-key": GUARDARIAN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Guardarian] Get transaction error:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Guardarian] Get transaction failed:", error);
    return null;
  }
}

/**
 * Map Guardarian status to our internal status
 */
export function mapGuardarianStatus(status: string): string {
  const mapping: Record<string, string> = {
    new: "PENDING",
    pending: "PENDING",
    on_hold: "PENDING",
    exchanging: "CONFIRMING",
    sending: "CONFIRMING",
    finished: "COMPLETED",
    failed: "FAILED",
    refunded: "REFUNDED",
    expired: "EXPIRED",
    cancelled: "CANCELLED",
  };
  return mapping[status.toLowerCase()] || status.toUpperCase();
}

/**
 * Get wallet address for receiving payments
 */
export function getPayoutAddress(currency: string): string {
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
