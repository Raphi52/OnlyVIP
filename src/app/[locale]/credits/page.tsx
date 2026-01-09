"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
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
  const [hasAutoOpened, setHasAutoOpened] = useState(false);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/credits");
      return;
    }

    if (session?.user?.id) {
      fetchCreditsInfo();
    }
  }, [session?.user?.id, status]);

  // Auto-open payment modal if package is specified in URL
  useEffect(() => {
    if (hasAutoOpened || isLoading || status !== "authenticated") return;

    const packageId = searchParams.get("package");
    if (packageId) {
      const pkg = creditPackages.find((p) => p.id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        setShowPaymentMethodModal(true);
        setHasAutoOpened(true);
      }
    }
  }, [searchParams, isLoading, status, hasAutoOpened]);

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

  // Card payment fee: 1% + 0.02€ (PayGate/Kryptonim fees)
  const getCardFee = (price: number) => {
    return Math.round((price * 0.01 + 0.02) * 100) / 100;
  };

  const getCardTotal = (price: number) => {
    return Math.round((price + getCardFee(price)) * 100) / 100;
  };

  if (status === "loading" || isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        {/* Hero Section - Premium Black & Silver Theme */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          {/* Animated silver/white orbs */}
          <motion.div
            className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-white/5 via-gray-300/10 to-transparent rounded-full blur-[100px]"
            animate={{ x: [0, 30, 0], opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-slate-400/10 via-gray-500/5 to-transparent rounded-full blur-[80px]"
            animate={{ x: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-gray-800/20 via-slate-500/10 to-transparent rounded-full blur-[100px]"
            animate={{ opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              {/* Premium badge with silver glow */}
              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-white/10 to-gray-400/10 border border-white/20 text-gray-200 text-sm font-medium mb-6 relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-gray-400/10 blur-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Coins className="w-4 h-4 relative z-10 text-yellow-400" />
                <span className="relative z-10">Credit Store</span>
                <Sparkles className="w-4 h-4 relative z-10 text-gray-300" />
              </motion.div>

              {/* Title with gradient */}
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
                Buy{" "}
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Credits
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Unlock exclusive content, send tips, and more with credits
              </p>
            </motion.div>

            {/* Current Balance - Premium Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-md mx-auto mb-16"
            >
              <div className="relative group">
                {/* Animated silver glow border */}
                <motion.div
                  className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-gray-400 via-white to-gray-400 opacity-50 blur-sm"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative bg-gradient-to-br from-gray-900/90 via-black to-gray-900/90 rounded-3xl border border-white/10 p-6 overflow-hidden">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-gray-400 font-medium">Your Balance</span>
                    {nextExpiration && (
                      <div className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {nextExpiration.amount} expire soon
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    {/* Coin icon with glow */}
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                      animate={{ boxShadow: ["0 0 20px rgba(250,204,21,0.3)", "0 0 40px rgba(250,204,21,0.5)", "0 0 20px rgba(250,204,21,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Coins className="w-8 h-8 text-black" />
                    </motion.div>
                    <div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                        {balance.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Total credits</p>
                    </div>
                  </div>

                  {/* Paid vs Bonus breakdown */}
                  <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-yellow-400"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-gray-400">Paid Credits</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{paidCredits.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-300 to-slate-400 shadow-[0_0_6px_rgba(156,163,175,0.8)]"
                          animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 4px rgba(156,163,175,0.5)", "0 0 10px rgba(203,213,225,0.8)", "0 0 4px rgba(156,163,175,0.5)"] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                        <span className="text-gray-400">Bonus Credits</span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-gray-200 via-slate-300 to-gray-200 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]">
                        {bonusCredits.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Paid credits: chat, tips, PPV • Bonus credits: PPV catalog only
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Credit Packages - Premium Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-center mb-8">
                <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
                  Choose a Package
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {creditPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePackageSelect(pkg)}
                    className="relative group cursor-pointer"
                  >
                    {/* Glow effect on hover - silver for regular */}
                    {!(pkg.popular || pkg.bestValue) && (
                      <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm bg-gradient-to-r from-gray-400/50 via-white/50 to-gray-400/50" />
                    )}

                    {/* ✨ ULTRA PREMIUM HOLOGRAPHIC EFFECT for featured packages */}
                    {(pkg.popular || pkg.bestValue) && (
                      <>
                        {/* Layer 1: Outer glow pulse */}
                        <motion.div
                          className="absolute -inset-3 rounded-3xl opacity-40"
                          style={{
                            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)',
                          }}
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Layer 2: Animated rainbow border */}
                        <motion.div
                          className="absolute -inset-[2px] rounded-2xl"
                          style={{
                            background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
                            backgroundSize: '300% 100%',
                          }}
                          animate={{
                            backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Layer 3: Inner gold border */}
                        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500" />

                        {/* Layer 4: Sparkle particles */}
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                              left: `${15 + i * 15}%`,
                              top: `${10 + (i % 3) * 35}%`,
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
                      </>
                    )}

                    {/* Badge - Ultra premium style */}
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <motion.div
                          className="relative"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {/* Badge glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-md opacity-60" />
                          <div className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black text-xs font-bold shadow-xl">
                            <Sparkles className="w-3.5 h-3.5" />
                            Popular
                          </div>
                        </motion.div>
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <motion.div
                          className="relative"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {/* Badge glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-md opacity-60" />
                          <div className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black text-xs font-bold shadow-xl">
                            <Crown className="w-3.5 h-3.5" />
                            Best Value
                          </div>
                        </motion.div>
                      </div>
                    )}

                    <div className={cn(
                      "relative rounded-2xl border-0 p-5 transition-all overflow-hidden",
                      pkg.popular || pkg.bestValue
                        ? "bg-gradient-to-br from-gray-950 via-black to-gray-950 pt-6"
                        : "bg-gradient-to-br from-gray-900 to-black border border-white/10 group-hover:border-white/30"
                    )}>
                      {/* ✨ Interior holographic effects - CSS animations for mobile compatibility */}
                      {(pkg.popular || pkg.bestValue) && (
                        <>
                          {/* Primary prismatic sweep - CSS animation from globals.css */}
                          <div
                            className="absolute inset-0 animate-holographic-sweep"
                            style={{
                              background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.25) 15%, rgba(0,255,255,0.25) 30%, rgba(255,255,0,0.18) 45%, rgba(128,0,255,0.25) 60%, rgba(0,255,128,0.18) 75%, transparent 100%)',
                              backgroundSize: '300% 300%',
                            }}
                          />

                          {/* Secondary reverse sweep - CSS animation from globals.css */}
                          <div
                            className="absolute inset-0 animate-holographic-sweep-reverse"
                            style={{
                              background: 'linear-gradient(-45deg, transparent 0%, rgba(0,200,255,0.2) 25%, rgba(255,100,200,0.2) 50%, rgba(100,255,150,0.2) 75%, transparent 100%)',
                              backgroundSize: '250% 250%',
                            }}
                          />
                        </>
                      )}

                      {/* Shimmer on hover - diagonal to match prismatic bands */}
                      <motion.div
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        style={{
                          background: pkg.popular || pkg.bestValue
                            ? 'linear-gradient(125deg, transparent 0%, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%, transparent 100%)'
                            : 'linear-gradient(125deg, transparent 0%, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%, transparent 100%)',
                        }}
                      />

                      <div className="text-center relative z-10">
                        {/* Credits amount */}
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Coins className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">
                            {pkg.credits.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-yellow-500/70 mb-2">paid credits</p>

                        {/* Bonus - Silver Shine / No bonus placeholder */}
                        {pkg.bonus ? (
                          <motion.div
                            className="relative flex items-center justify-center gap-1.5 text-xs mb-3 mx-auto w-fit"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {/* Silver glow border */}
                            <motion.div
                              className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-gray-400 via-slate-300 to-gray-400 blur-[2px]"
                              animate={{ opacity: [0.4, 0.7, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-gray-800 via-slate-900 to-gray-800 border border-gray-400/30">
                              <Gift className="w-3 h-3 text-gray-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.8)]" />
                              <span className="font-semibold bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
                                +{pkg.bonus.toLocaleString()} bonus
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-xs mb-3 mx-auto w-fit px-3 py-1 rounded-full border border-gray-700/50 text-gray-600">
                            No bonus
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-3xl font-bold text-white mb-1">
                          ${pkg.price}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${((pkg.price / (pkg.credits + (pkg.bonus || 0))) * 100).toFixed(2)} per 100
                        </div>

                        {/* Buy indicator */}
                        <motion.div
                          className={cn(
                            "mt-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity",
                            pkg.popular || pkg.bestValue
                              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400"
                              : "bg-gradient-to-r from-white/10 to-gray-400/10 border border-white/20 text-white"
                          )}
                          whileHover={{ scale: 1.02 }}
                        >
                          Click to Buy
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Benefits - Premium Silver Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
            >
              {[
                { icon: Zap, title: "Unlock Content", desc: "Use credits to unlock exclusive PPV photos and videos", iconColor: "text-yellow-400" },
                { icon: Gift, title: "Send Tips", desc: "Show your appreciation by sending tips to creators", iconColor: "text-gray-300" },
                { icon: TrendingUp, title: "Save More", desc: "Bigger packages include bonus credits for better value", iconColor: "text-white" },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  className="relative group"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-gray-400/30 via-white/30 to-gray-400/30 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                  <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 group-hover:border-white/30 p-6 text-center transition-all overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-gray-400/10 border border-white/20 flex items-center justify-center mx-auto mb-4 relative z-10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <benefit.icon className={cn("w-7 h-7", benefit.iconColor)} />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mb-2 relative z-10">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-400 relative z-10">
                      {benefit.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
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
              {/* ✨ HOLOGRAPHIC EFFECT for modal - all decorative elements have pointer-events-none */}
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
                {/* Holographic interior effect - pointer-events-none to allow clicks through */}
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

                {/* Secondary sweep - pointer-events-none to allow clicks through */}
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
                      className="relative z-50 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
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
          amount={getCardTotal(selectedPackage.price)}
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
