"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { Lock, Play, Crown, Sparkles, Eye, Star, Coins } from "lucide-react";
import { Button } from "@/components/ui";

interface ContentShowcaseProps {
  creatorSlug?: string;
}

interface MediaItem {
  id: string;
  title: string;
  type: "PHOTO" | "VIDEO";
  thumbnailUrl: string;
  accessTier: string; // Legacy
  duration?: number;
  createdAt: string;
  // New tag system
  tagFree?: boolean;
  tagVIP?: boolean;
  tagPPV?: boolean;
  tagGallery?: boolean;
  ppvPriceCredits?: number | null;
}

// Format duration from seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Individual parallax image component
function ParallaxImage({
  media,
  index,
  basePath,
}: {
  media: MediaItem;
  index: number;
  basePath: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const speeds = [0.15, 0.25, 0.35, 0.2, 0.3, 0.15, 0.25, 0.35, 0.2, 0.3, 0.15, 0.25];
  const speed = speeds[index % speeds.length];

  const y = useTransform(scrollYProgress, [0, 1], [-50 * speed, 50 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  const sizes = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/3]", "aspect-square"];
  const size = sizes[index % sizes.length];

  // New tag-based access
  const isFree = media.tagFree === true;
  const isVip = media.tagVIP === true;
  const isPPV = media.tagPPV === true;
  const isNew = new Date(media.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Determine if content should be blurred
  // Free = no blur, VIP/PPV = blur for non-authenticated preview
  const shouldBlur = !isFree;

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`${basePath}/gallery`}>
        <div className={`relative ${size} rounded-2xl overflow-hidden border border-white/10 hover:border-[var(--gold)]/50 transition-all duration-500 cursor-pointer`}>
          {/* Image - no blur for FREE content */}
          <img
            src={media.thumbnailUrl}
            alt={media.title}
            className={`w-full h-full object-cover transition-all duration-500 scale-110 group-hover:scale-105 ${
              shouldBlur ? "blur-xl group-hover:blur-lg" : ""
            }`}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

          {/* Gold gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Center icon - Eye for FREE, Lock for paid */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className={`w-14 h-14 rounded-full backdrop-blur-sm border flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
                isFree
                  ? "bg-green-500/20 border-green-500/50 group-hover:bg-green-500/30"
                  : "bg-black/60 border-[var(--gold)]/50 group-hover:bg-[var(--gold)]/20"
              }`}
              whileHover={{ scale: 1.1 }}
            >
              {media.type === "VIDEO" ? (
                <Play className={`w-6 h-6 ${isFree ? "text-green-500 fill-green-500/50" : "text-[var(--gold)] fill-[var(--gold)]/50"}`} />
              ) : isFree ? (
                <Eye className="w-6 h-6 text-green-500" />
              ) : (
                <Lock className="w-6 h-6 text-[var(--gold)]" />
              )}
            </motion.div>
          </div>

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex gap-2 flex-wrap">
              {isFree && (
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-500 text-white">
                  FREE
                </span>
              )}
              {isVip && (
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-[var(--gold)] to-yellow-500 text-black">
                  VIP
                </span>
              )}
              {isPPV && (
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-purple-500 text-white flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {media.ppvPriceCredits || 1000}
                </span>
              )}
              {isNew && (
                <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-500 text-white">
                  NEW
                </span>
              )}
            </div>
            {media.type === "VIDEO" && media.duration && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-black/60 backdrop-blur-sm text-white">
                {formatDuration(media.duration)}
              </span>
            )}
          </div>

          {/* Bottom text - appears on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className={`backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-center gap-2 ${
              isFree ? "bg-green-500/80" : isPPV ? "bg-purple-500/80" : "bg-black/80"
            }`}>
              {isFree ? (
                <>
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">View Now</span>
                </>
              ) : isPPV ? (
                <>
                  <Coins className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">
                    Unlock for {media.ppvPriceCredits || 1000} credits
                  </span>
                </>
              ) : isVip ? (
                <>
                  <Crown className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-sm text-white font-medium">VIP Only</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-sm text-white font-medium">Subscribe to View</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ContentShowcase({ creatorSlug = "miacosta" }: ContentShowcaseProps) {
  const containerRef = useRef<HTMLElement>(null);
  const basePath = `/${creatorSlug}`;
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState({ photos: 0, videos: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      try {
        // Fetch only gallery-tagged media
        const res = await fetch(`/api/media?creator=${creatorSlug}&limit=12&tagGallery=true`);
        if (res.ok) {
          const data = await res.json();
          setMedia(data.media || []);

          // Use stats from API (counts all gallery media, not just returned 12)
          if (data.stats) {
            setStats({ photos: data.stats.photos, videos: data.stats.videos });
          }
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMedia();
  }, [creatorSlug]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  // Don't render if no media and not loading
  if (!isLoading && media.length === 0) {
    return null;
  }

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Premium Content
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Discover{" "}
            <span className="gradient-gold-text">Exclusive</span>
            <br />Photos & Videos
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto mb-8"
          >
            Get instant access to my private collection.
            VIP members see everything unblurred.
          </motion.p>

          {/* Stats row - clickable filters */}
          {(stats.photos > 0 || stats.videos > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-6 sm:gap-8 text-sm"
            >
              {stats.photos > 0 && (
                <Link
                  href={`${basePath}/gallery?type=PHOTO`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-[var(--gold)]/30 transition-all cursor-pointer group"
                >
                  <Eye className="w-5 h-5 text-[var(--gold)] group-hover:scale-110 transition-transform" />
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    <span className="text-white font-semibold">{stats.photos}</span> Photos
                  </span>
                </Link>
              )}
              {stats.videos > 0 && (
                <Link
                  href={`${basePath}/gallery?type=VIDEO`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-[var(--gold)]/30 transition-all cursor-pointer group"
                >
                  <Play className="w-5 h-5 text-[var(--gold)] group-hover:scale-110 transition-transform" />
                  <span className="text-gray-400 group-hover:text-white transition-colors">
                    <span className="text-white font-semibold">{stats.videos}</span> Videos
                  </span>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[var(--gold)]" />
                <span className="text-gray-400">
                  <span className="text-white font-semibold">New</span> Updates
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Masonry grid with parallax */}
        {!isLoading && media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {media.map((item, index) => (
              <ParallaxImage
                key={item.id}
                media={item}
                index={index}
                basePath={basePath}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-left">
              <p className="text-white font-semibold text-lg mb-1">
                Want to see more?
              </p>
              <p className="text-gray-400 text-sm">
                Unlock all content with VIP membership
              </p>
            </div>
            <Link href={`${basePath}/membership`}>
              <Button
                variant="premium"
                size="lg"
                className="gap-2 px-8 shadow-lg shadow-[var(--gold)]/20"
              >
                <Crown className="w-5 h-5" />
                Unlock Everything
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
