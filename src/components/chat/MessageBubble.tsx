"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import {
  Lock, Play, Pause, Coins, Check, CheckCheck,
  CornerUpLeft, Heart, ThumbsUp, Laugh, Frown, Flame,
  MoreHorizontal, Volume2, VolumeX, Download, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";

interface MessageMedia {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  url: string;
  previewUrl?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface QuotedMessage {
  id: string;
  text?: string;
  senderName: string;
}

interface MessageBubbleProps {
  id: string;
  text?: string;
  media?: MessageMedia[];
  isPPV?: boolean;
  ppvPrice?: number;
  isUnlocked?: boolean;
  isSent?: boolean;
  timestamp: Date;
  senderName?: string;
  senderAvatar?: string;
  isRead?: boolean;
  isDelivered?: boolean;
  reactions?: Reaction[];
  replyTo?: QuotedMessage;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isCurrentUserCreator?: boolean; // Hide tip button for creators
  onUnlock?: (messageId: string) => void;
  onTip?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onMediaClick?: (media: MessageMedia) => void;
  onQuoteClick?: (messageId: string) => void;
  searchHighlight?: string;
}

const QUICK_REACTIONS = ["❤️", "🔥", "😍", "😂", "👍", "💋"];

export const MessageBubble = memo(function MessageBubble({
  id,
  text,
  media,
  isPPV,
  ppvPrice,
  isUnlocked,
  isSent,
  timestamp,
  senderName,
  senderAvatar,
  isRead,
  isDelivered,
  reactions,
  replyTo,
  isFirstInGroup = true,
  isLastInGroup = true,
  isCurrentUserCreator = false,
  onUnlock,
  onTip,
  onReact,
  onReply,
  onMediaClick,
  onQuoteClick,
  searchHighlight,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Swipe animation
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [0, 60, 80], [0, 0.5, 1]);
  const replyScale = useTransform(x, [0, 60, 80], [0.5, 0.8, 1]);

  const showLocked = isPPV && !isUnlocked && !isSent;
  const showSentPPV = isPPV && isSent; // Show special card for sender

  // Video handlers
  const toggleVideoPlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  }, [isVideoPlaying]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(progress);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // Long press for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 400);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Swipe to reply
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > 80 && !isSent && onReply) {
      onReply(id);
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [id, isSent, onReply]);

  // Close actions on outside click
  useEffect(() => {
    if (!showActions && !showReactions) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showActions, showReactions]);

  // Highlight search text
  const highlightText = (content: string) => {
    if (!searchHighlight || !content) return content;
    const regex = new RegExp(`(${searchHighlight})`, "gi");
    const parts = content.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[var(--gold)]/40 text-white rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  // Time formatting
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      ref={bubbleRef}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex gap-2.5 group relative px-1",
        isSent ? "flex-row-reverse" : "",
        !isLastInGroup && "mb-[2px]",
        isLastInGroup && "mb-3"
      )}
    >
      {/* Avatar */}
      {!isSent && (
        <div className="flex-shrink-0 w-8 self-end">
          {isLastInGroup && (
            senderAvatar ? (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={senderAvatar}
                alt={senderName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 shadow-lg"
              />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-xs shadow-lg"
              >
                {senderName?.charAt(0) || "?"}
              </motion.div>
            )
          )}
        </div>
      )}

      {/* Message container */}
      <motion.div
        drag={!isSent ? "x" : false}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative max-w-[75%] min-w-[80px] group/message",
          isSent ? "ml-auto" : "mr-auto"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Swipe reply indicator */}
        {!isSent && (
          <motion.div
            style={{ opacity: replyOpacity, scale: replyScale }}
            className="absolute -left-12 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--gold)]/20 flex items-center justify-center"
          >
            <CornerUpLeft className="w-4 h-4 text-[var(--gold)]" />
          </motion.div>
        )}

        {/* Reply quote */}
        {replyTo && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onQuoteClick?.(replyTo.id)}
            className={cn(
              "mb-1 px-3 py-1.5 rounded-lg w-full text-left",
              "bg-white/5 hover:bg-white/10 transition-colors",
              "border-l-2 border-[var(--gold)]"
            )}
          >
            <p className="text-[10px] text-[var(--gold)] font-medium">{replyTo.senderName}</p>
            <p className="text-xs text-white/60 truncate">{replyTo.text || "Media"}</p>
          </motion.button>
        )}

        {/* Media Grid */}
        {media && media.length > 0 && (
          <div className={cn(
            "overflow-hidden rounded-2xl mb-0.5",
            media.length > 1 && !showLocked && !showSentPPV && "grid gap-0.5",
            media.length === 2 && !showLocked && !showSentPPV && "grid-cols-2",
            media.length >= 3 && !showLocked && !showSentPPV && "grid-cols-2",
            isSent ? "rounded-br-md" : "rounded-bl-md"
          )}>
            {((showLocked || showSentPPV) ? media.slice(0, 1) : media.slice(0, 4)).map((item, index) => (
              <motion.div
                key={item.id}
                className={cn(
                  "relative cursor-pointer overflow-hidden",
                  // Locked PPV - big premium card (buyer view)
                  showLocked && "aspect-[9/16] min-h-[420px] max-h-[520px] w-full bg-gradient-to-br from-pink-950/50 via-black to-purple-950/50",
                  // Sent PPV - big card (seller view)
                  showSentPPV && "aspect-[4/5] min-h-[320px] max-h-[400px] w-full bg-black/20",
                  // Regular media sizing (non-PPV)
                  !showLocked && !showSentPPV && "bg-black/20",
                  !showLocked && !showSentPPV && media.length === 1 && "aspect-[4/3] max-h-[320px]",
                  !showLocked && !showSentPPV && media.length > 1 && "aspect-square",
                  !showLocked && !showSentPPV && index === 0 && media.length === 3 && "row-span-2"
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => !showLocked && onMediaClick?.(item)}
              >
                {showLocked ? (
                  /* Ultra Modern Locked PPV Card */
                  <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
                    {/* Blurred preview background */}
                    {item.previewUrl ? (
                      <Image
                        src={item.previewUrl}
                        alt=""
                        fill
                        sizes="300px"
                        className="object-cover blur-2xl scale-150 opacity-40"
                      />
                    ) : null}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />

                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <motion.div
                        className="absolute -inset-[100%]"
                        style={{
                          background: "conic-gradient(from 0deg, transparent 0%, rgba(236, 72, 153, 0.8) 25%, transparent 50%, rgba(251, 191, 36, 0.8) 75%, transparent 100%)",
                        }}
                        animate={{ rotate: [0, 360] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      />
                    </div>

                    {/* Inner content area */}
                    <div className="absolute inset-[2px] rounded-2xl bg-black/90" />

                    {/* Top section */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                      {/* Media count pill */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10"
                      >
                        {media && media.some(m => m.type === "VIDEO") ? (
                          <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-white/70" />
                        )}
                        <span className="text-xs font-semibold text-white">
                          {media ? media.length : 1} {media && media.some(m => m.type === "VIDEO") ? "video" : "photo"}{media && media.length > 1 ? "s" : ""}
                        </span>
                      </motion.div>

                      {/* VIP badge */}
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                      >
                        <span className="text-[10px] font-black text-white tracking-widest">VIP</span>
                      </motion.div>
                    </div>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                      {/* Lock icon */}
                      <motion.div
                        className="relative mb-8"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        {/* Glow */}
                        <div className="absolute -inset-2 rounded-2xl bg-pink-500/20 blur-xl -z-10" />
                      </motion.div>

                      {/* Price display */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-black" />
                          </div>
                          <span className="text-5xl font-black text-white">{ppvPrice || 0}</span>
                        </div>
                        <p className="text-sm text-white/50 font-medium">credits to unlock</p>
                      </motion.div>

                      {/* Unlock button */}
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); onUnlock?.(id); }}
                        className="relative w-full max-w-[200px] overflow-hidden rounded-xl"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Button gradient bg */}
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-[length:200%_100%] animate-gradient" />

                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                        />

                        <div className="relative px-8 py-4 flex items-center justify-center gap-2">
                          <Lock className="w-5 h-5 text-white" />
                          <span className="text-base font-bold text-white tracking-wide">UNLOCK</span>
                        </div>
                      </motion.button>
                    </div>

                    {/* Bottom info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-4 left-0 right-0 flex justify-center z-10"
                    >
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Instant access</span>
                      </div>
                    </motion.div>
                  </div>
                ) : item.type === "VIDEO" ? (
                  /* Video Player */
                  <div
                    className="relative w-full h-full group/video select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <video
                      ref={media.length === 1 ? videoRef : undefined}
                      src={item.url}
                      poster={item.previewUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      muted={isVideoMuted}
                      playsInline
                      loop
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      onTimeUpdate={media.length === 1 ? handleVideoTimeUpdate : undefined}
                      onEnded={() => setIsVideoPlaying(false)}
                    />

                    {/* Video overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity",
                      isVideoPlaying ? "opacity-0 group-hover/video:opacity-100" : "opacity-100"
                    )}>
                      {/* Play/Pause center button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); toggleVideoPlay(); }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                          {isVideoPlaying ? (
                            <Pause className="w-6 h-6 text-white" fill="white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-1" fill="white" />
                          )}
                        </div>
                      </motion.button>

                      {/* Bottom controls */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="h-full bg-[var(--gold)]"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsVideoMuted(!isVideoMuted); }}
                            className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white"
                          >
                            {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onMediaClick?.(item); }}
                            className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Photo */
                  <>
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 80vw, 300px"
                      className="object-cover transition-transform duration-300 hover:scale-105 pointer-events-none select-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    {/* Protection overlay */}
                    <div
                      className="absolute inset-0 z-[1]"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </>
                )}

                {/* More indicator */}
                {index === 3 && media.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">+{media.length - 4}</span>
                  </div>
                )}

                {/* Sent PPV Overlay - Premium Creator View (image visible) */}
                {showSentPPV && index === 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Glowing animated border */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{
                        boxShadow: [
                          "inset 0 0 0 3px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)",
                          "inset 0 0 0 3px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.4)",
                          "inset 0 0 0 3px rgba(236, 72, 153, 0.8), 0 0 20px rgba(236, 72, 153, 0.4)",
                        ]
                      }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />

                    {/* Light gradient overlay at bottom only for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />

                    {/* Top left - Status pill */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-3 left-3 z-10"
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-1.5 h-1.5 rounded-full bg-white"
                        />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sent</span>
                      </div>
                    </motion.div>

                    {/* Top right - VIP badge like buyer card */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30">
                        <span className="text-[10px] font-black text-white tracking-widest">VIP</span>
                      </div>
                    </motion.div>

                    {/* Bottom card - Price & Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                          <div className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Coin icon with glow */}
                              <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-[var(--gold)] rounded-lg blur-md opacity-40" />
                                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center">
                                  <Coins className="w-5 h-5 text-black" />
                                </div>
                              </div>

                              {/* Price text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-black text-white">{ppvPrice || 0}</span>
                                  <span className="text-xs font-medium text-white/50">credits</span>
                                </div>
                                <p className="text-[10px] text-white/40 truncate">
                                  {media && media.length > 1 ? `${media.length} exclusive files` : "Exclusive content"}
                                </p>
                              </div>

                              {/* PPV Badge */}
                              <div className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--gold)] to-amber-500 shadow-lg shadow-amber-500/30">
                                <span className="text-xs font-black text-black">PPV</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Text bubble */}
        {text && (
          <div
            className={cn(
              "relative px-4 py-2.5 shadow-lg select-none",
              isSent
                ? "bg-gradient-to-br from-[var(--gold)] via-amber-500 to-amber-600 text-black rounded-2xl"
                : "bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] text-white rounded-2xl border border-white/5",
              // Bubble tail based on position
              isSent && isLastInGroup && "rounded-br-sm",
              !isSent && isLastInGroup && "rounded-bl-sm"
            )}
          >
            {/* Shine effect for sent messages */}
            {isSent && (
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-50" />
              </div>
            )}

            <p className={cn(
              "text-[15px] leading-relaxed whitespace-pre-wrap break-words relative z-10",
              isSent ? "text-black" : "text-white"
            )}>
              {highlightText(text)}
            </p>
          </div>
        )}

        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex flex-wrap gap-1 mt-1",
              isSent ? "justify-end" : "justify-start"
            )}
          >
            {reactions.map((reaction) => (
              <motion.button
                key={reaction.emoji}
                whileTap={{ scale: 0.85 }}
                onClick={() => onReact?.(id, reaction.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs backdrop-blur-md",
                  reaction.hasReacted
                    ? "bg-[var(--gold)]/30 ring-1 ring-[var(--gold)]/50"
                    : "bg-white/10 hover:bg-white/20 ring-1 ring-white/10"
                )}
              >
                <span className="text-sm">{reaction.emoji}</span>
                {reaction.count > 1 && <span className="text-white/70">{reaction.count}</span>}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Timestamp & Status */}
        {isLastInGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "flex items-center gap-1.5 mt-1 text-[10px] text-white/40 px-1",
              isSent ? "justify-end" : "justify-start"
            )}
          >
            <span>{formatTime(timestamp)}</span>
            {isSent && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                {isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[var(--gold)]" />
                ) : isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5 text-white/40" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white/40" />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Desktop hover actions */}
        <div className={cn(
          "absolute top-2 hidden md:flex items-center gap-1 pointer-events-auto z-20",
          "opacity-0 group-hover/message:opacity-100 hover:opacity-100 transition-all duration-200",
          isSent ? "left-0 -translate-x-full pr-3" : "right-0 translate-x-full pl-3"
        )}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowReactions(!showReactions)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors backdrop-blur-md"
          >
            <Heart className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReply?.(id)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors backdrop-blur-md"
          >
            <CornerUpLeft className="w-4 h-4" />
          </motion.button>
          {!isSent && !isCurrentUserCreator && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTip?.(id)}
              className="p-2 rounded-full bg-[var(--gold)]/20 hover:bg-[var(--gold)]/30 text-[var(--gold)] transition-colors backdrop-blur-md"
            >
              <Coins className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Desktop reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={cn(
                "absolute bottom-full mb-2 flex items-center gap-1 p-1.5 rounded-full",
                "bg-[#2a2a2a]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-30",
                isSent ? "right-0" : "left-0"
              )}
            >
              {QUICK_REACTIONS.map((emoji, i) => (
                <motion.button
                  key={emoji}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.3, y: -4 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => {
                    onReact?.(id, emoji);
                    setShowReactions(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-full transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile action sheet */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden"
              onClick={() => setShowActions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#1c1c1e] to-[#0c0c0e] rounded-t-[28px] z-50 md:hidden overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>

              {/* Quick reactions */}
              <div className="flex items-center justify-center gap-2 py-4 px-4">
                {QUICK_REACTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      onReact?.(id, emoji);
                      setShowActions(false);
                    }}
                    className="w-14 h-14 flex items-center justify-center text-2xl bg-white/5 rounded-2xl active:bg-white/10 border border-white/5"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10 mx-4" />

              {/* Actions */}
              <div className="p-3 space-y-1">
                <button
                  onClick={() => { onReply?.(id); setShowActions(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl active:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <CornerUpLeft className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Reply</span>
                </button>

                {!isSent && (
                  <button
                    onClick={() => { onTip?.(id); setShowActions(false); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl active:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)]/30 to-amber-600/30 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                    <span className="text-white font-medium">Send Tip</span>
                  </button>
                )}
              </div>

              {/* Cancel */}
              <div className="p-3 pt-0">
                <button
                  onClick={() => setShowActions(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 active:bg-white/10 text-white font-medium border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
