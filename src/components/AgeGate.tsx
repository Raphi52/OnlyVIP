"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function AgeGate() {
  const t = useTranslations("ageGate");
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already consented
    const consented = localStorage.getItem("age_consent");
    if (!consented) {
      setShow(true);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem("age_consent", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-md mx-4"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-[var(--gold)]/20 rounded-3xl blur-xl" />

            {/* Card */}
            <div className="relative bg-gradient-to-b from-zinc-900 to-black border border-[var(--gold)]/20 rounded-2xl p-8 text-center">
              {/* Crown icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 flex items-center justify-center">
                <Crown className="w-8 h-8 text-[var(--gold)]" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("title")}
              </h2>

              {/* Subtitle */}
              <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                {t("description")}
              </p>

              {/* Enter button */}
              <button
                onClick={handleEnter}
                className="w-full py-4 px-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("enter")}
              </button>

              {/* Legal links */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                <Link href="/terms" className="hover:text-[var(--gold)] transition-colors">
                  {t("terms")}
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-[var(--gold)] transition-colors">
                  {t("privacy")}
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
