"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import {
  X,
  ChevronUp,
  ChevronDown,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lock,
  Crown,
  Coins,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";

export interface MediaItem {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "PACK";
  title: string;
  description?: string;
  thumbnailUrl: string | null;
  contentUrl: string | null;
  accessTier: "FREE" | "BASIC" | "VIP";
  isPurchaseable?: boolean;
  price?: number | null;
  duration?: number | null;
  hasAccess?: boolean;
  hasPurchased?: boolean;
  tagFree?: boolean;
  tagVIP?: boolean;
  tagPPV?: boolean;
  tagGallery?: boolean;
  ppvPriceCredits?: number | null;
  isFavorited?: boolean;
  viewCount?: number;
}

interface MediaFeedViewerProps {
  mediaItems: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  creatorSlug: string;
  userCredits?: number;
  isVIP?: boolean;
  onUnlock?: (mediaId: string) => void;
  onCreditsUpdate?: (newBalance: number) => void;
  onPurchased?: (mediaId: string) => void;
}

export function MediaFeedViewer({
  mediaItems,
  initialIndex,
  onClose,
  creatorSlug,
  userCredits = 0,
  isVIP = false,
  onUnlock,
  onCreditsUpdate,
  onPurchased,
}: MediaFeedViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Initialize favorites from media items
  useEffect(() => {
    const initialFavorites = new Set<string>();
    mediaItems.forEach(item => {
      if (item.isFavorited) {
        initialFavorites.add(item.id);
      }
    });
    setFavorites(initialFavorites);
  }, [mediaItems]);

  // Scroll to initial index on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container && slideRefs.current[initialIndex]) {
      slideRefs.current[initialIndex]?.scrollIntoView({ behavior: "instant" });
    }
  }, [initialIndex]);

  // Intersection observer for detecting active slide
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              setActiveIndex(index);
              // Auto-pause videos when scrolling away
              videoRefs.current.forEach((video, i) => {
                if (video && i !== index) {
                  video.pause();
                }
              });
            }
          }
        });
      },
      { threshold: 0.6, root: container }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [mediaItems.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(Math.min(mediaItems.length - 1, activeIndex + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        const currentMedia = mediaItems[activeIndex];
        if (currentMedia.type === "VIDEO" && hasAccessToMedia(currentMedia)) {
          togglePlayPause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, mediaItems, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (index >= 0 && index < mediaItems.length) {
      slideRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mediaItems.length]);

  const hasAccessToMedia = useCallback((item: MediaItem) => {
    if (item.tagFree) return true;
    if (item.hasPurchased) return true;
    if (item.tagVIP && !isVIP) return false;
    if (item.tagPPV && !item.hasPurchased) return false;
    return item.hasAccess ?? true;
  }, [isVIP]);

  const toggleFavorite = async (mediaId: string) => {
    try {
      const isFavorited = favorites.has(mediaId);
      const res = await fetch("/api/user/favorites", {
        method: isFavorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });

      if (res.ok) {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (isFavorited) {
            next.delete(mediaId);
          } else {
            next.add(mediaId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setVideoProgress(video.currentTime);
    setVideoDuration(video.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRefs.current[activeIndex];
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUnlock = async (item: MediaItem) => {
    if (item.tagVIP && !isVIP) {
      // Redirect to subscription
      window.location.href = `/${creatorSlug}/membership`;
      return;
    }

    if (item.tagPPV) {
      const price = item.ppvPriceCredits || 0;
      if (userCredits < price) {
        // Redirect to buy credits
        window.location.href = `/${creatorSlug}/credits`;
        return;
      }

      // Attempt purchase
      try {
        const res = await fetch("/api/media/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: item.id }),
        });

        if (res.ok) {
          const data = await res.json();
          onCreditsUpdate?.(data.newBalance);
          onPurchased?.(item.id);
        }
      } catch (error) {
        console.error("Unlock error:", error);
      }
    }
  };

  const currentMedia = mediaItems[activeIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      >
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 transition-colors"
          onClick={onClose}
        >
          <X className="w-6 h-6 text-white" />
        </motion.button>

        {/* Desktop navigation arrows */}
        <div className="hidden md:block">
          {activeIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-1/2 left-4 -translate-y-1/2 z-50 p-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(activeIndex - 1);
              }}
            >
              <ChevronUp className="w-6 h-6 text-white" />
            </motion.button>
          )}
          {activeIndex < mediaItems.length - 1 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-50 p-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(activeIndex + 1);
              }}
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </div>

        {/* Position indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
          <span className="text-white text-sm font-medium">
            {activeIndex + 1} / {mediaItems.length}
          </span>
        </div>

        {/* Scroll container */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
          style={{ scrollSnapType: "y mandatory" }}
        >
          {mediaItems.map((item, index) => {
            const hasAccess = hasAccessToMedia(item);
            const isFavorited = favorites.has(item.id);

            return (
              <div
                key={item.id}
                ref={(el) => { slideRefs.current[index] = el; }}
                className="h-full w-full flex items-center justify-center snap-start snap-always"
                style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
              >
                <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col">
                  {/* Media container */}
                  <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
                    <div className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                      {/* Image or Video */}
                      {item.type === "VIDEO" && hasAccess && item.contentUrl ? (
                        <video
                          ref={(el) => { videoRefs.current[index] = el; }}
                          src={item.contentUrl}
                          poster={item.thumbnailUrl || undefined}
                          className="w-full h-full object-contain"
                          playsInline
                          muted={isMuted}
                          loop
                          onTimeUpdate={index === activeIndex ? handleVideoTimeUpdate : undefined}
                          onPlay={() => index === activeIndex && setIsPlaying(true)}
                          onPause={() => index === activeIndex && setIsPlaying(false)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index === activeIndex) togglePlayPause();
                          }}
                        />
                      ) : item.thumbnailUrl ? (
                        <NextImage
                          src={hasAccess && item.contentUrl ? item.contentUrl : item.thumbnailUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 80vw"
                          className={cn(
                            "object-contain",
                            !hasAccess && "blur-xl scale-105"
                          )}
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-20 h-20 text-gray-600" />
                        </div>
                      )}

                      {/* Locked overlay */}
                      {!hasAccess && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                          <motion.div
                            className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] flex items-center justify-center mb-6 shadow-xl shadow-[var(--gold)]/30"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Lock className="w-10 h-10 text-black" />
                          </motion.div>

                          <h3 className="text-2xl font-bold text-white mb-2 text-center">
                            {item.tagVIP ? "VIP Exclusive" : "Premium Content"}
                          </h3>

                          <p className="text-gray-400 text-center mb-6 max-w-sm">
                            {item.tagVIP && !isVIP
                              ? "Subscribe to VIP to unlock this content"
                              : item.tagPPV
                              ? `Unlock this content for ${item.ppvPriceCredits || 0} credits`
                              : "Subscribe to access this content"}
                          </p>

                          <Button
                            variant="premium"
                            size="lg"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlock(item);
                            }}
                          >
                            {item.tagVIP && !isVIP ? (
                              <>
                                <Crown className="w-5 h-5" />
                                Subscribe VIP
                              </>
                            ) : item.tagPPV ? (
                              <>
                                <Coins className="w-5 h-5" />
                                Unlock for {item.ppvPriceCredits || 0} credits
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Subscribe
                              </>
                            )}
                          </Button>

                          {item.tagPPV && userCredits < (item.ppvPriceCredits || 0) && (
                            <p className="text-sm text-red-400 mt-3">
                              You need {(item.ppvPriceCredits || 0) - userCredits} more credits
                            </p>
                          )}
                        </div>
                      )}

                      {/* Video play button overlay */}
                      {item.type === "VIDEO" && hasAccess && !isPlaying && index === activeIndex && (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause();
                          }}
                        >
                          <motion.div
                            className="w-20 h-20 rounded-full bg-[var(--gold)] flex items-center justify-center shadow-xl shadow-[var(--gold)]/30"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom overlay - info and controls */}
                  <div className="absolute bottom-16 left-0 right-0 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-2xl p-4 md:p-6">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tagFree && (
                          <Badge className="bg-green-500 text-white border-0">
                            FREE
                          </Badge>
                        )}
                        {item.tagVIP && (
                          <Badge className="bg-gradient-to-r from-[var(--gold)] to-yellow-500 text-black border-0">
                            <Crown className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {item.tagPPV && (
                          <Badge className="bg-purple-500 text-white border-0">
                            <Coins className="w-3 h-3 mr-1" />
                            {item.ppvPriceCredits || 0}
                          </Badge>
                        )}
                        {item.type === "VIDEO" && item.duration && (
                          <Badge variant="duration">
                            {formatDuration(item.duration)}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {item.title}
                      </h2>

                      {/* Description */}
                      {item.description && (
                        <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Controls row */}
                      <div className="flex items-center gap-4">
                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className="flex items-center gap-2 text-white hover:text-[var(--gold)] transition-colors"
                        >
                          <Heart
                            className={cn(
                              "w-6 h-6 transition-all",
                              isFavorited && "fill-red-500 text-red-500"
                            )}
                          />
                        </button>

                        {/* Video controls */}
                        {item.type === "VIDEO" && hasAccess && index === activeIndex && (
                          <>
                            {/* Play/Pause */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePlayPause();
                              }}
                              className="text-white hover:text-[var(--gold)] transition-colors"
                            >
                              {isPlaying ? (
                                <Pause className="w-6 h-6" />
                              ) : (
                                <Play className="w-6 h-6" />
                              )}
                            </button>

                            {/* Mute/Unmute */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMute();
                              }}
                              className="text-white hover:text-[var(--gold)] transition-colors"
                            >
                              {isMuted ? (
                                <VolumeX className="w-6 h-6" />
                              ) : (
                                <Volume2 className="w-6 h-6" />
                              )}
                            </button>

                            {/* Progress bar */}
                            <div className="flex-1 flex items-center gap-3">
                              <span className="text-xs text-gray-400 min-w-[40px]">
                                {formatDuration(videoProgress)}
                              </span>
                              <div
                                className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                                onClick={handleProgressClick}
                              >
                                <div
                                  className="h-full bg-[var(--gold)] rounded-full transition-all"
                                  style={{
                                    width: `${(videoProgress / videoDuration) * 100 || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 min-w-[40px]">
                                {formatDuration(videoDuration)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
