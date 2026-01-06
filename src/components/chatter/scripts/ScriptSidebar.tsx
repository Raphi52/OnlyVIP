"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Star,
  Copy,
  Check,
  FileText,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
  intent: string | null;
  conversionRate: number;
  usageCount: number;
  hasVariables: boolean;
}

interface ScriptSidebarProps {
  creatorSlug: string;
  currentIntent?: string | null;
  fanName?: string;
  ppvPrice?: number;
  onSelectScript: (content: string, scriptId: string) => void;
  className?: string;
}

const CATEGORIES = [
  { value: "all", label: "All", icon: "📋" },
  { value: "GREETING", label: "Greeting", icon: "👋" },
  { value: "PPV_PITCH", label: "PPV Pitch", icon: "💎" },
  { value: "FOLLOW_UP", label: "Follow Up", icon: "💬" },
  { value: "CLOSING", label: "Closing", icon: "🎯" },
  { value: "CUSTOM", label: "Custom", icon: "✨" },
];

export default function ScriptSidebar({
  creatorSlug,
  currentIntent,
  fanName,
  ppvPrice,
  onSelectScript,
  className,
}: ScriptSidebarProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch scripts
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/chatter/scripts?creatorSlug=${encodeURIComponent(creatorSlug)}&limit=50`
        );
        if (res.ok) {
          const data = await res.json();
          setScripts(data.scripts || []);
        }
      } catch (err) {
        console.error("Error fetching scripts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, [creatorSlug]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/chatter/scripts/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavorites(new Set(data.favoriteIds || []));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    fetchFavorites();
  }, []);

  // Filter scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      // Category filter
      if (category !== "all" && script.category !== category) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          script.name.toLowerCase().includes(searchLower) ||
          script.content.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [scripts, category, search]);

  // Scripts matching current intent
  const suggestedScripts = useMemo(() => {
    if (!currentIntent) return [];
    return scripts
      .filter(
        (s) =>
          s.intent === currentIntent ||
          s.category === currentIntent.split("_")[0]
      )
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 3);
  }, [scripts, currentIntent]);

  // Parse variables in script content
  const parseVariables = (content: string) => {
    return content
      .replace(/\{\{fanName\}\}/g, fanName || "babe")
      .replace(/\{\{ppvPrice\}\}/g, String(ppvPrice || 15))
      .replace(/\{\{creatorName\}\}/g, "me");
  };

  // Handle copy
  const handleCopy = async (script: Script) => {
    const parsedContent = parseVariables(script.content);

    // Track usage
    try {
      await fetch("/api/chatter/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.id, action: "copied" }),
      });
    } catch (err) {
      // Ignore tracking errors
    }

    onSelectScript(parsedContent, script.id);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle favorite
  const toggleFavorite = async (scriptId: string) => {
    const isFavorite = favorites.has(scriptId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(scriptId);
      } else {
        next.add(scriptId);
      }
      return next;
    });

    try {
      await fetch("/api/chatter/scripts/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, action: isFavorite ? "remove" : "add" }),
      });
    } catch (err) {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(scriptId);
        } else {
          next.delete(scriptId);
        }
        return next;
      });
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search */}
      <div className="p-3 border-b border-[--border]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search scripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[--background] border border-[--border] text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-[--border]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
              category === cat.value
                ? "bg-purple-600 text-white"
                : "bg-[--background] text-gray-400 hover:bg-[--surface-elevated] hover:text-white"
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Suggested scripts (if intent detected) */}
      {suggestedScripts.length > 0 && (
        <div className="px-3 py-2 border-b border-[--border] bg-purple-500/5">
          <div className="flex items-center gap-1 text-xs text-purple-400 mb-2">
            <Sparkles className="w-3 h-3" />
            <span className="font-medium">Suggested for current message</span>
          </div>
          <div className="space-y-2">
            {suggestedScripts.map((script) => (
              <ScriptCard
                key={`suggested-${script.id}`}
                script={script}
                isFavorite={favorites.has(script.id)}
                isCopied={copiedId === script.id}
                onCopy={() => handleCopy(script)}
                onToggleFavorite={() => toggleFavorite(script.id)}
                parseVariables={parseVariables}
                compact
                highlighted
              />
            ))}
          </div>
        </div>
      )}

      {/* Scripts list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scripts found</p>
          </div>
        ) : (
          filteredScripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              isFavorite={favorites.has(script.id)}
              isCopied={copiedId === script.id}
              onCopy={() => handleCopy(script)}
              onToggleFavorite={() => toggleFavorite(script.id)}
              parseVariables={parseVariables}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Individual script card
function ScriptCard({
  script,
  isFavorite,
  isCopied,
  onCopy,
  onToggleFavorite,
  parseVariables,
  compact = false,
  highlighted = false,
}: {
  script: Script;
  isFavorite: boolean;
  isCopied: boolean;
  onCopy: () => void;
  onToggleFavorite: () => void;
  parseVariables: (content: string) => string;
  compact?: boolean;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const categoryColor = {
    GREETING: "bg-blue-500/20 text-blue-400",
    PPV_PITCH: "bg-emerald-500/20 text-emerald-400",
    FOLLOW_UP: "bg-yellow-500/20 text-yellow-400",
    CLOSING: "bg-purple-500/20 text-purple-400",
    CUSTOM: "bg-pink-500/20 text-pink-400",
  }[script.category] || "bg-gray-500/20 text-gray-400";

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        highlighted
          ? "bg-purple-500/10 border-purple-500/30"
          : "bg-[--background] border-[--border]",
        expanded && "ring-1 ring-purple-500/50"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={() => !compact && setExpanded(!expanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "p-1 rounded transition-colors",
            isFavorite
              ? "text-yellow-400"
              : "text-gray-500 hover:text-yellow-400"
          )}
        >
          <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {script.name}
            </span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", categoryColor)}>
              {script.category}
            </span>
          </div>
          {!compact && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {parseVariables(script.content).substring(0, 60)}...
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {script.conversionRate > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              {script.conversionRate.toFixed(0)}%
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className={cn(
              "p-1.5 rounded transition-colors",
              isCopied
                ? "bg-emerald-500 text-white"
                : "bg-purple-600 text-white hover:bg-purple-500"
            )}
          >
            {isCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {!compact && (
            <ChevronRight
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                expanded && "rotate-90"
              )}
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && !compact && (
        <div className="px-3 pb-3 border-t border-[--border] mt-2 pt-2">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {parseVariables(script.content)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>Used {script.usageCount} times</span>
            {script.hasVariables && (
              <span className="text-purple-400">Has variables</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
