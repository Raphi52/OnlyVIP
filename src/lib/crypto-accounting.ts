import { prisma } from "@/lib/prisma";

const ACCOUNTING_API_URL = process.env.CRYPTO_ACCOUNTING_URL;
const ACCOUNTING_API_KEY = process.env.CRYPTO_ACCOUNTING_API_KEY;

interface AccountingPayload {
  externalId: string;
  amountUsd: number;
  amountCrypto: number;
  cryptoCurrency: string;
  productType: string;
  productName?: string;
  status: string;
  paymentDate: string;
  userEmail?: string;
  userId?: string;
  walletAddress?: string;
  transactionHash?: string;
  exchangeRate?: number;
  nowPaymentsId?: string;
  actuallyPaid?: number;
  metadata?: Record<string, unknown>;
}

async function queueForRetry(payload: AccountingPayload, error: string): Promise<void> {
  try {
    await prisma.accountingQueue.create({
      data: {
        payload: JSON.stringify(payload),
        status: "PENDING",
        attempts: 1,
        lastError: error,
        nextRetryAt: new Date(Date.now() + 60 * 1000), // Retry in 1 minute
      },
    });
    console.log("[Accounting] Payment queued for retry:", payload.externalId);
  } catch (queueError) {
    console.error("[Accounting] Failed to queue payment:", queueError);
  }
}

export async function sendToAccounting(payload: AccountingPayload): Promise<void> {
  if (!ACCOUNTING_API_URL || !ACCOUNTING_API_KEY) {
    console.log("[Accounting] Not configured, skipping");
    return;
  }

  try {
    const response = await fetch(`${ACCOUNTING_API_URL}/api/webhook/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ACCOUNTING_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Accounting] Failed to send payment:", error);
      await queueForRetry(payload, error);
    } else {
      const result = await response.json();
      console.log("[Accounting] Payment sent:", result.status);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Accounting] Webhook error:", errorMessage);
    await queueForRetry(payload, errorMessage);
  }
}

export async function processAccountingQueue(): Promise<{ processed: number; failed: number }> {
  if (!ACCOUNTING_API_URL || !ACCOUNTING_API_KEY) {
    return { processed: 0, failed: 0 };
  }

  const pendingItems = await prisma.accountingQueue.findMany({
    where: {
      status: "PENDING",
      nextRetryAt: { lte: new Date() },
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  let processed = 0;
  let failed = 0;

  for (const item of pendingItems) {
    await prisma.accountingQueue.update({
      where: { id: item.id },
      data: { status: "PROCESSING" },
    });

    try {
      const payload = JSON.parse(item.payload) as AccountingPayload;

      const response = await fetch(`${ACCOUNTING_API_URL}/api/webhook/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ACCOUNTING_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await prisma.accountingQueue.update({
          where: { id: item.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
        processed++;
        console.log("[Accounting Queue] Processed:", payload.externalId);
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const newAttempts = item.attempts + 1;
      const backoffMinutes = Math.pow(2, newAttempts); // Exponential backoff

      await prisma.accountingQueue.update({
        where: { id: item.id },
        data: {
          status: newAttempts >= 5 ? "FAILED" : "PENDING",
          attempts: newAttempts,
          lastError: errorMessage,
          nextRetryAt: new Date(Date.now() + backoffMinutes * 60 * 1000),
        },
      });
      failed++;
      console.error("[Accounting Queue] Failed:", item.id, errorMessage);
    }
  }

  return { processed, failed };
}

export function mapCryptoCurrency(currency: string): string {
  const mapping: Record<string, string> = {
    btc: "BTC",
    eth: "ETH",
    eur: "EUR",
    usd: "USD",
  };
  return mapping[currency.toLowerCase()] || currency.toUpperCase();
}

export function mapPaymentStatus(status: string): string {
  const mapping: Record<string, string> = {
    waiting: "PENDING",
    confirming: "CONFIRMING",
    confirmed: "COMPLETED",
    sending: "COMPLETED",
    partially_paid: "PENDING",
    finished: "COMPLETED",
    failed: "FAILED",
    refunded: "REFUNDED",
    expired: "EXPIRED",
  };
  return mapping[status.toLowerCase()] || status.toUpperCase();
}
