"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Send, Edit3, RefreshCw, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CreditIndicator from "./CreditIndicator";
import AiToneSelector, { type AiTone } from "./AiToneSelector";

interface AiSuggestion {
  id: string;
  content: string;
  mediaDecision: string | null;
  mediaId: string | null;
  expiresAt: string;
  personality: {
    id: string;
    name: string;
  };
}

interface BillingInfo {
  willCharge: boolean;
  usingCustomKey: boolean;
  balance: number;
  costPerSuggestion: number;
}

interface MatchedScript {
  id: string;
  name: string;
  confidence: number;
  intent: string | null;
}

interface AiCopilotPanelProps {
  conversationId: string;
  creatorSlug: string;
  onSuggestionSelect: (text: string) => void;
  onClose: () => void;
  className?: string;
}

export default function AiCopilotPanel({
  conversationId,
  creatorSlug,
  onSuggestionSelect,
  onClose,
  className,
}: AiCopilotPanelProps) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [matchedScript, setMatchedScript] = useState<MatchedScript | null>(null);
  const [selectedTone, setSelectedTone] = useState<AiTone>("flirty");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  // Fetch billing status on mount
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch(
          `/api/chatter/billing/status?creatorSlug=${encodeURIComponent(creatorSlug)}`
        );
        if (res.ok) {
          const data = await res.json();
          setBilling({
            willCharge: data.shouldCharge,
            usingCustomKey: data.usingCustomKey,
            balance: data.balance,
            costPerSuggestion: data.costPerSuggestion || 1,
          });
        }
      } catch (err) {
        console.error("Error fetching billing:", err);
      }
    };
    fetchBilling();
  }, [creatorSlug]);

  // Generate new suggestion
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/chatter/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          tone: selectedTone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError("Insufficient credits. Please contact your agency.");
        } else {
          setError(data.error || "Failed to generate suggestion");
        }
        return;
      }

      setSuggestions((prev) => [data.suggestion, ...prev.slice(0, 4)]);
      setBilling(data.billing);
      setMatchedScript(data.matchedScript);
    } catch (err) {
      setError("Failed to generate suggestion. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [conversationId, selectedTone, isGenerating]);

  // Send suggestion
  const handleSend = async (suggestion: AiSuggestion) => {
    try {
      const res = await fetch("/api/chatter/ai-suggest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          action: "send",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError("Insufficient credits");
        } else {
          setError(data.error || "Failed to send");
        }
        return;
      }

      // Remove from list and notify parent
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      onSuggestionSelect(suggestion.content);

      // Update billing
      if (data.newBalance !== undefined && billing) {
        setBilling({ ...billing, balance: data.newBalance });
      }
    } catch (err) {
      setError("Failed to send message");
    }
  };

  // Edit and send
  const handleEdit = async (suggestionId: string) => {
    if (!editedContent.trim()) return;

    try {
      const res = await fetch("/api/chatter/ai-suggest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          action: "edit",
          editedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }

      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      onSuggestionSelect(editedContent);
      setEditingId(null);
      setEditedContent("");

      if (data.newBalance !== undefined && billing) {
        setBilling({ ...billing, balance: data.newBalance });
      }
    } catch (err) {
      setError("Failed to send message");
    }
  };

  // Reject suggestion
  const handleReject = async (suggestionId: string) => {
    try {
      await fetch("/api/chatter/ai-suggest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId,
          action: "reject",
        }),
      });

      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    } catch (err) {
      console.error("Error rejecting:", err);
    }
  };

  // Start editing
  const startEdit = (suggestion: AiSuggestion) => {
    setEditingId(suggestion.id);
    setEditedContent(suggestion.content);
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 w-96 max-h-[60vh] rounded-xl",
        "bg-[--surface-elevated] border border-[--border] shadow-2xl",
        "flex flex-col overflow-hidden z-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">AI Copilot</span>
        </div>
        <div className="flex items-center gap-2">
          {billing && (
            <CreditIndicator
              usingCustomKey={billing.usingCustomKey}
              balance={billing.balance}
              variant="compact"
            />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tone selector */}
      <div className="px-4 py-3 border-b border-[--border]">
        <p className="text-xs text-gray-400 mb-2">Response tone</p>
        <AiToneSelector
          value={selectedTone}
          onChange={setSelectedTone}
          disabled={isGenerating}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Matched script indicator */}
      {matchedScript && (
        <div className="px-4 py-2 bg-purple-500/10 border-b border-[--border]">
          <p className="text-xs text-purple-400">
            <span className="font-medium">Script matched:</span> {matchedScript.name}
            <span className="text-purple-300/60 ml-1">
              ({Math.round(matchedScript.confidence * 100)}% confidence)
            </span>
          </p>
        </div>
      )}

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {suggestions.length === 0 && !isGenerating && (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click generate to get AI suggestions</p>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            isEditing={editingId === suggestion.id}
            editedContent={editedContent}
            onEditChange={setEditedContent}
            onSend={() => handleSend(suggestion)}
            onStartEdit={() => startEdit(suggestion)}
            onConfirmEdit={() => handleEdit(suggestion.id)}
            onCancelEdit={() => {
              setEditingId(null);
              setEditedContent("");
            }}
            onReject={() => handleReject(suggestion.id)}
            onInsert={() => onSuggestionSelect(suggestion.content)}
          />
        ))}
      </div>

      {/* Generate button */}
      <div className="px-4 py-3 border-t border-[--border]">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !!(billing && !billing.usingCustomKey && billing.balance < billing.costPerSuggestion)}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
            "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium",
            "hover:from-purple-500 hover:to-pink-500 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Suggestion
            </>
          )}
        </button>
        {billing && !billing.usingCustomKey && (
          <p className="text-xs text-center text-gray-500 mt-2">
            {billing.costPerSuggestion} credit will be charged when sent
          </p>
        )}
      </div>
    </div>
  );
}

// Individual suggestion card
function SuggestionCard({
  suggestion,
  isEditing,
  editedContent,
  onEditChange,
  onSend,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onReject,
  onInsert,
}: {
  suggestion: AiSuggestion;
  isEditing: boolean;
  editedContent: string;
  onEditChange: (content: string) => void;
  onSend: () => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onReject: () => void;
  onInsert: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  // Expiration countdown
  useEffect(() => {
    const updateTime = () => {
      const expires = new Date(suggestion.expiresAt).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [suggestion.expiresAt]);

  return (
    <div className="bg-[--background] rounded-lg border border-[--border] overflow-hidden">
      {/* Content */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full p-2 bg-[--surface-elevated] border border-[--border] rounded text-sm text-white resize-none"
            rows={4}
            autoFocus
          />
        ) : (
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            {suggestion.content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-[--surface-elevated] border-t border-[--border]">
        {/* Time left */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {timeLeft}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={onCancelEdit}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onConfirmEdit}
                className="p-1.5 rounded bg-purple-600 text-white hover:bg-purple-500"
                title="Send edited"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReject}
                className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onStartEdit}
                className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onInsert}
                className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10"
                title="Insert into input"
              >
                Insert
              </button>
              <button
                onClick={onSend}
                className="p-1.5 rounded bg-purple-600 text-white hover:bg-purple-500"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
