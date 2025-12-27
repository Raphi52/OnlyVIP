"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: December 2024</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using VipOnly ("Service"), you accept and agree to be bound by the terms
                and provisions of this agreement. If you do not agree to these terms, please do not use
                our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
              <p>
                You must be at least 18 years old to use this Service. By using the Service, you represent
                and warrant that you are at least 18 years of age and have the legal capacity to enter into
                these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <p>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscriptions and Payments</h2>
              <p>
                Subscriptions are billed on a recurring basis (monthly or annually) until cancelled.
                By subscribing, you authorize us to charge your payment method for the subscription fee.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Prices are subject to change with notice</li>
                <li>Refunds are handled on a case-by-case basis</li>
                <li>You can cancel your subscription at any time</li>
                <li>Access continues until the end of the billing period</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Content and Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Share, redistribute, or resell any content from the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other users or creators</li>
                <li>Attempt to bypass any security measures</li>
                <li>Use automated systems to access the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p>
                All content on the Service, including but not limited to images, videos, text, and graphics,
                is protected by copyright and other intellectual property rights. You may not copy,
                reproduce, distribute, or create derivative works without express permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time, without prior notice,
                for conduct that we believe violates these Terms or is harmful to other users, us, or third
                parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" without warranties of any kind, either express or implied.
                We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of or relating to your use of the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material
                changes via email or through the Service. Continued use of the Service after such modifications
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@viponly.fun" className="text-[var(--gold)] hover:underline">
                  legal@viponly.fun
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
