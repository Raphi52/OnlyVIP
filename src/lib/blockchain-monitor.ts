// Blockchain monitoring for incoming payments
// Uses Blockstream API for Bitcoin (free, no KYC)

interface BTCTransaction {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
  };
  vout: Array<{
    scriptpubkey_address: string;
    value: number; // in satoshis
  }>;
}

interface PendingPayment {
  id: string;
  walletAddress: string;
  expectedAmount: number; // in satoshis for BTC
  currency: string;
  type: 'subscription' | 'ppv' | 'tip';
  userId: string;
  creatorId?: string;
  planId?: string;
  mediaId?: string;
  createdAt: Date;
}

// Get recent transactions for a Bitcoin address
export async function getBTCTransactions(address: string): Promise<BTCTransaction[]> {
  try {
    const response = await fetch(
      `https://blockstream.info/api/address/${address}/txs`
    );

    if (!response.ok) {
      throw new Error(`Blockstream API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching BTC transactions:", error);
    return [];
  }
}

// Get address balance
export async function getBTCBalance(address: string): Promise<{
  confirmed: number;
  unconfirmed: number;
}> {
  try {
    const response = await fetch(
      `https://blockstream.info/api/address/${address}`
    );

    if (!response.ok) {
      throw new Error(`Blockstream API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      confirmed: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
      unconfirmed: data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum,
    };
  } catch (error) {
    console.error("Error fetching BTC balance:", error);
    return { confirmed: 0, unconfirmed: 0 };
  }
}

// Check if a specific amount was received (with tolerance for fees)
export async function checkPaymentReceived(
  address: string,
  expectedAmountSatoshis: number,
  tolerancePercent: number = 5
): Promise<{
  received: boolean;
  txid?: string;
  amount?: number;
  confirmed?: boolean;
}> {
  const transactions = await getBTCTransactions(address);

  const minAmount = expectedAmountSatoshis * (1 - tolerancePercent / 100);
  const maxAmount = expectedAmountSatoshis * (1 + tolerancePercent / 100);

  for (const tx of transactions) {
    for (const output of tx.vout) {
      if (output.scriptpubkey_address === address) {
        if (output.value >= minAmount && output.value <= maxAmount) {
          return {
            received: true,
            txid: tx.txid,
            amount: output.value,
            confirmed: tx.status.confirmed,
          };
        }
      }
    }
  }

  return { received: false };
}

// Convert USD to satoshis using current BTC price
export async function usdToSatoshis(usdAmount: number): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error("CoinGecko API error");
    }

    const data = await response.json();
    const btcPrice = data.bitcoin.usd;
    const btcAmount = usdAmount / btcPrice;

    return Math.round(btcAmount * 100000000); // Convert to satoshis
  } catch (error) {
    console.error("Error converting USD to satoshis:", error);
    return 0;
  }
}

// Ethereum support using public API
export async function getETHTransactions(address: string): Promise<any[]> {
  try {
    // Using Etherscan public API (rate limited but free)
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken`
    );

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Error fetching ETH transactions:", error);
    return [];
  }
}
