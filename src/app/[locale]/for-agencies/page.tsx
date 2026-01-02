"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Sparkles,
  ArrowRight,
  Users,
  Bot,
  BarChart3,
  MessageCircle,
  DollarSign,
  Shield,
  Zap,
  Crown,
  Building2,
  UserPlus,
  Settings,
  PieChart,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Headphones,
  Laptop,
  TrendingUp,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Users,
    title: "Multi-Creator Management",
    description:
      "Manage unlimited creators from one dashboard. Add new creators, view their profiles, and monitor performance all in one place.",
  },
  {
    icon: Headphones,
    title: "Chatter Assignment",
    description:
      "Assign chatters to specific creators. Track response times, message quality, and fan satisfaction metrics.",
  },
  {
    icon: Bot,
    title: "AI-Powered Messaging",
    description:
      "Let AI handle routine fan messages 24/7. Customizable personalities for each creator. Seamless handoff to human chatters.",
  },
  {
    icon: PieChart,
    title: "Earnings Analytics",
    description:
      "Track earnings by creator, by chatter, and by content type. Real-time revenue dashboards and performance reports.",
  },
  {
    icon: DollarSign,
    title: "Commission Management",
    description:
      "Set commission rates per creator. Automatic earnings split calculation. Transparent payout tracking.",
  },
  {
    icon: Shield,
    title: "Content Moderation",
    description:
      "Review and approve content before publishing. Bulk upload capabilities. Content scheduling tools.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Sign Up as Agency",
    description: "Create your agency account and complete the verification process",
    icon: Building2,
  },
  {
    step: 2,
    title: "Add Creators",
    description: "Invite creators to join your agency or create profiles for them",
    icon: UserPlus,
  },
  {
    step: 3,
    title: "Assign Chatters",
    description: "Add team members as chatters and assign them to specific creators",
    icon: Headphones,
  },
  {
    step: 4,
    title: "Configure AI",
    description: "Set up AI personalities to handle fan messages automatically",
    icon: Bot,
  },
  {
    step: 5,
    title: "Monitor & Grow",
    description: "Track earnings, optimize performance, and scale your agency",
    icon: TrendingUp,
  },
];

const BENEFITS = [
  {
    stat: "5%",
    label: "Platform Fee",
    description: "Lowest fees in the industry. More earnings for you and your creators.",
  },
  {
    stat: "24/7",
    label: "AI Chat",
    description: "Never miss a message. AI responds when your team is offline.",
  },
  {
    stat: "∞",
    label: "Creators",
    description: "No limits on how many creators you can manage.",
  },
  {
    stat: "0%",
    label: "First Month",
    description: "New creators get 0% platform fee for their first month.",
  },
];

const FAQS = [
  {
    q: "What is an OnlyFans agency?",
    a: "An OnlyFans agency (or content creator agency) manages multiple content creators, handling their marketing, fan engagement, content strategy, and business operations. Agencies typically take a percentage of creator earnings in exchange for their management services.",
  },
  {
    q: "How do I start an agency on VipOnly?",
    a: "Sign up for a VipOnly account, then apply to become an agency from your dashboard. Once approved, you'll get access to the agency dashboard where you can add creators, assign chatters, and manage everything from one place.",
  },
  {
    q: "What are chatters and how do they work?",
    a: "Chatters are team members who respond to fan messages on behalf of creators. On VipOnly, you can add chatters to your agency, assign them to specific creators, and track their performance including response times and conversion rates.",
  },
  {
    q: "How does the AI chat feature work for agencies?",
    a: "VipOnly's AI can be configured for each creator with a unique personality. The AI handles routine fan messages 24/7, and can seamlessly hand off to human chatters for complex conversations or sales opportunities.",
  },
  {
    q: "What fees does VipOnly charge agencies?",
    a: "VipOnly charges only 5% platform fee on all earnings - the lowest in the industry. There are no additional agency fees. You set your own commission rates with your creators.",
  },
  {
    q: "Can I manage creators who are already on OnlyFans?",
    a: "Yes! You can invite creators who are currently on OnlyFans to also create a VipOnly profile. Many agencies manage creators across multiple platforms.",
  },
];

export default function ForAgenciesPage() {
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
                  Start Agency
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--gold)]/10 blur-[120px] rounded-full" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
            >
              <Building2 className="w-4 h-4" />
              OnlyFans Agency Platform
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              The Ultimate <span className="gradient-gold-text">Agency Platform</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-4">
              Manage multiple creators, assign chatters, and let AI handle fan messages.
              Everything you need to run a successful content creator agency.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Built for OnlyFans agencies. Only 5% platform fee.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-8">
                  <Building2 className="w-5 h-5" />
                  Start Your Agency
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="gap-2">
                  <Laptop className="w-5 h-5" />
                  See Features
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {BENEFITS.map((b, i) => (
              <Card key={i} className="p-4 text-center">
                <div className="text-3xl font-bold text-[var(--gold)] mb-1">
                  {b.stat}
                </div>
                <div className="text-sm font-medium text-white mb-1">{b.label}</div>
                <div className="text-xs text-gray-500">{b.description}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 pb-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Agency Management Features
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage creators, chatters, and grow your agency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:border-[var(--gold)]/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 pb-20 border-t border-white/5 pt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              How to Start Your Agency
            </h2>
            <p className="text-gray-400">
              Get your agency up and running in 5 simple steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-[var(--gold)]/50 to-purple-500/50 hidden md:block" />

            <div className="space-y-8">
              {WORKFLOW_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-6",
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  )}
                >
                  <div className={cn("flex-1", i % 2 === 0 ? "md:text-right" : "md:text-left")}>
                    <Card className="p-6 inline-block">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
                          <step.icon className="w-6 h-6 text-[var(--gold)]" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-white">{step.title}</h3>
                          <p className="text-sm text-gray-400">{step.description}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center z-10 flex-shrink-0">
                    {step.step}
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatting Section */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-12 bg-gradient-to-br from-purple-500/10 to-[var(--gold)]/10 border-purple-500/20">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium mb-4">
                    <Bot className="w-4 h-4" />
                    AI-Powered
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Let AI Handle Fan Messages 24/7
                  </h2>
                  <p className="text-gray-400 mb-6">
                    VipOnly's AI chat feature can respond to fan messages automatically,
                    using customizable personalities for each creator. Your chatters can
                    focus on high-value conversations while AI handles routine messages.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Custom AI personality per creator",
                      "Seamless handoff to human chatters",
                      "24/7 response coverage",
                      "Learns from creator's messaging style",
                      "Conversion optimization",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/30 to-[var(--gold)]/30 flex items-center justify-center">
                    <Bot className="w-24 h-24 text-[var(--gold)]" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
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
              Agency FAQ
            </h2>
            <p className="text-gray-400">
              Common questions about running an agency on VipOnly
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
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-purple-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Your Agency?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join VipOnly today and get access to the most powerful agency management
              tools in the industry. Only 5% platform fee.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-10">
                  <Building2 className="w-5 h-5" />
                  Create Agency Account
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
              {new Date().getFullYear()} VipOnly - The Best OnlyFans Agency Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
