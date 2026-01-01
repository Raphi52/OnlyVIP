"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, User, Settings, Send, Paperclip, Image, Sparkles } from "lucide-react";
import AiSuggestionCard from "./AiSuggestionCard";

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  receiverId: string;
  isAiGenerated: boolean;
  aiPersonalityId: string | null;
  chatterId: string | null;
  isPPV: boolean;
  ppvPrice: number | null;
  isRead: boolean;
  media: {
    id: string;
    type: string;
    url: string;
    previewUrl: string | null;
  }[];
  createdAt: string;
}

interface Conversation {
  id: string;
  creatorSlug: string;
  aiMode: "auto" | "assisted" | "disabled";
  detectedTone: string | null;
  toneConfidence: number | null;
  assignedChatterId: string | null;
  aiPersonality: {
    id: string;
    name: string;
  } | null;
  fan: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface AiSuggestion {
  id: string;
  content: string;
  mediaDecision: string | null;
  mediaId: string | null;
  status: string;
  editedContent: string | null;
  expiresAt: string;
  createdAt: string;
  personality: {
    id: string;
    name: string;
  };
  conversation: {
    id: string;
    creatorSlug: string;
    detectedTone: string | null;
    toneConfidence: number | null;
    fan: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
    recentMessages: any[];
  };
}

interface ChatterChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  creatorUserId: string;
  onSendMessage: (text: string) => void;
  onModeChange: (mode: "auto" | "assisted" | "disabled") => void;
  isLoading?: boolean;
}

export default function ChatterChatWindow({
  conversation,
  messages,
  creatorUserId,
  onSendMessage,
  onModeChange,
  isLoading = false,
}: ChatterChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch suggestions for this conversation
  useEffect(() => {
    if (conversation.aiMode === "assisted") {
      fetchSuggestions();
      const interval = setInterval(fetchSuggestions, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [conversation.id, conversation.aiMode]);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await fetch(
        `/api/chatter/suggestions?conversationId=${conversation.id}&status=pending`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSuggestionAction = async (
    suggestionId: string,
    action: "send" | "edit" | "reject" | "regenerate",
    editedContent?: string
  ) => {
    setActionLoading(suggestionId);
    try {
      const res = await fetch("/api/chatter/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, action, editedContent }),
      });

      if (res.ok) {
        // Remove from local state
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
        // Refresh suggestions
        fetchSuggestions();
      }
    } catch (error) {
      console.error("Failed to process suggestion:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getModeLabel = () => {
    switch (conversation.aiMode) {
      case "auto":
        return { label: "AI Auto", color: "text-green-400", bg: "bg-green-500/20" };
      case "assisted":
        return { label: "AI Assisted", color: "text-purple-400", bg: "bg-purple-500/20" };
      case "disabled":
        return { label: "Manual", color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  const modeInfo = getModeLabel();

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {conversation.fan.image ? (
            <img
              src={conversation.fan.image}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-white">
              {conversation.fan.name || "Anonymous"}
            </h3>
            <p className="text-xs text-gray-400">@{conversation.creatorSlug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Mode indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${modeInfo.bg}`}>
            {conversation.aiMode !== "disabled" && (
              <Sparkles className={`w-3.5 h-3.5 ${modeInfo.color}`} />
            )}
            <span className={`text-xs font-medium ${modeInfo.color}`}>
              {modeInfo.label}
            </span>
          </div>

          {/* Tone indicator */}
          {conversation.detectedTone && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
              Tone: {conversation.detectedTone}
              {conversation.toneConfidence && (
                <span className="text-gray-500">
                  ({Math.round(conversation.toneConfidence * 100)}%)
                </span>
              )}
            </div>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-800/80 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">AI Mode:</span>
            <div className="flex gap-2">
              {(["auto", "assisted", "disabled"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    conversation.aiMode === mode
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {mode === "auto" ? "Auto" : mode === "assisted" ? "Assisted" : "Manual"}
                </button>
              ))}
            </div>
          </div>
          {conversation.aiPersonality && (
            <div className="mt-2 text-xs text-gray-500">
              Current personality: <span className="text-purple-400">{conversation.aiPersonality.name}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions (only in assisted mode) */}
      {conversation.aiMode === "assisted" && suggestions.length > 0 && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-3 max-h-[300px] overflow-y-auto">
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <Bot className="w-4 h-4" />
            <span>AI Suggestions ({suggestions.length})</span>
          </div>
          {suggestions.map((suggestion) => (
            <AiSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onSend={() => handleSuggestionAction(suggestion.id, "send")}
              onEdit={(content) => handleSuggestionAction(suggestion.id, "edit", content)}
              onReject={() => handleSuggestionAction(suggestion.id, "reject")}
              onRegenerate={() => handleSuggestionAction(suggestion.id, "regenerate")}
              isLoading={actionLoading === suggestion.id}
            />
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isFromCreator = message.senderId === creatorUserId;
          const isAi = message.isAiGenerated || !!message.aiPersonalityId;

          return (
            <div
              key={message.id}
              className={`flex ${isFromCreator ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isFromCreator
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                {/* AI Badge (only visible to chatter) */}
                {isFromCreator && isAi && (
                  <div className="flex items-center gap-1 mb-1 opacity-60">
                    <Bot className="w-3 h-3" />
                    <span className="text-[10px]">AI</span>
                  </div>
                )}

                {/* Message content */}
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                {/* Media */}
                {message.media.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.media.map((m) => (
                      <div key={m.id} className="relative">
                        {message.isPPV && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded">
                            PPV ${message.ppvPrice}
                          </div>
                        )}
                        <img
                          src={m.previewUrl || m.url}
                          alt=""
                          className={`rounded-lg max-w-full ${message.isPPV ? "blur-xl" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] mt-1 ${isFromCreator ? "text-white/60" : "text-gray-500"}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Image className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
