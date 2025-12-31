"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  CheckCircle,
  Loader2,
  Bitcoin,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "media" | "subscription" | "ppv" | "tip" | "credits";
  mediaId?: string;
  planId?: string;
  billingInterval?: string;
  messageId?: string;
  amount?: number;
  title: string;
  price: number;
  metadata?: Record<string, any>;
}

const cryptoCurrencies = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", color: "#F7931A" },
  { id: "eth", name: "Ethereum", symbol: "ETH", color: "#627EEA" },
  { id: "usdttrc20", name: "USDT (TRC20)", symbol: "USDT", color: "#26A17B" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", color: "#345D9D" },
];

export function CryptoPaymentModal({
  isOpen,
  onClose,
  type,
  mediaId,
  planId,
  billingInterval,
  messageId,
  amount,
  title,
  price,
  metadata,
}: CryptoPaymentModalProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState<{
    payAddress: string;
    payAmount: number;
    payCurrency: string;
  } | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCrypto(null);
      setCryptoPayment(null);
      setAddressCopied(false);
    }
  }, [isOpen]);

  // Generate crypto payment
  const generatePayment = async () => {
    if (!selectedCrypto) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/crypto/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          currency: selectedCrypto,
          mediaId,
          planId,
          billingInterval,
          messageId,
          amount: amount || price,
          ...metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const data = await response.json();
      setCryptoPayment({
        payAddress: data.payAddress,
        payAmount: data.payAmount,
        payCurrency: data.payCurrency,
      });
    } catch (error) {
      console.error("Crypto payment error:", error);
      alert(error instanceof Error ? error.message : "Error creating payment");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy address
  const copyAddress = async () => {
    if (cryptoPayment?.payAddress) {
      await navigator.clipboard.writeText(cryptoPayment.payAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 3000);
    }
  };

  // Get credits from price (100 credits = $1)
  const credits = Math.floor(price * 100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-[#0d0d0f] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        >
          {!cryptoPayment ? (
            /* Step 1: Select Crypto */
            <>
              {/* Header */}
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Crypto Payment
                    </h3>
                    <p className="text-sm text-gray-400">
                      Purchase {credits.toLocaleString()} credits
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-400">
                  Select which cryptocurrency you want to pay with:
                </p>

                {/* Crypto selection grid */}
                <div className="grid grid-cols-2 gap-3">
                  {cryptoCurrencies.map((crypto) => (
                    <button
                      key={crypto.id}
                      onClick={() => setSelectedCrypto(crypto.id)}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center gap-3",
                        selectedCrypto === crypto.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 hover:border-purple-500/50 bg-white/5"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${crypto.color}20` }}
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ color: crypto.color }}
                        >
                          {crypto.symbol.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white text-sm">
                          {crypto.symbol}
                        </p>
                        <p className="text-xs text-gray-500">
                          {crypto.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePayment}
                  disabled={!selectedCrypto || isLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all",
                    selectedCrypto && !isLoading
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:opacity-90"
                      : "bg-white/10 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Step 2: Payment Instructions */
            <>
              {/* Header */}
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Crypto Payment Instructions
                    </h3>
                    <p className="text-sm text-gray-400">
                      Purchase {credits.toLocaleString()} credits
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Send exactly this amount
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <span className="text-orange-400 font-mono font-bold">
                        {cryptoPayment.payAmount} {cryptoPayment.payCurrency.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      Send to this wallet address
                    </p>
                    <p className="text-sm text-gray-400 mt-1 mb-2">
                      Copy and paste this address in your wallet:
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                      <code className="flex-1 text-xs text-purple-400 break-all font-mono">
                        {cryptoPayment.payAddress}
                      </code>
                      <button
                        onClick={copyAddress}
                        className={cn(
                          "flex-shrink-0 p-2 rounded-lg transition-all",
                          addressCopied
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        )}
                      >
                        {addressCopied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {addressCopied && (
                      <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Address copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Credits added automatically
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your credits will be added to your account within minutes once we receive the payment.
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <p className="text-sm text-orange-400">
                    <strong>Important:</strong> Make sure to copy the wallet address correctly. Funds sent to wrong addresses cannot be recovered.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    // Open blockchain explorer if possible
                    window.open(`https://blockchair.com/search?q=${cryptoPayment.payAddress}`, "_blank");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Track Payment
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
