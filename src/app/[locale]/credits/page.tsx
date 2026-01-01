"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, Badge, Card } from "@/components/ui";
import {
  Coins,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Clock,
  TrendingUp,
  Gift,
  Loader2,
  CreditCard,
  Bitcoin,
  X,
} from "lucide-react";
import { CryptoPaymentModal, DisputeForm, PayGateModal } from "@/components/payments";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface CreditPackage {
  id: string;
  credits: number;       // Paid credits (usable everywhere)
  price: number;
  bonus?: number;        // Bonus credits (PPV catalog only)
  popular?: boolean;
  bestValue?: boolean;
}

const creditPackages: CreditPackage[] = [
  { id: "starter", credits: 1000, price: 10 },
  { id: "basic", credits: 2000, price: 20, bonus: 100 },
  { id: "standard", credits: 5000, price: 50, bonus: 500 },
  { id: "premium", credits: 10000, price: 100, bonus: 2000, popular: true },
  { id: "pro", credits: 50000, price: 500, bonus: 12500 },
  { id: "elite", credits: 100000, price: 1000, bonus: 35000, bestValue: true },
];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [paidCredits, setPaidCredits] = useState(0);
  const [bonusCredits, setBonusCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextExpiration, setNextExpiration] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showPayGateModal, setShowPayGateModal] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/credits");
      return;
    }

    if (session?.user?.id) {
      fetchCreditsInfo();
    }
  }, [session?.user?.id, status]);

  const fetchCreditsInfo = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setPaidCredits(data.paidCredits || 0);
        setBonusCredits(data.bonusCredits || 0);
        setTransactions(data.transactions || []);
        setNextExpiration(data.nextExpiration);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = (method: "crypto" | "card") => {
    setShowPaymentMethodModal(false);
    if (method === "crypto") {
      setShowCryptoModal(true);
    } else {
      setShowPayGateModal(true);
    }
  };

  const getTotalCredits = (pkg: CreditPackage) => {
    return pkg.credits + (pkg.bonus || 0);
  };

  if (status === "loading" || isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-black" />
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ x: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Coins className="w-4 h-4" />
                Credit Store
              </motion.span>
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
                Buy <span className="text-purple-400">Credits</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Unlock exclusive content, send tips, and more with credits
              </p>
            </motion.div>

            {/* Current Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-md mx-auto mb-16"
            >
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl border border-purple-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Your Balance</span>
                  {nextExpiration && (
                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                      <Clock className="w-3 h-3" />
                      {nextExpiration.amount} expire soon
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/30 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-white">{balance.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total credits</p>
                  </div>
                </div>
                {/* Paid vs Bonus breakdown */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-gray-400">Paid Credits</span>
                    </div>
                    <span className="text-emerald-400 font-medium">{paidCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="text-gray-400">Bonus Credits</span>
                    </div>
                    <span className="text-purple-400 font-medium">{bonusCredits.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Paid credits: chat, tips, PPV • Bonus credits: PPV catalog only
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Credit Packages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Choose a Package
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {creditPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handlePackageSelect(pkg)}
                    className={cn(
                      "relative rounded-2xl border p-5 transition-all cursor-pointer",
                      pkg.popular
                        ? "bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/20"
                        : pkg.bestValue
                        ? "bg-[var(--gold)]/10 border-[var(--gold)]/50 shadow-lg shadow-[var(--gold)]/20"
                        : "bg-white/5 border-white/10 hover:border-purple-500/30"
                    )}
                  >
                    {/* Badge */}
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white border-0 px-3">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[var(--gold)] text-black border-0 px-3">
                          <Crown className="w-3 h-3 mr-1" />
                          Best Value
                        </Badge>
                      </div>
                    )}

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Coins className="w-5 h-5 text-emerald-400" />
                        <span className="text-2xl font-bold text-white">
                          {pkg.credits.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400/80 mb-2">paid credits</p>
                      {pkg.bonus && (
                        <div className="flex items-center justify-center gap-1 text-xs text-purple-400 mb-3">
                          <Gift className="w-3 h-3" />
                          +{pkg.bonus.toLocaleString()} bonus (PPV only)
                        </div>
                      )}
                      <div className="text-3xl font-bold text-white mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${((pkg.price / pkg.credits) * 100).toFixed(2)} per 100 paid
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            >
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Unlock Content
                </h3>
                <p className="text-sm text-gray-400">
                  Use credits to unlock exclusive PPV photos and videos
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Send Tips
                </h3>
                <p className="text-sm text-gray-400">
                  Show your appreciation by sending tips to creators
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Save More
                </h3>
                <p className="text-sm text-gray-400">
                  Bigger packages include bonus credits for better value
                </p>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Recent Activity
                </h2>
                <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/10">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"
                        }`}>
                          <Coins className={`w-5 h-5 ${
                            tx.amount > 0 ? "text-green-400" : "text-red-400"
                          }`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        tx.amount > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dispute Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <button
                onClick={() => setShowDisputeForm(true)}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-2xl transition-all group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                    <HelpCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white group-hover:text-orange-400 transition-colors">
                      I Didn&apos;t Receive My Credits
                    </p>
                    <p className="text-sm text-gray-500">
                      Submit a dispute if your payment wasn&apos;t credited
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Payment Method Selection Modal */}
      <AnimatePresence>
        {showPaymentMethodModal && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => {
              setShowPaymentMethodModal(false);
              setSelectedPackage(null);
            }}
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
              <div className="absolute -inset-[1px] bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-transparent rounded-t-3xl sm:rounded-3xl blur-sm" />

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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Choose Payment
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Select your payment method
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPaymentMethodModal(false);
                        setSelectedPackage(null);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Package summary */}
                  <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Coins className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            {selectedPackage.credits.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-400">credits</span>
                        </div>
                        {selectedPackage.bonus && (
                          <div className="flex items-center gap-1 text-sm text-purple-400">
                            <Gift className="w-4 h-4" />
                            +{selectedPackage.bonus.toLocaleString()} bonus
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">${selectedPackage.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="px-6 pb-6 space-y-3">
                  {/* Crypto Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePaymentMethodSelect("crypto")}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-orange-500/10 border-2 border-white/10 hover:border-orange-500/50 rounded-2xl transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <span className="text-2xl font-bold text-white">₿</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                        Pay with Crypto
                      </p>
                      <p className="text-sm text-gray-500">
                        Bitcoin, Ethereum, USDT & more
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
                  </motion.button>

                  {/* Card Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePaymentMethodSelect("card")}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-blue-500/10 border-2 border-white/10 hover:border-blue-500/50 rounded-2xl transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        Pay with Card
                      </p>
                      <p className="text-sm text-gray-500">
                        Visa, Mastercard, Apple Pay
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </motion.button>

                  <p className="text-xs text-center text-gray-500 pt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      No KYC required under €700
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crypto Payment Modal */}
      {selectedPackage && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => {
            setShowCryptoModal(false);
            setSelectedPackage(null);
          }}
          type="credits"
          title={`${getTotalCredits(selectedPackage).toLocaleString()} Credits`}
          price={selectedPackage.price}
          metadata={{ credits: getTotalCredits(selectedPackage) }}
        />
      )}

      {/* PayGate Card Payment Modal */}
      {selectedPackage && (
        <PayGateModal
          isOpen={showPayGateModal}
          onClose={() => {
            setShowPayGateModal(false);
            setSelectedPackage(null);
          }}
          amount={selectedPackage.price}
          credits={selectedPackage.credits}
          bonusCredits={selectedPackage.bonus}
        />
      )}

      {/* Dispute Form Modal */}
      <DisputeForm
        isOpen={showDisputeForm}
        onClose={() => setShowDisputeForm(false)}
      />

      <Footer />
    </>
  );
}
