"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, Star, Crown, Coins, Sparkles, ArrowRight, Gift, Zap, Lock, MessageCircle, X, Loader2, AlertCircle, AlertTriangle, ShoppingCart } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PricingProps {
  creatorSlug?: string;
}

// 100 credits = $1
const CREDITS_PER_DOLLAR = 100;

// Membership tiers - prices in credits (translations added in component)
const membershipTiersConfig = [
  {
    id: "basic",
    nameKey: "basicPlan",
    descriptionKey: "accessBasicContent",
    monthlyCredits: 999, // ~$9.99
    annualCredits: 9588, // ~$95.88 (save 20%)
    featureKeys: ["basicGallery", "directMessaging", "supportCreator"],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "vip",
    nameKey: "vipPlan",
    descriptionKey: "fullAccess",
    monthlyCredits: 2999, // ~$29.99
    annualCredits: 28788, // ~$287.88 (save 20%)
    isPopular: true,
    featureKeys: ["fullGallery", "vipContent", "priorityMessaging", "earlyAccess", "behindTheScenes", "exclusiveBadge"],
    gradient: "from-[var(--gold)] to-yellow-500",
    iconBg: "bg-[var(--gold)]/20",
    iconColor: "text-[var(--gold)]",
  },
];

// Helper to convert credits to USD
const creditsToUsd = (credits: number) => (credits / CREDITS_PER_DOLLAR).toFixed(2);

// Credit packages for additional purchases (synced with /credits page)
const creditPackages = [
  { id: "starter", credits: 1000, price: 10 },
  { id: "basic", credits: 2000, price: 20, bonus: 100 },
  { id: "standard", credits: 5000, price: 50, bonus: 500, popular: true },
  { id: "premium", credits: 10000, price: 100, bonus: 2000, bestValue: true },
];

export function Pricing({ creatorSlug = "miacosta" }: PricingProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("pricingSection");
  const tPricing = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const [isAnnual, setIsAnnual] = useState(false);

  // Build translated membership tiers
  const membershipTiers = useMemo(() => membershipTiersConfig.map((tier) => ({
    ...tier,
    name: tPricing(tier.nameKey),
    description: tPricing(tier.descriptionKey),
    features: tier.featureKeys.map((key) => tPricing(key)),
  })), [tPricing]);

  const [plans, setPlans] = useState<typeof membershipTiers>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Initialize plans with translated tiers when component mounts or translations change
  useEffect(() => {
    if (membershipTiers.length > 0) {
      setPlans(membershipTiers);
    }
  }, [membershipTiers]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const basePath = `/${creatorSlug}`;

  // Fetch user's credit balance
  useEffect(() => {
    async function fetchBalance() {
      if (!session?.user) {
        setIsLoadingBalance(false);
        return;
      }
      try {
        const res = await fetch("/api/user/credits");
        if (res.ok) {
          const data = await res.json();
          setUserBalance(data.balance || 0);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    }
    fetchBalance();
  }, [session?.user]);

  // Fetch creator's custom pricing (in credits)
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(`/api/creators/${creatorSlug}/pricing`);
        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans.length > 0) {
            const customPlans = membershipTiers.map((plan) => {
              const customPlan = data.plans.find((p: any) => p.id === plan.id);
              if (customPlan) {
                return {
                  ...plan,
                  monthlyCredits: customPlan.monthlyCredits ?? plan.monthlyCredits,
                  annualCredits: customPlan.annualCredits ?? plan.annualCredits,
                };
              }
              return plan;
            });
            setPlans(customPlans);
          }
        }
      } catch (error) {
        console.error("Error fetching pricing:", error);
      } finally {
        setIsLoadingPlans(false);
      }
    }
    fetchPricing();
  }, [creatorSlug]);

  // Handle subscription purchase
  const handleSubscribe = async (planId: string) => {
    // Check if user is logged in
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/${creatorSlug}/membership`)}`);
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const creditsNeeded = isAnnual ? plan.annualCredits : plan.monthlyCredits;

    // Check if user has enough credits
    if (userBalance < creditsNeeded) {
      setRequiredCredits(creditsNeeded);
      setShowInsufficientModal(true);
      return;
    }

    setIsPurchasing(planId);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/subscription/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval: isAnnual ? "annual" : "monthly",
          creatorSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Insufficient credits") {
          setRequiredCredits(data.required);
          setShowInsufficientModal(true);
        } else {
          setErrorMessage(data.error || "Failed to subscribe");
        }
        return;
      }

      // Success!
      setUserBalance(data.newBalance);
      setSuccessMessage(`Welcome to ${plan.name}! Your subscription is now active.`);

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Subscription error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <section id="membership" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            {t("membershipCredits")}
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t("unlock")} <span className="gradient-gold-text">{t("exclusiveAccess")}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("subscribeDescription")}
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
        >
          <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t("step1Title")}</h3>
            <p className="text-sm text-gray-400">
              {t("step1Desc")}
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t("step2Title")}</h3>
            <p className="text-sm text-gray-400">
              {t("step2Desc")}
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t("step3Title")}</h3>
            <p className="text-sm text-gray-400">
              {t("step3Desc")}
            </p>
          </div>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !isAnnual ? "text-white" : "text-gray-500"
            )}
          >
            {t("monthly")}
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={cn(
              "relative w-16 h-8 rounded-full transition-colors p-1",
              isAnnual ? "bg-[var(--gold)]" : "bg-white/10"
            )}
          >
            <motion.div
              className="w-6 h-6 rounded-full bg-white shadow-lg"
              animate={{ x: isAnnual ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isAnnual ? "text-white" : "text-gray-500"
            )}
          >
            {t("annual")}
          </span>
          {isAnnual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold"
            >
              {t("save20")}
            </motion.span>
          )}
        </motion.div>

        {/* Membership Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={cn(
                "relative rounded-3xl overflow-hidden",
                plan.isPopular ? "md:scale-105 z-10" : ""
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-[var(--gold)] via-yellow-500 to-[var(--gold)]" />
              )}

              <div className={cn(
                "p-8 h-full border rounded-3xl transition-all duration-300",
                plan.isPopular
                  ? "bg-gradient-to-b from-[var(--gold)]/10 to-transparent border-[var(--gold)]/30 hover:border-[var(--gold)]/50"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}>
                {plan.isPopular && (
                  <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gold)] text-black text-sm font-semibold">
                      <Star className="w-4 h-4" />
                      {t("bestValue")}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <div className={cn(
                    "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
                    plan.iconBg
                  )}>
                    <Crown className={cn("w-7 h-7", plan.iconColor)} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Price in Credits */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-[var(--gold)]" />
                    <span className="text-4xl font-bold text-white">
                      {Math.round(isAnnual ? plan.annualCredits / 12 : plan.monthlyCredits).toLocaleString()}
                    </span>
                    <span className="text-gray-400">{t("creditsMo")}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    ~${creditsToUsd(isAnnual ? plan.annualCredits / 12 : plan.monthlyCredits)}/month
                  </p>
                  {isAnnual && (
                    <p className="text-sm text-[var(--gold)] mt-2">
                      Billed {plan.annualCredits.toLocaleString()} credits/year (~${creditsToUsd(plan.annualCredits)})
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        plan.isPopular ? "bg-[var(--gold)]/20" : "bg-green-500/20"
                      )}>
                        <Check
                          className={cn(
                            "w-3 h-3",
                            plan.isPopular ? "text-[var(--gold)]" : "text-green-400"
                          )}
                        />
                      </div>
                      <span className="text-sm text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.isPopular ? "premium" : "gold-outline"}
                  className="w-full gap-2 group"
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isPurchasing === plan.id}
                >
                  {isPurchasing === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      {t("subscribeNow")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Credit Packages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl font-bold text-white mb-3">
            {t("needMoreCredits")}
          </h3>
          <p className="text-gray-400">
            {t("topUpAnytime")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 pt-4"
        >
          {creditPackages.map((pkg, index) => (
            <Link key={pkg.id} href={`/credits?package=${pkg.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
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

                {/* Badge - Outside overflow-hidden container */}
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
                        {t("popular")}
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
                        {t("bestValue")}
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

                  {/* Shimmer on hover - diagonal, extended to cover full card */}
                  <motion.div
                    className="absolute -inset-[100%] -translate-x-[200%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"
                    style={{
                      background: pkg.popular || pkg.bestValue
                        ? 'linear-gradient(125deg, transparent 0%, transparent 45%, rgba(255,255,255,0.4) 50%, transparent 55%, transparent 100%)'
                        : 'linear-gradient(125deg, transparent 0%, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%, transparent 100%)',
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

                    {/* Bonus - Silver Shine */}
                    {pkg.bonus && pkg.bonus > 0 && (
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
                            +{pkg.bonus.toLocaleString()} {t("bonus")}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Price */}
                    <div className="text-3xl font-bold text-white mb-1">
                      ${pkg.price}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${((pkg.price / pkg.credits) * 100).toFixed(2)} per 100
                    </div>

                    {/* Buy indicator */}
                    <motion.div
                      className="mt-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.02 }}
                    >
                      {t("clickToBuy") || "Click to Buy"}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* What you can do with credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <h4 className="text-lg font-semibold text-white mb-4 text-center">
              {t("whatCanYouDo")}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Lock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">{t("unlockPPV")}</p>
              </div>
              <div className="text-center">
                <Gift className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">{t("sendTips")}</p>
              </div>
              <div className="text-center">
                <MessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">{t("unlockMessages")}</p>
              </div>
              <div className="text-center">
                <Sparkles className="w-6 h-6 text-[var(--gold)] mx-auto mb-2" />
                <p className="text-sm text-gray-300">{t("exclusiveContent")}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Balance Display */}
        {session?.user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <Coins className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">{t("yourBalance")}</span>
              <span className="text-xl font-bold text-white">
                {isLoadingBalance ? "..." : userBalance.toLocaleString()}
              </span>
              <span className="text-gray-400">{t("credits")}</span>
              <Link href="/credits">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  {t("topUp")}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Payment methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500 mb-4">
            {t("buyCreditsSecurely")}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#F7931A] font-medium">Bitcoin</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#627EEA] font-medium">Ethereum</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-blue-400 font-medium">{t("creditCard")}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insufficient Credits Modal */}
      <AnimatePresence>
        {showInsufficientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowInsufficientModal(false)}
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
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-orange-500/30 via-red-500/20 to-transparent rounded-t-3xl sm:rounded-3xl blur-sm" />

              <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
                {/* Drag indicator for mobile */}
                <div className="sm:hidden flex justify-center pt-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <AlertCircle className="w-7 h-7 text-white" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-[#0a0a0c]"
                      >
                        <span className="text-white text-xs font-bold">!</span>
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {t("insufficientCredits")}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {t("topUpToContinue")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 space-y-4">
                  {/* Credits comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Required */}
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        {t("required")}
                      </p>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-purple-400" />
                        <span className="text-xl font-bold text-white">
                          {requiredCredits.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Your balance */}
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        {t("yourBalanceLabel")}
                      </p>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-red-400" />
                        <span className="text-xl font-bold text-red-400">
                          {userBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Missing amount - highlighted */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("youNeed")}</p>
                          <p className="font-bold text-white">
                            {(requiredCredits - userBalance).toLocaleString()} {t("moreCredits")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Tip */}
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-400">
                      <strong>{t("proTip")}</strong> {t("biggerPackages")}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/5 mt-4 flex gap-3">
                  <button
                    onClick={() => setShowInsufficientModal(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                  >
                    {tCommon("cancel")}
                  </button>
                  <Link href="/credits" className="flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t("buyCredits")}
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
