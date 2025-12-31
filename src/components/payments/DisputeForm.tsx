"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  X,
  CreditCard,
  Bitcoin,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
  Calendar,
  DollarSign,
  Mail,
  MessageSquare,
  Hash,
  Wallet,
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#0d0d0f] border border-white/10 rounded-t-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-5 border-b border-white/10 bg-[#0d0d0f]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Report Missing Credits
                    </h3>
                    <p className="text-sm text-gray-400">
                      Submit a dispute for review
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    Dispute Submitted
                  </h4>
                  <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                    We&apos;ll review your case and respond within 24-48 hours. Check your email for updates.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Payment Method Used
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          paymentMethod === "card"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 hover:border-blue-500/50"
                        )}
                      >
                        <CreditCard className={cn(
                          "w-5 h-5",
                          paymentMethod === "card" ? "text-blue-400" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          paymentMethod === "card" ? "text-blue-400" : "text-white"
                        )}>
                          Card
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("crypto")}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          paymentMethod === "crypto"
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-white/10 hover:border-orange-500/50"
                        )}
                      >
                        <Bitcoin className={cn(
                          "w-5 h-5",
                          paymentMethod === "crypto" ? "text-orange-400" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          paymentMethod === "crypto" ? "text-orange-400" : "text-white"
                        )}>
                          Crypto
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Amount Paid (USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 50.00"
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Crypto-specific fields */}
                  {paymentMethod === "crypto" && (
                    <>
                      {/* Cryptocurrency */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Cryptocurrency Used
                        </label>
                        <select
                          value={cryptoCurrency}
                          onChange={(e) => setCryptoCurrency(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="">Select cryptocurrency</option>
                          {cryptoCurrencies.map((crypto) => (
                            <option key={crypto.id} value={crypto.id}>
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
                        <input
                          type="text"
                          value={transactionHash}
                          onChange={(e) => setTransactionHash(e.target.value)}
                          placeholder="e.g. 0x1234...abcd"
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Find this in your wallet or exchange history
                        </p>
                      </div>

                      {/* Wallet Address */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Your Wallet Address
                        </label>
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="e.g. 0x1234... or bc1q..."
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      What Happened?
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe the issue..."
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Info box */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-400">
                      We take all disputes seriously. Providing accurate information helps us resolve your case faster.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
