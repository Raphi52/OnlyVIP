"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { use } from "react";

interface PageProps {
  params: Promise<{ creator: string }>;
}

const faqs = [
  {
    category: "Subscription",
    questions: [
      {
        q: "How do I subscribe?",
        a: "Click on \"Join Now\" or \"Subscribe\" button on the creator's page, select your preferred plan (monthly or annual), and complete the payment using credit card or cryptocurrency.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel your subscription at any time from your dashboard. Your access will remain active until the end of your current billing period.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept credit/debit cards (Visa, Mastercard, Amex) and cryptocurrencies (Bitcoin, Ethereum).",
      },
      {
        q: "Is there a free trial?",
        a: "Some creators offer a free tier with limited content. Check the membership page for available options.",
      },
    ],
  },
  {
    category: "Content",
    questions: [
      {
        q: "How do I access exclusive content?",
        a: "After subscribing, all exclusive content will be unlocked and accessible in the gallery. Some special content may require additional one-time purchases.",
      },
      {
        q: "Can I download content?",
        a: "Download availability depends on your subscription tier and the creator's settings. VIP members typically have download access.",
      },
      {
        q: "How often is new content posted?",
        a: "Content frequency varies by creator. Most creators post new exclusive content multiple times per week.",
      },
    ],
  },
  {
    category: "Messaging",
    questions: [
      {
        q: "Can I message the creator directly?",
        a: "VIP subscribers can send direct messages to the creator. Response times may vary based on the creator's availability.",
      },
      {
        q: "What are PPV messages?",
        a: "Pay-Per-View (PPV) messages contain exclusive content that can be unlocked with a one-time payment.",
      },
      {
        q: "How do tips work?",
        a: "Tips are optional payments you can send to show appreciation. They go directly to the creator.",
      },
    ],
  },
  {
    category: "Account",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click on \"Forgot Password\" on the login page and follow the instructions sent to your email.",
      },
      {
        q: "Is my information secure?",
        a: "Yes, we use industry-standard encryption and never share your personal information with third parties.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact support to request account deletion. All your data will be permanently removed.",
      },
    ],
  },
];

export default function FAQPage({ params }: PageProps) {
  const { creator: creatorSlug } = use(params);
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <>
      <Navbar creatorSlug={creatorSlug} />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-[var(--gold)]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Find answers to common questions about subscriptions, content, and more.
            </p>
          </motion.div>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h2 className="text-xl font-semibold text-[var(--gold)] mb-4">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, index) => {
                    const key = `${categoryIndex}-${index}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={key}
                        className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : key)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium text-white">{faq.q}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-6 pb-4 text-gray-400">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center p-8 rounded-2xl bg-white/5 border border-white/10"
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-400 mb-4">
              Can't find what you're looking for? Contact our support team.
            </p>
            <a
              href={`/${creatorSlug}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--gold)] text-black font-semibold hover:bg-[var(--gold-light)] transition-colors"
            >
              Contact Support
            </a>
          </motion.div>
        </div>
      </main>
      <Footer creatorSlug={creatorSlug} />
    </>
  );
}
