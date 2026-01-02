"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  CheckCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Zap,
  Shield,
  Clock,
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
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    gradient: "from-orange-500 to-amber-500",
    icon: "₿"
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    gradient: "from-blue-500 to-indigo-500",
    icon: "Ξ"
  },
  {
    id: "usdttrc20",
    name: "USDT TRC20",
    symbol: "USDT",
    color: "#26A17B",
    gradient: "from-emerald-500 to-teal-500",
    icon: "₮"
  },
  {
    id: "ltc",
    name: "Litecoin",
    symbol: "LTC",
    color: "#345D9D",
    gradient: "from-slate-400 to-slate-500",
    icon: "Ł"
  },
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
    qrCodeUrl?: string;
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
        qrCodeUrl: data.qrCodeUrl,
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
  const selectedCryptoData = cryptoCurrencies.find(c => c.id === selectedCrypto);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="relative w-full sm:max-w-md overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-orange-500/20 via-purple-500/20 to-transparent rounded-t-3xl sm:rounded-3xl blur-sm" />

          <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {!cryptoPayment ? (
              /* Step 1: Select Crypto */
              <>
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                          <span className="text-2xl font-bold text-white">₿</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-2 border-[#0a0a0c]">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Crypto Payment
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Fast & anonymous payment
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Amount badge */}
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">
                      {credits.toLocaleString()} credits
                    </span>
                    <span className="text-sm text-gray-400">
                      (${price})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Select your preferred cryptocurrency:
                  </p>

                  {/* Crypto selection grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {cryptoCurrencies.map((crypto) => (
                      <motion.button
                        key={crypto.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCrypto(crypto.id)}
                        className={cn(
                          "relative p-4 rounded-2xl border-2 transition-all overflow-hidden",
                          selectedCrypto === crypto.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 hover:border-white/20 bg-white/5"
                        )}
                      >
                        {selectedCrypto === crypto.id && (
                          <motion.div
                            layoutId="crypto-selection"
                            className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                          />
                        )}
                        <div className="relative flex flex-col items-center gap-2">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                              crypto.gradient
                            )}
                            style={{ boxShadow: `0 8px 24px ${crypto.color}40` }}
                          >
                            <span className="text-xl font-bold text-white">
                              {crypto.icon}
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-white text-sm">
                              {crypto.symbol}
                            </p>
                            <p className="text-xs text-gray-500">
                              {crypto.name}
                            </p>
                          </div>
                        </div>
                        {selectedCrypto === crypto.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={generatePayment}
                      disabled={!selectedCrypto || isLoading}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold transition-all",
                        selectedCrypto && !isLoading
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
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
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              /* Step 2: Payment Instructions */
              <>
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br",
                            selectedCryptoData?.gradient || "from-orange-500 to-amber-600"
                          )}
                          style={{ boxShadow: `0 8px 24px ${selectedCryptoData?.color || '#F7931A'}40` }}
                        >
                          <span className="text-2xl font-bold text-white">
                            {selectedCryptoData?.icon || "₿"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Send {cryptoPayment.payCurrency.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {credits.toLocaleString()} credits
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 space-y-4">
                  {/* QR Code */}
                  {cryptoPayment.qrCodeUrl && (
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-2xl">
                        <img
                          src={cryptoPayment.qrCodeUrl}
                          alt="Payment QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount to send */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Send exactly
                    </p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {cryptoPayment.payAmount}{" "}
                      <span className="text-purple-400">{cryptoPayment.payCurrency.toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Wallet Address */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      To this wallet address
                    </p>
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                      <div className="flex items-center gap-3">
                        <code className="flex-1 text-sm text-purple-400 break-all font-mono leading-relaxed">
                          {cryptoPayment.payAddress}
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={copyAddress}
                          className={cn(
                            "flex-shrink-0 p-3 rounded-xl transition-all",
                            addressCopied
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-gray-400 hover:bg-white/20"
                          )}
                        >
                          {addressCopied ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                    {addressCopied && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-emerald-400 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Copied to clipboard!
                      </motion.p>
                    )}
                  </div>

                  {/* Info badges */}
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-white/5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Auto-credited</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-white/5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-gray-400">Secure</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm text-orange-400">
                      <strong>Important:</strong> Send the exact amount to avoid delays. Wrong amounts may require manual processing.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/5 mt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                    >
                      Done
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        window.open(`https://blockchair.com/search?q=${cryptoPayment.payAddress}`, "_blank");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                    >
                      Track Payment
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
