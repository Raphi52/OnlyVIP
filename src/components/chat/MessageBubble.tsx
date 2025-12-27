"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import {
  Lock, Play, Pause, DollarSign, Check, CheckCheck,
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
          "relative max-w-[75%] min-w-[80px]",
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
            media.length > 1 && "grid gap-0.5",
            media.length === 2 && "grid-cols-2",
            media.length >= 3 && "grid-cols-2",
            isSent ? "rounded-br-md" : "rounded-bl-md"
          )}>
            {media.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.id}
                className={cn(
                  "relative cursor-pointer overflow-hidden bg-black/20",
                  media.length === 1 ? "aspect-[4/3] max-h-[320px]" : "aspect-square",
                  index === 0 && media.length === 3 && "row-span-2"
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => !showLocked && onMediaClick?.(item)}
              >
                {showLocked ? (
                  /* Locked PPV */
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/80 to-black/90">
                    {item.previewUrl && (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <motion.div
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center mb-3 shadow-xl shadow-[var(--gold)]/30"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(212, 175, 55, 0.3)",
                            "0 0 40px rgba(212, 175, 55, 0.5)",
                            "0 0 20px rgba(212, 175, 55, 0.3)"
                          ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Lock className="w-7 h-7 text-black" />
                      </motion.div>
                      <p className="text-2xl font-bold text-white mb-1">{formatPrice(ppvPrice || 0)}</p>
                      <p className="text-xs text-white/50 mb-4">Exclusive content</p>
                      <Button
                        variant="premium"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onUnlock?.(id); }}
                        className="shadow-xl px-6"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock
                      </Button>
                    </div>
                  </div>
                ) : item.type === "VIDEO" ? (
                  /* Video Player */
                  <div className="relative w-full h-full group/video">
                    <video
                      ref={media.length === 1 ? videoRef : undefined}
                      src={item.url}
                      poster={item.previewUrl}
                      className="w-full h-full object-cover"
                      muted={isVideoMuted}
                      playsInline
                      loop
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
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                )}

                {/* More indicator */}
                {index === 3 && media.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">+{media.length - 4}</span>
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
          "absolute top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          isSent ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
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
          {!isSent && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTip?.(id)}
              className="p-2 rounded-full bg-[var(--gold)]/20 hover:bg-[var(--gold)]/30 text-[var(--gold)] transition-colors backdrop-blur-md"
            >
              <DollarSign className="w-4 h-4" />
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
                      <DollarSign className="w-5 h-5 text-[var(--gold)]" />
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
