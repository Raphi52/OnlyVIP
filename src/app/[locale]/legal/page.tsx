"use client";

import { motion } from "framer-motion";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LegalPage() {
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
            <Scale className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Legal Notice</h1>
          <p className="text-gray-400">Mentions Légales / Impressum</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Publisher Information</h2>
              <p>
                This website is published by:
              </p>
              <div className="bg-white/5 rounded-xl p-6 mt-4 border border-white/10">
                <p className="font-semibold text-white">VipOnly</p>
                <p>Operated by: VIPONLY LTD</p>
                <p>Registered Address: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>
                <p>Company Number: [Pending Registration]</p>
                <p className="mt-4">
                  <strong>Contact:</strong><br />
                  Email: <a href="mailto:contact@viponly.fun" className="text-[var(--gold)] hover:underline">contact@viponly.fun</a><br />
                  Legal inquiries: <a href="mailto:legal@viponly.fun" className="text-[var(--gold)] hover:underline">legal@viponly.fun</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Publication Director</h2>
              <p>
                Director of Publication: The legal representative of VIPONLY LTD
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Hosting Provider</h2>
              <div className="bg-white/5 rounded-xl p-6 mt-4 border border-white/10">
                <p className="font-semibold text-white">Vercel Inc.</p>
                <p>340 S Lemon Ave #4133</p>
                <p>Walnut, CA 91789, United States</p>
                <p className="mt-2">
                  Website: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">vercel.com</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Platform Status</h2>
              <p>
                VipOnly operates as a <strong>hosting platform</strong> within the meaning of Article 6 of the
                French Law for Confidence in the Digital Economy (LCEN) and the EU Digital Services Act (DSA).
              </p>
              <p className="mt-4">
                As a hosting provider, VipOnly:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Provides technical infrastructure for content creators to share their content with subscribers</li>
                <li>Does not create, edit, or control user-generated content</li>
                <li>Is not responsible for content uploaded by users, unless notified of manifestly illegal content</li>
                <li>Acts promptly to remove or disable access to illegal content upon valid notification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Content Responsibility</h2>
              <p>
                Content creators ("Creators") are solely responsible for the content they upload to the platform.
                Each Creator warrants that:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>They own or have the necessary rights to all content they upload</li>
                <li>All individuals appearing in their content are of legal age (18+) and have given consent</li>
                <li>Their content complies with all applicable laws and our Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Reporting Illegal Content</h2>
              <p>
                To report illegal content or copyright infringement, please contact us at:
              </p>
              <div className="bg-white/5 rounded-xl p-6 mt-4 border border-white/10">
                <p><strong>Abuse Reports:</strong> <a href="mailto:abuse@viponly.fun" className="text-[var(--gold)] hover:underline">abuse@viponly.fun</a></p>
                <p><strong>DMCA / Copyright:</strong> <a href="mailto:dmca@viponly.fun" className="text-[var(--gold)] hover:underline">dmca@viponly.fun</a></p>
                <p><strong>Legal Requests:</strong> <a href="mailto:legal@viponly.fun" className="text-[var(--gold)] hover:underline">legal@viponly.fun</a></p>
              </div>
              <p className="mt-4">
                We respond to all valid notifications within 24-48 hours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. DMCA Notice Procedure</h2>
              <p>
                If you believe that content on our platform infringes your copyright, please send a DMCA
                takedown notice to <a href="mailto:dmca@viponly.fun" className="text-[var(--gold)] hover:underline">dmca@viponly.fun</a> including:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Your physical or electronic signature</li>
                <li>Identification of the copyrighted work claimed to be infringed</li>
                <li>Identification of the material to be removed (URL)</li>
                <li>Your contact information (name, address, phone, email)</li>
                <li>A statement that you have a good faith belief that the use is not authorized</li>
                <li>A statement under penalty of perjury that the information is accurate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
              <p>
                The VipOnly name, logo, and website design are trademarks of VIPONLY LTD.
                All rights reserved.
              </p>
              <p className="mt-4">
                User-generated content remains the property of respective creators who grant VipOnly
                a license to display and distribute such content through the platform as described
                in our Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Applicable Law</h2>
              <p>
                This website and its use are governed by the laws of England and Wales. Any disputes
                shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
              <p className="mt-4">
                For EU consumers: You may also bring proceedings in your local courts and benefit from
                mandatory consumer protection laws in your country of residence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Age Restriction</h2>
              <p>
                This website contains adult content intended for individuals aged 18 years or older.
                By accessing this website, you confirm that you are at least 18 years of age.
              </p>
              <p className="mt-4">
                We implement age verification measures in compliance with applicable regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Related Documents</h2>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><Link href="/terms" className="text-[var(--gold)] hover:underline">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-[var(--gold)] hover:underline">Privacy Policy</Link></li>
              </ul>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
