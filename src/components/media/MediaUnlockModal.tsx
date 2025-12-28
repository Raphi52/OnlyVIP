"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Lock, Loader2, CheckCircle, AlertCircle, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface MediaUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: string;
    title: string;
    thumbnailUrl: string;
    type: "PHOTO" | "VIDEO";
    ppvPriceCredits: number;
    tagVIP?: boolean;
  };
  userCredits: number;
  isVIP?: boolean;
  onSuccess?: (newBalance: number) => void;
}

export function MediaUnlockModal({
  isOpen,
  onClose,
  media,
  userCredits,
  isVIP = false,
  onSuccess,
}: MediaUnlockModalProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canAfford = userCredits >= media.ppvPriceCredits;
  const needsVIP = media.tagVIP && !isVIP;

  const handleUnlock = async () => {
    if (!canAfford || needsVIP) return;

    setIsUnlocking(true);
    setError(null);

    try {
      const res = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: media.id,
          type: "MEDIA_UNLOCK",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess(data.newBalance);
      }

      // Auto close after success
      setTimeout(() => {
        onClose();
        // Reload to show unlocked content
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock content");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-2xl p-6 z-50"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Thumbnail preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className="w-full h-full object-cover blur-xl"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-[var(--gold)]/50 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-[var(--gold)]" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">{media.title}</h3>
            <p className="text-gray-400 text-sm mb-6">
              Unlock this {media.type.toLowerCase()} to view it
            </p>

            {/* Price & Balance */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-bold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  {media.ppvPriceCredits.toLocaleString()} credits
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Your Balance</span>
                <span className={`font-bold flex items-center gap-2 ${
                  canAfford ? "text-green-400" : "text-red-400"
                }`}>
                  <Coins className="w-4 h-4" />
                  {userCredits.toLocaleString()} credits
                </span>
              </div>
              {!canAfford && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-400">Missing</span>
                    <span className="text-red-400 font-bold">
                      {(media.ppvPriceCredits - userCredits).toLocaleString()} credits
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* VIP Warning */}
            {needsVIP && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-yellow-500 font-medium">VIP Required</p>
                    <p className="text-yellow-500/70 text-sm">
                      This content is reserved for VIP members
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-500">{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-green-500">Content unlocked successfully!</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {needsVIP ? (
                <Link href="/membership" className="block">
                  <Button
                    variant="premium"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to VIP
                  </Button>
                </Link>
              ) : canAfford ? (
                <Button
                  onClick={handleUnlock}
                  disabled={isUnlocking || success}
                  variant="premium"
                  className="w-full gap-2"
                  size="lg"
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Unlocking...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Unlocked!
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5" />
                      Unlock for {media.ppvPriceCredits.toLocaleString()} credits
                    </>
                  )}
                </Button>
              ) : (
                <Link href="/credits" className="block">
                  <Button
                    variant="premium"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Coins className="w-5 h-5" />
                    Buy Credits
                  </Button>
                </Link>
              )}

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
