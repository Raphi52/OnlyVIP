"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  Lock,
  Unlock,
  Play,
  Crown,
  Coins,
  Sparkles,
  Check,
  Loader2,
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  Film,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaData {
  id: string;
  title: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  thumbnailUrl: string | null;
  contentUrl: string;
  ppvPriceCredits: number;
  creatorSlug: string;
  creator: {
    displayName: string;
    avatar: string | null;
  };
  hasPurchased: boolean;
}

export default function PPVPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const mediaId = params.mediaId as string;
  const creatorSlug = params.creator as string;

  const [media, setMedia] = useState<MediaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch media data
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/ppv/${mediaId}`);
        if (res.ok) {
          const data = await res.json();
          setMedia(data);
        } else {
          setError("Content not found");
        }
      } catch (err) {
        setError("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, [mediaId]);

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/user/credits");
        if (res.ok) {
          const data = await res.json();
          setUserCredits(data.balance || 0);
        }
      } catch (err) {
        console.error("Error fetching credits:", err);
      }
    };
    fetchCredits();
  }, [session?.user]);

  const handlePurchase = async () => {
    if (!session?.user) {
      router.push(`/${creatorSlug}/auth/login?callbackUrl=/${creatorSlug}/ppv/${mediaId}`);
      return;
    }

    if (!media) return;

    setIsPurchasing(true);
    setError(null);

    try {
      const res = await fetch("/api/ppv/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
        setUserCredits(data.newBalance);
        // Refresh media to get unlocked content
        const mediaRes = await fetch(`/api/ppv/${mediaId}`);
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMedia(mediaData);
        }
      } else {
        setError(data.error || "Purchase failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)]/20 border-t-[var(--gold)] animate-spin" />
            <Sparkles className="w-6 h-6 text-[var(--gold)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white/60">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !media) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Content Not Found</h1>
          <p className="text-white/60 mb-6">This content is no longer available.</p>
          <Link href={`/${creatorSlug}`}>
            <Button variant="gold-outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!media) return null;

  const canAfford = userCredits >= media.ppvPriceCredits;
  const isUnlocked = media.hasPurchased;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--gold)]/10 rounded-full blur-[150px]"
          animate={{ x: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]"
          animate={{ x: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Back link */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link href={`/${creatorSlug}`}>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Premium card with holographic border */}
          <div className="relative group">
            {/* Animated rainbow border */}
            <motion.div
              className="absolute -inset-[2px] rounded-3xl"
              style={{
                background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Gold inner border */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-yellow-400/80 via-amber-500/80 to-yellow-600/80" />

            {/* Card content */}
            <div className="relative bg-[#0a0a0a] rounded-3xl overflow-hidden">
              {/* Holographic sweep */}
              <div
                className="absolute inset-0 animate-holographic-sweep pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.15) 15%, rgba(0,255,255,0.15) 30%, rgba(255,255,0,0.1) 45%, rgba(128,0,255,0.15) 60%, rgba(0,255,128,0.1) 75%, transparent 100%)',
                  backgroundSize: '300% 300%',
                }}
              />

              {/* Media preview */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {media.thumbnailUrl ? (
                  <Image
                    src={isUnlocked ? media.contentUrl : media.thumbnailUrl}
                    alt={media.title}
                    fill
                    className={cn(
                      "object-cover transition-all duration-500",
                      !isUnlocked && "blur-xl scale-110"
                    )}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {media.type === "VIDEO" ? (
                      <Film className="w-20 h-20 text-gray-600" />
                    ) : (
                      <ImageIcon className="w-20 h-20 text-gray-600" />
                    )}
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Lock/Play icon */}
                {!isUnlocked ? (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-xl border-2 border-[var(--gold)]/50 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lock className="w-10 h-10 text-[var(--gold)]" />
                    </motion.div>
                  </motion.div>
                ) : media.type === "VIDEO" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-full bg-[var(--gold)] flex items-center justify-center cursor-pointer shadow-2xl shadow-[var(--gold)]/30"
                      onClick={() => {
                        // Open video player
                        window.open(media.contentUrl, '_blank');
                      }}
                    >
                      <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                    </motion.div>
                  </div>
                ) : null}

                {/* Type badge */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                    {media.type === "VIDEO" ? (
                      <>
                        <Film className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Video</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Photo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Unlocked badge */}
                {isUnlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 z-20"
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-medium shadow-lg">
                      <Check className="w-4 h-4" />
                      Unlocked
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Info section */}
              <div className="p-6">
                {/* Creator info */}
                <div className="flex items-center gap-3 mb-4">
                  {media.creator.avatar ? (
                    <Image
                      src={media.creator.avatar}
                      alt={media.creator.displayName}
                      width={48}
                      height={48}
                      className="rounded-full ring-2 ring-[var(--gold)]/30"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-lg">
                      {media.creator.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{media.creator.displayName}</p>
                    <p className="text-white/50 text-sm">Exclusive Content</p>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-6">{media.title}</h1>

                {/* Price & CTA */}
                {!isUnlocked ? (
                  <div className="space-y-4">
                    {/* Price display */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Coins className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Price</p>
                          <p className="text-2xl font-bold text-white">{media.ppvPriceCredits.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-sm">Your balance</p>
                        <p className={cn(
                          "text-xl font-bold",
                          canAfford ? "text-emerald-400" : "text-red-400"
                        )}>
                          {userCredits.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Error message */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* CTA Button */}
                    {session?.user ? (
                      canAfford ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePurchase}
                          disabled={isPurchasing}
                          className="w-full relative group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] via-amber-400 to-[var(--gold)] rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex items-center justify-center gap-3 py-4 font-bold text-black text-lg">
                            {isPurchasing ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Unlock className="w-5 h-5" />
                                Unlock Now
                              </>
                            )}
                          </div>
                        </motion.button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-center text-red-400 text-sm">
                            You need {(media.ppvPriceCredits - userCredits).toLocaleString()} more credits
                          </p>
                          <Link href="/credits" className="block">
                            <Button variant="premium" size="lg" className="w-full">
                              <ShoppingBag className="w-5 h-5 mr-2" />
                              Buy Credits
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : (
                      <Link href={`/${creatorSlug}/auth/login?callbackUrl=/${creatorSlug}/ppv/${mediaId}`} className="block">
                        <Button variant="premium" size="lg" className="w-full">
                          <Crown className="w-5 h-5 mr-2" />
                          Sign In to Unlock
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-400 font-semibold">Content Unlocked!</p>
                      <p className="text-white/60 text-sm mt-1">You have full access to this content</p>
                    </div>

                    {media.type === "VIDEO" ? (
                      <a href={media.contentUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="premium" size="lg" className="w-full">
                          <Play className="w-5 h-5 mr-2" />
                          Watch Video
                        </Button>
                      </a>
                    ) : (
                      <a href={media.contentUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="premium" size="lg" className="w-full">
                          <Eye className="w-5 h-5 mr-2" />
                          View Full Image
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sparkle particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[var(--gold)] rounded-full pointer-events-none"
            style={{
              left: `${20 + i * 12}%`,
              top: `${15 + (i % 3) * 30}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Success animation overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Unlocked!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/60"
              >
                Tap anywhere to continue
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
