"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  Crown,
  DollarSign,
  Wallet,
  Bot,
  Users,
  Shield,
  Zap,
  TrendingUp,
  Calculator,
  ChevronDown,
  ChevronUp,
  Star,
  MessageCircle,
  Lock,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const COMPARISON_FEATURES = [
  { feature: "Platform Fee", viponly: "5%", onlyfans: "20%", highlight: true },
  { feature: "First Month Fee", viponly: "0%", onlyfans: "20%", highlight: true },
  { feature: "Crypto Payments", viponly: true, onlyfans: false },
  { feature: "Bitcoin Accepted", viponly: true, onlyfans: false },
  { feature: "Anonymous Payments", viponly: true, onlyfans: false },
  { feature: "AI Chat Assistant", viponly: true, onlyfans: false },
  { feature: "Agency Tools", viponly: true, onlyfans: false },
  { feature: "Multi-Creator Management", viponly: true, onlyfans: false },
  { feature: "Chatter Assignment", viponly: true, onlyfans: false },
  { feature: "Credit Card Payments", viponly: true, onlyfans: true },
  { feature: "Direct Messaging", viponly: true, onlyfans: true },
  { feature: "PPV Content", viponly: true, onlyfans: true },
  { feature: "Subscriptions", viponly: true, onlyfans: true },
  { feature: "Tips", viponly: true, onlyfans: true },
];

const WHY_SWITCH = [
  {
    icon: DollarSign,
    title: "Keep 95% of Earnings",
    description:
      "VipOnly takes only 5% vs OnlyFans' 20%. That's 4x less in fees. New creators get 0% fees for the first month.",
    stat: "95%",
    statLabel: "You Keep",
  },
  {
    icon: Wallet,
    title: "Crypto Payments",
    description:
      "Accept Bitcoin, Ethereum, USDT and 50+ cryptocurrencies. OnlyFans doesn't support crypto at all.",
    stat: "50+",
    statLabel: "Cryptos",
  },
  {
    icon: Bot,
    title: "AI Chat Assistant",
    description:
      "Let AI handle fan messages 24/7 while you focus on creating content. Personalized responses in your style.",
    stat: "24/7",
    statLabel: "AI Chat",
  },
  {
    icon: Users,
    title: "Agency Features",
    description:
      "Built-in tools for agencies: manage multiple creators, assign chatters, track earnings by creator.",
    stat: "∞",
    statLabel: "Creators",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Top Creator",
    text: "I switched from OnlyFans and saved over $2,000/month in fees. VipOnly's 5% fee is a game-changer.",
    rating: 5,
  },
  {
    name: "Agency XYZ",
    role: "Management Agency",
    text: "The agency tools are incredible. We manage 15 creators from one dashboard. OnlyFans couldn't do this.",
    rating: 5,
  },
  {
    name: "Mike T.",
    role: "Subscriber",
    text: "Finally I can pay with Bitcoin! No more embarrassing credit card statements. Total privacy.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Is VipOnly really cheaper than OnlyFans?",
    a: "Yes! VipOnly charges only 5% platform fee compared to OnlyFans' 20%. That means you keep 95% of your earnings instead of 80%. New creators get 0% fees for their first month.",
  },
  {
    q: "Can I transfer my OnlyFans subscribers to VipOnly?",
    a: "While you can't directly transfer subscribers, you can promote your VipOnly page to your existing audience. Many creators successfully migrate their fanbase by offering exclusive content on VipOnly.",
  },
  {
    q: "Does VipOnly have the same features as OnlyFans?",
    a: "VipOnly has all OnlyFans features plus more: subscriptions, PPV, tips, DMs, and stories. Plus exclusive features like crypto payments, AI chat, and agency management tools.",
  },
  {
    q: "Is VipOnly safe and legit?",
    a: "Absolutely. VipOnly uses bank-level encryption, secure payment processing, and strict content policies. Your data and earnings are protected.",
  },
  {
    q: "How do payouts work on VipOnly?",
    a: "Payouts are processed quickly via bank transfer or crypto. There's no minimum payout threshold, so you can withdraw your earnings anytime.",
  },
];

export default function OnlyFansAlternativePage() {
  const locale = useLocale();
  const [monthlyEarnings, setMonthlyEarnings] = useState(5000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculate savings
  const onlyfansFee = monthlyEarnings * 0.2;
  const vipOnlyFee = monthlyEarnings * 0.05;
  const monthlySavings = onlyfansFee - vipOnlyFee;
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[var(--gold)]" />
              <span className="text-xl font-bold gradient-gold-text">VipOnly</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href={`/${locale}/creators`}>
                <Button variant="ghost" size="sm">
                  Browse Creators
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="sm" className="gap-2">
                  Switch to VipOnly
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6"
            >
              <TrendingUp className="w-4 h-4" />
              #1 OnlyFans Alternative 2025
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              The Best <span className="gradient-gold-text">OnlyFans Alternative</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-4">
              Keep <span className="text-[var(--gold)] font-bold">95%</span> of your earnings
              instead of 80%. VipOnly charges only{" "}
              <span className="text-[var(--gold)] font-bold">5% fees</span> vs OnlyFans' 20%.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Plus: Crypto payments, AI chat assistant, and agency management tools.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-8">
                  <Crown className="w-5 h-5" />
                  Start Free Today
                </Button>
              </Link>
              <Link href="#calculator">
                <Button variant="outline" size="lg" className="gap-2">
                  <Calculator className="w-5 h-5" />
                  Calculate Savings
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--gold)]">5%</div>
                <div className="text-sm text-gray-500">Platform Fee</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">0%</div>
                <div className="text-sm text-gray-500">First Month</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--gold)]">95%</div>
                <div className="text-sm text-gray-500">You Keep</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              VipOnly vs OnlyFans Comparison
            </h2>
            <p className="text-gray-400">
              See why creators are switching to VipOnly
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left p-4 text-gray-400 font-medium">
                        Feature
                      </th>
                      <th className="text-center p-4 w-32">
                        <div className="flex flex-col items-center">
                          <Sparkles className="w-5 h-5 text-[var(--gold)] mb-1" />
                          <span className="text-[var(--gold)] font-bold">VipOnly</span>
                        </div>
                      </th>
                      <th className="text-center p-4 w-32">
                        <span className="text-gray-500 font-medium">OnlyFans</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-white/5 last:border-0",
                          row.highlight && "bg-[var(--gold)]/5"
                        )}
                      >
                        <td className={cn("p-4", row.highlight && "text-white font-medium")}>
                          {row.feature}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.viponly === "boolean" ? (
                            row.viponly ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className={cn(
                              "font-bold",
                              row.highlight ? "text-green-500 text-lg" : "text-[var(--gold)]"
                            )}>
                              {row.viponly}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.onlyfans === "boolean" ? (
                            row.onlyfans ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className={cn(
                              row.highlight ? "text-red-400 text-lg font-bold" : "text-gray-400"
                            )}>
                              {row.onlyfans}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Savings Calculator */}
      <section id="calculator" className="px-4 pb-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              <Calculator className="w-8 h-8 inline-block mr-2 text-[var(--gold)]" />
              Savings Calculator
            </h2>
            <p className="text-gray-400">
              See how much more you'd earn with VipOnly's 5% fee
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8">
              <div className="mb-8">
                <label className="block text-white font-medium mb-4">
                  Your Monthly Earnings: ${monthlyEarnings.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={monthlyEarnings}
                  onChange={(e) => setMonthlyEarnings(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--gold)]"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>$1,000</span>
                  <span>$50,000</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* OnlyFans Column */}
                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                  <h4 className="text-gray-400 mb-4">OnlyFans (20% fee)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Earnings</span>
                      <span className="text-white">${monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Platform Fee (20%)</span>
                      <span className="text-red-400">-${onlyfansFee.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">You Keep</span>
                      <span className="text-white font-bold text-xl">
                        ${(monthlyEarnings - onlyfansFee).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VipOnly Column */}
                <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
                  <h4 className="text-[var(--gold)] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    VipOnly (5% fee)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Earnings</span>
                      <span className="text-white">${monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Platform Fee (5%)</span>
                      <span className="text-green-400">-${vipOnlyFee.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">You Keep</span>
                      <span className="text-green-500 font-bold text-xl">
                        ${(monthlyEarnings - vipOnlyFee).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Summary */}
              <div className="p-6 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-center">
                <p className="text-gray-400 mb-2">By switching to VipOnly, you save:</p>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <div className="text-3xl font-bold text-[var(--gold)]">
                      ${monthlySavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div>
                    <div className="text-3xl font-bold text-green-500">
                      ${yearlySavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per year</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="px-4 pb-20 border-t border-white/5 pt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Creators Choose VipOnly
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              More than just lower fees - VipOnly offers features OnlyFans doesn't have
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_SWITCH.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:border-[var(--gold)]/30 transition-all text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-[var(--gold)]" />
                  </div>
                  <div className="text-3xl font-bold text-[var(--gold)] mb-1">
                    {item.stat}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">{item.statLabel}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              What Creators Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 text-[var(--gold)] fill-[var(--gold)]"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden transition-all cursor-pointer",
                    openFaq === i && "border-[var(--gold)]/30"
                  )}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white pr-4">{faq.q}</h3>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-[var(--gold)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-400 text-sm">{faq.a}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[var(--gold)]/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Crown className="w-16 h-16 text-[var(--gold)] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Keep More of Your Earnings?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who've switched to VipOnly. Lower fees, crypto
              payments, and features OnlyFans doesn't have.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-10">
                  <Crown className="w-5 h-5" />
                  Switch to VipOnly Free
                </Button>
              </Link>
              <Link href={`/${locale}/creators`}>
                <Button variant="outline" size="lg" className="gap-2">
                  See Top Creators
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--gold)]" />
              <span className="font-bold gradient-gold-text">VipOnly</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} VipOnly - The Best OnlyFans Alternative
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
