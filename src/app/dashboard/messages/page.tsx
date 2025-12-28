"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Lock, Loader2, MessageCircle, Search, ArrowLeft,
  Sparkles, Settings, Bell, BellOff, Pin, Trash2, MoreVertical,
  Circle, CheckCheck
} from "lucide-react";
import { ChatWindow } from "@/components/chat";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { usePusherChat } from "@/hooks/usePusher";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  receiverId: string;
  isPPV: boolean;
  ppvPrice: number | null;
  isUnlocked: boolean;
  ppvUnlockedBy: string[];
  media: {
    id: string;
    type: "PHOTO" | "VIDEO" | "AUDIO";
    url: string;
    previewUrl: string | null;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
    isOnline?: boolean;
  };
  lastMessage?: {
    text: string | null;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  const userIdFromUrl = searchParams.get("user");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  const userId = session?.user?.id;
  const isCreator = (session?.user as any)?.isCreator;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Check subscription status - Creators and Admins can always message
  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId) return;

      // Creators and Admins can always message
      if (isCreator || isAdmin) {
        setHasSubscription(true);
        return;
      }

      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = await res.json();
          // Both Basic and VIP can message
          const canMessage =
            data.subscription?.plan?.canMessage ||
            ["BASIC", "PREMIUM", "VIP"].includes(data.subscription?.plan?.accessTier) ||
            data.subscription?.status === "ACTIVE" ||
            data.subscription?.status === "TRIALING";
          setHasSubscription(canMessage);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [userId, isCreator, isAdmin]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && hasSubscription) {
      fetchConversations();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [userId, hasSubscription, fetchConversations, status]);

  // Auto-select conversation from URL param (by conversation ID)
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0 && !autoSelectDone) {
      const targetConversation = conversations.find(c => c.id === conversationIdFromUrl);
      if (targetConversation) {
        setSelectedConversation(targetConversation);
        setAutoSelectDone(true);
      }
    }
  }, [conversationIdFromUrl, conversations, autoSelectDone]);

  // Auto-find or create conversation by user ID (for creator messaging members)
  useEffect(() => {
    const findOrCreateConversation = async () => {
      if (!userIdFromUrl || !userId || !hasSubscription || autoSelectDone) return;

      // First check if conversation with this user already exists
      const existingConv = conversations.find(c => c.otherUser.id === userIdFromUrl);
      if (existingConv) {
        setSelectedConversation(existingConv);
        setAutoSelectDone(true);
        return;
      }

      // If not found and we have loaded conversations, try to start a new one
      if (conversations.length >= 0 && !isLoading) {
        try {
          // For creators messaging members, we need to find the member's creator association
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userIdFromUrl }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.conversationId) {
              // Refresh conversations to get the new one
              await fetchConversations();
              setAutoSelectDone(true);
            }
          }
        } catch (error) {
          console.error("Error creating conversation:", error);
        }
      }
    };

    findOrCreateConversation();
  }, [userIdFromUrl, userId, conversations, hasSubscription, autoSelectDone, isLoading, fetchConversations]);

  // Fetch messages for selected conversation
  // markAsRead=true marks messages as read (used when user opens conversation)
  const fetchMessages = useCallback(async (markAsRead: boolean = false) => {
    if (!selectedConversation) return;

    setIsLoadingMessages(true);
    try {
      const url = markAsRead
        ? `/api/conversations/${selectedConversation.id}/messages?markAsRead=true`
        : `/api/conversations/${selectedConversation.id}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(true); // markAsRead=true when user opens conversation
    }
  }, [selectedConversation, fetchMessages]);

  // Handle new message from Pusher
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
    fetchConversations();
  }, [fetchConversations]);

  // Pusher real-time connection
  const { isConnected } = usePusherChat({
    conversationId: selectedConversation?.id || "",
    onNewMessage: handleNewMessage,
  });

  // Fallback polling when Pusher is not connected (every 5 seconds)
  useEffect(() => {
    // Skip if Pusher is connected
    if (isConnected) return;
    if (!selectedConversation) return;

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => {
            // Only update if there are new messages
            if (data.length !== prev.length ||
                (data.length > 0 && prev.length > 0 && data[data.length - 1].id !== prev[prev.length - 1].id)) {
              return data;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [isConnected, selectedConversation]);

  // Also poll conversations list every 10 seconds
  useEffect(() => {
    if (!userId || !hasSubscription) return;

    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [userId, hasSubscription, fetchConversations]);

  // Send message
  const handleSendMessage = async (
    text: string,
    mediaFiles?: File[],
    isPPV?: boolean,
    ppvPrice?: number
  ) => {
    if (!selectedConversation || !userId) return;
    if (!text && (!mediaFiles || mediaFiles.length === 0)) return;
    if (isSending) return;

    setIsSending(true);

    try {
      let uploadedMedia: { type: string; url: string; previewUrl?: string }[] = [];

      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch("/api/messages/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const mediaData = await uploadRes.json();
            uploadedMedia.push({
              type: file.type.startsWith("video") ? "VIDEO" :
                    file.type.startsWith("audio") ? "AUDIO" : "PHOTO",
              url: mediaData.url,
              previewUrl: mediaData.previewUrl || null,
            });
          }
        }
      }

      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || null,
          senderId: userId,
          media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Unlock PPV content
  const handleUnlockPPV = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/unlock`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.unlocked) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, isUnlocked: true, ppvUnlockedBy: [...msg.ppvUnlockedBy, userId!] }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error unlocking PPV:", error);
    }
  };

  // Send tip
  const handleSendTip = async (messageId: string, amount: number) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        alert(`Tip of $${amount} sent successfully!`);
      }
    } catch (error) {
      console.error("Error sending tip:", error);
    }
  };

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv) =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: pinned first, then by last message date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [conversations, searchQuery]);

  // Handle reaction
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        // Update local state to reflect the reaction
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;

            const reactions = msg.reactions || [];
            const existingReaction = reactions.find((r) => r.emoji === emoji);
            const hasReacted = existingReaction?.users.includes(userId!);

            if (hasReacted) {
              // Remove reaction
              const newReactions = reactions
                .map((r) => {
                  if (r.emoji !== emoji) return r;
                  return {
                    ...r,
                    count: r.count - 1,
                    users: r.users.filter((u) => u !== userId),
                  };
                })
                .filter((r) => r.count > 0);
              return { ...msg, reactions: newReactions };
            } else {
              // Add reaction
              if (existingReaction) {
                const newReactions = reactions.map((r) => {
                  if (r.emoji !== emoji) return r;
                  return {
                    ...r,
                    count: r.count + 1,
                    users: [...r.users, userId!],
                  };
                });
                return { ...msg, reactions: newReactions };
              } else {
                return {
                  ...msg,
                  reactions: [...reactions, { emoji, count: 1, users: [userId!] }],
                };
              }
            }
          })
        );
      }
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  // Transform messages for ChatWindow
  const transformedMessages = useMemo(() => messages.map((msg) => ({
    id: msg.id,
    text: msg.text || undefined,
    media: msg.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      previewUrl: m.previewUrl || undefined,
    })),
    isPPV: msg.isPPV,
    ppvPrice: msg.ppvPrice || undefined,
    isUnlocked: msg.ppvUnlockedBy?.includes(userId!) || msg.senderId === userId,
    senderId: msg.senderId,
    createdAt: new Date(msg.createdAt),
    reactions: (msg.reactions || []).map((r) => ({
      emoji: r.emoji,
      count: r.count,
      hasReacted: r.users.includes(userId!),
    })),
  })), [messages, userId]);

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-[var(--gold)]/20 border-t-[var(--gold)]"
            />
            <MessageCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[var(--gold)]" />
          </div>
          <p className="text-white/40 text-sm">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--gold)]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gold)]/20 to-amber-600/20 flex items-center justify-center mx-auto mb-6 border border-[var(--gold)]/20"
              >
                <Lock className="w-10 h-10 text-[var(--gold)]" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-3">Sign In Required</h1>
              <p className="text-white/50 mb-8">Please sign in to access direct messaging.</p>
              <Link href="/auth/login">
                <Button variant="premium" size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // No subscription
  if (!hasSubscription) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden">
            {/* Animated glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[var(--gold)] rounded-full blur-[120px] pointer-events-none"
            />

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[var(--gold)]/30"
              >
                <Crown className="w-12 h-12 text-black" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-3">Unlock Direct Messaging</h1>
              <p className="text-white/50 mb-8">
                Upgrade to VIP to start chatting directly with creators.
              </p>
              <Link href="/miacosta/membership">
                <Button variant="premium" size="lg" className="w-full gap-2 shadow-xl shadow-[var(--gold)]/20">
                  <Sparkles className="w-5 h-5" />
                  Upgrade to VIP
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
      {/* Conversation List */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "w-full lg:w-96 border-r border-white/5 flex flex-col bg-[#0a0a0a]",
          selectedConversation && "hidden lg:flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <div className="flex items-center gap-1">
              {isConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-emerald-500 mr-2"
                  title="Connected"
                />
              )}
              <button className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">No conversations yet</p>
              <p className="text-white/20 text-sm mt-1">Start chatting with a creator</p>
            </motion.div>
          ) : (
            <div className="py-2">
              {filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div
                    onClick={() => setSelectedConversation(conv)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedConversation(conv)}
                    className={cn(
                      "w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left group cursor-pointer",
                      selectedConversation?.id === conv.id && "bg-white/5 border-l-2 border-[var(--gold)]"
                    )}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      {conv.otherUser.image ? (
                        <img
                          src={conv.otherUser.image}
                          alt={conv.otherUser.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white/5"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-lg">
                          {conv.otherUser.name.charAt(0)}
                        </div>
                      )}
                      {conv.otherUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-emerald-500/50" />
                      )}
                      {conv.isPinned && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--gold)] rounded-full flex items-center justify-center">
                          <Pin className="w-3 h-3 text-black" />
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-white truncate">
                            {conv.otherUser.name}
                          </span>
                          {conv.unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-600 text-black text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                            >
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </motion.span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <span className="text-[11px] text-white/30 flex-shrink-0">
                            {formatRelativeTime(new Date(conv.lastMessage.createdAt))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm truncate pr-2",
                          conv.unreadCount > 0 ? "text-white/70 font-medium" : "text-white/40"
                        )}>
                          {conv.lastMessage?.senderId === userId && (
                            <CheckCheck className="w-3.5 h-3.5 inline-block mr-1 text-[var(--gold)]" />
                          )}
                          {conv.lastMessage?.text || "Start a conversation"}
                        </p>
                        {conv.isMuted && (
                          <BellOff className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* More button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConversationMenu(showConversationMenu === conv.id ? null : conv.id);
                      }}
                      className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conversation menu */}
                  <AnimatePresence>
                    {showConversationMenu === conv.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-4 top-full -mt-2 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      >
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
                          <Pin className="w-4 h-4" />
                          {conv.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
                          {conv.isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          {conv.isMuted ? "Unmute" : "Mute"}
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation && "hidden lg:flex"
      )}>
        {selectedConversation ? (
          isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
                <p className="text-white/30 text-sm">Loading messages...</p>
              </motion.div>
            </div>
          ) : (
            <ChatWindow
              conversationId={selectedConversation.id}
              currentUserId={userId || ""}
              otherUser={{
                id: selectedConversation.otherUser.id,
                name: selectedConversation.otherUser.name,
                image: selectedConversation.otherUser.image || undefined,
                isOnline: selectedConversation.otherUser.isOnline,
              }}
              messages={transformedMessages}
              onSendMessage={handleSendMessage}
              onUnlockPPV={handleUnlockPPV}
              onSendTip={handleSendTip}
              onReact={handleReact}
              isSending={isSending}
              onBack={() => setSelectedConversation(null)}
            />
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative text-center p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center mx-auto mb-6 border border-white/5"
              >
                <MessageCircle className="w-12 h-12 text-white/20" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-white/60 mb-2"
              >
                Select a conversation
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/30"
              >
                Choose from your existing conversations or start a new one
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showConversationMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowConversationMenu(null)}
        />
      )}
    </div>
  );
}
