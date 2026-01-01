"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
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
            media.length > 1 && !showLocked && "grid gap-0.5",
            media.length === 2 && !showLocked && "grid-cols-2",
            media.length >= 3 && !showLocked && "grid-cols-2",
            isSent ? "rounded-br-md" : "rounded-bl-md"
          )}>
            {(showLocked ? media.slice(0, 1) : media.slice(0, 4)).map((item, index) => (
              <motion.div
                key={item.id}
                className={cn(
                  "relative cursor-pointer overflow-hidden",
                  // Locked PPV - big premium card
                  showLocked
                    ? "aspect-[3/4] min-h-[350px] max-h-[450px] bg-gradient-to-br from-pink-950/50 via-black to-purple-950/50"
                    : "bg-black/20",
                  // Regular media sizing
                  !showLocked && media.length === 1 && "aspect-[4/3] max-h-[320px]",
                  !showLocked && media.length > 1 && "aspect-square",
                  !showLocked && index === 0 && media.length === 3 && "row-span-2"
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => !showLocked && onMediaClick?.(item)}
              >
                {showLocked ? (
                  /* Premium Locked PPV - Sexy & Enticing Design */
                  <div className="absolute inset-0 overflow-hidden">
                    {/* Blurred preview background */}
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-70"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/50 via-purple-900/50 to-rose-900/50" />
                    )}

                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"
                      animate={{
                        background: [
                          "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)",
                          "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)",
                          "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)",
                        ]
                      }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    />

                    {/* Sparkle effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5, 0.5],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            delay: i * 0.4,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>

                    {/* Content type badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
                      >
                        {item.type === "VIDEO" ? (
                          <>
                            <Play className="w-3 h-3 text-pink-400" fill="currentColor" />
                            <span className="text-[10px] font-semibold text-white/90">VIDEO</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-pink-400" />
                            <span className="text-[10px] font-semibold text-white/90">PHOTO</span>
                          </>
                        )}
                      </motion.div>
                    </div>

                    {/* VIP Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 10px rgba(236, 72, 153, 0.3)",
                            "0 0 20px rgba(236, 72, 153, 0.5)",
                            "0 0 10px rgba(236, 72, 153, 0.3)",
                          ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 border border-pink-400/30"
                      >
                        <span className="text-[9px] font-bold text-white tracking-wider">EXCLUSIVE</span>
                      </motion.div>
                    </div>

                    {/* Main content area */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      {/* Lock icon with premium animation */}
                      <motion.div
                        className="relative mb-4"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      >
                        {/* Outer glow ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              "0 0 30px 10px rgba(236, 72, 153, 0.2)",
                              "0 0 50px 15px rgba(236, 72, 153, 0.4)",
                              "0 0 30px 10px rgba(236, 72, 153, 0.2)",
                            ],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />

                        {/* Lock container */}
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-2xl">
                          {/* Inner shine */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/30 to-white/0" />
                          <Lock className="w-7 h-7 text-white drop-shadow-lg" />
                        </div>
                      </motion.div>

                      {/* Price tag with sexy gradient */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-4"
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Coins className="w-5 h-5 text-[var(--gold)]" />
                          <span className="text-3xl font-black bg-gradient-to-r from-[var(--gold)] via-amber-300 to-[var(--gold)] bg-clip-text text-transparent">
                            {ppvPrice || 0}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 font-medium">credits to unlock</p>
                      </motion.div>

                      {/* Sexy unlock button */}
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); onUnlock?.(id); }}
                        className="relative group/btn overflow-hidden px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 shadow-lg shadow-pink-500/40"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                          boxShadow: [
                            "0 10px 30px rgba(236, 72, 153, 0.3)",
                            "0 10px 40px rgba(236, 72, 153, 0.5)",
                            "0 10px 30px rgba(236, 72, 153, 0.3)",
                          ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                          animate={{ translateX: ["100%", "-100%"] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 1 }}
                        />

                        <span className="relative flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                          <Lock className="w-4 h-4" />
                          UNLOCK NOW
                        </span>
                      </motion.button>

                      {/* Trust indicator */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 text-[10px] text-white/40 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        Instant access after payment
                      </motion.p>
                    </div>

                    {/* Bottom gradient fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
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
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 pointer-events-none select-none"
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
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

                {/* Sent PPV Overlay - Premium Creator View */}
                {showSentPPV && index === 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      {/* PPV Badge */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--gold)]/90 to-amber-500/90 backdrop-blur-md shadow-lg"
                      >
                        <Lock className="w-3 h-3 text-black" />
                        <span className="text-[10px] font-bold text-black tracking-wide">PPV</span>
                      </motion.div>

                      {/* Price Badge */}
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[var(--gold)]/30"
                      >
                        <Coins className="w-3 h-3 text-[var(--gold)]" />
                        <span className="text-[11px] font-bold text-[var(--gold)]">{ppvPrice || 0}</span>
                      </motion.div>
                    </div>

                    {/* Bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-black" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-white">Exclusive Content</p>
                            <p className="text-[9px] text-white/50">Waiting for unlock</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                          <span className="text-[9px] font-medium">Sent</span>
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
