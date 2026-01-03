"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Search,
  Crown,
  Camera,
  Video,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Clock,
  Star,
  X,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Heart,
  ChevronRight,
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

// SEO content for each category
const CATEGORY_CONTENT: Record<
  string,
  {
    h1: string;
    subtitle: string;
    description: string;
    icon: string;
  }
> = {
  latina: {
    h1: "Best Latina Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Discover the hottest Latina content creators on VipOnly. Exclusive photos, videos, and premium content from the best Latina models. Pay with crypto, lower fees than OnlyFans.",
    icon: "🔥",
  },
  asian: {
    h1: "Best Asian Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Find top Asian content creators on VipOnly. Japanese, Korean, Chinese, and Southeast Asian models with exclusive premium content.",
    icon: "🌸",
  },
  mature: {
    h1: "Best MILF & Mature Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Discover experienced mature creators and MILF models on VipOnly. Exclusive content from confident women who know what you want.",
    icon: "💎",
  },
  cosplay: {
    h1: "Best Cosplay Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Find the best cosplay creators on VipOnly. Anime characters, gaming costumes, and creative cosplay content from talented models.",
    icon: "🎭",
  },
  feet: {
    h1: "Best Feet Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Discover top feet content creators on VipOnly. Exclusive foot content, photos, and videos from dedicated feet models.",
    icon: "👠",
  },
  curvy: {
    h1: "Best BBW & Curvy Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Find beautiful BBW and curvy content creators on VipOnly. Exclusive content from confident plus-size models.",
    icon: "🍑",
  },
  ebony: {
    h1: "Best Ebony Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Discover stunning Ebony content creators on VipOnly. Exclusive photos and videos from beautiful Black models.",
    icon: "✨",
  },
  blonde: {
    h1: "Best Blonde Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Find the hottest blonde content creators on VipOnly. Exclusive content from beautiful blonde models.",
    icon: "💫",
  },
  brunette: {
    h1: "Best Brunette Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Discover stunning brunette content creators on VipOnly. Exclusive photos and videos from dark-haired beauties.",
    icon: "🖤",
  },
  petite: {
    h1: "Best Petite Models",
    subtitle: "OnlyFans Alternative",
    description:
      "Find the best petite content creators on VipOnly. Exclusive content from small and beautiful models.",
    icon: "🦋",
  },
};

// Related categories for internal linking
const RELATED_CATEGORIES: Record<string, string[]> = {
  latina: ["brunette", "curvy", "mature"],
  asian: ["petite", "cosplay", "brunette"],
  mature: ["curvy", "blonde", "brunette"],
  cosplay: ["asian", "petite", "blonde"],
  feet: ["petite", "blonde", "brunette"],
  curvy: ["latina", "ebony", "mature"],
  ebony: ["curvy", "mature", "brunette"],
  blonde: ["petite", "cosplay", "mature"],
  brunette: ["latina", "asian", "mature"],
  petite: ["asian", "blonde", "cosplay"],
};

type SortOption = "popular" | "newest" | "content";

export default function CategoryPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = useLocale();
  const category = params.category as string;

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [gridSize, setGridSize] = useState<"normal" | "large">("normal");

  const categoryData = getCategoryById(category);
  const content = CATEGORY_CONTENT[category];
  const relatedCategories = RELATED_CATEGORIES[category] || [];

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

  // Filter creators by category
  const filteredCreators = useMemo(() => {
    let result = creators.filter((c) => c.categories?.includes(category));

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

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case "content":
        result.sort(
          (a, b) => b.photoCount + b.videoCount - (a.photoCount + a.videoCount)
        );
        break;
    }

    return result;
  }, [creators, category, searchQuery, sortBy]);

  if (!categoryData || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Category Not Found</h1>
          <Link href={`/${locale}/creators`}>
            <Button variant="premium">Browse All Creators</Button>
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Breadcrumb */}
      <div className="pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              href={`/${locale}/creators`}
              className="hover:text-white transition-colors"
            >
              Creators
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--gold)]">{categoryData.label}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="text-5xl mb-4 block">{content.icon}</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
              {content.h1}
            </h1>
            <p className="text-lg text-[var(--gold)] mb-4">{content.subtitle}</p>
            <p className="text-gray-400 max-w-2xl mx-auto">{content.description}</p>

            <div className="flex items-center justify-center gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>{filteredCreators.length} Creators</span>
              </div>
              <div className="text-gray-600">|</div>
              <div className="text-[var(--gold)]">5% Platform Fee</div>
              <div className="text-gray-600">|</div>
              <div className="text-[var(--gold)]">Crypto Accepted</div>
            </div>
          </motion.div>

          {/* Search & Filters */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${categoryData.label} creators...`}
                className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Sort & View Options */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              {[
                { value: "popular", label: "Popular", icon: TrendingUp },
                { value: "newest", label: "Newest", icon: Clock },
                { value: "content", label: "Most Content", icon: Camera },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    sortBy === option.value
                      ? "bg-[var(--gold)] text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>

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
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--gold)]" />
            </div>
          ) : filteredCreators.length > 0 ? (
            <>
              <p className="text-gray-500 text-sm mb-6">
                Showing {filteredCreators.length} {categoryData.label} creator
                {filteredCreators.length !== 1 ? "s" : ""}
              </p>

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
                      <CreatorCard creator={creator} size={gridSize} locale={locale} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">{content.icon}</div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                No {categoryData.label} creators yet
              </h3>
              <p className="text-gray-400 mb-8">
                Be the first to create a {categoryData.label} profile!
              </p>
              <Link href={`/${locale}/auth/register`}>
                <Button variant="premium" className="gap-2">
                  <Crown className="w-4 h-4" />
                  Become a Creator
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Related Categories - Internal Linking */}
      <section className="px-4 pb-16 border-t border-white/5 pt-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">
            Related Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedCategories.map((catId) => {
              const cat = getCategoryById(catId);
              const catContent = CATEGORY_CONTENT[catId];
              if (!cat || !catContent) return null;
              return (
                <Link key={catId} href={`/${locale}/creators/${catId}`}>
                  <Card className="p-4 hover:border-[var(--gold)]/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{catContent.icon}</span>
                      <div>
                        <p className="font-medium text-white group-hover:text-[var(--gold)] transition-colors">
                          {cat.label} Models
                        </p>
                        <p className="text-xs text-gray-500">View Creators</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
            <Link href={`/${locale}/top-creators`}>
              <Card className="p-4 hover:border-[var(--gold)]/50 transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium text-white group-hover:text-[var(--gold)] transition-colors">
                      Top Creators
                    </p>
                    <p className="text-xs text-gray-500">View Best Models</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <h2 className="text-xl font-bold text-white mb-4">
              About {categoryData.label} Creators on VipOnly
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-gray-400">
              <p>
                VipOnly is the best OnlyFans alternative for {categoryData.label.toLowerCase()}{" "}
                content creators. Unlike OnlyFans, we charge only{" "}
                <strong className="text-white">5% platform fees</strong> (compared to 20% on
                OnlyFans), and we accept{" "}
                <strong className="text-[var(--gold)]">cryptocurrency payments</strong>{" "}
                including Bitcoin, Ethereum, and USDT.
              </p>
              <p className="mt-4">
                Browse our selection of {categoryData.label.toLowerCase()} models and subscribe
                to their exclusive content. All creators on VipOnly offer premium photos,
                videos, and direct messaging with their fans.
              </p>
            </div>
          </Card>
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
              {new Date().getFullYear()} VipOnly - Best OnlyFans Alternative
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
  size,
  locale,
}: {
  creator: Creator;
  size: "normal" | "large";
  locale: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/${locale}/${creator.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-500",
          isHovered && "scale-[1.02]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            size === "large" ? "aspect-[4/5]" : "aspect-[3/4]"
          )}
        >
          {creator.cardImage || creator.avatar ? (
            <Image
              src={creator.cardImage || creator.avatar || ""}
              alt={`${creator.displayName} - VipOnly Creator`}
              fill
              unoptimized={(creator.cardImage || creator.avatar || "").startsWith("/uploads")}
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

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          {/* Category tags */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
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
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3
              className={cn("font-bold text-white", size === "large" ? "text-xl" : "text-lg")}
            >
              {creator.displayName}
            </h3>
            <p
              className={cn(
                "text-gray-300 line-clamp-2 mb-3",
                size === "large" ? "text-sm" : "text-xs"
              )}
            >
              {creator.bio || "Exclusive content creator"}
            </p>

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
        </div>
      </Card>
    </Link>
  );
}
