"use client";

import { motion } from "framer-motion";
import { Star, Quote, Shield, CreditCard, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface Testimonial {
  id: number;
  nameKey: string;
  avatar: string;
  rating: number;
  textKey: string;
  tier: string;
  dateKey: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    nameKey: "testimonial1Name",
    avatar: "A",
    rating: 5,
    textKey: "testimonial1Text",
    tier: "VIP",
    dateKey: "testimonial1Date",
  },
  {
    id: 2,
    nameKey: "testimonial2Name",
    avatar: "J",
    rating: 5,
    textKey: "testimonial2Text",
    tier: "VIP",
    dateKey: "testimonial2Date",
  },
  {
    id: 3,
    nameKey: "testimonial3Name",
    avatar: "C",
    rating: 5,
    textKey: "testimonial3Text",
    tier: "VIP",
    dateKey: "testimonial3Date",
  },
  {
    id: 4,
    nameKey: "testimonial4Name",
    avatar: "S",
    rating: 5,
    textKey: "testimonial4Text",
    tier: "Basic",
    dateKey: "testimonial4Date",
  },
];

const trustBadges = [
  { icon: Shield, textKey: "securePayments", subtextKey: "ssl256" },
  { icon: CreditCard, textKey: "discreteBilling", subtextKey: "privateName" },
  { icon: Clock, textKey: "instantAccess", subtextKey: "noWaiting" },
];

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#080808] to-black" />

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            {t("memberReviews")}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t("whatMembers")}{" "}
            <span className="gradient-gold-text">{t("say")}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t("joinThousands")}
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--gold)]/30 transition-all group"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-[var(--gold)]/20" />

              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-light)] flex items-center justify-center text-black font-bold text-lg">
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{t(testimonial.nameKey)}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      testimonial.tier === "VIP"
                        ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {testimonial.tier}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{t(testimonial.dateKey)}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[var(--gold)] fill-[var(--gold)]" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-300 leading-relaxed">{t(testimonial.textKey)}</p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-8"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.textKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                <badge.icon className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-white font-medium">{t(badge.textKey)}</p>
                <p className="text-sm text-gray-500">{t(badge.subtextKey)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center px-4"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-4 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-[var(--gold)]/5 to-[var(--gold)]/10 border border-[var(--gold)]/20 max-w-full">
            <div className="px-2">
              <p className="text-2xl sm:text-3xl font-bold gradient-gold-text">2,500+</p>
              <p className="text-xs sm:text-sm text-gray-400">{t("members")}</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[var(--gold)]/20" />
            <div className="px-2">
              <p className="text-2xl sm:text-3xl font-bold gradient-gold-text">4.9</p>
              <p className="text-xs sm:text-sm text-gray-400">{t("ratingLabel")}</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[var(--gold)]/20" />
            <div className="px-2">
              <p className="text-2xl sm:text-3xl font-bold gradient-gold-text">98%</p>
              <p className="text-xs sm:text-sm text-gray-400">{t("satisfaction")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
