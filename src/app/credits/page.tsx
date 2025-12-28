"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Check,
  CreditCard,
  Bitcoin,
  ExternalLink,
} from "lucide-react";
import { CryptoPaymentModal } from "@/components/payments";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
}

const creditPackages: CreditPackage[] = [
  { id: "starter", credits: 100, price: 1 },
  { id: "basic", credits: 500, price: 5, bonus: 50 },
  { id: "standard", credits: 1000, price: 10, bonus: 150, popular: true },
  { id: "premium", credits: 2500, price: 25, bonus: 500 },
  { id: "pro", credits: 5000, price: 50, bonus: 1250, bestValue: true },
  { id: "elite", credits: 10000, price: 100, bonus: 3000 },
];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

type PaymentMethod = "crypto" | "card";

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextExpiration, setNextExpiration] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");
  const [isProcessingCard, setIsProcessingCard] = useState(false);

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
        setTransactions(data.recentTransactions || []);
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
    if (paymentMethod === "crypto") {
      setShowCryptoModal(true);
    } else {
      handleCardPayment(pkg);
    }
  };

  const handleCardPayment = async (pkg: CreditPackage) => {
    setIsProcessingCard(true);
    try {
      const totalCredits = getTotalCredits(pkg);
      const res = await fetch("/api/payments/card/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          amount: pkg.price,
          credits: totalCredits,
        }),
      });

      const data = await res.json();

      if (data.changeHeroUrl) {
        // Open ChangeHero in new tab
        window.open(data.changeHeroUrl, "_blank");
        // Show wallet address info
        alert(`After buying crypto on ChangeHero, send it to:\n${data.walletAddress}\n\nYour credits will be added once we receive the payment.`);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Card payment error:", error);
      alert("Failed to create payment. Please try again.");
    } finally {
      setIsProcessingCard(false);
      setSelectedPackage(null);
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
                    <p className="text-sm text-gray-500">Available credits</p>
                  </div>
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
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                Choose a Package
              </h2>

              {/* Payment Method Selector */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod("crypto")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl border transition-all",
                    paymentMethod === "crypto"
                      ? "bg-purple-500/20 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  <Bitcoin className="w-5 h-5" />
                  <span>Crypto</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl border transition-all",
                    paymentMethod === "card"
                      ? "bg-blue-500/20 border-blue-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Credit Card</span>
                </button>
              </div>

              {paymentMethod === "card" && (
                <p className="text-center text-sm text-gray-400 mb-6">
                  Pay with Visa, Mastercard or Apple Pay. No KYC under €150.
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {creditPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: isProcessingCard ? 1 : 1.02 }}
                    onClick={() => !isProcessingCard && handlePackageSelect(pkg)}
                    className={cn(
                      "relative rounded-2xl border p-5 transition-all",
                      isProcessingCard && selectedPackage?.id === pkg.id
                        ? "opacity-50 cursor-wait"
                        : isProcessingCard
                        ? "opacity-30 cursor-not-allowed"
                        : "cursor-pointer",
                      pkg.popular
                        ? "bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/20"
                        : pkg.bestValue
                        ? "bg-[var(--gold)]/10 border-[var(--gold)]/50 shadow-lg shadow-[var(--gold)]/20"
                        : "bg-white/5 border-white/10 hover:border-purple-500/30"
                    )}
                  >
                    {/* Loading overlay */}
                    {isProcessingCard && selectedPackage?.id === pkg.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
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
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Coins className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-white">
                          {getTotalCredits(pkg).toLocaleString()}
                        </span>
                      </div>
                      {pkg.bonus && (
                        <div className="flex items-center justify-center gap-1 text-xs text-green-400 mb-3">
                          <Gift className="w-3 h-3" />
                          +{pkg.bonus.toLocaleString()} bonus
                        </div>
                      )}
                      <div className="text-3xl font-bold text-white mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${((pkg.price / getTotalCredits(pkg)) * 100).toFixed(2)} per 100
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
          </div>
        </section>
      </main>

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

      <Footer />
    </>
  );
}
