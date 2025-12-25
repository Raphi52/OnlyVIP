"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Crown, Lock, Loader2, MessageSquare } from "lucide-react";
import { ChatWindow } from "@/components/chat";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

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
  createdAt: string;
}

const ADMIN_USER_ID = "admin";

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const userId = session?.user?.id;

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId) return;

      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = await res.json();
          // Premium and VIP can message
          setHasSubscription(
            data.subscription?.plan?.canMessage ||
            ["PREMIUM", "VIP"].includes(data.subscription?.plan?.accessTier)
          );
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [userId]);

  // Initialize or get conversation with admin
  const initConversation = useCallback(async () => {
    if (!userId) return;

    try {
      // Create or get existing conversation with admin
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ADMIN_USER_ID }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.id);
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [conversationId]);

  // Initialize on mount
  useEffect(() => {
    if (userId && hasSubscription) {
      initConversation();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [userId, hasSubscription, initConversation, status]);

  // Fetch messages when conversation is ready
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!conversationId) return;

    const pollInterval = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollInterval);
  }, [conversationId, fetchMessages]);

  // Send message
  const handleSendMessage = async (
    text: string,
    mediaFiles?: File[],
    isPPV?: boolean,
    ppvPrice?: number
  ) => {
    if (!conversationId || !userId) return;
    setIsSending(true);

    try {
      // Send message via API
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || null,
          senderId: userId,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Unlock PPV content
  const handleUnlockPPV = async (messageId: string) => {
    // TODO: Implement payment flow for PPV unlock
    console.log("Unlock PPV:", messageId);
  };

  // Send tip
  const handleSendTip = async (messageId: string, amount: number) => {
    // TODO: Implement payment flow for tips
    console.log("Send tip:", messageId, amount);
  };

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <Card variant="featured" className="p-8">
            <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[var(--gold)]" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
              Sign In Required
            </h1>
            <p className="text-[var(--muted)] mb-8">
              Please sign in to access direct messaging.
            </p>
            <Link href="/auth/signin">
              <Button variant="premium" size="lg">
                Sign In
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  // No subscription
  if (!hasSubscription) {
    return (
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <Card variant="featured" className="p-8">
            <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[var(--gold)]" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
              Unlock Direct Messaging
            </h1>
            <p className="text-[var(--muted)] mb-8">
              Upgrade to Premium or VIP to start chatting directly with Mia.
              Get exclusive content, personalized messages, and more!
            </p>
            <Link href="/#membership">
              <Button variant="premium" size="lg" className="gap-2">
                <Crown className="w-5 h-5" />
                Upgrade Now
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Transform messages for ChatWindow
  const transformedMessages = messages.map((msg) => ({
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
  }));

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[var(--background)]" />
          </div>
          <div>
            <h1 className="font-semibold text-[var(--foreground)]">Mia Costa</h1>
            <p className="text-xs text-[var(--success)]">Online</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-[var(--gold)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Start a conversation
              </h2>
              <p className="text-[var(--muted)] text-sm max-w-xs mx-auto">
                Say hi to Mia! She'll respond as soon as possible.
              </p>
            </div>
          </div>
        ) : null}
        <ChatWindow
          conversationId={conversationId || ""}
          currentUserId={userId || ""}
          otherUser={{
            id: ADMIN_USER_ID,
            name: "Mia Costa",
            image: undefined,
            isOnline: true,
          }}
          messages={transformedMessages}
          onSendMessage={handleSendMessage}
          onUnlockPPV={handleUnlockPPV}
          onSendTip={handleSendTip}
        />
      </div>
    </div>
  );
}
