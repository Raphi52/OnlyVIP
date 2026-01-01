"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  X,
  CreditCard,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
  Calendar,
  Mail,
  MessageSquare,
  Hash,
  Wallet,
  DollarSign,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DisputeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const cryptoCurrencies = [
  { id: "btc", name: "Bitcoin (BTC)" },
  { id: "eth", name: "Ethereum (ETH)" },
  { id: "usdt", name: "USDT (TRC20/ERC20)" },
  { id: "usdc", name: "USDC" },
  { id: "ltc", name: "Litecoin (LTC)" },
  { id: "sol", name: "Solana (SOL)" },
  { id: "other", name: "Other" },
];

export function DisputeForm({ isOpen, onClose }: DisputeFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("crypto");
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/payments/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          amount: parseFloat(amount),
          transactionHash: paymentMethod === "crypto" ? transactionHash : undefined,
          walletAddress: paymentMethod === "crypto" ? walletAddress : undefined,
          paymentDate,
          cryptoCurrency: paymentMethod === "crypto" ? cryptoCurrency : undefined,
          email,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit dispute");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentMethod("crypto");
    setAmount("");
    setTransactionHash("");
    setWalletAddress("");
    setPaymentDate("");
    setCryptoCurrency("");
    setEmail("");
    setDescription("");
    setIsSuccess(false);
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
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
            className="relative w-full sm:max-w-md max-h-[90vh] overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-orange-500/20 via-purple-500/10 to-transparent rounded-t-3xl sm:rounded-3xl blur-sm" />

            <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
              {/* Drag indicator for mobile */}
              <div className="sm:hidden flex justify-center pt-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header - Sticky */}
              <div className="sticky top-0 z-10 p-6 pb-4 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <HelpCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-[#0a0a0c]">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Report Issue
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Missing credits? We&apos;ll help
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-4">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h4 className="text-2xl font-bold text-white mb-2">
                      Submitted!
                    </h4>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      We&apos;ll review your case and respond within 24-48 hours. Check your email for updates.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClose}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Payment Method Used
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMethod("card")}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                            paymentMethod === "card"
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/10 hover:border-white/20 bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            paymentMethod === "card"
                              ? "bg-blue-500/20"
                              : "bg-white/10"
                          )}>
                            <CreditCard className={cn(
                              "w-5 h-5",
                              paymentMethod === "card" ? "text-blue-400" : "text-gray-400"
                            )} />
                          </div>
                          <span className={cn(
                            "font-medium",
                            paymentMethod === "card" ? "text-blue-400" : "text-white"
                          )}>
                            Card
                          </span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMethod("crypto")}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                            paymentMethod === "crypto"
                              ? "border-orange-500 bg-orange-500/10"
                              : "border-white/10 hover:border-white/20 bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            paymentMethod === "crypto"
                              ? "bg-orange-500/20"
                              : "bg-white/10"
                          )}>
                            <span className={cn(
                              "text-lg font-bold",
                              paymentMethod === "crypto" ? "text-orange-400" : "text-gray-400"
                            )}>₿</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            paymentMethod === "crypto" ? "text-orange-400" : "text-white"
                          )}>
                            Crypto
                          </span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Amount Paid (USD)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="50.00"
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Payment Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          required
                          max={new Date().toISOString().split("T")[0]}
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Crypto-specific fields */}
                    {paymentMethod === "crypto" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5"
                      >
                        {/* Cryptocurrency */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Cryptocurrency Used
                          </label>
                          <select
                            value={cryptoCurrency}
                            onChange={(e) => setCryptoCurrency(e.target.value)}
                            required
                            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all appearance-none"
                          >
                            <option value="" className="bg-gray-900">Select cryptocurrency</option>
                            {cryptoCurrencies.map((crypto) => (
                              <option key={crypto.id} value={crypto.id} className="bg-gray-900">
                                {crypto.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Transaction Hash */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Transaction Hash (TXID)
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={transactionHash}
                              onChange={(e) => setTransactionHash(e.target.value)}
                              placeholder="0x1234...abcd"
                              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all font-mono text-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5">
                            Find this in your wallet or exchange history
                          </p>
                        </div>

                        {/* Wallet Address */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Your Wallet Address
                          </label>
                          <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={walletAddress}
                              onChange={(e) => setWalletAddress(e.target.value)}
                              placeholder="0x1234... or bc1q..."
                              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all font-mono text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Contact Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        What Happened?
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please describe the issue..."
                          required
                          rows={3}
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all resize-none"
                        />
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

                    {/* Info box */}
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-blue-400">
                        We take all disputes seriously. Providing accurate information helps us resolve your case faster.
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
