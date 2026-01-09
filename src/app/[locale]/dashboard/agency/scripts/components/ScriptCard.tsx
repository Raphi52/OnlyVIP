"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Settings,
  Star,
  Trash2,
  MessageSquare,
  DollarSign,
  Image,
  Code,
  ArrowRight,
  Clock,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ScriptMedia {
  id: string;
  media: {
    id: string;
    contentUrl: string;
    type: string;
    thumbnailUrl: string | null;
  };
}

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
  intent: string | null;
  fanStage: string | null;
  language: string;
  suggestedPrice: number | null;
  isFreeTease: boolean;
  hasVariables: boolean;
  mediaItems: ScriptMedia[];
  nextScriptOnSuccess: string | null;
  nextScriptOnReject: string | null;
  usageCount: number;
  conversionRate: number;
  revenueGenerated: number;
  isFavorite: boolean;
  createdAt: string;
}

interface ScriptCardProps {
  script: Script;
  onCopy: (script: Script) => void;
  onToggleFavorite: (script: Script) => void;
  onDelete: (script: Script) => void;
  isCopied: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (scriptId: string) => void;
}

const INTENT_COLORS: Record<string, { color: string; bg: string }> = {
  GREETING: { color: "text-blue-400", bg: "bg-blue-500/20" },
  PPV_PITCH: { color: "text-emerald-400", bg: "bg-emerald-500/20" },
  PPV_FOLLOWUP: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  OBJECTION_PRICE: { color: "text-red-400", bg: "bg-red-500/20" },
  OBJECTION_TIME: { color: "text-orange-400", bg: "bg-orange-500/20" },
  OBJECTION_TRUST: { color: "text-purple-400", bg: "bg-purple-500/20" },
  CLOSING: { color: "text-green-400", bg: "bg-green-500/20" },
  REENGAGEMENT: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  UPSELL: { color: "text-amber-400", bg: "bg-amber-500/20" },
  THANK_YOU: { color: "text-pink-400", bg: "bg-pink-500/20" },
  SEXTING_START: { color: "text-rose-400", bg: "bg-rose-500/20" },
  CUSTOM: { color: "text-gray-400", bg: "bg-gray-500/20" },
};

const STAGE_LABELS: Record<string, string> = {
  new: "New Fan",
  engaged: "Engaged",
  vip: "VIP",
  cooling_off: "Cooling Off",
  any: "Any Stage",
};

export default function ScriptCard({
  script,
  onCopy,
  onToggleFavorite,
  onDelete,
  isCopied,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: ScriptCardProps) {
  const params = useParams();
  const locale = params.locale as string;

  const intentStyle = INTENT_COLORS[script.intent || "CUSTOM"] || INTENT_COLORS.CUSTOM;
  const hasFlow = script.nextScriptOnSuccess || script.nextScriptOnReject;

  const handleCardClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(script.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div
        onClick={selectionMode ? handleCardClick : undefined}
        className={cn(
          "relative bg-white/5 border rounded-2xl p-3 sm:p-4 transition-all",
          selectionMode ? "cursor-pointer" : "",
          isSelected
            ? "border-red-500/50 bg-red-500/10"
            : "border-white/10 hover:bg-white/[0.07]"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Title with favorite star */}
            <div className="flex items-center gap-2 mb-2">
              {/* Selection checkbox */}
              {selectionMode && (
                <div className={cn(
                  "w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-red-500 border-red-500"
                    : "border-white/30 bg-white/5"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                {script.name}
              </h3>
              {script.isFavorite && (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
              )}
            </div>

            {/* Tags row - scrollable on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
              {/* Intent badge */}
              {script.intent && (
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                  intentStyle.bg, intentStyle.color
                )}>
                  {script.intent.replace(/_/g, " ")}
                </span>
              )}

              {/* Fan stage */}
              {script.fanStage && script.fanStage !== "any" && (
                <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300 flex-shrink-0">
                  {STAGE_LABELS[script.fanStage] || script.fanStage}
                </span>
              )}

              {/* Price badge */}
              {script.suggestedPrice && (
                <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 flex items-center gap-1 flex-shrink-0">
                  <DollarSign className="w-3 h-3" />
                  {script.suggestedPrice}
                </span>
              )}

              {/* Free tease */}
              {script.isFreeTease && (
                <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 flex-shrink-0">
                  Free
                </span>
              )}

              {/* Has variables */}
              {script.hasVariables && (
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 flex-shrink-0">
                  <Code className="w-3 h-3" />
                </span>
              )}

              {/* Has media */}
              {script.mediaItems.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs bg-pink-500/20 text-pink-400 flex items-center gap-1 flex-shrink-0">
                  <Image className="w-3 h-3" />
                  {script.mediaItems.length}
                </span>
              )}

              {/* Has flow */}
              {hasFlow && (
                <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 flex items-center gap-1 flex-shrink-0">
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>

          {/* Quick actions - smaller on mobile, hidden in selection mode */}
          {!selectionMode && (
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <button
                onClick={() => onToggleFavorite(script)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors",
                  script.isFavorite
                    ? "text-yellow-400 bg-yellow-500/10"
                    : "text-gray-400 bg-white/5 hover:bg-white/10"
                )}
              >
                <Star className={cn("w-4 h-4", script.isFavorite && "fill-current")} />
              </button>
              <Link
                href={`/${locale}/dashboard/agency/scripts/${script.id}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/dashboard/agency/scripts/${script.id}/edit`}
                className="hidden sm:flex w-9 h-9 rounded-xl bg-white/5 text-gray-400 items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
          {script.content}
        </p>

        {/* Media thumbnails */}
        {script.mediaItems.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {script.mediaItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5"
              >
                <img
                  src={item.media.thumbnailUrl || item.media.contentUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {script.mediaItems.length > 4 && (
              <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-white/10 flex items-center justify-center text-sm text-gray-400">
                +{script.mediaItems.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 min-w-0 overflow-hidden">
            <span className="flex items-center gap-1 flex-shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
              {script.usageCount}
            </span>
            {script.conversionRate > 0 && (
              <span className="text-emerald-400 hidden sm:inline">
                {script.conversionRate.toFixed(1)}%
              </span>
            )}
            {script.revenueGenerated > 0 && (
              <span className="text-emerald-400 font-medium flex-shrink-0">
                ${script.revenueGenerated.toFixed(0)}
              </span>
            )}
          </div>

          {/* Copy button - hidden in selection mode */}
          {!selectionMode && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => onDelete(script)}
                className="h-8 sm:h-9 w-8 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onCopy(script)}
                className={cn(
                  "h-8 sm:h-9 px-3 sm:px-4 rounded-lg sm:rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
                  isCopied
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                )}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
