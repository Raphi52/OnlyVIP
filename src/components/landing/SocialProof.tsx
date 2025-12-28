"use client";

import { motion } from "framer-motion";
import { Shield, Clock, Heart } from "lucide-react";

export function SocialProof() {
  const trustBadges = [
    { icon: Shield, text: "Secure Payments", subtext: "256-bit SSL" },
    { icon: Clock, text: "Instant Access", subtext: "No waiting" },
    { icon: Heart, text: "Cancel Anytime", subtext: "No commitment" },
  ];

  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-black via-[#050505] to-black">
      <div className="max-w-7xl mx-auto px-6">
        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 lg:gap-12"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
                <badge.icon className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{badge.text}</p>
                <p className="text-gray-500 text-xs">{badge.subtext}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
