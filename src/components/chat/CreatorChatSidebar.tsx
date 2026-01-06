"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  MapPin,
  Calendar,
  Coins,
  ShoppingBag,
  MessageSquare,
  Brain,
  Sparkles,
  ChevronRight,
  Crown,
  Clock,
  Heart,
  Loader2,
  X,
  Edit3,
  Save,
  Wand2,
  FileText,
  Check,
  AlertCircle,
  UserX,
  Zap,
  Snowflake,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PPVHistoryPanel } from "./PPVHistoryPanel";

interface FanContext {
  fan: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    joinedAt: string;
    lastActive: string | null;
    isOnline: boolean;
  };
  profile: {
    stage: "new" | "engaged" | "vip" | "cooling_off";
    totalSpent: number;
    purchaseCount: number;
    avgOrderValue: number;
    lastPurchase: string | null;
    messagesSent: number;
    fanStatus: "active" | "dropped" | "inactive" | "new";
    fanStatusReason?: string;
  };
  personalInfo: {
    age: number | null;
    job: string | null;
    location: string | null;
    interests: string[];
    relationship: string | null;
    name: string | null;
  };
  memory: {
    facts: string[];
    preferences: {
      contentType?: string;
      priceRange?: string;
      communicationStyle?: string;
    };
  };
  recentPurchases: Array<{
    type: string;
    amount: number;
    date: string;
    description?: string;
  }>;
  ppvStats: {
    totalSent: number;
    totalPurchased: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

interface CreatorChatSidebarProps {
  conversationId: string;
  onClose?: () => void;
  className?: string;
}

const stageBadges = {
  new: {
    label: "New",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Sparkles,
  },
  engaged: {
    label: "Engaged",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Heart,
  },
  vip: {
    label: "VIP",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Crown,
  },
  cooling_off: {
    label: "Cooling Off",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: Clock,
  },
};

export function CreatorChatSidebar({
  conversationId,
  onClose,
  className = "",
}: CreatorChatSidebarProps) {
  const [context, setContext] = useState<FanContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Personal note state
  const [personalNote, setPersonalNote] = useState<string>("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState<string>("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);
  const [noteUpdatedBy, setNoteUpdatedBy] = useState<string | null>(null);

  // Fetch personal note
  const fetchPersonalNote = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/personal-note`);
      if (res.ok) {
        const data = await res.json();
        setPersonalNote(data.personalNote || "");
        setNoteUpdatedAt(data.updatedAt);
        setNoteUpdatedBy(data.updatedBy);
      }
    } catch (err) {
      console.error("Error fetching personal note:", err);
    }
  }, [conversationId]);

  // Save personal note
  const savePersonalNote = async () => {
    if (!conversationId) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/personal-note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalNote: editedNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalNote(data.personalNote || "");
        setNoteUpdatedAt(data.updatedAt);
        setNoteUpdatedBy(data.updatedBy);
        setIsEditingNote(false);
      }
    } catch (err) {
      console.error("Error saving personal note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Generate personal note with AI
  const generatePersonalNote = async () => {
    if (!conversationId) return;
    setIsGeneratingNote(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/personal-note`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalNote(data.personalNote || "");
        setNoteUpdatedAt(data.updatedAt);
        setNoteUpdatedBy("ai");
      }
    } catch (err) {
      console.error("Error generating personal note:", err);
    } finally {
      setIsGeneratingNote(false);
    }
  };

  useEffect(() => {
    const fetchContext = async () => {
      if (!conversationId) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/conversations/${conversationId}/context`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setContext(data);
      } catch (err) {
        console.error("Error fetching fan context:", err);
        setError("Failed to load fan info");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
    fetchPersonalNote();
  }, [conversationId, fetchPersonalNote]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-sm text-gray-500">{error || "No data available"}</p>
      </div>
    );
  }

  const { fan, profile, personalInfo, memory, ppvStats } = context;
  const stageBadge = stageBadges[profile.stage];
  const StageIcon = stageBadge.icon;

  return (
    <div
      className={`h-full flex flex-col bg-[#0a0a0a] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          Fan Context
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">

        {/* Personal Note - Main Section */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Personal Note
            </h5>
            <div className="flex items-center gap-1">
              {!isEditingNote && (
                <>
                  <button
                    onClick={generatePersonalNote}
                    disabled={isGeneratingNote}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                    title="Generate with AI"
                  >
                    {isGeneratingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditedNote(personalNote);
                      setIsEditingNote(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Edit note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                placeholder="Write a note about this fan... (age, location, job, interests, personality, etc.)"
                className="w-full h-32 px-3 py-2 text-sm text-gray-200 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:border-purple-500/50 placeholder:text-gray-600"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePersonalNote}
                  disabled={isSavingNote}
                  className="px-3 py-1.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isSavingNote ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ) : personalNote ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {personalNote}
              </p>
              {noteUpdatedAt && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  {noteUpdatedBy === "ai" && <Wand2 className="w-3 h-3" />}
                  Updated{" "}
                  {formatDistanceToNow(new Date(noteUpdatedAt), { addSuffix: true })}
                  {noteUpdatedBy === "ai" && " by AI"}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">
                No notes yet about this fan
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={generatePersonalNote}
                  disabled={isGeneratingNote}
                  className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isGeneratingNote ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  Generate with AI
                </button>
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Write manually
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Info Tags - Compact view of extracted data */}
        {(personalInfo.age || personalInfo.job || personalInfo.location || personalInfo.relationship || personalInfo.interests.length > 0) && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex flex-wrap gap-1.5">
              {personalInfo.age && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs">
                  <Calendar className="w-3 h-3" />
                  {personalInfo.age} ans
                </span>
              )}
              {personalInfo.location && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs">
                  <MapPin className="w-3 h-3" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.job && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs">
                  <Briefcase className="w-3 h-3" />
                  {personalInfo.job}
                </span>
              )}
              {personalInfo.relationship && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/10 text-pink-300 text-xs">
                  <Heart className="w-3 h-3" />
                  {personalInfo.relationship}
                </span>
              )}
              {personalInfo.interests.slice(0, 3).map((interest, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="p-4 border-b border-white/5">
          <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Stats
          </h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Total Spent</span>
              </div>
              <p className="text-lg font-bold text-white">
                {profile.totalSpent.toLocaleString()}
                <span className="text-xs text-gray-500 ml-1">cr</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Purchases</span>
              </div>
              <p className="text-lg font-bold text-white">
                {profile.purchaseCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Messages</span>
              </div>
              <p className="text-lg font-bold text-white">
                {profile.messagesSent || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                {profile.fanStatus === "dropped" ? (
                  <UserX className="w-4 h-4 text-red-400" />
                ) : profile.fanStatus === "inactive" ? (
                  <Snowflake className="w-4 h-4 text-blue-400" />
                ) : profile.fanStatus === "active" ? (
                  <Zap className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-xs text-gray-400">Status</span>
              </div>
              <p className={`text-sm font-bold ${
                profile.fanStatus === "dropped" ? "text-red-400" :
                profile.fanStatus === "inactive" ? "text-blue-400" :
                profile.fanStatus === "active" ? "text-emerald-400" :
                "text-purple-400"
              }`}>
                {profile.fanStatus === "dropped" ? "Dropped" :
                 profile.fanStatus === "inactive" ? "Inactive" :
                 profile.fanStatus === "active" ? "Active" :
                 "New"}
              </p>
              {profile.fanStatusReason && (
                <p className="text-[10px] text-gray-500 mt-0.5 truncate" title={profile.fanStatusReason}>
                  {profile.fanStatusReason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI Memory */}
        {memory.facts.length > 0 && (
          <div className="p-4 border-b border-white/5">
            <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Memory
            </h5>
            <div className="space-y-2">
              {memory.facts.slice(0, 5).map((fact, i) => (
                <p key={i} className="text-sm text-gray-300">
                  • {fact}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* PPV History */}
        <PPVHistoryPanel conversationId={conversationId} />

        {/* Join Date */}
        <div className="p-4 text-xs text-gray-500">
          <p className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined{" "}
            {fan.joinedAt &&
              formatDistanceToNow(new Date(fan.joinedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
