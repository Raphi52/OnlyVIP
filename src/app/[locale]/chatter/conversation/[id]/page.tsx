"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Loader2,
  User,
  Lock,
  DollarSign,
  Check,
  Copy,
  FileText,
} from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import Pusher from "pusher-js";

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  receiverId: string;
  isFromCreator: boolean;
  sentByChatter: boolean;
  isPPV: boolean;
  ppvPrice: number | null;
  isUnlocked: boolean;
  media: Array<{
    id: string;
    type: string;
    url: string;
    previewUrl: string | null;
  }>;
  createdAt: string;
  chatterName?: string;
}

interface ConversationInfo {
  id: string;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorUserId: string;
  fan: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
}

export default function ChatterConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showScripts, setShowScripts] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chatter/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMessages(data.messages || []);
      setConversation(data.conversation);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Pusher for real-time
  useEffect(() => {
    if (!conversationId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (data: any) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);

  // Fetch scripts
  const fetchScripts = useCallback(async () => {
    if (scripts.length > 0) return; // Already loaded
    setScriptsLoading(true);
    try {
      const res = await fetch("/api/chatter/scripts?limit=20");
      const data = await res.json();
      setScripts(data.scripts || []);
    } catch (err) {
      console.error("Failed to fetch scripts:", err);
    } finally {
      setScriptsLoading(false);
    }
  }, [scripts.length]);

  // Send message
  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chatter/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Use script
  const handleUseScript = (script: Script) => {
    setMessageText(script.content);
    setShowScripts(false);
    inputRef.current?.focus();

    // Track usage
    fetch("/api/chatter/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId: script.id }),
    }).catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
        <button
          onClick={() => router.push("/chatter/dashboard")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            {conversation?.fan?.avatar ? (
              <img
                src={conversation.fan.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">
              {conversation?.fan?.name || "Fan"}
            </p>
            <p className="text-xs text-gray-500">
              via @{conversation?.creatorSlug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation?.creatorAvatar && (
            <img
              src={conversation.creatorAvatar}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-purple-500"
            />
          )}
          <span className="text-sm text-gray-400">
            Chatting as <span className="text-purple-400">{conversation?.creatorName}</span>
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isFromCreator ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-3 ${
                  msg.isFromCreator
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                {/* PPV Badge */}
                {msg.isPPV && (
                  <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                    <Lock className="w-3 h-3" />
                    PPV {msg.ppvPrice} credits
                  </div>
                )}

                {/* Media */}
                {msg.media.length > 0 && (
                  <div className="mb-2 grid gap-2">
                    {msg.media.map((m) => (
                      <div key={m.id} className="rounded-lg overflow-hidden">
                        {m.type === "IMAGE" || m.type === "image" ? (
                          <img
                            src={m.url}
                            alt=""
                            className="max-h-64 object-cover"
                          />
                        ) : (
                          <video
                            src={m.url}
                            controls
                            className="max-h-64"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text */}
                {msg.text && (
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                )}

                {/* Meta */}
                <div
                  className={`flex items-center gap-2 mt-1 text-xs ${
                    msg.isFromCreator ? "text-white/60" : "text-gray-500"
                  }`}
                >
                  <span>
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {msg.sentByChatter && (
                    <span className="text-purple-300">• You</span>
                  )}
                  {msg.chatterName && !msg.sentByChatter && (
                    <span>• {msg.chatterName}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scripts Panel */}
      <AnimatePresence>
        {showScripts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Quick Scripts</span>
                <button
                  onClick={() => setShowScripts(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              {scriptsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                </div>
              ) : scripts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No scripts available
                </p>
              ) : (
                <div className="grid gap-2">
                  {scripts.slice(0, 6).map((script) => (
                    <button
                      key={script.id}
                      onClick={() => handleUseScript(script)}
                      className="text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {script.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {script.content}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowScripts(!showScripts);
              if (!showScripts) fetchScripts();
            }}
            className={`p-2.5 rounded-lg transition-colors ${
              showScripts
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
            title="Quick Scripts"
          >
            <FileText className="w-5 h-5" />
          </button>

          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />

          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            variant="premium"
            className="px-4"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
