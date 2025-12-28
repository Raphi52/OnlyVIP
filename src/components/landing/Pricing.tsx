"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, Star, Crown, Coins, Sparkles, ArrowRight, Gift, Zap, Lock, MessageCircle, X, Loader2, AlertCircle } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PricingProps {
  creatorSlug?: string;
}

// 100 credits = $1
const CREDITS_PER_DOLLAR = 100;

// Membership tiers - prices in credits
const membershipTiers = [
  {
    id: "basic",
    name: "Basic",
    description: "Access basic content & messaging",
    monthlyCredits: 999, // ~$9.99
    annualCredits: 9588, // ~$95.88 (save 20%)
    bonusCredits: 500, // Bonus credits included monthly
    features: [
      "500 bonus credits/month",
      "Access to basic gallery",
      "Direct messaging",
      "Support the creator",
    ],
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "vip",
    name: "VIP",
    description: "Full access & maximum perks",
    monthlyCredits: 2999, // ~$29.99
    annualCredits: 28788, // ~$287.88 (save 20%)
    bonusCredits: 2000, // Bonus credits included monthly
    isPopular: true,
    features: [
      "2000 bonus credits/month",
      "Full gallery access",
      "VIP-only content",
      "Priority messaging",
      "Early access to new content",
      "Behind-the-scenes access",
      "Exclusive VIP badge",
    ],
    gradient: "from-[var(--gold)] to-yellow-500",
    iconBg: "bg-[var(--gold)]/20",
    iconColor: "text-[var(--gold)]",
  },
];

// Helper to convert credits to USD
const creditsToUsd = (credits: number) => (credits / CREDITS_PER_DOLLAR).toFixed(2);

// Credit packages for additional purchases
const creditPackages = [
  { credits: 500, price: 5, bonus: 50 },
  { credits: 1000, price: 10, bonus: 150, popular: true },
  { credits: 2500, price: 25, bonus: 500 },
  { credits: 5000, price: 50, bonus: 1250, bestValue: true },
];

export function Pricing({ creatorSlug = "miacosta" }: PricingProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState(membershipTiers);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
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
                  bonusCredits: customPlan.bonusCredits ?? plan.bonusCredits,
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
      setSuccessMessage(`Welcome to ${plan.name}! You received ${data.bonusCreditsAdded} bonus credits.`);

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
            Membership & Credits
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Get <span className="gradient-gold-text">Free Credits</span> Monthly
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Subscribe to receive free credits every month. Use them to unlock exclusive content,
            send tips, and access PPV media.
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
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">1. Subscribe</h3>
            <p className="text-sm text-gray-400">
              Choose a plan and get free credits delivered to your account monthly
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">2. Use Credits</h3>
            <p className="text-sm text-gray-400">
              Spend credits on PPV content, tips, and exclusive media unlocks
            </p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">3. Top Up</h3>
            <p className="text-sm text-gray-400">
              Need more? Buy additional credits anytime with crypto or card
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
            Monthly
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
            Annual
          </span>
          {isAnnual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold"
            >
              Save 20%
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
                      Best Value
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

                {/* Monthly Bonus Credits */}
                <div className="text-center mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Gift className="w-5 h-5 text-green-400" />
                    <span className="text-3xl font-bold text-white">
                      +{plan.bonusCredits.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-green-300">bonus credits every month</p>
                </div>

                {/* Price in Credits */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-[var(--gold)]" />
                    <span className="text-4xl font-bold text-white">
                      {Math.round(isAnnual ? plan.annualCredits / 12 : plan.monthlyCredits).toLocaleString()}
                    </span>
                    <span className="text-gray-400">credits/mo</span>
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
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe Now
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
            Need More Credits?
          </h3>
          <p className="text-gray-400">
            Top up anytime with additional credit packages
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
        >
          {creditPackages.map((pkg, index) => (
            <Link key={index} href="/credits">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "relative p-5 rounded-2xl border cursor-pointer transition-all",
                  pkg.popular
                    ? "bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50"
                    : pkg.bestValue
                    ? "bg-[var(--gold)]/10 border-[var(--gold)]/30 hover:border-[var(--gold)]/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white border-0 text-xs">
                    Popular
                  </Badge>
                )}
                {pkg.bestValue && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-black border-0 text-xs">
                    Best Value
                  </Badge>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-xl font-bold text-white">
                      {(pkg.credits + pkg.bonus).toLocaleString()}
                    </span>
                  </div>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-green-400 mb-2">
                      +{pkg.bonus} bonus
                    </p>
                  )}
                  <p className="text-lg font-bold text-white">
                    ${pkg.price}
                  </p>
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
              What can you do with credits?
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Lock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Unlock PPV</p>
              </div>
              <div className="text-center">
                <Gift className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Send Tips</p>
              </div>
              <div className="text-center">
                <MessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Priority Chat</p>
              </div>
              <div className="text-center">
                <Sparkles className="w-6 h-6 text-[var(--gold)] mx-auto mb-2" />
                <p className="text-sm text-gray-300">Exclusive Content</p>
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
              <span className="text-gray-400">Your balance:</span>
              <span className="text-xl font-bold text-white">
                {isLoadingBalance ? "..." : userBalance.toLocaleString()}
              </span>
              <span className="text-gray-400">credits</span>
              <Link href="/credits">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  Top Up
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
            Buy credits securely with crypto or card
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#F7931A] font-medium">Bitcoin</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#627EEA] font-medium">Ethereum</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-blue-400 font-medium">Credit Card</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowInsufficientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Not Enough Credits
                </h3>
                <p className="text-gray-400 mb-6">
                  You need <span className="text-white font-semibold">{requiredCredits.toLocaleString()}</span> credits
                  but only have <span className="text-white font-semibold">{userBalance.toLocaleString()}</span>.
                </p>
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-2">You need</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {(requiredCredits - userBalance).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">more credits</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowInsufficientModal(false)}
                  >
                    Cancel
                  </Button>
                  <Link href="/credits" className="flex-1">
                    <Button variant="premium" className="w-full gap-2">
                      <Coins className="w-4 h-4" />
                      Buy Credits
                    </Button>
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
