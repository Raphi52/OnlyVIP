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
      setSuccessMessage(`Welcome to ${plan.name}! Starting your conversation...`);

      // Create conversation and redirect to messages
      try {
        const convRes = await fetch("/api/conversations/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorSlug }),
        });

        if (convRes.ok) {
          const convData = await convRes.json();
          // Redirect to messages with conversation open
          setTimeout(() => {
            router.push(`/dashboard/messages?conversation=${convData.conversationId}`);
          }, 1500);
        } else {
          // Fallback to messages page
          setTimeout(() => {
            router.push("/dashboard/messages");
          }, 1500);
        }
      } catch (convError) {
        console.error("Error creating conversation:", convError);
        // Fallback to messages page
        setTimeout(() => {
          router.push("/dashboard/messages");
        }, 1500);
      }
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

            {/* USDT/Tether */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#26A17B]/20 to-[#26A17B]/5 border border-[#26A17B]/30 hover:border-[#26A17B]/60 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#26A17B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[#26A17B] font-bold text-lg sm:text-xl relative z-10">₮</span>
            </motion.div>

            {/* Litecoin */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#A6A9AA]/20 to-[#A6A9AA]/5 border border-[#A6A9AA]/30 hover:border-[#A6A9AA]/60 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#A6A9AA]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[#A6A9AA] font-bold text-lg sm:text-xl relative z-10">Ł</span>
            </motion.div>

            {/* Visa */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-[#1A1F71]/40 to-[#1A1F71]/20 border border-[#1A1F71]/50 hover:border-[#1A1F71]/80 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-white font-bold text-lg sm:text-xl italic relative z-10 tracking-tight">VISA</span>
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
              <div className="flex items-center gap-0.5 relative z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-white text-[10px] sm:text-xs font-medium">Pay</span>
              </div>
            </motion.div>

            {/* Google Pay */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="group relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/40 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-0.5 relative z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-white text-[10px] sm:text-xs font-medium">Pay</span>
              </div>
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
