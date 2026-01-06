"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// Hook to get the previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Lock, Loader2, MessageCircle, Search, ArrowLeft,
  Sparkles, Bell, BellOff, Pin, Trash2, MoreVertical,
  Circle, CheckCheck, Image, X, PanelLeftClose, PanelRightClose,
  User, ChevronLeft, ChevronRight
} from "lucide-react";
import { ChatWindow } from "@/components/chat";
import { CreatorChatSidebar } from "@/components/chat/CreatorChatSidebar";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { usePusherChat } from "@/hooks/usePusher";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

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
  replyTo?: {
    id: string;
    text?: string;
    senderName: string;
  };
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
    isOnline?: boolean;
    slug?: string;
  };
  lastMessage?: {
    text: string | null;
    createdAt: string;
    senderId: string;
    isPPV?: boolean;
    hasMedia?: boolean;
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
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true); // Open by default on desktop

  const userId = session?.user?.id;
  const isCreator = (session?.user as any)?.isCreator;
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [isAgencyOwner, setIsAgencyOwner] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  // For creators: get selected creator profile for PPV functionality
  const { selectedCreator } = useAdminCreator();

  // Check subscription status - Creators, Admins, and Agency owners can always message
  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId) {
        setIsCheckingSubscription(false);
        return;
      }

      // Creators and Admins can always message
      if (isCreator || isAdmin) {
        setHasSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      try {
        // Check if user is an agency owner
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agency) {
            setIsAgencyOwner(true);
            setHasSubscription(true);
            setIsCheckingSubscription(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking agency:", error);
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
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [userId, isCreator, isAdmin]);

  // Fetch conversations (filtered by selected creator if any)
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      // Build URL with optional creator filter
      const url = selectedCreator?.slug
        ? `/api/conversations?creator=${selectedCreator.slug}`
        : "/api/conversations";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedCreator?.slug]);

  useEffect(() => {
    if (userId && hasSubscription) {
      fetchConversations();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [userId, hasSubscription, fetchConversations, status]);

  // Reset selected conversation when creator changes (but not on initial mount)
  const previousCreatorSlug = usePrevious(selectedCreator?.slug);
  useEffect(() => {
    // Only reset if creator actually changed (not on initial mount)
    if (previousCreatorSlug !== undefined && previousCreatorSlug !== selectedCreator?.slug) {
      setSelectedConversation(null);
      setMessages([]);
      setAutoSelectDone(false);
    }
  }, [selectedCreator?.slug, previousCreatorSlug]);

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

        // Notify sidebar to update unread count when messages are marked as read
        if (markAsRead) {
          window.dispatchEvent(new Event("unread-count-updated"));
        }
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

  // Handle messages read event from Pusher (when other user reads our messages)
  const handleMessagesRead = useCallback((data: { readerId: string }) => {
    // Update local message state to show read receipts for messages we sent to that reader
    setMessages((prev) =>
      prev.map((msg) =>
        msg.senderId === userId && msg.receiverId === data.readerId
          ? { ...msg, isRead: true }
          : msg
      )
    );
  }, [userId]);

  // Handle marking messages as read (batch approach)
  const handleMarkAsRead = useCallback(async () => {
    if (!selectedConversation) return;

    try {
      // Use batch approach - fetch with markAsRead=true
      await fetch(`/api/conversations/${selectedConversation.id}/messages?markAsRead=true`);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId !== userId ? { ...msg, isRead: true } : msg
        )
      );

      // Update unread count in conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Notify sidebar to update unread count
      window.dispatchEvent(new Event("unread-count-updated"));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [selectedConversation, userId]);

  // Pusher real-time connection
  const { isConnected } = usePusherChat({
    conversationId: selectedConversation?.id || "",
    onNewMessage: handleNewMessage,
    onMessagesRead: handleMessagesRead,
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
    ppvPrice?: number,
    replyToId?: string
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
          isPPV: isPPV || false,
          ppvPrice: isPPV && ppvPrice ? ppvPrice : undefined,
          replyToId: replyToId || undefined,
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
                ? {
                    ...msg,
                    isUnlocked: true,
                    ppvUnlockedBy: [...msg.ppvUnlockedBy, userId!],
                    // Update media URLs with unlocked content
                    media: data.media || msg.media,
                  }
                : msg
            )
          );
        }
      } else {
        const errorData = await res.json();
        if (errorData.error === "Insufficient paid credits") {
          alert(`Not enough credits. You have ${errorData.balance} but need ${errorData.required} credits.`);
        } else {
          alert(errorData.error || "Failed to unlock content");
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

  // Send PPV from library (for creators only)
  const handleSendPPVFromLibrary = async (media: {
    id: string;
    type: string;
    url: string;
    previewUrl?: string;
    ppvPriceCredits?: number;
  }) => {
    if (!selectedConversation || !userId) return;
    if (isSending) return;
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: null,
          senderId: userId,
          media: [{
            type: media.type,
            url: media.url,
            previewUrl: media.previewUrl || null,
            mediaId: media.id,
          }],
          isPPV: true,
          ppvPrice: media.ppvPriceCredits || 50,
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
      console.error("Error sending PPV from library:", error);
    } finally {
      setIsSending(false);
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

  // Handle AI suggestion
  const handleAISuggest = async (lastUserMessage: string): Promise<string> => {
    if (!selectedConversation) {
      throw new Error("No conversation selected");
    }

    const res = await fetch(`/api/conversations/${selectedConversation.id}/ai-suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error("Failed to get AI suggestion");
    }

    const data = await res.json();
    return data.suggestion;
  };

  // Handle pin conversation
  const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, isPinned } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error pinning conversation:", error);
    }
    setShowConversationMenu(null);
  };

  // Handle mute conversation
  const handleMuteConversation = async (conversationId: string, isMuted: boolean) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMuted }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, isMuted } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error muting conversation:", error);
    }
    setShowConversationMenu(null);
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
    setShowConversationMenu(null);
  };

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

  // Loading state - show loading while session, conversations, or subscription is being checked
  if (status === "loading" || isLoading || isCheckingSubscription) {
    return (
      <div className="h-screen pt-16 lg:pt-0 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 sm:gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[var(--gold)]/20 border-t-[var(--gold)]"
            />
            <MessageCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-[var(--gold)]" />
          </div>
          <p className="text-white/40 text-xs sm:text-sm">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  // Not logged in - only show when explicitly confirmed as unauthenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen pt-16 lg:pt-0 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-[var(--gold)]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--gold)]/20 to-amber-600/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-[var(--gold)]/20"
              >
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--gold)]" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Sign In Required</h1>
              <p className="text-sm sm:text-base text-white/50 mb-6 sm:mb-8">Please sign in to access direct messaging.</p>
              <Link href="/auth/login">
                <Button variant="premium" size="lg" className="w-full text-sm sm:text-base">
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
      <div className="min-h-screen pt-16 lg:pt-0 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden">
            {/* Animated glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-64 sm:h-80 bg-[var(--gold)] rounded-full blur-[120px] pointer-events-none"
            />

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl shadow-[var(--gold)]/30"
              >
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Unlock Direct Messaging</h1>
              <p className="text-sm sm:text-base text-white/50 mb-6 sm:mb-8">
                Upgrade to VIP to start chatting directly with creators.
              </p>
              <Link href="/miacosta/membership">
                <Button variant="premium" size="lg" className="w-full gap-2 shadow-xl shadow-[var(--gold)]/20 text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
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
    <div className="h-screen pt-16 lg:pt-0 flex bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
      {/* Left Panel Toggle (when collapsed on desktop) - only show when a conversation is selected */}
      <AnimatePresence>
        {!showLeftPanel && selectedConversation && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setShowLeftPanel(true)}
            className="hidden lg:flex items-center justify-center w-10 h-full border-r border-white/5 bg-[#0a0a0a] hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Conversation List */}
      <AnimatePresence>
        {(showLeftPanel || !selectedConversation) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-full lg:w-96 border-r border-white/5 flex flex-col bg-[#0a0a0a] overflow-hidden",
              selectedConversation && "hidden lg:flex"
            )}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Messages</h1>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      title="Connected"
                    />
                  )}
                  {/* Collapse button - desktop only, only when a conversation is selected */}
                  {selectedConversation && (
                    <button
                      onClick={() => setShowLeftPanel(false)}
                      className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Collapse panel"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
              </div>
              <p className="text-sm sm:text-base text-white/40 font-medium">No conversations yet</p>
              <p className="text-white/20 text-xs sm:text-sm mt-1">Start chatting with a creator</p>
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
                      "w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-white/5 transition-all text-left group cursor-pointer",
                      selectedConversation?.id === conv.id && "bg-white/5 border-l-2 border-[var(--gold)]"
                    )}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      {conv.otherUser.image ? (
                        <img
                          src={conv.otherUser.image}
                          alt={conv.otherUser.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/5"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[var(--gold)] via-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-base sm:text-lg">
                          {conv.otherUser.name.charAt(0)}
                        </div>
                      )}
                      {conv.otherUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-emerald-500/50" />
                      )}
                      {conv.isPinned && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[var(--gold)] rounded-full flex items-center justify-center">
                          <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="text-sm sm:text-base font-semibold text-white truncate">
                            {conv.otherUser.name}
                          </span>
                          {conv.unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] px-1 sm:px-1.5 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-600 text-black text-[10px] sm:text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                            >
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </motion.span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <span className="text-[10px] sm:text-[11px] text-white/30 flex-shrink-0 ml-1">
                            {formatRelativeTime(new Date(conv.lastMessage.createdAt))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-xs sm:text-sm truncate pr-2",
                          conv.unreadCount > 0 ? "text-white/70 font-medium" : "text-white/40"
                        )}>
                          {conv.lastMessage?.senderId === userId && (
                            <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline-block mr-1 text-[var(--gold)]" />
                          )}
                          {conv.lastMessage
                            ? conv.lastMessage.isPPV
                              ? "🔒 Exclusive content"
                              : conv.lastMessage.text
                                ? conv.lastMessage.text
                                : conv.lastMessage.hasMedia
                                  ? "📷 Sent media"
                                  : "New conversation"
                            : "Start a conversation"}
                        </p>
                        {conv.isMuted && (
                          <BellOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/20 flex-shrink-0" />
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinConversation(conv.id, !conv.isPinned);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                          <Pin className={cn("w-4 h-4", conv.isPinned && "text-[var(--gold)]")} />
                          {conv.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMuteConversation(conv.id, !conv.isMuted);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                          {conv.isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          {conv.isMuted ? "Unmute" : "Mute"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this conversation?")) {
                              handleDeleteConversation(conv.id);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
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
      )}
      </AnimatePresence>

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
                slug: selectedConversation.otherUser.slug,
              }}
              messages={transformedMessages}
              isAdmin={isCreator || !!selectedCreator}
              isMuted={selectedConversation.isMuted}
              onSendMessage={handleSendMessage}
              onUnlockPPV={handleUnlockPPV}
              onSendTip={handleSendTip}
              onReact={handleReact}
              onMarkAsRead={handleMarkAsRead}
              onAISuggest={(isCreator || selectedCreator) ? handleAISuggest : undefined}
              creatorSlug={selectedCreator?.slug || undefined}
              onSendPPVFromLibrary={selectedCreator?.slug ? handleSendPPVFromLibrary : undefined}
              onMute={(muted) => handleMuteConversation(selectedConversation.id, muted)}
              onDelete={() => handleDeleteConversation(selectedConversation.id)}
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
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-[var(--gold)]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative text-center p-6 sm:p-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-white/5"
              >
                <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white/20" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl font-semibold text-white/60 mb-1 sm:mb-2"
              >
                Select a conversation
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-white/30"
              >
                Choose from your existing conversations
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Panel Toggle (when collapsed on desktop) */}
      <AnimatePresence>
        {!showRightPanel && selectedConversation && (isCreator || !!selectedCreator) && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setShowRightPanel(true)}
            className="hidden lg:flex items-center justify-center w-10 h-full border-l border-white/5 bg-[#0a0a0a] hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Panel - Fan Context */}
      <AnimatePresence>
        {showRightPanel && selectedConversation && (isCreator || !!selectedCreator) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col border-l border-white/5 bg-[#0a0a0a] overflow-hidden"
          >
            <CreatorChatSidebar
              conversationId={selectedConversation.id}
              onClose={() => setShowRightPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
