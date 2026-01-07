"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crown,
  X,
  Sparkles,
  Unlock,
  ShoppingCart,
  AlertTriangle,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

      // Redirect to view the unlocked content
      setTimeout(() => {
        onClose();
        if (data.mediaUrl) {
          // Navigate directly to the media URL
          window.location.href = data.mediaUrl;
        } else {
          // Fallback: reload page to update UI
          window.location.reload();
        }
      }, 1000);
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-md overflow-hidden"
        >
          {/* Glow effect */}
          <div className={cn(
            "absolute -inset-[1px] rounded-t-3xl sm:rounded-3xl blur-sm",
            success
              ? "bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent"
              : !canAfford
              ? "bg-gradient-to-b from-orange-500/30 via-red-500/10 to-transparent"
              : "bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-transparent"
          )} />

          <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Success State */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlocked!</h3>
                <p className="text-gray-400">Enjoy your content</p>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                          canAfford
                            ? "bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/25"
                            : "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/25"
                        )}>
                          {canAfford ? (
                            <Unlock className="w-7 h-7 text-white" />
                          ) : (
                            <Lock className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                          {media.type === "VIDEO" ? (
                            <Play className="w-3 h-3 text-white" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {canAfford ? "Unlock Content" : "Insufficient Credits"}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                          {media.title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Preview */}
                <div className="px-6 mb-4">
                  <div
                    className="relative aspect-video rounded-2xl overflow-hidden select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Image
                      src={media.thumbnailUrl}
                      alt={media.title}
                      fill
                      sizes="(max-width: 768px) 90vw, 500px"
                      className="object-cover blur-sm scale-[1.02] pointer-events-none select-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center"
                      >
                        <Lock className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur text-xs font-medium text-white flex items-center gap-1">
                        {media.type === "VIDEO" ? (
                          <>
                            <Play className="w-3 h-3" />
                            Video
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3" />
                            Photo
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 space-y-4">
                  {/* Price & Balance */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Price */}
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Price
                      </p>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-purple-400" />
                        <span className="text-xl font-bold text-white">
                          {media.ppvPriceCredits.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className={cn(
                      "p-4 rounded-2xl border",
                      canAfford
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    )}>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Your Balance
                      </p>
                      <div className="flex items-center gap-2">
                        <Coins className={cn(
                          "w-5 h-5",
                          canAfford ? "text-emerald-400" : "text-red-400"
                        )} />
                        <span className={cn(
                          "text-xl font-bold",
                          canAfford ? "text-emerald-400" : "text-red-400"
                        )}>
                          {userCredits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Insufficient Credits Warning */}
                  {!canAfford && !needsVIP && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            Need {missingCredits.toLocaleString()} more credits
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            Top up your balance to unlock this content
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* VIP Warning */}
                  {needsVIP && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Crown className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">VIP Only Content</p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            Upgrade to VIP to access exclusive content
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/5 mt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                    >
                      Cancel
                    </button>

                    {needsVIP ? (
                      <Link href="/membership" className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to VIP
                        </motion.button>
                      </Link>
                    ) : canAfford ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUnlock}
                        disabled={isUnlocking}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                      >
                        {isUnlocking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Unlocking...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Unlock Now
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <Link href="/credits" className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Buy Credits
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
