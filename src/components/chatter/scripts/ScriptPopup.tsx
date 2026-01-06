"use client";

import { useState, useEffect } from "react";
import { X, Send, Copy, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchedScript {
  id: string;
  name: string;
  content: string;
  category: string;
  intent: string | null;
  confidence: number;
  hasNextScript: boolean;
  suggestedPrice: number | null;
}

interface ScriptPopupProps {
  conversationId: string;
  message: string;
  fanName?: string;
  ppvPrice?: number;
  onInsert: (content: string, scriptId: string) => void;
  onSend: (content: string, scriptId: string) => void;
  onDismiss: () => void;
  className?: string;
}

export default function ScriptPopup({
  conversationId,
  message,
  fanName,
  ppvPrice,
  onInsert,
  onSend,
  onDismiss,
  className,
}: ScriptPopupProps) {
  const [matchedScript, setMatchedScript] = useState<MatchedScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Fetch matching script
  useEffect(() => {
    if (!message || dismissed) {
      setMatchedScript(null);
      setLoading(false);
      return;
    }

    const fetchMatch = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/chatter/scripts/match?conversationId=${encodeURIComponent(conversationId)}&message=${encodeURIComponent(message)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.script && data.confidence > 0.5) {
            setMatchedScript({
              ...data.script,
              confidence: data.confidence,
            });
          } else {
            setMatchedScript(null);
          }
        }
      } catch (err) {
        console.error("Error fetching script match:", err);
        setMatchedScript(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchMatch, 300);
    return () => clearTimeout(timer);
  }, [conversationId, message, dismissed]);

  // Parse variables
  const parseContent = (content: string) => {
    return content
      .replace(/\{\{fanName\}\}/g, fanName || "babe")
      .replace(/\{\{ppvPrice\}\}/g, String(ppvPrice || matchedScript?.suggestedPrice || 15))
      .replace(/\{\{creatorName\}\}/g, "me");
  };

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(true);
    setMatchedScript(null);
    onDismiss();
  };

  // Reset dismissed state when message changes significantly
  useEffect(() => {
    setDismissed(false);
  }, [message]);

  if (loading || !matchedScript || dismissed) {
    return null;
  }

  const parsedContent = parseContent(matchedScript.content);
  const confidencePercent = Math.round(matchedScript.confidence * 100);

  const categoryIcon = {
    GREETING: "👋",
    PPV_PITCH: "💎",
    FOLLOW_UP: "💬",
    CLOSING: "🎯",
    CUSTOM: "✨",
  }[matchedScript.category] || "📝";

  return (
    <div
      className={cn(
        "absolute bottom-full left-0 right-0 mb-2 mx-4",
        "bg-[--surface-elevated] border border-purple-500/30 rounded-xl shadow-lg",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">
            Script Suggestion
          </span>
          <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
            {confidencePercent}% match
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Script name and category */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{categoryIcon}</span>
          <span className="text-sm font-medium text-gray-300">
            {matchedScript.name}
          </span>
        </div>

        {/* Preview with variables filled */}
        <div className="bg-[--background] rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            {parsedContent}
          </p>
        </div>

        {/* Flow indicator */}
        {matchedScript.hasNextScript && (
          <div className="flex items-center gap-1 text-xs text-purple-400 mb-3">
            <ArrowRight className="w-3 h-3" />
            <span>Has follow-up scripts configured</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onInsert(parsedContent, matchedScript.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[--background] border border-[--border] text-sm text-gray-300 hover:bg-[--surface-elevated] hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
            Insert
          </button>
          <button
            onClick={() => onSend(parsedContent, matchedScript.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to use script popup functionality
export function useScriptPopup(conversationId: string) {
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    // Show popup if message looks like it could use a script response
    setShowPopup(newMessage.length > 10);
  };

  const dismissPopup = () => {
    setShowPopup(false);
  };

  return {
    message,
    showPopup,
    setMessage: handleMessageChange,
    dismissPopup,
  };
}
