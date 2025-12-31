"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

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
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Card Payment
                </h3>
                <p className="text-sm text-gray-400">
                  Purchase {totalCredits.toLocaleString()} credits
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
                  Pay with card via MixPay
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  You&apos;ll be redirected to MixPay to complete payment using Visa, Mastercard, or crypto.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-white">
                  Complete the payment
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  No KYC required for purchases under €700. Fast and secure.
                </p>
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
                  Your credits will be added within minutes once payment is confirmed.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-medium">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Credits</span>
                <span className="text-white font-medium">{credits.toLocaleString()}</span>
              </div>
              {bonusCredits > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Bonus credits</span>
                  <span className="text-green-400 font-medium">+{bonusCredits.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between">
                <span className="text-white font-medium">Total credits</span>
                <span className="text-purple-400 font-bold">{totalCredits.toLocaleString()}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-400">
                <strong>Secure:</strong> MixPay accepts Visa, Mastercard, and 50+ cryptocurrencies with no KYC required.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Pay ${amount}
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
