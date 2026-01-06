"use client";

import { cn } from "@/lib/utils";
import {
  MessageSquare,
  DollarSign,
  Clock,
  AlertTriangle,
  Heart,
  Zap,
  Gift,
  ShoppingCart,
  RotateCcw,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Tag,
  Flame,
} from "lucide-react";

interface IntentCount {
  value: string | null;
  label: string;
  count: number;
}

interface IntentSidebarProps {
  intents: IntentCount[];
  selectedIntent: string | null;
  onSelectIntent: (intent: string | null) => void;
  totalCount: number;
}

const INTENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  GREETING: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/20" },
  PPV_PITCH: { icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  PPV_FOLLOWUP: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  OBJECTION_PRICE: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/20" },
  OBJECTION_TIME: { icon: Clock, color: "text-orange-400", bg: "bg-orange-500/20" },
  OBJECTION_TRUST: { icon: HelpCircle, color: "text-purple-400", bg: "bg-purple-500/20" },
  CLOSING: { icon: ShoppingCart, color: "text-green-400", bg: "bg-green-500/20" },
  REENGAGEMENT: { icon: RotateCcw, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  UPSELL: { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/20" },
  THANK_YOU: { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/20" },
  SEXTING_START: { icon: Flame, color: "text-rose-400", bg: "bg-rose-500/20" },
  SEXTING_CONTINUE: { icon: Flame, color: "text-rose-400", bg: "bg-rose-500/20" },
  CUSTOM_REQUEST: { icon: Gift, color: "text-violet-400", bg: "bg-violet-500/20" },
  FLASH_SALE: { icon: Tag, color: "text-fuchsia-400", bg: "bg-fuchsia-500/20" },
  CUSTOM: { icon: Sparkles, color: "text-gray-400", bg: "bg-gray-500/20" },
};

export default function IntentSidebar({
  intents,
  selectedIntent,
  onSelectIntent,
  totalCount,
}: IntentSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 hidden lg:block">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-24">
        <h3 className="text-sm font-semibold text-white mb-3">Filter by Intent</h3>

        <div className="space-y-1">
          {/* All scripts */}
          <button
            onClick={() => onSelectIntent(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all",
              selectedIntent === null
                ? "bg-purple-500/20 text-purple-400"
                : "text-gray-400 hover:bg-white/5"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="flex-1 text-left">All Scripts</span>
            <span className="text-xs text-gray-500">{totalCount}</span>
          </button>

          {/* Intent list */}
          {intents.map((intent) => {
            const config = INTENT_CONFIG[intent.value || "CUSTOM"] || INTENT_CONFIG.CUSTOM;
            const Icon = config.icon;

            return (
              <button
                key={intent.value}
                onClick={() => onSelectIntent(intent.value)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all",
                  selectedIntent === intent.value
                    ? `${config.bg} ${config.color}`
                    : "text-gray-400 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left truncate">{intent.label}</span>
                <span className="text-xs text-gray-500">{intent.count}</span>
              </button>
            );
          })}
        </div>

        {/* Intent legend */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Intent Types</h4>
          <div className="space-y-1 text-xs text-gray-500">
            <p><span className="text-blue-400">GREETING</span> - Welcome messages</p>
            <p><span className="text-emerald-400">PPV_PITCH</span> - Sell content</p>
            <p><span className="text-red-400">OBJECTION_*</span> - Handle objections</p>
            <p><span className="text-green-400">CLOSING</span> - Close the sale</p>
            <p><span className="text-cyan-400">REENGAGEMENT</span> - Win back fans</p>
          </div>
        </div>
      </div>
    </div>
  );
}
