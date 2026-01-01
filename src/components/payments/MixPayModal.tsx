"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Shield,
  Zap,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MixPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  credits: number;
  bonusCredits?: number;
}

export function MixPayModal({
  isOpen,
  onClose,
  amount,
  credits,
  bonusCredits = 0,
}: MixPayModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/mixpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // Redirect to MixPay payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const totalCredits = credits + bonusCredits;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
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
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-md overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-transparent rounded-t-3xl sm:rounded-3xl blur-sm" />

          <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center border-2 border-[#0a0a0c]">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Card Payment
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Secure checkout via MixPay
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
              {/* Order Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Order Summary</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    No KYC
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Base credits</span>
                    <span className="text-white font-medium">{credits.toLocaleString()}</span>
                  </div>

                  {bonusCredits > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-emerald-400">
                        <Gift className="w-4 h-4" />
                        Bonus credits
                      </span>
                      <span className="text-emerald-400 font-medium">+{bonusCredits.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total credits</span>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xl font-bold text-purple-400">
                          {totalCredits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">Amount to pay</span>
                      <span className="text-lg font-semibold text-white">${amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                  <div className="w-8 h-5 rounded bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">VISA</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                  <div className="w-8 h-5 rounded bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <div className="flex">
                      <div className="w-2 h-2 rounded-full bg-red-300 opacity-80"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 -ml-1 opacity-80"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                  <div className="w-8 h-5 rounded bg-black flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">Pay</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">Instant credit</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-400">256-bit SSL</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-white/5 mt-4">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold transition-all",
                    !isLoading
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                      : "bg-white/10 text-gray-500"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ${amount}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-3">
                You&apos;ll be redirected to MixPay secure checkout
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
