"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import { Bot, Send, Edit3, RefreshCw, X, Clock, Image as ImageIcon, DollarSign } from "lucide-react";

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
    recentMessages: {
      id: string;
      text: string | null;
      senderId: string;
      createdAt: string;
    }[];
  };
}

interface AiSuggestionCardProps {
  suggestion: AiSuggestion;
  onSend: () => void;
  onEdit: (content: string) => void;
  onReject: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
}

export default function AiSuggestionCard({
  suggestion,
  onSend,
  onEdit,
  onReject,
  onRegenerate,
  isLoading = false,
}: AiSuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.content);
  const [timeLeft, setTimeLeft] = useState("");

  // Calculate time remaining
  useEffect(() => {
    const updateTimeLeft = () => {
      const expiresAt = new Date(suggestion.expiresAt).getTime();
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [suggestion.expiresAt]);

  const handleSaveEdit = () => {
    if (editedContent.trim() !== suggestion.content) {
      onEdit(editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(suggestion.content);
    setIsEditing(false);
  };

  const isExpired = timeLeft === "Expired";
  const mediaTypeLabel = suggestion.mediaDecision === "PPV" ? "PPV" :
                         suggestion.mediaDecision === "FREE" ? "Free" :
                         suggestion.mediaDecision === "TEASE" ? "Tease" : null;

  return (
    <div className={`bg-gray-800 rounded-lg border ${isExpired ? "border-red-500/50 opacity-60" : "border-gray-700"} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">
            {suggestion.personality.name}
          </span>
          {suggestion.conversation.detectedTone && (
            <span className="text-xs px-2 py-0.5 bg-gray-600 rounded text-gray-300">
              {suggestion.conversation.detectedTone}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs ${isExpired ? "text-red-400" : "text-gray-400"}`}>
          <Clock className="w-3 h-3" />
          {timeLeft}
        </div>
      </div>

      {/* Fan info */}
      <div className="px-4 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          {suggestion.conversation.fan?.image ? (
            <NextImage
              src={suggestion.conversation.fan.image}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-xs text-gray-400">?</span>
            </div>
          )}
          <span className="text-sm text-gray-300">
            {suggestion.conversation.fan?.name || "Anonymous"}
          </span>
          <span className="text-xs text-gray-500">
            @{suggestion.conversation.creatorSlug}
          </span>
        </div>

        {/* Recent messages context */}
        {suggestion.conversation.recentMessages.length > 0 && (
          <div className="mt-2 space-y-1">
            {suggestion.conversation.recentMessages.slice(-2).map((msg) => (
              <div
                key={msg.id}
                className={`text-xs px-2 py-1 rounded ${
                  msg.senderId === suggestion.conversation.fan?.id
                    ? "bg-gray-700 text-gray-300"
                    : "bg-pink-500/20 text-pink-200"
                }`}
              >
                {msg.text?.substring(0, 80)}{msg.text && msg.text.length > 80 ? "..." : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestion content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              rows={4}
              placeholder="Edit the AI suggestion..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Save & Send
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-200 text-sm whitespace-pre-wrap">
            {suggestion.editedContent || suggestion.content}
          </p>
        )}

        {/* Media indicator */}
        {mediaTypeLabel && (
          <div className="mt-3 flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              suggestion.mediaDecision === "PPV" ? "bg-yellow-500/20 text-yellow-400" :
              suggestion.mediaDecision === "FREE" ? "bg-green-500/20 text-green-400" :
              "bg-blue-500/20 text-blue-400"
            }`}>
              {suggestion.mediaDecision === "PPV" ? (
                <DollarSign className="w-3 h-3" />
              ) : (
                <ImageIcon className="w-3 h-3" />
              )}
              {mediaTypeLabel} Media
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isExpired && !isEditing && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700/30 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onSend}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
