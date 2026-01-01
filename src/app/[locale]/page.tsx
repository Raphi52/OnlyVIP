"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  Sparkles,
  Crown,
  MessageCircle,
  Lock,
  DollarSign,
  ArrowRight,
  Check,
  TrendingUp,
  Shield,
  Zap,
  Camera,
  Video,
  Users,
  Search,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar: string | null;
  cardImage: string | null;
  bio: string | null;
  photoCount: number;
  videoCount: number;
  subscriberCount: number;
  categories?: string[];
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();

  const creatorFeatures = [
    {
      icon: DollarSign,
      title: t("features.zeroPercent"),
      description: t("features.zeroPercentDesc"),
    },
    {
      icon: Lock,
      title: t("features.exclusive"),
      description: t("features.exclusiveDesc"),
    },
    {
      icon: MessageCircle,
      title: t("features.messaging"),
      description: t("features.messagingDesc"),
    },
    {
      icon: Shield,
      title: t("features.crypto"),
      description: t("features.cryptoDesc"),
    },
  ];

  // Don't auto-redirect - let users browse the homepage freely

  // Fetch creators
  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          setCreators(data.creators || []);
        }
      } catch (error) {
        console.error("Failed to fetch creators:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[var(--gold)]" />
              <span className="text-xl font-bold gradient-gold-text">VipOnly</span>
            </Link>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {session ? (
                <>
                  <Link href={`/${locale}/dashboard`}>
                    <Button variant="ghost" size="sm">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                  {session.user?.image ? (
                    <Link href={`/${locale}/dashboard`}>
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--gold)]/30"
                      />
                    </Link>
                  ) : (
                    <Link href={`/${locale}/dashboard`}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-sm">
                        {session.user?.name?.charAt(0) || "U"}
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href={`/${locale}/auth/login`}>
                    <Button variant="ghost" size="sm">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/auth/register`}>
                    <Button variant="premium" size="sm" className="gap-2">
                      {t("nav.signup")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Browse Models */}
      <section className="relative pt-24 pb-8 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--gold)]/5 via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="gradient-gold-text">{t("home.title")}</span> — {t("home.subtitle")}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t("home.description")}
            </p>
          </motion.div>

          {/* Creators Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : creators.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {creators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/${locale}/${creator.slug}`}>
                    <Card className="group overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-300 hover:scale-[1.02]">
                      {/* Image */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        {creator.cardImage || creator.avatar ? (
                          <img
                            src={creator.cardImage || creator.avatar || ""}
                            alt={creator.displayName}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--gold)]/20 to-purple-500/20 flex items-center justify-center">
                            <span className="text-5xl font-bold text-white/20">
                              {creator.displayName.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* Content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {creator.displayName}
                          </h3>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                            {creator.bio || "Exclusive content creator"}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {creator.photoCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {creator.photoCount}
                              </span>
                            )}
                            {creator.videoCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                {creator.videoCount}
                              </span>
                            )}
                            {creator.subscriberCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {creator.subscriberCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Category tags */}
                        {creator.categories && creator.categories.length > 0 && (
                          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                            {creator.categories.slice(0, 2).map((catId) => {
                              const cat = getCategoryById(catId);
                              return cat ? (
                                <span
                                  key={catId}
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm",
                                    cat.color
                                  )}
                                >
                                  {cat.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t("home.noCreators")}</h3>
              <p className="text-gray-400 mb-6">{t("home.beFirst")}</p>
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium">{t("nav.becomeCreator")}</Button>
              </Link>
            </div>
          )}

          {/* See More Button */}
          {creators.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-10"
            >
              <Link href={`/${locale}/creators`}>
                <Button variant="premium" size="lg" className="gap-2 px-8">
                  {t("home.discoverCreators")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Become a Creator Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              {t("home.forCreators")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("home.startMonetizing")}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.creatorCTA")}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              {creatorFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-5 h-full hover:border-[var(--gold)]/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center mb-3">
                      <feature.icon className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Creator Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)]/20 to-purple-500/20 rounded-3xl blur-3xl" />
                <Card variant="featured" className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t("home.creatorAccount")}</h3>
                      <p className="text-gray-400">{t("home.startEarning")}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">{t("home.firstMonth")}</span>
                      <span className="text-[var(--gold)] font-bold text-xl">{t("home.zeroFee")}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">{t("home.afterFirstMonth")}</span>
                      <span className="text-white font-semibold">{t("home.onlyFivePercent")}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-400">{t("home.monthlySubscription")}</span>
                      <span className="text-white font-semibold">{t("home.free")}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      t("home.cryptoCard"),
                      t("home.customUrl"),
                      t("home.unlimitedUploads"),
                      t("home.realtimeAnalytics"),
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[var(--gold)]" />
                        </div>
                        <span className="text-gray-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/${locale}/auth/register`} className="block">
                    <Button variant="premium" size="lg" className="w-full gap-2">
                      {t("home.createPageFree")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--gold)]" />
              <span className="font-bold gradient-gold-text">VipOnly</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} VipOnly. {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
