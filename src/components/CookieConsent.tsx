"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, Check } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_PREFERENCES_KEY = "cookie_preferences";

export function CookieConsent() {
  const t = useTranslations("cookies");
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const acceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, marketing: true };
    setPreferences(allPrefs);
    saveConsent(allPrefs);
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectNonEssential = () => {
    const minPrefs = { necessary: true, analytics: false, marketing: false };
    setPreferences(minPrefs);
    saveConsent(minPrefs);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setShow(false);
    setShowSettings(false);

    // Dispatch event for analytics scripts to check
    window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: prefs }));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9998] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

              {showSettings ? (
                // Settings view
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[var(--gold)]" />
                      {t("preferences")}
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Necessary cookies */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="font-medium text-white">{t("necessary")}</p>
                        <p className="text-sm text-gray-400">{t("necessaryDesc")}</p>
                      </div>
                      <div className="px-3 py-1 bg-[var(--gold)]/20 text-[var(--gold)] text-sm rounded-full">
                        {t("alwaysOn")}
                      </div>
                    </div>

                    {/* Analytics cookies */}
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-white">{t("analytics")}</p>
                        <p className="text-sm text-gray-400">{t("analyticsDesc")}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${preferences.analytics ? "bg-[var(--gold)]" : "bg-gray-600"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${preferences.analytics ? "translate-x-6" : "translate-x-0.5"}`} />
                        </div>
                      </div>
                    </label>

                    {/* Marketing cookies */}
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-white">{t("marketing")}</p>
                        <p className="text-sm text-gray-400">{t("marketingDesc")}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${preferences.marketing ? "bg-[var(--gold)]" : "bg-gray-600"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${preferences.marketing ? "translate-x-6" : "translate-x-0.5"}`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={acceptSelected}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/25 transition-all"
                    >
                      {t("savePreferences")}
                    </button>
                    <button
                      onClick={acceptAll}
                      className="flex-1 py-3 px-6 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                    >
                      {t("acceptAll")}
                    </button>
                  </div>
                </div>
              ) : (
                // Main banner view
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                        <Cookie className="w-6 h-6 text-[var(--gold)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{t("title")}</h3>
                        <p className="text-sm text-gray-400">
                          {t("description")}{" "}
                          <Link href="/privacy" className="text-[var(--gold)] hover:underline">
                            {t("privacyPolicy")}
                          </Link>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
                      <button
                        onClick={() => setShowSettings(true)}
                        className="py-2.5 px-4 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                      >
                        {t("customize")}
                      </button>
                      <button
                        onClick={rejectNonEssential}
                        className="py-2.5 px-4 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors text-center"
                      >
                        {t("rejectAll")}
                      </button>
                      <button
                        onClick={acceptAll}
                        className="py-2.5 px-6 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-black text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {t("acceptAll")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
