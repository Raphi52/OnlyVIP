"use client";

import { motion } from "framer-motion";
import { Link2, Coins, TrendingUp, Sparkles, ExternalLink, Copy, Check, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface PPVLinksProps {
  creatorSlug?: string;
}

export function PPVLinks({ creatorSlug = "creator" }: PPVLinksProps) {
  const t = useTranslations("home");
  const [copied, setCopied] = useState(false);

  const features = [
    {
      icon: Link2,
      title: t("ppvFeature1"),
      description: t("ppvFeature1Desc"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Coins,
      title: t("ppvFeature2"),
      description: t("ppvFeature2Desc"),
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: TrendingUp,
      title: t("ppvFeature3"),
      description: t("ppvFeature3Desc"),
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Sparkles,
      title: t("ppvFeature4"),
      description: t("ppvFeature4Desc"),
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(`viponly.fun/${creatorSlug}/ppv/xxxxx`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#030308] to-black" />

      {/* Animated gradient mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/20 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-amber-500/10 rounded-full blur-[120px] sm:blur-[150px]" />
      </div>

      {/* Grid pattern overlay - hidden on mobile for performance */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px] hidden sm:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6 sm:mb-8"
          >
            <div className="relative">
              <Link2 className="w-4 h-4 text-blue-400" />
              <div className="absolute inset-0 animate-ping">
                <Link2 className="w-4 h-4 text-blue-400 opacity-50" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t("ppvSubtitle")}
            </span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("ppvTitle")}
              </span>
              <motion.span
                className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h2>

          <p className="text-gray-400 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2">
            {t("ppvDesc")}
          </p>
        </motion.div>

        {/* Interactive Link Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-10 sm:mb-16"
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-40 sm:opacity-50 blur-lg group-hover:opacity-75 transition-opacity duration-500" />

            <div className="relative bg-[#0a0a0f] rounded-2xl border border-white/10 p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Link icon with animation */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Link2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 border-2 border-[#0a0a0f] flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </motion.div>
                </div>

                {/* Link URL */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">PPV Link</p>
                  <div className="flex items-center gap-2">
                    <code className="text-white font-mono text-xs sm:text-sm lg:text-base truncate">
                      viponly.fun/<span className="text-blue-400">{creatorSlug}</span>/ppv/<span className="text-purple-400">xxxxx</span>
                    </code>
                  </div>
                </div>

                {/* Copy button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className={`p-2.5 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                    copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                </motion.button>
              </div>

              {/* Stats preview */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { label: "Clicks", value: "2.4K", color: "text-blue-400" },
                  { label: "Conversions", value: "18%", color: "text-purple-400" },
                  { label: "Revenue", value: "$1,240", color: "text-green-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center"
                  >
                    <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* Card glow on hover - desktop only */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-50 blur transition-opacity duration-500 hidden sm:block`} />

              <div className="relative h-full bg-[#0a0a0f]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 hover:border-white/20 transition-colors">
                {/* Icon */}
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {feature.description}
                </p>

                {/* Decorative corner - desktop only */}
                <div className={`absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl ${feature.gradient} opacity-5 rounded-bl-full hidden sm:block`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-16"
        >
          <p className="text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-2 px-4">
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-center">Twitter, Instagram, Telegram, DMs...</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
