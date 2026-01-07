"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import Link from "next/link";

interface RecentMessage {
  id: string;
  conversationId: string;
  text: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isRead: boolean;
}

export function RecentMessagesWidget() {
  const router = useRouter();
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchRecentMessages() {
      try {
        const res = await fetch("/api/messages/recent");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching recent messages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentMessages();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">Messages</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold flex-shrink-0">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link href="/dashboard/messages" className="flex-shrink-0">
          <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm text-gray-400 px-2 sm:px-3">
            <span className="hidden sm:inline">View all</span>
            <span className="sm:hidden">Voir</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </Link>
      </div>

      {messages.length === 0 ? (
        <Card className="p-6 text-center">
          <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No messages yet</p>
          <Link href="/creators">
            <Button variant="outline" size="sm">
              Discover Creators
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-white/5 overflow-hidden">
          {messages.slice(0, 3).map((msg) => (
            <button
              key={msg.id}
              onClick={() => router.push(`/dashboard/messages?user=${msg.senderId}`)}
              className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              {/* Avatar */}
              {msg.senderAvatar ? (
                <Image
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">
                    {msg.senderName?.charAt(0) || "?"}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium truncate ${msg.isRead ? "text-white" : "text-white"}`}>
                    {msg.senderName}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className={`text-sm truncate ${msg.isRead ? "text-gray-500" : "text-gray-300"}`}>
                  {truncateText(msg.text)}
                </p>
              </div>

              {/* Unread indicator */}
              {!msg.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold)] flex-shrink-0" />
              )}
            </button>
          ))}
        </Card>
      )}
    </motion.div>
  );
}
