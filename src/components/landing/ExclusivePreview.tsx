"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Lock, Play, Crown, Sparkles, ArrowRight, Eye, Coins } from "lucide-react";
import { Button } from "@/components/ui";

interface ExclusivePreviewProps {
  creatorSlug?: string;
}

interface MediaItem {
  id: string;
  title: string;
  description?: string;
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

// Single preview card with peek effect
function PreviewCard({
  item,
  index,
  basePath,
}: {
  item: MediaItem;
  index: number;
  basePath: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const direction = index % 2 === 0 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 0.5], [100 * direction, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const smoothX = useSpring(x, { stiffness: 100, damping: 30 });

  const isNew = new Date(item.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // New tag-based access
  const isFree = item.tagFree === true;
  const isVip = item.tagVIP === true;
  const isPPV = item.tagPPV === true;
  const shouldBlur = !isFree;

  return (
    <motion.div
      ref={ref}
      style={{ x: smoothX, opacity }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`${basePath}/gallery`}>
        <div className="relative aspect-[16/9] lg:aspect-[21/9] rounded-3xl overflow-hidden border-2 border-white/10 hover:border-[var(--gold)]/50 transition-all duration-500 cursor-pointer">
          {/* Background image - no blur for FREE content */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              filter: shouldBlur ? (isHovered ? "blur(15px)" : "blur(25px)") : "none",
              transform: isHovered ? "scale(1.05)" : "scale(1.1)",
            }}
          >
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

          {/* Gold shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold)]/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: isHovered ? "100%" : "-100%" }}
            transition={{ duration: 0.8 }}
          />

          {/* Content */}
          <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-between">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {isNew && (
                  <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold animate-pulse">
                    NEW
                  </span>
                )}
                {isFree && (
                  <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                    FREE
                  </span>
                )}
                {isVip && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[var(--gold)] to-yellow-500 text-black text-xs font-bold">
                    VIP ONLY
                  </span>
                )}
                {isPPV && (
                  <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {item.ppvPriceCredits || 1000} credits
                  </span>
                )}
                {!isFree && !isVip && !isPPV && (
                  <span className="px-3 py-1 rounded-full bg-[var(--gold)] text-black text-xs font-bold">
                    EXCLUSIVE
                  </span>
                )}
              </div>
              {item.type === "VIDEO" && item.duration && (
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
                  <Play className="w-3 h-3" />
                  {formatDuration(item.duration)}
                </span>
              )}
              {item.type === "PHOTO" && (
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Photo
                </span>
              )}
            </div>

            {/* Center icon - play/eye for FREE, lock for paid */}
            <div className="flex items-center justify-center">
              <motion.div
                className={`w-20 h-20 rounded-full backdrop-blur-md border-2 flex items-center justify-center ${
                  isFree
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-black/60 border-[var(--gold)]/50"
                }`}
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  borderColor: isHovered
                    ? isFree ? "rgba(34,197,94,0.8)" : "rgba(212,175,55,0.8)"
                    : isFree ? "rgba(34,197,94,0.5)" : "rgba(212,175,55,0.5)",
                }}
              >
                {item.type === "VIDEO" ? (
                  <Play className={`w-8 h-8 ${isFree ? "text-green-500 fill-green-500/30" : "text-[var(--gold)] fill-[var(--gold)]/30"}`} />
                ) : isFree ? (
                  <Eye className="w-8 h-8 text-green-500" />
                ) : (
                  <Lock className="w-8 h-8 text-[var(--gold)]" />
                )}
              </motion.div>
            </div>

            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-400">{item.description}</p>
                )}
              </div>

              <motion.div
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold ${
                  isFree
                    ? "bg-green-500 text-white"
                    : isPPV
                    ? "bg-purple-500 text-white"
                    : "bg-[var(--gold)] text-black"
                }`}
                animate={{ x: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0.8 }}
              >
                {isFree ? (
                  <>
                    <Eye className="w-5 h-5" />
                    <span>View</span>
                  </>
                ) : isPPV ? (
                  <>
                    <Coins className="w-5 h-5" />
                    <span>Unlock</span>
                  </>
                ) : isVip ? (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>VIP Only</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Subscribe</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ExclusivePreview({ creatorSlug = "miacosta" }: ExclusivePreviewProps) {
  const basePath = `/${creatorSlug}`;
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      try {
        // Fetch only gallery-tagged media
        const res = await fetch(`/api/media?creator=${creatorSlug}&limit=3&tagGallery=true`);
        if (res.ok) {
          const data = await res.json();
          setMedia(data.media || []);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMedia();
  }, [creatorSlug]);

  // Don't render if no media and not loading
  if (!isLoading && media.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-1/2 h-96 bg-[var(--gold)]/5 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-1/2 h-96 bg-purple-500/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            Fresh Content
          </motion.span>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Latest Releases -{" "}
            <span className="gradient-gold-text">Don't Miss Out</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Exclusive content just for you. VIP members get instant access.
          </p>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[21/9] rounded-3xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Preview cards */}
        {!isLoading && media.length > 0 && (
          <div className="space-y-8">
            {media.map((item, index) => (
              <PreviewCard
                key={item.id}
                item={item}
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
          className="text-center mt-12"
        >
          <Link href={`${basePath}/membership`}>
            <Button
              variant="premium"
              size="lg"
              className="gap-3 px-10 py-7 text-lg shadow-2xl shadow-[var(--gold)]/30"
            >
              <Crown className="w-6 h-6" />
              Get VIP Access Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Instant access to all content. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
