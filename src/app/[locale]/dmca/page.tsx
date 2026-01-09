"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Send, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DMCAPage() {
  const t = useTranslations("legal");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    contentUrl: "",
    originalUrl: "",
    description: "",
    signature: "",
    goodFaith: false,
    accuracy: false,
    authorization: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.goodFaith || !formData.accuracy || !formData.authorization) {
      alert("You must check all required declarations");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Failed to submit. Please email dmca@viponly.fun directly.");
      }
    } catch {
      alert("Failed to submit. Please email dmca@viponly.fun directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-black py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{t("dmca.successTitle")}</h1>
          <p className="text-gray-400 mb-8">
            {t("dmca.successDesc")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--gold)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("dmca.returnHome")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToHome")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{t("dmca.title")}</h1>
          <p className="text-gray-400">{t("dmca.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Policy Information */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment</h2>
                <p>
                  VipOnly respects the intellectual property rights of others and expects our users to do the same.
                  In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly
                  to claims of copyright infringement that are reported to our designated copyright agent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Designated DMCA Agent</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <p className="mb-2"><strong>DMCA Agent:</strong> Legal Department</p>
                  <p className="mb-2"><strong>Email:</strong> <a href="mailto:dmca@viponly.fun" className="text-[var(--gold)]">dmca@viponly.fun</a></p>
                  <p><strong>Response Time:</strong> Within 24-48 business hours</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Filing a DMCA Notice</h2>
                <p>To file a copyright infringement notification, you must provide a written communication that includes:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>A physical or electronic signature of the copyright owner or authorized agent</li>
                  <li>Identification of the copyrighted work claimed to have been infringed</li>
                  <li>Identification of the material that is claimed to be infringing, with enough detail to locate it</li>
                  <li>Your contact information (address, telephone number, and email)</li>
                  <li>A statement that you have a good faith belief that the use is not authorized</li>
                  <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Counter-Notification</h2>
                <p>
                  If you believe your content was removed in error, you may file a counter-notification containing:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Your physical or electronic signature</li>
                  <li>Identification of the removed material and its previous location</li>
                  <li>A statement under penalty of perjury that removal was a mistake or misidentification</li>
                  <li>Your name, address, phone number, and consent to jurisdiction</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Repeat Infringers</h2>
                <p>
                  VipOnly will terminate accounts of users who are determined to be repeat infringers.
                  We maintain records of all DMCA notices and will take appropriate action against repeat offenders.
                </p>
              </section>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-2">Important Warning</h3>
              <p className="text-gray-300 text-sm">
                Filing a false DMCA notice is a serious matter. Under 17 U.S.C. 512(f), any person who knowingly
                materially misrepresents that material is infringing may be subject to liability for damages,
                including costs and attorneys' fees.
              </p>
            </div>
          </div>

          {/* Takedown Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Submit DMCA Takedown Notice</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company/Organization (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL of Infringing Content on VipOnly *
                </label>
                <input
                  type="url"
                  required
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="https://viponly.fun/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL of Original Work (proof of ownership) *
                </label>
                <input
                  type="url"
                  required
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description of Infringement *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none resize-none"
                  placeholder="Please describe the copyrighted work and how it is being infringed..."
                />
              </div>

              {/* Declarations */}
              <div className="space-y-4 bg-black/30 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Required Declarations</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.goodFaith}
                    onChange={(e) => setFormData({ ...formData, goodFaith: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span className="text-sm text-gray-300">
                    I have a good faith belief that the use of the material in the manner complained of is not
                    authorized by the copyright owner, its agent, or the law.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accuracy}
                    onChange={(e) => setFormData({ ...formData, accuracy: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span className="text-sm text-gray-300">
                    I swear, under penalty of perjury, that the information in this notification is accurate.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.authorization}
                    onChange={(e) => setFormData({ ...formData, authorization: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-[var(--gold)] focus:ring-[var(--gold)]"
                  />
                  <span className="text-sm text-gray-300">
                    I am the copyright owner or authorized to act on behalf of the copyright owner.
                  </span>
                </label>
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Electronic Signature (type your full legal name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[var(--gold)]/50 focus:outline-none font-serif italic"
                  placeholder="Your Full Legal Name"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-8 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit DMCA Notice
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
