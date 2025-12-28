"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Search, MessageCircle, Users, Loader2, RefreshCw,
  Settings, Bell, BellOff, Pin, Trash2, MoreVertical, CheckCheck,
  Sparkles, Wifi, WifiOff
} from "lucide-react";
import { ChatWindow } from "@/components/chat";
import { Badge, Button } from "@/components/ui";
import { usePusherChat, isPusherAvailable } from "@/hooks/usePusher";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    isOnline: boolean;
  };
  lastMessage: {
    text: string | null;
    isPPV: boolean;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  } | null;
  unreadCount: number;
  subscription: string;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  receiverId: string;
  isPPV: boolean;
  ppvPrice: number | null;
  isUnlocked: boolean;
  isRead?: boolean;
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

const subscriptionColors: Record<string, string> = {
  Free: "bg-white/10 text-white/50",
  Basic: "bg-blue-500/20 text-blue-400",
  BASIC: "bg-blue-500/20 text-blue-400",
  Premium: "bg-purple-500/20 text-purple-400",
  PREMIUM: "bg-purple-500/20 text-purple-400",
  VIP: "bg-gradient-to-r from-[var(--gold)]/20 to-amber-600/20 text-[var(--gold)]",
};

export default function CreatorMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedCreator, creators, isLoading: creatorsLoading } = useAdminCreator();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pusherConnected, setPusherConnected] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);

  const isCreator = (session?.user as any)?.isCreator === true;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Redirect if not a creator/admin or no creator profile
  useEffect(() => {
    if (status === "loading" || creatorsLoading) return;
    if (!session || (!isCreator && !isAdmin)) {
      router.push("/dashboard");
      return;
    }
    // If user is marked as creator but has no creator profiles, redirect
    if (!selectedCreator && !creatorsLoading && creators.length === 0) {
      router.push("/dashboard");
    }
  }, [session, status, isCreator, isAdmin, router, selectedCreator, creatorsLoading, creators.length]);

  // Handle new message from Pusher
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });

    // Update the conversation's lastMessage
    // Since Pusher is subscribed to activeConversation, update that one
    if (activeConversation) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation
            ? {
                ...conv,
                lastMessage: {
                  text: message.isPPV ? "Sent exclusive content" : message.text,
                  isPPV: message.isPPV,
                  createdAt: typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString(),
                  isRead: false,
                  senderId: message.senderId,
                },
              }
            : conv
        )
      );
    }
  }, [activeConversation]);

  // Pusher real-time subscription
  const { isConnected } = usePusherChat({
    conversationId: activeConversation || "",
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    setPusherConnected(isConnected && isPusherAvailable());
  }, [isConnected]);

  // Fetch conversations
  const fetchConversations = useCallback(async (isInitial = false) => {
    if (!selectedCreator) {
      if (isInitial) setIsLoadingConvs(false);
      return;
    }
    if (isInitial) setIsLoadingConvs(true);
    try {
      const res = await fetch(`/api/conversations?creator=${selectedCreator.slug}`);
      if (res.ok) {
        const json = await res.json();
        const data: Conversation[] = Array.isArray(json) ? json : (json.conversations || []);
        setConversations((prev) => {
          const prevJson = JSON.stringify(prev.map(c => ({ id: c.id, unread: c.unreadCount, lastMsg: c.lastMessage?.createdAt })));
          const newJson = JSON.stringify(data.map((c: Conversation) => ({ id: c.id, unread: c.unreadCount, lastMsg: c.lastMessage?.createdAt })));
          if (prevJson !== newJson) {
            return data;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (isInitial) setIsLoadingConvs(false);
    }
  }, [selectedCreator]);

  // Fetch messages for active conversation
  // markAsRead=true marks messages as read (used when user opens conversation)
  // markAsRead=false for polling (to preserve unread count)
  const fetchMessages = useCallback(async (conversationId: string, markAsRead: boolean = false) => {
    setIsLoadingMsgs(true);
    try {
      const url = markAsRead
        ? `/api/conversations/${conversationId}/messages?markAsRead=true`
        : `/api/conversations/${conversationId}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  // Load conversations when creator changes
  useEffect(() => {
    if (selectedCreator) {
      setActiveConversation(null);
      setMessages([]);
      fetchConversations(true);
    }
  }, [fetchConversations, selectedCreator]);

  // Load messages when conversation changes (mark as read when user clicks)
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation, true); // markAsRead=true
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  }, [activeConversation, fetchMessages]);

  // Fallback polling
  useEffect(() => {
    if (pusherConnected) return;

    const pollInterval = setInterval(() => {
      fetchConversations();
      if (activeConversation) {
        fetch(`/api/conversations/${activeConversation}/messages`)
          .then((res) => res.json())
          .then((data) => {
            setMessages((prev) => {
              if (data.length !== prev.length ||
                  (data.length > 0 && prev.length > 0 && data[data.length - 1].id !== prev[prev.length - 1].id)) {
                return data;
              }
              return prev;
            });
          })
          .catch(console.error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [pusherConnected, activeConversation, fetchConversations]);

  const handleSendMessage = async (
    text: string,
    mediaFiles?: File[],
    isPPV?: boolean,
    ppvPrice?: number
  ) => {
    if (!activeConversation) return;
    if (isSending) return;
    setIsSending(true);

    try {
      let uploadedMedia: any[] = [];

      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("files", file));
        formData.append("type", "chat");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedMedia = uploadData.files || [uploadData];
        }
      }

      const res = await fetch(`/api/conversations/${activeConversation}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || null,
          senderId: selectedCreator?.userId || selectedCreator?.slug || "creator",
          media: uploadedMedia.map((m) => ({
            type: m.type,
            url: m.url,
            previewUrl: m.previewUrl,
          })),
          isPPV: isPPV || false,
          ppvPrice: isPPV ? ppvPrice : null,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  lastMessage: {
                    text: isPPV ? "Sent exclusive content" : text,
                    isPPV: isPPV || false,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    senderId: selectedCreator?.userId || selectedCreator?.slug || "creator",
                  },
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter((conv) =>
      conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [conversations, searchQuery]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const activeConv = conversations.find((c) => c.id === activeConversation);

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
    isUnlocked: msg.isUnlocked,
    senderId: msg.senderId,
    createdAt: new Date(msg.createdAt),
    isRead: msg.isRead,
    reactions: (msg.reactions || []).map((r: any) => ({
      emoji: r.emoji,
      count: r.count,
      hasReacted: r.users?.includes(selectedCreator?.userId) || false,
    })),
  })), [messages, selectedCreator]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
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

  if (!isCreator && !isAdmin) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
      {/* Conversation List + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "w-full lg:w-96 border-r border-white/5 flex flex-col bg-[#0a0a0a]",
            activeConversation && "hidden lg:flex"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <div className="flex items-center gap-2">
                {/* Real-time indicator */}
                {pusherConnected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Connected"
                  />
                )}

                {/* Stats */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-sm">
                  <Users className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-white font-medium">{conversations.length}</span>
                </div>

                {totalUnread > 0 && (
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-600 text-black text-sm font-bold">
                    {totalUnread} new
                  </div>
                )}

                <button
                  onClick={() => fetchConversations()}
                  className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search fans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConvs ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
                  <p className="text-white/30 text-sm">Loading conversations...</p>
                </motion.div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full p-8 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-white/40 font-medium">No conversations yet</p>
                <p className="text-white/20 text-sm mt-1">
                  Conversations will appear when fans message you
                </p>
              </motion.div>
            ) : (
              <div className="py-2">
                {filteredConversations.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    <div
                      onClick={() => setActiveConversation(conv.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveConversation(conv.id)}
                      className={cn(
                        "w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all text-left group cursor-pointer",
                        activeConversation === conv.id && "bg-white/5 border-l-2 border-[var(--gold)]"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conv.user.image ? (
                          <img
                            src={conv.user.image}
                            alt={conv.user.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-white/5"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-lg">
                            {conv.user.name.charAt(0)}
                          </div>
                        )}
                        {conv.user.isOnline && (
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
                              {conv.user.name}
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
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                              subscriptionColors[conv.subscription] || subscriptionColors.Free
                            )}>
                              {conv.subscription}
                            </span>
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
                            {conv.lastMessage?.senderId === selectedCreator?.slug && (
                              <CheckCheck className="w-3.5 h-3.5 inline-block mr-1 text-[var(--gold)]" />
                            )}
                            {conv.lastMessage?.isPPV
                              ? "Exclusive content"
                              : conv.lastMessage?.text || "Start a conversation"}
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

                    {/* Context menu */}
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
          !activeConversation && "hidden lg:flex"
        )}>
          {activeConversation && activeConv ? (
            isLoadingMsgs ? (
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
                conversationId={activeConversation}
                currentUserId={selectedCreator?.userId || selectedCreator?.slug || "creator"}
                otherUser={activeConv.user}
                messages={transformedMessages}
                isAdmin={true}
                isSending={isSending}
                onSendMessage={handleSendMessage}
                onUnlockPPV={(messageId) => {
                  console.log("User unlock PPV:", messageId);
                }}
                onSendTip={(messageId, amount) => {
                  console.log("User tip:", messageId, amount);
                }}
                onBack={() => setActiveConversation(null)}
                onAISuggest={async (userMessage) => {
                  const res = await fetch("/api/ai/suggest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      conversationId: activeConversation,
                      userMessage,
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    return data.suggestion;
                  }
                  throw new Error("AI suggestion failed");
                }}
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
                  Choose a fan to start chatting
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
    </div>
  );
}
