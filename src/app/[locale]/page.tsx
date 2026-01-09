"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut,
  User,
  Building2,
  BarChart3,
  UserPlus,
  Handshake,
  Heart,
} from "lucide-react";
import { Button, Card, PremiumCard, FeatureCard, PremiumBadge } from "@/components/ui";
import { Footer } from "@/components/layout/Footer";
import { PPVLinks } from "@/components/landing";
import { getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Premium Creator Card component for homepage
function PremiumCreatorCard({ creator, locale }: { creator: Creator; locale: string }) {
  return (
    <Link href={`/${locale}/${creator.slug}`}>
      <PremiumCard
        variant="gold"
        showSparkles={true}
        showHolographic={true}
        className="h-full"
        contentClassName="h-full"
        rounded="2xl"
      >
        <div className="aspect-[3/4] relative overflow-hidden">
          {creator.cardImage || creator.avatar ? (
            <Image
              src={creator.cardImage || creator.avatar || ""}
              alt={creator.displayName}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={(creator.cardImage || creator.avatar || "").startsWith("/uploads")}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
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
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="text-lg font-bold text-white mb-1">
              {creator.displayName}
            </h3>
            <p className="text-sm text-gray-300 line-clamp-2 mb-3">
              {creator.bio || "Exclusive content creator"}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {creator.photoCount > 0 && (
                <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Camera className="w-3 h-3" />
                  {creator.photoCount}
                </span>
              )}
              {creator.videoCount > 0 && (
                <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Video className="w-3 h-3" />
                  {creator.videoCount}
                </span>
              )}
              {creator.subscriberCount > 0 && (
                <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Users className="w-3 h-3" />
                  {creator.subscriberCount}
                </span>
              )}
            </div>
          </div>

          {/* Category tags */}
          {creator.categories && creator.categories.length > 0 && (
            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
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
      </PremiumCard>
    </Link>
  );
}

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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
        const res = await fetch("/api/creators?featured=true", {
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
    <div className="min-h-screen bg-black max-w-[100vw] overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}`} className="flex items-center gap-2 flex-shrink-0">
              <Crown className="w-7 h-7 text-[var(--gold)] flex-shrink-0" />
              <span className="text-xl font-bold gradient-gold-text">VipOnly</span>
            </Link>

            <div className="flex items-center gap-3">
              {session ? (
                <div className="relative">
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-full border border-white/10 hover:border-[var(--gold)]/30 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--gold)]/50"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-black" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm text-gray-300 max-w-[100px] truncate">
                      {session.user?.name?.split(" ")[0] || "User"}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        />

                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-2rem)] bg-black/95 backdrop-blur-xl border border-[var(--gold)]/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                        >
                          {/* Gold accent */}
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-semibold text-white">
                              {session.user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {session.user?.email}
                            </p>
                          </div>
                          <div className="py-2">
                            <Link
                              href={`/${locale}/dashboard`}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Crown className="w-4 h-4 text-[var(--gold)]" />
                              {t("nav.dashboard")}
                            </Link>
                            <Link
                              href={`/${locale}/dashboard/messages`}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <MessageCircle className="w-4 h-4 text-blue-400" />
                              Messages
                            </Link>
                            <button
                              onClick={() => signOut()}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t("nav.logout")}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
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
      <section className="relative pt-24 pb-8 px-4 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-[var(--gold)]/10 via-amber-500/5 to-transparent rounded-full blur-[100px]"
            animate={{ x: [0, 30, 0], opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-[80px]"
            animate={{ x: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-[var(--gold)]/10 via-amber-500/5 to-transparent rounded-full blur-[100px]"
            animate={{ opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Premium badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--gold)]/20 to-amber-500/10 border border-[var(--gold)]/30 text-[var(--gold)] text-sm font-medium mb-6 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--gold)]/20 to-amber-500/10 blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Crown className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t("home.premiumCollection") || "Premium Collection"}</span>
              <Sparkles className="w-4 h-4 relative z-10" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-yellow-200 via-[var(--gold)] to-amber-500 bg-clip-text text-transparent">{t("home.title")}</span> — {t("home.subtitle")}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {t("home.description")}
            </p>
          </motion.div>

          {/* Creators Grid - Premium Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 p-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : creators.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 p-2"
            >
              {creators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <PremiumCreatorCard creator={creator} locale={locale} />
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
            {/* Features with FeatureCard */}
            <div className="grid sm:grid-cols-2 gap-4">
              {creatorFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <FeatureCard variant="gold" className="p-5 h-full">
                    <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center mb-3">
                      <feature.icon className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </FeatureCard>
                </motion.div>
              ))}
            </div>

            {/* Creator Card - Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <PremiumCard variant="gold" showSparkles={true} showHolographic={true} rounded="3xl">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center shadow-lg shadow-[var(--gold)]/30"
                      animate={{ boxShadow: ["0 0 20px rgba(212,175,55,0.3)", "0 0 40px rgba(212,175,55,0.5)", "0 0 20px rgba(212,175,55,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-8 h-8 text-black" />
                    </motion.div>
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
                        <motion.div
                          className="w-5 h-5 rounded-full bg-[var(--gold)]/20 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        >
                          <Check className="w-3 h-3 text-[var(--gold)]" />
                        </motion.div>
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
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>

      {/* For Agencies Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              {t("home.forAgencies")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("home.agencyTitle")}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.agencyCTA")}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Agency Features with FeatureCard */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Users, title: t("home.multipleCreators"), desc: t("home.multipleCreatorsDesc") },
                { icon: BarChart3, title: t("home.performanceTracking"), desc: t("home.performanceTrackingDesc") },
                { icon: UserPlus, title: t("home.teamManagement"), desc: t("home.teamManagementDesc") },
                { icon: DollarSign, title: t("home.revenueSharing"), desc: t("home.revenueSharingDesc") },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <FeatureCard variant="purple" className="p-5 h-full">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </FeatureCard>
                </motion.div>
              ))}
            </div>

            {/* Agency Card - Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <PremiumCard variant="purple" showSparkles={true} showHolographic={true} rounded="3xl">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                      animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.3)", "0 0 40px rgba(168,85,247,0.5)", "0 0 20px rgba(168,85,247,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Building2 className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t("home.agencyAccount")}</h3>
                      <p className="text-gray-400">{t("home.manageCreators")}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">{t("home.firstMonth")}</span>
                      <span className="text-purple-400 font-bold text-xl">{t("home.zeroFee")}</span>
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
                      t("home.multipleCreators"),
                      t("home.performanceTracking"),
                      t("home.revenueSharing"),
                      t("home.realtimeAnalytics"),
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <motion.div
                          className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        >
                          <Check className="w-3 h-3 text-purple-400" />
                        </motion.div>
                        <span className="text-gray-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/${locale}/dashboard/agency`} className="block">
                    <Button variant="default" size="lg" className="w-full gap-2 bg-purple-500 hover:bg-purple-600">
                      {t("home.joinAsAgency")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PPV Links Section */}
      <PPVLinks />

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </div>

      {/* Protection Mutuelle Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              {t("home.protectionBadge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("home.protectionTitle")}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.protectionDesc")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pour les Créateurs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full hover:border-[var(--gold)]/30 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{t("home.protectionCreatorsTitle")}</h3>
                    <p className="text-sm text-[var(--gold)]">{t("home.protectionCreatorsSubtitle")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionCreators1")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionCreators1Desc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionCreators2")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionCreators2Desc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[var(--gold)]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionCreators3")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionCreators3Desc")}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Pour les Agences */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{t("home.protectionAgenciesTitle")}</h3>
                    <p className="text-sm text-purple-400">{t("home.protectionAgenciesSubtitle")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionAgencies1")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionAgencies1Desc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionAgencies2")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionAgencies2Desc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t("home.protectionAgencies3")}</p>
                      <p className="text-sm text-gray-400">{t("home.protectionAgencies3Desc")}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-blue-500/10 to-purple-500/10 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{t("home.protectionTrustTitle")}</p>
                <p className="text-sm text-gray-400">{t("home.protectionTrustDesc")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      {/* Connect Section - Find Agency / Find Creator */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Handshake className="w-4 h-4" />
              {t("home.connect")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("home.connectTitle")}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.connectCTA")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Creators - Find Agency */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full hover:border-emerald-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t("home.forCreatorsTitle")}</h3>
                <p className="text-sm text-emerald-400 mb-4">{t("home.forCreatorsConnect")}</p>
                <p className="text-gray-400 mb-6">
                  {t("home.forCreatorsDesc")}
                </p>
                <Link href={`/${locale}/dashboard/find-agency`}>
                  <Button variant="outline" className="w-full gap-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                    {t("home.findAgency")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* For Agencies - Find Creators */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full hover:border-purple-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t("home.forAgenciesTitle")}</h3>
                <p className="text-sm text-purple-400 mb-4">{t("home.forAgenciesConnect")}</p>
                <p className="text-gray-400 mb-6">
                  {t("home.forAgenciesDesc")}
                </p>
                <Link href={`/${locale}/dashboard/find-creator`}>
                  <Button variant="outline" className="w-full gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                    {t("home.findCreators")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>

          {/* Matching System Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{t("home.matchingSystem")}</p>
                <p className="text-sm text-gray-400">{t("home.matchingSystemDesc")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer showPlatformLinks={true} />
    </div>
  );
}
