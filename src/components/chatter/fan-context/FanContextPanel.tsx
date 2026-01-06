"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  DollarSign,
  Calendar,
  Clock,
  Brain,
  ShoppingCart,
  TrendingUp,
  Star,
  Heart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FanContext {
  fan: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    joinedAt: string;
    lastActive: string | null;
  };
  profile: {
    stage: "new" | "engaged" | "vip" | "cooling_off";
    totalSpent: number;
    purchaseCount: number;
    avgOrderValue: number;
    lastPurchase: string | null;
    qualityScore: number;
    engagementScore: number;
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
}

interface FanContextPanelProps {
  conversationId: string;
  className?: string;
}

const STAGE_CONFIG = {
  new: {
    label: "New Fan",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Star,
  },
  engaged: {
    label: "Engaged",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Heart,
  },
  vip: {
    label: "VIP",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Star,
  },
  cooling_off: {
    label: "Cooling Off",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: Clock,
  },
};

export default function FanContextPanel({
  conversationId,
  className,
}: FanContextPanelProps) {
  const [context, setContext] = useState<FanContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (!conversationId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/chatter/conversations/${conversationId}/context`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch fan context");
        }

        const data = await res.json();
        setContext(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [conversationId]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className={cn("text-center py-8 text-gray-400", className)}>
        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Unable to load fan context</p>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[context.profile.stage] || STAGE_CONFIG.new;
  const StageIcon = stageConfig.icon;

  return (
    <div className={cn("flex flex-col h-full overflow-y-auto", className)}>
      {/* Profile header */}
      <div className="p-4 border-b border-[--border]">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[--surface-elevated]">
            {context.fan.image ? (
              <Image
                src={context.fan.image}
                alt={context.fan.name || "Fan"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Name and stage */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {context.fan.name || "Anonymous Fan"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                  stageConfig.color
                )}
              >
                <StageIcon className="w-3 h-3" />
                {stageConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-[--background] rounded-lg p-2">
            <p className="text-xs text-gray-400">Total Spent</p>
            <p className="text-lg font-semibold text-emerald-400">
              ${context.profile.totalSpent.toFixed(0)}
            </p>
          </div>
          <div className="bg-[--background] rounded-lg p-2">
            <p className="text-xs text-gray-400">Purchases</p>
            <p className="text-lg font-semibold text-white">
              {context.profile.purchaseCount}
            </p>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="p-4 border-b border-[--border]">
        <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">
          Engagement
        </h4>
        <div className="space-y-3">
          <ScoreBar
            label="Quality Score"
            value={context.profile.qualityScore}
            color="purple"
          />
          <ScoreBar
            label="Engagement"
            value={context.profile.engagementScore}
            color="blue"
          />
        </div>
      </div>

      {/* Memory / Facts */}
      {context.memory.facts.length > 0 && (
        <div className="p-4 border-b border-[--border]">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-medium text-gray-400 uppercase">
              AI Memory
            </h4>
          </div>
          <ul className="space-y-2">
            {context.memory.facts.map((fact, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-purple-400 mt-0.5">•</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preferences */}
      {Object.keys(context.memory.preferences).length > 0 && (
        <div className="p-4 border-b border-[--border]">
          <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">
            Preferences
          </h4>
          <div className="flex flex-wrap gap-2">
            {context.memory.preferences.contentType && (
              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                Prefers {context.memory.preferences.contentType}
              </span>
            )}
            {context.memory.preferences.priceRange && (
              <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                {context.memory.preferences.priceRange} spender
              </span>
            )}
            {context.memory.preferences.communicationStyle && (
              <span className="px-2 py-1 rounded-full text-xs bg-pink-500/20 text-pink-400">
                {context.memory.preferences.communicationStyle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recent purchases */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-medium text-gray-400 uppercase">
            Recent Purchases
          </h4>
        </div>
        {context.recentPurchases.length === 0 ? (
          <p className="text-sm text-gray-500">No purchases yet</p>
        ) : (
          <div className="space-y-2">
            {context.recentPurchases.slice(0, 5).map((purchase, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[--border] last:border-0"
              >
                <div>
                  <p className="text-sm text-white">{purchase.type}</p>
                  <p className="text-xs text-gray-500">
                    {purchase.date ? formatDistanceToNow(new Date(purchase.date), {
                      addSuffix: true,
                    }) : "Unknown date"}
                  </p>
                </div>
                <span className="text-sm font-medium text-emerald-400">
                  ${(purchase.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="p-4 border-t border-[--border] text-xs text-gray-500">
        {context.fan.joinedAt && (
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            Joined{" "}
            {formatDistanceToNow(new Date(context.fan.joinedAt), {
              addSuffix: true,
            })}
          </div>
        )}
        {context.fan.lastActive && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last active{" "}
            {formatDistanceToNow(new Date(context.fan.lastActive), {
              addSuffix: true,
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Score bar component
function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "blue" | "emerald";
}) {
  const colorClass = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-medium text-white">{value}%</span>
      </div>
      <div className="h-1.5 bg-[--background] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
