"use client";

import { useState, useEffect, useRef } from "react";
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
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkData {
  link: {
    id: string;
    shortCode: string;
    mediaId: string;
    creatorSlug: string;
    isActive: boolean;
  };
  media: {
    id: string;
    title: string;
    description: string | null;
    type: "PHOTO" | "VIDEO" | "AUDIO";
    thumbnailUrl: string | null;
    previewUrl: string | null;
    ppvPriceCredits: number;
    tagPPV: boolean;
  };
  creator: {
    slug: string;
    displayName: string;
    avatar: string | null;
  };
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem("ppv_visitor_id");
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("ppv_visitor_id", visitorId);
  }
  return visitorId;
}

export default function PPVLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const shortCode = params.shortCode as string;
  const creatorSlug = params.creator as string;

  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clickTracked = useRef(false);
  const visitorIdRef = useRef<string>("");

  // Get or generate visitor ID
  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  // Fetch link data and track click
  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        // Fetch link info
        const res = await fetch(`/api/ppv/links/by-code/${shortCode}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Link not found");
          } else if (res.status === 410) {
            setError("This link is no longer active");
          } else {
            setError("Failed to load content");
          }
          setIsLoading(false);
          return;
        }

        const data: LinkData = await res.json();
        setLinkData(data);

        // Track click (only once per page load)
        if (!clickTracked.current && visitorIdRef.current) {
          clickTracked.current = true;
          try {
            await fetch(`/api/ppv/links/${data.link.id}/click`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ visitorId: visitorIdRef.current }),
            });
          } catch (err) {
            console.error("Error tracking click:", err);
          }
        }

        // Check if user has purchased
        if (session?.user) {
          const purchaseRes = await fetch(`/api/ppv/${data.media.id}`);
          if (purchaseRes.ok) {
            const purchaseData = await purchaseRes.json();
            setHasPurchased(purchaseData.hasPurchased || false);
          }
        }
      } catch (err) {
        setError("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    if (shortCode) {
      fetchLinkData();
    }
  }, [shortCode, session?.user]);

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
      router.push(`/${creatorSlug}/auth/login?callbackUrl=/${creatorSlug}/ppv/l/${shortCode}`);
      return;
    }

    if (!linkData) return;

    const price = linkData.media.ppvPriceCredits || 0;
    if (userCredits < price) {
      router.push(`/${creatorSlug}/checkout/credits?amount=${price - userCredits}&redirect=/${creatorSlug}/ppv/l/${shortCode}`);
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch("/api/ppv/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: linkData.media.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.newBalance);
        setHasPurchased(true);
        setShowSuccess(true);

        // Track conversion
        try {
          await fetch(`/api/ppv/links/${linkData.link.id}/convert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitorId: visitorIdRef.current,
              purchaseAmount: price,
            }),
          });
        } catch (err) {
          console.error("Error tracking conversion:", err);
        }

        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Purchase failed");
      }
    } catch (err) {
      setError("Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {error || "Content not found"}
          </h1>
          <p className="text-gray-400 mb-6">
            This link may have expired or been removed.
          </p>
          <Link href={`/${creatorSlug}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { link, media, creator } = linkData;
  const price = media.ppvPriceCredits || 0;
  const hasEnoughCredits = userCredits >= price;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/${creatorSlug}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          {session?.user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {userCredits.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Creator info */}
        <div className="flex items-center gap-3 mb-6">
          {creator.avatar ? (
            <Image
              src={creator.avatar}
              alt={creator.displayName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/50"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-white">{creator.displayName}</h2>
            <p className="text-sm text-gray-400">Exclusive content</p>
          </div>
        </div>

        {/* Media preview */}
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-900">
          {media.thumbnailUrl || media.previewUrl ? (
            <Image
              src={media.thumbnailUrl || media.previewUrl || ""}
              alt={media.title}
              fill
              className={cn(
                "object-cover transition-all duration-300",
                !hasPurchased && "blur-xl scale-110"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              {media.type === "VIDEO" ? (
                <Film className="w-16 h-16 text-purple-400" />
              ) : (
                <ImageIcon className="w-16 h-16 text-purple-400" />
              )}
            </div>
          )}

          {/* Lock overlay */}
          {!hasPurchased && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{price}</span>
                </div>
                <p className="text-sm text-gray-400">Credits to unlock</p>
              </motion.div>
            </div>
          )}

          {/* Media type badge */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
            {media.type === "VIDEO" ? (
              <>
                <Play className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-white">Video</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-white">Photo</span>
              </>
            )}
          </div>

          {/* PPV badge */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">PPV</span>
          </div>
        </div>

        {/* Title and description */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-2">{media.title}</h1>
          {media.description && (
            <p className="text-gray-400 text-sm leading-relaxed">
              {media.description}
            </p>
          )}
        </div>

        {/* Action button */}
        {hasPurchased ? (
          <div className="space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Unlocked!</span>
              </div>
              <p className="text-sm text-gray-400">
                This content is now available in your library
              </p>
            </motion.div>

            <Link href={`/${creatorSlug}/ppv/${media.id}`}>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Eye className="w-4 h-4 mr-2" />
                View Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className={cn(
                "w-full py-4 text-lg font-semibold transition-all",
                hasEnoughCredits
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              )}
            >
              {isPurchasing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : hasEnoughCredits ? (
                <>
                  <Unlock className="w-5 h-5 mr-2" />
                  Unlock for {price} credits
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Buy credits to unlock
                </>
              )}
            </Button>

            {!hasEnoughCredits && session?.user && (
              <p className="text-center text-sm text-gray-500">
                You need {price - userCredits} more credits
              </p>
            )}

            {!session?.user && (
              <p className="text-center text-sm text-gray-500">
                Sign in to purchase this content
              </p>
            )}
          </div>
        )}

        {/* Success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-24 left-4 right-4 mx-auto max-w-lg"
            >
              <div className="p-4 rounded-xl bg-green-500 text-white text-center font-medium shadow-lg shadow-green-500/30">
                <Check className="w-5 h-5 inline mr-2" />
                Content unlocked successfully!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
