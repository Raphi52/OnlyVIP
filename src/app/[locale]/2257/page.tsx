"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Compliance2257Page() {
  const t = useTranslations("legal");
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
            <FileText className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{t("compliance2257.title")}</h1>
          <p className="text-gray-400">{t("compliance2257.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Compliance Statement</h2>
              <p>
                All content appearing on VipOnly (viponly.fun) is in full compliance with the requirements
                of 18 U.S.C. 2257 and associated regulations. All models, actors, actresses, and other
                persons that appear in any visual depiction of actual or simulated sexually explicit conduct
                appearing on or otherwise contained in this website were over the age of eighteen (18) years
                at the time of the creation of such depictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Record Keeping</h2>
              <p>
                Records required to be maintained pursuant to 18 U.S.C. 2257 are kept by the individual
                content creators ("Creators") who upload content to this platform. Each Creator is solely
                responsible for:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Verifying the age of all individuals appearing in their content</li>
                <li>Maintaining all required records for each individual depicted</li>
                <li>Ensuring all individuals are at least 18 years of age at the time of production</li>
                <li>Providing age verification documents upon request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Platform Responsibilities</h2>
              <p>
                VipOnly operates as a platform that facilitates the sharing of content between Creators
                and their subscribers. As such:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>We require all Creators to verify their identity and age before publishing content</li>
                <li>We require Creators to certify that all individuals in their content are 18 years or older</li>
                <li>We maintain records of Creator verifications and certifications</li>
                <li>We promptly investigate and remove content that violates our policies</li>
                <li>We cooperate with law enforcement requests as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Creator Verification Requirements</h2>
              <p>
                Before any Creator can publish content on VipOnly, they must:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Provide valid government-issued photo identification</li>
                <li>Complete identity verification through our third-party verification service</li>
                <li>Certify that they are at least 18 years of age</li>
                <li>Agree to maintain all required 2257 records for their content</li>
                <li>Certify that all individuals appearing in their content are at least 18 years of age</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Custodian of Records</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="mb-4">
                  The Custodian of Records for content produced directly by VipOnly is:
                </p>
                <p className="mb-2"><strong>Custodian:</strong> VipOnly Legal Department</p>
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:legal@viponly.fun" className="text-[var(--gold)]">legal@viponly.fun</a></p>
                <p className="mt-4 text-sm text-gray-400">
                  For user-generated content, the individual Creator is the Custodian of Records for their
                  own content and is responsible for maintaining all required documentation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Exemption Statement</h2>
              <p>
                Certain content on this website may be exempt from the record-keeping requirements of
                18 U.S.C. 2257 and 28 C.F.R. 75 because it consists solely of:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Content that does not portray actual sexually explicit conduct as defined in 18 U.S.C. 2256(2)(A)</li>
                <li>Content that was produced prior to July 3, 1995</li>
                <li>Content produced by parties located outside the United States</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Reporting Violations</h2>
              <p>
                If you believe that any content on this website may be in violation of 18 U.S.C. 2257
                or involves individuals under the age of 18, please report it immediately to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Email: <a href="mailto:legal@viponly.fun" className="text-[var(--gold)]">legal@viponly.fun</a></li>
                <li>National Center for Missing & Exploited Children (NCMEC): <a href="https://www.missingkids.org/gethelpnow/cybertipline" className="text-[var(--gold)]" target="_blank" rel="noopener noreferrer">CyberTipline</a></li>
              </ul>
              <p className="mt-4">
                We take all reports seriously and will investigate immediately. Content found to be in
                violation will be removed and the responsible parties will be banned from the platform
                and reported to the appropriate authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Updates to This Statement</h2>
              <p>
                This compliance statement may be updated from time to time to reflect changes in our
                practices or applicable law. The date of the last update will be noted at the top of
                this page.
              </p>
              <p className="mt-4 text-gray-400">
                <strong>Last Updated:</strong> January 2, 2026
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
