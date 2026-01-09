"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { use } from "react";
import { useTranslations } from "next-intl";

interface PageProps {
  params: Promise<{ creator: string }>;
}

export default function FAQPage({ params }: PageProps) {
  const { creator: creatorSlug } = use(params);
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const faqs = [
    {
      category: t("categories.subscription"),
      questions: [
        { q: t("questions.howToSubscribe"), a: t("questions.howToSubscribeAnswer") },
        { q: t("questions.cancelSubscription"), a: t("questions.cancelSubscriptionAnswer") },
        { q: t("questions.paymentMethods"), a: t("questions.paymentMethodsAnswer") },
      ],
    },
    {
      category: t("categories.content"),
      questions: [
        { q: t("questions.contentTypes"), a: t("questions.contentTypesAnswer") },
        { q: t("questions.downloadContent"), a: t("questions.downloadContentAnswer") },
      ],
    },
    {
      category: t("categories.messaging"),
      questions: [
        { q: t("questions.howToMessage"), a: t("questions.howToMessageAnswer") },
        { q: t("questions.responseTime"), a: t("questions.responseTimeAnswer") },
      ],
    },
    {
      category: t("categories.account"),
      questions: [
        { q: t("questions.changePassword"), a: t("questions.changePasswordAnswer") },
        { q: t("questions.deleteAccount"), a: t("questions.deleteAccountAnswer") },
      ],
    },
  ];

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
              {t("title")}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("subtitle")}
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
              {t("stillHaveQuestions")}
            </h3>
            <p className="text-gray-400 mb-4">
              {t("cantFindAnswer")}
            </p>
            <a
              href={`/${creatorSlug}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--gold)] text-black font-semibold hover:bg-[var(--gold-light)] transition-colors"
            >
              {t("contactSupport")}
            </a>
          </motion.div>
        </div>
      </main>
      <Footer creatorSlug={creatorSlug} />
    </>
  );
}
