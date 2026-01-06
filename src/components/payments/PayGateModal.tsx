"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Loader2,
  ExternalLink,
  AlertCircle,
  X,
  Sparkles,
  Shield,
  Zap,
  Gift,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PayGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  credits: number;
  bonusCredits?: number;
  type?: "credits" | "subscription" | "ppv" | "tip";
  metadata?: Record<string, any>;
}

export function PayGateModal({
  isOpen,
  onClose,
  amount,
  credits,
  bonusCredits = 0,
  type = "credits",
  metadata = {},
}: PayGateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/paygate/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          ...metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // Redirect to PayGate checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
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
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
          {/* ✨ HOLOGRAPHIC EFFECT for modal */}
          {/* Outer glow pulse */}
          <motion.div
            className="absolute -inset-4 rounded-[2rem] opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.3) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.25, 0.4, 0.25]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Animated rainbow border */}
          <motion.div
            className="absolute -inset-[2px] rounded-t-3xl sm:rounded-3xl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
              backgroundSize: '300% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner gold border */}
          <div className="absolute -inset-[1px] rounded-t-3xl sm:rounded-3xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 pointer-events-none" />

          {/* Sparkle particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full z-10 pointer-events-none"
              style={{
                left: `${15 + i * 18}%`,
                top: `${8 + (i % 3) * 15}%`,
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="relative bg-[#0a0a0c]/98 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
            {/* Holographic interior effect */}
            <motion.div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.12) 15%, rgba(0,255,255,0.12) 30%, rgba(255,255,0,0.08) 45%, rgba(128,0,255,0.12) 60%, rgba(0,255,128,0.08) 75%, transparent 100%)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Secondary sweep */}
            <motion.div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(-45deg, transparent 0%, rgba(0,200,255,0.1) 25%, rgba(255,100,200,0.1) 50%, rgba(100,255,150,0.1) 75%, transparent 100%)',
                backgroundSize: '250% 250%',
              }}
              animate={{
                backgroundPosition: ['100% 0%', '0% 100%', '100% 0%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-[#0a0a0c]">
                      <Wallet className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Card Payment
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Instant & secure checkout
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Order Summary</span>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      No KYC
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                      Instant
                    </span>
                  </div>
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
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-xl font-bold text-emerald-400">
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
              <div className="flex items-center justify-center gap-3 py-2">
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
                  <div className="w-8 h-5 rounded bg-black flex items-center justify-center border border-white/10">
                    <span className="text-[7px] font-medium text-white">Pay</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                  <div className="w-8 h-5 rounded bg-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-black">G Pay</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400 text-center">Instant</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-gray-400 text-center">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400 text-center">No KYC</span>
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
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
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
                Secure payment - No chargebacks - Instant delivery
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
