"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Crown,
  Camera,
  Video,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Star,
  Flame,
  Trophy,
  Zap,
  Heart,
  Loader2,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, getCategoryById } from "@/lib/categories";

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
  categories: string[];
  createdAt?: string;
}

// SEO-optimized category links
const TOP_CATEGORIES = [
  { id: "latina", label: "Latina", icon: "🔥" },
  { id: "asian", label: "Asian", icon: "🌸" },
  { id: "mature", label: "MILF", icon: "💎" },
  { id: "cosplay", label: "Cosplay", icon: "🎭" },
  { id: "feet", label: "Feet", icon: "👠" },
  { id: "curvy", label: "BBW/Curvy", icon: "🍑" },
  { id: "ebony", label: "Ebony", icon: "✨" },
  { id: "blonde", label: "Blonde", icon: "💫" },
  { id: "brunette", label: "Brunette", icon: "🖤" },
  { id: "petite", label: "Petite", icon: "🦋" },
];

export default function TopCreatorsPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators");
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

  // Sort creators
  const topCreators = [...creators]
    .sort((a, b) => b.subscriberCount - a.subscriberCount)
    .slice(0, 12);

  const risingStars = [...creators]
    .filter((c) => c.createdAt && isNewCreator(c.createdAt))
    .sort((a, b) => b.subscriberCount - a.subscriberCount)
    .slice(0, 6);

  const mostContent = [...creators]
    .sort((a, b) => (b.photoCount + b.videoCount) - (a.photoCount + a.videoCount))
    .slice(0, 6);

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
              {session ? (
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/${locale}/auth/login`}>
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href={`/${locale}/auth/register`}>
                    <Button variant="premium" size="sm" className="gap-2">
                      Join Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6"
            >
              <Trophy className="w-4 h-4" />
              Best OnlyFans Alternative
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Best <span className="gradient-gold-text">Models</span> & Top Creators
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
              Discover the hottest content creators on VipOnly. Unlike OnlyFans, we accept{" "}
              <span className="text-[var(--gold)]">crypto payments</span> and charge only{" "}
              <span className="text-[var(--gold)]">5% fees</span> (vs 20% on OnlyFans).
            </p>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--gold)]">{creators.length}+</div>
                <div className="text-gray-500">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--gold)]">5%</div>
                <div className="text-gray-500">Platform Fee</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--gold)]">BTC/ETH</div>
                <div className="text-gray-500">Crypto Accepted</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Quick Links - SEO Internal Links */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TOP_CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                >
                  <Link href={`/${locale}/creators/${cat.id}`}>
                    <Card className="p-4 hover:border-[var(--gold)]/50 transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <p className="font-medium text-white group-hover:text-[var(--gold)] transition-colors">
                            {cat.label}
                          </p>
                          <p className="text-xs text-gray-500">View Models</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Creators Section */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[var(--gold)]" />
                Top Creators
              </h2>
              <Link href={`/${locale}/creators?sort=popular`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--gold)]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {topCreators.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <CreatorCard creator={creator} rank={i + 1} locale={locale} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Rising Stars Section */}
      {risingStars.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-green-500" />
                  Rising Stars
                  <span className="text-sm font-normal text-gray-500 ml-2">New This Week</span>
                </h2>
                <Link href={`/${locale}/creators?sort=newest`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All New
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {risingStars.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CreatorCard creator={creator} isNew locale={locale} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Most Content Section */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Camera className="w-6 h-6 text-purple-500" />
                Most Content
              </h2>
              <Link href={`/${locale}/creators?sort=content`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {mostContent.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CreatorCard creator={creator} locale={locale} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="px-4 pb-16 border-t border-white/5 pt-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-invert max-w-none"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Why VipOnly is the Best OnlyFans Alternative
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                  Lower Fees for Creators
                </h3>
                <p className="text-sm leading-relaxed">
                  VipOnly charges only <strong className="text-white">5% platform fee</strong>{" "}
                  compared to OnlyFans' 20%. This means creators keep 95% of their earnings.
                  New creators get <strong className="text-[var(--gold)]">0% fees for the first month</strong>.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                  Crypto Payments Accepted
                </h3>
                <p className="text-sm leading-relaxed">
                  Unlike OnlyFans, VipOnly accepts <strong className="text-white">Bitcoin, Ethereum, USDT</strong>{" "}
                  and other cryptocurrencies. Pay anonymously without bank statements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--gold)]" />
                  AI-Powered Chatting
                </h3>
                <p className="text-sm leading-relaxed">
                  Creators can use AI assistants to engage with fans 24/7. Better response times
                  and personalized experiences for subscribers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[var(--gold)]" />
                  Agency Management Tools
                </h3>
                <p className="text-sm leading-relaxed">
                  Built-in tools for OnlyFans agencies: manage multiple creators, assign chatters,
                  track earnings, and AI personality customization.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[var(--gold)]/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Crown className="w-16 h-16 text-[var(--gold)] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Join VipOnly?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Whether you're a creator looking for lower fees or a fan wanting to pay with crypto,
              VipOnly is the best OnlyFans alternative.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" size="lg" className="gap-2 px-10">
                  <Crown className="w-5 h-5" />
                  Become a Creator
                </Button>
              </Link>
              <Link href={`/${locale}/creators`}>
                <Button variant="outline" size="lg" className="gap-2">
                  Browse All Creators
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer with SEO Links */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Top Categories</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                {TOP_CATEGORIES.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${locale}/creators/${cat.id}`}
                      className="hover:text-[var(--gold)] transition-colors"
                    >
                      {cat.label} Models
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">More Categories</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                {TOP_CATEGORIES.slice(5, 10).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${locale}/creators/${cat.id}`}
                      className="hover:text-[var(--gold)] transition-colors"
                    >
                      {cat.label} Creators
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Discover</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href={`/${locale}/creators`} className="hover:text-[var(--gold)] transition-colors">
                    All Creators
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/creators?sort=newest`} className="hover:text-[var(--gold)] transition-colors">
                    New Creators
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/creators?sort=popular`} className="hover:text-[var(--gold)] transition-colors">
                    Popular Creators
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href={`/${locale}/credits`} className="hover:text-[var(--gold)] transition-colors">
                    Buy Credits
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/terms`} className="hover:text-[var(--gold)] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/privacy`} className="hover:text-[var(--gold)] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--gold)]" />
              <span className="font-bold gradient-gold-text">VipOnly</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} VipOnly - Best OnlyFans Alternative. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Creator Card Component
function CreatorCard({
  creator,
  rank,
  isNew,
  locale,
}: {
  creator: Creator;
  rank?: number;
  isNew?: boolean;
  locale: string;
}) {
  return (
    <Link href={`/${locale}/${creator.slug}`}>
      <Card className="group overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-300 hover:scale-[1.02]">
        <div className="aspect-[3/4] relative overflow-hidden">
          {creator.cardImage || creator.avatar ? (
            <Image
              src={creator.cardImage || creator.avatar || ""}
              alt={`${creator.displayName} - VipOnly Creator`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--gold)]/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-white/20">
                {creator.displayName.charAt(0)}
              </span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Rank Badge */}
          {rank && rank <= 3 && (
            <div className="absolute top-2 left-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  rank === 1 && "bg-[var(--gold)] text-black",
                  rank === 2 && "bg-gray-300 text-black",
                  rank === 3 && "bg-amber-600 text-white"
                )}
              >
                #{rank}
              </div>
            </div>
          )}

          {/* New Badge */}
          {isNew && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                NEW
              </span>
            </div>
          )}

          {/* Category Tags */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {creator.categories?.slice(0, 2).map((catId) => {
              const cat = getCategoryById(catId);
              return cat ? (
                <span
                  key={catId}
                  className="px-2 py-0.5 rounded-full bg-black/80 text-[var(--gold)] text-[10px] font-bold border border-[var(--gold)]/50"
                >
                  {cat.label}
                </span>
              ) : null;
            })}
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-sm truncate">{creator.displayName}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
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
        </div>
      </Card>
    </Link>
  );
}

function isNewCreator(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}
