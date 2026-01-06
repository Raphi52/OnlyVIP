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
          <p className="text-sm text-gray-500 mb-6">
            {t("buyCreditsSecurely")}
          </p>

          {/* Payment Icons Grid */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap max-w-2xl mx-auto">
            {/* Bitcoin */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#F7931A]/20 to-[#F7931A]/5 border border-[#F7931A]/30 hover:border-[#F7931A]/60 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#F7931A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#F7931A] relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.52 2.107c-.345-.087-.7-.17-1.053-.252l.53-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.974.225.955.238c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.254 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.52 2.75 2.084v.006z"/>
              </svg>
            </motion.div>

            {/* Ethereum */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#627EEA]/20 to-[#627EEA]/5 border border-[#627EEA]/30 hover:border-[#627EEA]/60 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#627EEA]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#627EEA] relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
              </svg>
            </motion.div>

            {/* USDT */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#26A17B]/20 to-[#26A17B]/5 border border-[#26A17B]/30 hover:border-[#26A17B]/60 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#26A17B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#26A17B] relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0zm5.5 13.38c-.057.033-.117.064-.175.097-.69.38-1.87.656-3.325.784v2.872c0 .114-.093.206-.206.206h-1.588a.206.206 0 0 1-.206-.206v-2.827c-1.561-.103-2.852-.39-3.575-.788a.19.19 0 0 1-.096-.165v-1.482c0-.13.133-.22.255-.177 1.146.398 2.665.618 4.416.618 1.75 0 3.27-.22 4.415-.618a.19.19 0 0 1 .255.177v1.402a.19.19 0 0 1-.096.165h.026v.044zm0-3.014c-.057.033-.117.064-.175.097-.69.38-1.87.656-3.325.784v.87c0 .114-.093.206-.206.206h-1.588a.206.206 0 0 1-.206-.206v-.827c-1.561-.103-2.852-.39-3.575-.788a.19.19 0 0 1-.096-.165V8.85c0-.13.133-.22.255-.177 1.146.398 2.665.619 4.416.619 1.75 0 3.27-.221 4.415-.619a.19.19 0 0 1 .255.177v1.401a.19.19 0 0 1-.096.165h.026v.044zm0-3.013c-.057.033-.117.065-.175.097-.69.38-1.87.656-3.325.784v-.87h-2v.827c-1.561-.103-2.852-.39-3.575-.788a.19.19 0 0 1-.096-.165V5.836c0-.13.133-.22.255-.177 1.146.398 2.665.619 4.416.619 1.75 0 3.27-.221 4.415-.619a.19.19 0 0 1 .255.177v1.401a.19.19 0 0 1-.096.165h.026v.044-.068z"/>
              </svg>
            </motion.div>

            {/* Visa */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#1A1F71]/40 to-[#1A1F71]/20 border border-[#1A1F71]/50 hover:border-[#1A1F71]/80 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-10 h-4 sm:w-12 sm:h-5 relative z-10" viewBox="0 0 48 16" fill="none">
                <path d="M19.315 15.5h-3.91L17.88.5h3.91l-2.475 15z" fill="#1A1F71"/>
                <path d="M33.96.5l-3.75 10.35-.395-2.01-.005.015-1.185-6.09c-.205-1.05-.995-1.245-1.89-1.265H21.55l-.05.265c1.47.375 2.775.915 3.875 1.57L28.76 15.5h4.075l6.205-15H33.96z" fill="#1A1F71"/>
                <path d="M38.695.5L36.06 15.5h3.72L42.415.5h-3.72z" fill="#1A1F71"/>
                <path d="M8.675 10.195l-.395-2.01-.005.015L7.09 2.11c-.205-1.05-.995-1.245-1.89-1.265H.015L0 1.11c2.355.605 4.47 1.645 6.175 2.99l3.39 10.4h4.075L19.845.5h-4.08l-5.625 9.24-1.465.455z" fill="#1A1F71"/>
              </svg>
            </motion.div>

            {/* Mastercard */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700/50 hover:border-gray-600/80 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-9 h-6 sm:w-10 sm:h-7 relative z-10" viewBox="0 0 48 30" fill="none">
                <circle cx="18" cy="15" r="12" fill="#EB001B"/>
                <circle cx="30" cy="15" r="12" fill="#F79E1B"/>
                <path d="M24 5.5c3.128 2.25 5.15 5.88 5.15 9.95 0 4.07-2.022 7.7-5.15 9.95-3.128-2.25-5.15-5.88-5.15-9.95 0-4.07 2.022-7.7 5.15-9.95z" fill="#FF5F00"/>
              </svg>
            </motion.div>

            {/* Apple Pay */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/40 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-10 h-5 sm:w-12 sm:h-6 text-white relative z-10" viewBox="0 0 48 20" fill="currentColor">
                <path d="M8.43 3.12c-.56.66-1.46 1.18-2.34 1.1-.11-.88.32-1.82.82-2.4.56-.65 1.54-1.13 2.33-1.17.1.92-.27 1.82-.81 2.47zM9.25 4.43c-1.3-.08-2.4.74-3.02.74-.62 0-1.56-.7-2.58-.68-1.33.02-2.55.77-3.23 1.97-1.38 2.38-.35 5.92.98 7.86.66.95 1.44 2.01 2.47 1.97 1-.04 1.37-.64 2.58-.64s1.54.64 2.58.62c1.07-.02 1.74-.97 2.4-1.92.75-1.1 1.06-2.16 1.08-2.22-.02-.01-2.08-.8-2.1-3.16-.02-1.98 1.62-2.93 1.7-2.98-.93-1.37-2.37-1.52-2.87-1.56h.01z"/>
                <path d="M20.52 1.18c3.35 0 5.68 2.31 5.68 5.67 0 3.38-2.37 5.7-5.76 5.7h-3.7v5.9h-2.66V1.18h6.44zm-3.78 9.1h3.07c2.33 0 3.66-1.26 3.66-3.42 0-2.16-1.33-3.41-3.65-3.41h-3.08v6.83z"/>
                <path d="M27.11 14.08c0-2.19 1.68-3.53 4.66-3.7l3.44-.2v-.97c0-1.4-.93-2.23-2.5-2.23-1.47 0-2.4.73-2.63 1.86h-2.43c.14-2.31 2.13-4.02 5.14-4.02 3.02 0 4.96 1.6 4.96 4.1v8.53h-2.47v-2.04h-.06c-.73 1.39-2.31 2.21-3.96 2.21-2.46 0-4.15-1.52-4.15-3.54zm8.1-1.07v-1l-3.1.19c-1.54.1-2.41.75-2.41 1.8 0 1.04.9 1.72 2.27 1.72 1.79 0 3.24-1.23 3.24-2.71z"/>
                <path d="M39.8 22.2v-2.07c.18.05.6.05.79.05 1.14 0 1.76-.48 2.14-1.7l.23-.74-4.47-12.29h2.79l3.06 9.95h.04l3.06-9.95H50l-4.63 12.92c-1.06 2.97-2.28 3.92-4.84 3.92-.18 0-.55-.02-.73-.09z"/>
              </svg>
            </motion.div>

            {/* Google Pay */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/40 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-10 h-5 sm:w-12 sm:h-6 relative z-10" viewBox="0 0 48 20" fill="none">
                <path d="M22.8 10.04v5.84h-1.86V1.52h4.93c1.18-.02 2.32.42 3.18 1.24.88.78 1.38 1.9 1.36 3.06.02 1.18-.48 2.3-1.36 3.08-.86.82-1.94 1.24-3.18 1.22l-3.07-.08zm0-6.66v4.8h3.1c.7.02 1.38-.26 1.88-.76.98-.96 1-2.54.04-3.52l-.04-.04c-.5-.52-1.18-.8-1.88-.78h-3.1v.3z" fill="white"/>
                <path d="M35.34 6.4c1.38 0 2.46.36 3.26 1.1.8.72 1.2 1.72 1.2 2.98v6.02h-1.78v-1.36h-.08c-.76 1.12-1.78 1.68-3.04 1.68-1.08 0-1.98-.32-2.7-.96-.7-.62-1.08-1.44-1.08-2.42 0-1.02.4-1.84 1.16-2.44.78-.6 1.82-.9 3.12-.9 1.1 0 2.02.2 2.72.6v-.42c0-.66-.28-1.28-.78-1.72-.5-.44-1.14-.68-1.82-.68-.98 0-1.78.42-2.36 1.24l-1.64-.98c.88-1.2 2.2-1.82 3.9-1.82l-.08.08zm-2.4 7c0 .48.22.9.58 1.18.4.32.88.48 1.4.48.76 0 1.48-.3 2.04-.84.58-.56.86-1.22.86-1.98-.56-.46-1.36-.68-2.38-.68-.74 0-1.38.18-1.88.52-.42.34-.62.78-.62 1.32z" fill="white"/>
                <path d="M48 6.72l-6.18 14.2h-1.94l2.3-4.96-4.06-9.24h2.04l2.92 7.1h.04l2.84-7.1H48z" fill="white"/>
                <path d="M15.42 8.7c0-.54-.04-1.08-.14-1.6H7.86v3.04h4.26c-.18 1-.74 1.88-1.58 2.46v2.02h2.54c1.5-1.38 2.34-3.4 2.34-5.92z" fill="#4285F4"/>
                <path d="M7.86 16.56c2.14 0 3.94-.7 5.26-1.92l-2.54-2.02c-.72.48-1.62.76-2.72.76-2.08 0-3.86-1.4-4.5-3.3H.74v2.08c1.34 2.64 4.06 4.4 7.12 4.4z" fill="#34A853"/>
                <path d="M3.36 10.08c-.32-.96-.32-2 0-2.96V5H.74C-.38 7.24-.38 9.88.74 12.12l2.62-2.04z" fill="#FBBC04"/>
                <path d="M7.86 3.82c1.14-.02 2.24.4 3.08 1.18l2.28-2.28C11.78 1.4 9.88.62 7.86.64c-3.06 0-5.78 1.76-7.12 4.4l2.62 2.04c.64-1.9 2.42-3.26 4.5-3.26z" fill="#EA4335"/>
              </svg>
            </motion.div>
          </div>

          {/* Security badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <Lock className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">SSL Secured • 256-bit Encryption</span>
          </motion.div>
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
