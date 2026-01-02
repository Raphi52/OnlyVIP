"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Check,
  Crown,
  CreditCard,
  Wallet,
  BadgeCheck,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// Supported cryptocurrencies
const CRYPTO_LIST = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "text-orange-500" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "text-blue-400" },
  { symbol: "USDT", name: "Tether", icon: "₮", color: "text-green-500" },
  { symbol: "USDC", name: "USD Coin", icon: "$", color: "text-blue-500" },
  { symbol: "LTC", name: "Litecoin", icon: "Ł", color: "text-gray-400" },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "text-purple-500" },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", color: "text-yellow-500" },
  { symbol: "XRP", name: "Ripple", icon: "✕", color: "text-gray-300" },
];

const BENEFITS = [
  {
    icon: EyeOff,
    title: "100% Anonymous",
    description:
      "No bank statements, no credit card records. Your purchases stay private.",
  },
  {
    icon: Zap,
    title: "Instant Transactions",
    description:
      "Crypto payments are processed instantly. No waiting for bank approvals.",
  },
  {
    icon: Globe,
    title: "No Geographic Limits",
    description:
      "Pay from anywhere in the world. No country restrictions on crypto payments.",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description:
      "Blockchain transactions are encrypted and irreversible. Maximum security.",
  },
  {
    icon: Lock,
    title: "No Chargebacks",
    description:
      "Crypto payments are final. Protects both creators and the platform.",
  },
  {
    icon: BadgeCheck,
    title: "Lower Fees",
    description:
      "Crypto transactions have lower processing fees than credit cards.",
  },
];

const COMPARISON = [
  { feature: "Bitcoin (BTC)", viponly: true, onlyfans: false },
  { feature: "Ethereum (ETH)", viponly: true, onlyfans: false },
  { feature: "USDT / USDC", viponly: true, onlyfans: false },
  { feature: "Anonymous Payments", viponly: true, onlyfans: false },
  { feature: "No Bank Statements", viponly: true, onlyfans: false },
  { feature: "Credit Card", viponly: true, onlyfans: true },
  { feature: "Platform Fee", viponly: "5%", onlyfans: "20%" },
];

const FAQS = [
  {
    q: "Does VipOnly accept Bitcoin?",
    a: "Yes! VipOnly accepts Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin, Solana, and many other cryptocurrencies. We're one of the few adult content platforms that fully supports crypto payments.",
  },
  {
    q: "Is paying with crypto anonymous?",
    a: "Yes, cryptocurrency payments on VipOnly are completely anonymous. Unlike credit card payments, crypto transactions don't appear on bank statements. Your privacy is 100% protected.",
  },
  {
    q: "How do I pay with crypto on VipOnly?",
    a: "Simply select 'Pay with Crypto' at checkout. You'll receive a wallet address to send your payment. Once the transaction is confirmed on the blockchain, your purchase is complete.",
  },
  {
    q: "Why doesn't OnlyFans accept crypto?",
    a: "OnlyFans has chosen not to implement cryptocurrency payments. VipOnly is the best OnlyFans alternative for users who want to pay with Bitcoin, Ethereum, or other cryptocurrencies.",
  },
  {
    q: "Are there extra fees for crypto payments?",
    a: "VipOnly doesn't charge extra fees for crypto payments. You only pay the standard blockchain network fee (gas fee), which is typically very low.",
  },
  {
    q: "How long do crypto payments take?",
    a: "Most crypto payments are confirmed within minutes. Bitcoin typically takes 10-30 minutes for full confirmation, while Ethereum and stablecoins are usually faster.",
  },
];

export default function CryptoPage() {
  const locale = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
                  Join Free
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6"
            >
              <Wallet className="w-4 h-4" />
              Crypto Payments Accepted
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Pay with <span className="text-orange-500">Bitcoin</span>,{" "}
              <span className="text-blue-400">Ethereum</span> & More
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
              Unlike OnlyFans, VipOnly accepts{" "}
              <span className="text-white font-semibold">cryptocurrency payments</span>.
              Pay anonymously with Bitcoin, Ethereum, USDT, and 50+ other cryptocurrencies.
              No bank statements. No credit card records.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/creators`}>
                <Button variant="premium" size="lg" className="gap-2 px-8">
                  <Wallet className="w-5 h-5" />
                  Start Browsing
                </Button>
              </Link>
              <Link href={`/${locale}/credits`}>
                <Button variant="outline" size="lg" className="gap-2">
                  <CreditCard className="w-5 h-5" />
                  Buy Credits with Crypto
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Crypto Icons Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            {CRYPTO_LIST.map((crypto, i) => (
              <motion.div
                key={crypto.symbol}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Card className="px-4 py-3 flex items-center gap-3 hover:border-[var(--gold)]/50 transition-all">
                  <span className={cn("text-2xl font-bold", crypto.color)}>
                    {crypto.icon}
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">{crypto.symbol}</p>
                    <p className="text-xs text-gray-500">{crypto.name}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Crypto Section */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Pay with Crypto?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Cryptocurrency payments offer privacy, security, and convenience that
              traditional payment methods can't match.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:border-[var(--gold)]/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-[var(--gold)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
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
              VipOnly vs OnlyFans: Crypto Payments
            </h2>
            <p className="text-gray-400">
              See why VipOnly is the best OnlyFans alternative for crypto users
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
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-400 font-medium">
                        Feature
                      </th>
                      <th className="text-center p-4">
                        <span className="text-[var(--gold)] font-bold">VipOnly</span>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-gray-500 font-medium">OnlyFans</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="p-4 text-white">{row.feature}</td>
                        <td className="p-4 text-center">
                          {typeof row.viponly === "boolean" ? (
                            row.viponly ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-red-500">✗</span>
                            )
                          ) : (
                            <span className="text-[var(--gold)] font-bold">
                              {row.viponly}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.onlyfans === "boolean" ? (
                            row.onlyfans ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-red-500">✗</span>
                            )
                          ) : (
                            <span className="text-gray-400">{row.onlyfans}</span>
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

      {/* How It Works */}
      <section className="px-4 pb-20 border-t border-white/5 pt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              How to Pay with Crypto on VipOnly
            </h2>
            <p className="text-gray-400">
              It's easy to pay with Bitcoin, Ethereum, or any supported cryptocurrency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Browse Creators",
                description:
                  "Find your favorite creators and subscribe or purchase content",
              },
              {
                step: 2,
                title: "Select Crypto",
                description:
                  "At checkout, choose 'Pay with Crypto' and select your cryptocurrency",
              },
              {
                step: 3,
                title: "Send Payment",
                description:
                  "Send the exact amount to the wallet address. Done in minutes!",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[var(--gold)]">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
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
            <p className="text-gray-400">
              Everything you need to know about crypto payments on VipOnly
            </p>
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
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-orange-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Wallet className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Pay with Crypto?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join VipOnly today and enjoy anonymous payments with Bitcoin, Ethereum, and
              50+ other cryptocurrencies. No bank statements. Total privacy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-10">
                  <Crown className="w-5 h-5" />
                  Join VipOnly Free
                </Button>
              </Link>
              <Link href={`/${locale}/creators`}>
                <Button variant="outline" size="lg" className="gap-2">
                  Browse Creators
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
              {new Date().getFullYear()} VipOnly - The Best OnlyFans Alternative with Crypto
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
