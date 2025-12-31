"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Lock, Loader2, CheckCircle, AlertCircle, Crown } from "lucide-react";
import Link from "next/link";

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
  const missingCredits = media.ppvPriceCredits - userCredits;

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
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock content");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-[#0d0d0f] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Unlock Content
                </h3>
                <p className="text-sm text-gray-400">
                  {media.title}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5">
            {/* Thumbnail preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className="w-full h-full object-cover blur-xl"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-purple-500/50 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Step 1: Price */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  Content price
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-bold">
                    {media.ppvPriceCredits.toLocaleString()} credits
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Balance */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                canAfford ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  Your balance
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className={`w-4 h-4 ${canAfford ? "text-green-400" : "text-red-400"}`} />
                  <span className={`font-bold ${canAfford ? "text-green-400" : "text-red-400"}`}>
                    {userCredits.toLocaleString()} credits
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Result */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                canAfford ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
              }`}>
                3
              </div>
              <div className="flex-1">
                {canAfford ? (
                  <>
                    <p className="font-medium text-white">
                      Ready to unlock
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click unlock to access this {media.type.toLowerCase()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-white">
                      Need more credits
                    </p>
                    <p className="text-sm text-orange-400 mt-1">
                      Missing {missingCredits.toLocaleString()} credits
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* VIP Warning */}
            {needsVIP && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Content unlocked successfully!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            {needsVIP ? (
              <Link href="/membership" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-semibold hover:opacity-90 transition-opacity">
                  <Crown className="w-4 h-4" />
                  Upgrade to VIP
                </button>
              </Link>
            ) : canAfford ? (
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || success}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Unlocking...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Unlocked!
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    Unlock
                  </>
                )}
              </button>
            ) : (
              <Link href="/credits" className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity">
                  <Coins className="w-4 h-4" />
                  Buy Credits
                </button>
              </Link>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
