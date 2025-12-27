"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
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
}

const creatorFeatures = [
  {
    icon: Lock,
    title: "Exclusive Content",
    description: "Share photos, videos and exclusive content with paying subscribers only.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Chat directly with your fans. Send PPV messages and receive tips.",
  },
  {
    icon: DollarSign,
    title: "Multiple Revenue Streams",
    description: "Subscriptions, pay-per-view content, tips, and media sales.",
  },
  {
    icon: Shield,
    title: "Crypto Payments",
    description: "Accept crypto payments with instant conversions. Keep your earnings private.",
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Don't auto-redirect - let users browse the homepage freely

  // Fetch creators
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

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[var(--gold)]" />
              <span className="text-xl font-bold gradient-gold-text">VipOnly</span>
            </Link>

            <div className="flex items-center gap-3">
              {session ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  {session.user?.image ? (
                    <Link href="/dashboard/settings">
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--gold)]/30"
                      />
                    </Link>
                  ) : (
                    <Link href="/dashboard/settings">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-sm">
                        {session.user?.name?.charAt(0) || "U"}
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="premium" size="sm" className="gap-2">
                      Join Now
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
              Discover <span className="gradient-gold-text">Exclusive</span> Creators
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
              Subscribe to your favorite creators and access exclusive content, private messages, and more.
            </p>
            <Link href="/creators">
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                Browse All Creators
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
                  <Link href={`/${creator.slug}`}>
                    <Card className="group overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-300 hover:scale-[1.02]">
                      {/* Image */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        {creator.cardImage || creator.avatar ? (
                          <Image
                            src={creator.cardImage || creator.avatar || ""}
                            alt={creator.displayName}
                            fill
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

                        {/* VIP badge */}
                        <div className="absolute top-3 right-3">
                          <div className="px-2 py-1 rounded-full bg-[var(--gold)]/90 text-black text-xs font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            VIP
                          </div>
                        </div>
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
              <h3 className="text-xl font-semibold text-white mb-2">No creators yet</h3>
              <p className="text-gray-400 mb-6">Be the first to create your page!</p>
              <Link href="/auth/register">
                <Button variant="premium">Become a Creator</Button>
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
              <Link href="/creators">
                <Button variant="premium" size="lg" className="gap-2 px-8">
                  See More Creators
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
              For Creators
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start monetizing your content
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Create your exclusive page, share premium content, and earn from subscriptions, tips, and pay-per-view messages.
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
                      <h3 className="text-xl font-bold text-white">Creator Account</h3>
                      <p className="text-gray-400">Start earning today</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">Platform fee</span>
                      <span className="text-white font-semibold">3%</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">You keep</span>
                      <span className="text-[var(--gold)] font-bold text-xl">97%</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-400">Monthly fee</span>
                      <span className="text-white font-semibold">$0</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      "Accept crypto & card payments",
                      "Your own custom URL",
                      "Unlimited uploads",
                      "Real-time analytics",
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[var(--gold)]" />
                        </div>
                        <span className="text-gray-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/auth/register" className="block">
                    <Button variant="premium" size="lg" className="w-full gap-2">
                      Create Your Page - Free
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
              {new Date().getFullYear()} VipOnly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
