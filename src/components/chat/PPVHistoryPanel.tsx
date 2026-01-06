"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Check,
  Clock,
  Image as ImageIcon,
  Video,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PPVMessage {
  id: string;
  mediaType: "PHOTO" | "VIDEO";
  thumbnailUrl: string | null;
  mediaCount: number;
  price: number;
  isPurchased: boolean;
  purchasedAt: string | null;
  sentAt: string;
  text: string | null;
}

interface PPVStats {
  totalSent: number;
  totalPurchased: number;
  totalRevenue: number;
  conversionRate: number;
}

interface PPVHistoryPanelProps {
  conversationId: string;
  className?: string;
  collapsed?: boolean;
}

export function PPVHistoryPanel({
  conversationId,
  className = "",
  collapsed: initialCollapsed = false,
}: PPVHistoryPanelProps) {
  const [ppvMessages, setPpvMessages] = useState<PPVMessage[]>([]);
  const [stats, setStats] = useState<PPVStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    const fetchPPVHistory = async () => {
      if (!conversationId) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/ppv-history`
        );
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setPpvMessages(data.ppvMessages || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error("Error fetching PPV history:", err);
        setError("Failed to load PPV history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPPVHistory();
  }, [conversationId]);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <p className="text-sm text-red-400 text-center py-4">{error}</p>
      </div>
    );
  }

  return (
    <div className={`border-t border-white/5 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-white">
            PPV Sent ({stats?.totalSent || 0})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Stats Summary */}
            {stats && stats.totalSent > 0 && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Conversion</p>
                    <p className="text-lg font-bold text-white">
                      {stats.conversionRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Revenue</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {stats.totalRevenue.toLocaleString()} cr
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PPV List */}
            <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
              {ppvMessages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No PPV sent yet
                </p>
              ) : (
                ppvMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                      {msg.thumbnailUrl ? (
                        <img
                          src={msg.thumbnailUrl}
                          alt="PPV"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {msg.mediaType === "VIDEO" ? (
                            <Video className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      )}
                      {msg.mediaCount > 1 && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 text-[10px] font-bold bg-black/70 rounded text-white">
                          +{msg.mediaCount - 1}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {msg.price} cr
                        </span>
                        {msg.isPurchased ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                            <Check className="w-3 h-3" />
                            Bought
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {msg.sentAt &&
                          formatDistanceToNow(new Date(msg.sentAt), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Bottom Stats */}
            {stats && stats.totalSent > 0 && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                  <span>
                    {stats.totalPurchased}/{stats.totalSent} purchased
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    {stats.totalRevenue.toLocaleString()} credits earned
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
