"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-4">{t("terms.title")}</h1>
          <p className="text-gray-400">{t("lastUpdated", { date: "December 29, 2025" })}</p>
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
              <h2 className="text-2xl font-semibold text-white mb-4">7. User-Generated Content</h2>
              <p>
                VipOnly is a platform that allows creators to share content with subscribers. We do not
                create, control, verify, or endorse any content posted by creators or users on the platform.
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Creators are solely responsible for the content they upload and share</li>
                <li>We do not pre-screen or monitor all user-generated content</li>
                <li>We make no representations or warranties about the accuracy, quality, or legality of user content</li>
                <li>The presence of content on our platform does not constitute endorsement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Responsibility for User Activities</h2>
              <p>
                <strong>VipOnly acts solely as an intermediary platform and is not responsible for:</strong>
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Any content uploaded, posted, or shared by users or creators</li>
                <li>Any interactions, communications, or transactions between users and creators</li>
                <li>Any disputes arising between users and creators</li>
                <li>Any harm, damages, or losses resulting from user activities on the platform</li>
                <li>The conduct, actions, or behavior of any user or creator</li>
                <li>Any illegal activities conducted by users through the platform</li>
                <li>The accuracy of information provided by creators about themselves or their content</li>
              </ul>
              <p className="mt-4">
                Users and creators agree that they are using the platform at their own risk and are solely
                responsible for their own actions and content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless VipOnly, its officers, directors, employees,
                agents, and affiliates from and against any and all claims, damages, obligations, losses,
                liabilities, costs, and expenses (including attorney&apos;s fees) arising from:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you upload, post, or share on the platform</li>
                <li>Any interaction you have with other users or creators</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Third-Party Links and Services</h2>
              <p>
                The Service may contain links to third-party websites or services. We are not responsible
                for the content, privacy policies, or practices of any third-party websites or services.
                Your interactions with third parties are solely between you and such third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time, without prior notice,
                for conduct that we believe violates these Terms or is harmful to other users, us, or third
                parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, either
                express or implied, including but not limited to implied warranties of merchantability,
                fitness for a particular purpose, and non-infringement. We do not guarantee that the Service
                will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, VipOnly and its officers, directors,
                employees, and agents shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages, including but not limited to loss of profits, data, use, or other
                intangible losses, arising out of or relating to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your content</li>
              </ul>
              <p className="mt-4">
                In no event shall our total liability exceed the amount you have paid to us in the past
                twelve (12) months, or one hundred dollars ($100), whichever is greater.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Governing Law and Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
                United States, without regard to its conflict of law principles. Any disputes arising from or relating
                to these Terms or the Service shall be subject to the exclusive jurisdiction of the state and federal
                courts located in Delaware, USA.
              </p>
              <p className="mt-4">
                For users located in the European Union, nothing in these Terms affects your rights under mandatory
                consumer protection laws in your country of residence. EU residents may also bring proceedings in
                their local courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material
                changes via email or through the Service. Continued use of the Service after such modifications
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">16. Contact</h2>
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
