"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Crown,
  Camera,
  Video,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  TrendingUp,
  Clock,
  Star,
  X,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  category?: string;
  createdAt?: string;
}

type SortOption = "popular" | "newest" | "content" | "alphabetical";
type GridSize = "normal" | "large";

export default function CreatorsPage() {
  const { data: session } = useSession();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [gridSize, setGridSize] = useState<GridSize>("normal");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    let result = [...creators];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.bio?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
        break;
      case "newest":
        result.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case "content":
        result.sort(
          (a, b) =>
            (b.photoCount + b.videoCount) - (a.photoCount + a.videoCount)
        );
        break;
      case "alphabetical":
        result.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
    }

    return result;
  }, [creators, searchQuery, sortBy, selectedCategory]);

  // Categories (derived from creators)
  const categories = useMemo(() => {
    const cats = new Set(creators.map((c) => c.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [creators]);

  const sortOptions: { value: SortOption; label: string; icon: any }[] = [
    { value: "popular", label: "Most Popular", icon: TrendingUp },
    { value: "newest", label: "Newest", icon: Clock },
    { value: "content", label: "Most Content", icon: Camera },
    { value: "alphabetical", label: "A-Z", icon: Star },
  ];

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
                    <Link href="/dashboard">
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--gold)]/30"
                      />
                    </Link>
                  ) : (
                    <Link href="/dashboard">
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6"
            >
              <Crown className="w-4 h-4" />
              {creators.length} Exclusive Creators
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Discover <span className="gradient-gold-text">Amazing</span> Creators
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Browse our collection of exclusive content creators. Subscribe and unlock their premium content.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators by name..."
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]/50 focus:bg-white/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filters & Sort Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
          >
            {/* Sort Options */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                    sortBy === option.value
                      ? "bg-[var(--gold)] text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>

            {/* View Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGridSize("normal")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  gridSize === "normal"
                    ? "bg-[var(--gold)] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridSize("large")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  gridSize === "large"
                    ? "bg-[var(--gold)] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Category Pills (if any) */}
          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 mb-8 justify-center"
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  !selectedCategory
                    ? "bg-[var(--gold)] text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize",
                    selectedCategory === cat
                      ? "bg-[var(--gold)] text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Creators Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--gold)]" />
            </div>
          ) : filteredCreators.length > 0 ? (
            <>
              {/* Results count */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-sm mb-6"
              >
                Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""}
                {searchQuery && ` for "${searchQuery}"`}
              </motion.p>

              {/* Grid */}
              <motion.div
                layout
                className={cn(
                  "grid gap-4 sm:gap-6",
                  gridSize === "normal"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filteredCreators.map((creator, i) => (
                    <motion.div
                      key={creator.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <CreatorCard creator={creator} size={gridSize} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {searchQuery ? "No creators found" : "No creators yet"}
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? `We couldn't find any creators matching "${searchQuery}". Try a different search term.`
                  : "Be the first to create your exclusive page!"}
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear Search
                </Button>
              ) : (
                <Link href="/auth/register">
                  <Button variant="premium" className="gap-2">
                    <Crown className="w-4 h-4" />
                    Become a Creator
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
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
              Ready to share your content?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of creators earning from their exclusive content. Low fees, instant payouts, and full control.
            </p>
            <Link href="/auth/register">
              <Button variant="premium" size="lg" className="gap-2 px-10">
                Start Creating Today
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
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

// Creator Card Component
function CreatorCard({ creator, size }: { creator: Creator; size: GridSize }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/${creator.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-500",
          isHovered && "scale-[1.02] shadow-xl shadow-[var(--gold)]/10"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className={cn(
          "relative overflow-hidden",
          size === "large" ? "aspect-[4/5]" : "aspect-[3/4]"
        )}>
          {creator.cardImage || creator.avatar ? (
            <Image
              src={creator.cardImage || creator.avatar || ""}
              alt={creator.displayName}
              fill
              className={cn(
                "object-cover transition-transform duration-700",
                isHovered && "scale-110"
              )}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--gold)]/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-6xl font-bold text-white/20">
                {creator.displayName.charAt(0)}
              </span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-opacity duration-300",
            isHovered ? "opacity-90" : "opacity-70"
          )} />

          {/* Hover overlay content */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-end p-4"
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Button variant="premium" size="sm" className="gap-1 text-xs">
                <Crown className="w-3 h-3" />
                Subscribe
              </Button>
              <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                <Heart className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={cn(
                "font-bold text-white",
                size === "large" ? "text-xl" : "text-lg"
              )}>
                {creator.displayName}
              </h3>
            </div>

            <p className={cn(
              "text-gray-300 line-clamp-2 mb-3",
              size === "large" ? "text-sm" : "text-xs"
            )}>
              {creator.bio || "Exclusive content creator"}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {creator.photoCount > 0 && (
                <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Camera className="w-3 h-3" />
                  {creator.photoCount}
                </span>
              )}
              {creator.videoCount > 0 && (
                <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Video className="w-3 h-3" />
                  {creator.videoCount}
                </span>
              )}
              {creator.subscriberCount > 0 && (
                <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Users className="w-3 h-3" />
                  {creator.subscriberCount}
                </span>
              )}
            </div>
          </div>

          {/* VIP badge */}
          <div className="absolute top-3 right-3">
            <div className="px-2.5 py-1 rounded-full bg-[var(--gold)] text-black text-xs font-bold flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3" />
              VIP
            </div>
          </div>

          {/* New badge */}
          {creator.createdAt && isNewCreator(creator.createdAt) && (
            <div className="absolute top-3 left-3">
              <div className="px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-bold animate-pulse">
                NEW
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

// Helper function to check if creator is new (created within last 7 days)
function isNewCreator(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}
