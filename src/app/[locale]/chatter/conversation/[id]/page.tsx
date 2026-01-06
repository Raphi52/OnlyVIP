"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft } from "lucide-react";
import ChatterWorkspace from "@/components/chatter/ChatterWorkspace";
import Pusher from "pusher-js";

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  isFromCreator: boolean;
  isAiGenerated?: boolean;
  createdAt: string;
  media?: {
    id: string;
    type: string;
    thumbnailUrl: string | null;
    contentUrl: string;
  } | null;
}

interface Participant {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ConversationData {
  id: string;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  participants: Participant[];
  messages: Message[];
  aiMode: string;
}

export default function ChatterConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const conversationId = params.id as string;

  const [conversationData, setConversationData] =
    useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as any).role !== "CHATTER") {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  // Fetch conversation data
  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/chatter/conversations/${conversationId}/messages`
      );
      if (!res.ok) {
        if (res.status === 403) {
          setError("You don't have access to this conversation");
          return;
        }
        throw new Error("Failed to fetch conversation");
      }

      const data = await res.json();

      // Transform the data to match ConversationData interface
      const transformed: ConversationData = {
        id: conversationId,
        creatorSlug: data.conversation?.creatorSlug || "",
        creatorName: data.conversation?.creatorName || "Creator",
        creatorAvatar: data.conversation?.creatorAvatar || null,
        participants: [
          // Creator participant
          {
            userId: data.conversation?.creatorSlug || "",
            user: {
              id: data.conversation?.creatorUserId || "",
              name: data.conversation?.creatorName || "Creator",
              image: data.conversation?.creatorAvatar || null,
            },
          },
          // Fan participant
          {
            userId: data.conversation?.fan?.id || "",
            user: {
              id: data.conversation?.fan?.id || "",
              name: data.conversation?.fan?.name || "Fan",
              image: data.conversation?.fan?.avatar || null,
            },
          },
        ],
        messages: (data.messages || []).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          isFromCreator: msg.isFromCreator,
          isAiGenerated: msg.isAiGenerated || false,
          createdAt: msg.createdAt,
          media: msg.media?.[0]
            ? {
                id: msg.media[0].id,
                type: msg.media[0].type,
                thumbnailUrl: msg.media[0].previewUrl || null,
                contentUrl: msg.media[0].url,
              }
            : null,
        })),
        aiMode: "suggest", // Always suggest mode for chatters
      };

      setConversationData(transformed);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    if (session) {
      fetchConversation();
    }
  }, [session, fetchConversation]);

  // Pusher for real-time updates
  useEffect(() => {
    if (!conversationId || !conversationData) return;

    // Check if Pusher env vars are available
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("Pusher environment variables not configured");
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (data: any) => {
      setConversationData((prev) => {
        if (!prev) return prev;

        // Avoid duplicates
        if (prev.messages.some((m) => m.id === data.id)) return prev;

        const newMessage: Message = {
          id: data.id,
          text: data.text,
          senderId: data.senderId,
          isFromCreator: data.isFromCreator,
          isAiGenerated: data.isAiGenerated || false,
          createdAt: data.createdAt,
          media: data.media?.[0]
            ? {
                id: data.media[0].id,
                type: data.media[0].type,
                thumbnailUrl: data.media[0].previewUrl || null,
                contentUrl: data.media[0].url,
              }
            : null,
        };

        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, conversationData]);

  // Send message handler
  const handleSendMessage = async (text: string, scriptId?: string) => {
    if (!conversationData) return;

    const res = await fetch(
      `/api/chatter/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, scriptId }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to send message");
    }

    const newMessage = await res.json();

    // Add to local state (Pusher will also send it, but this is faster)
    setConversationData((prev) => {
      if (!prev) return prev;

      // Check if already exists (from Pusher)
      if (prev.messages.some((m) => m.id === newMessage.id)) return prev;

      const msg: Message = {
        id: newMessage.id,
        text: newMessage.text,
        senderId: newMessage.senderId,
        isFromCreator: true,
        isAiGenerated: newMessage.isAiGenerated || false,
        createdAt: newMessage.createdAt,
        media: null,
      };

      return {
        ...prev,
        messages: [...prev.messages, msg],
      };
    });
  };

  // Refresh handler
  const handleRefresh = () => {
    fetchConversation();
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Error state
  if (error || !conversationData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-gray-400">{error || "Conversation not found"}</p>
        <button
          onClick={() => router.push("/chatter/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <ChatterWorkspace
      conversationId={conversationId}
      conversationData={conversationData}
      onSendMessage={handleSendMessage}
      onRefresh={handleRefresh}
      className="h-[calc(100vh-4rem)]"
    />
  );
}
