"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Hash,
  Sparkles,
  MessageSquare,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
  creatorSlug: string | null;
  usageCount: number;
  salesGenerated: number;
  conversionRate: number;
}

interface Category {
  value: string;
  label: string;
  count: number;
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  GREETING: { icon: "👋", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  PPV_PITCH: { icon: "💎", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  FOLLOW_UP: { icon: "💬", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  CLOSING: { icon: "🎯", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  CUSTOM: { icon: "✨", color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30" },
};

export default function ChatterScriptsPage() {
  const { data: session } = useSession();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchScripts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "ALL") params.set("category", category);
        if (search) params.set("search", search);

        const res = await fetch(`/api/chatter/scripts?${params}`);
        const data = await res.json();
        setScripts(data.scripts || []);
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to fetch scripts:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchScripts, 300);
    return () => clearTimeout(debounce);
  }, [category, search]);

  const handleCopy = async (script: Script) => {
    await navigator.clipboard.writeText(script.content);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Track usage
    fetch("/api/chatter/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId: script.id }),
    }).catch(console.error);
  };

  const getCategoryConfig = (cat: string) => {
    return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.CUSTOM;
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 pb-24 overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Scripts Library</h1>
        </div>
        <p className="text-sm text-gray-400">
          Quick-copy messages for better conversions
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold text-white">{scripts.length}</p>
            </div>
          </div>
        </div>

        {categories.slice(0, 1).map((cat) => {
          const config = getCategoryConfig(cat.value);
          return (
            <div key={cat.value} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{cat.label}</p>
                  <p className="text-lg font-bold text-white">{cat.count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </motion.div>

      {/* Category Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-6 scrollbar-hide"
      >
        <button
          onClick={() => setCategory("ALL")}
          className={cn(
            "px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5",
            category === "ALL"
              ? "bg-white text-black shadow-lg"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          All
        </button>
        {categories.map((cat) => {
          const config = getCategoryConfig(cat.value);
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5",
                category === cat.value
                  ? `${config.bg} ${config.color} ${config.border} border`
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <span>{config.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </motion.div>

      {/* Scripts List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : scripts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 text-center">
            No scripts found
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            {search
              ? "Try a different search term"
              : "Your agency hasn't added any scripts yet"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script, index) => {
            const config = getCategoryConfig(script.category);
            const isExpanded = expandedId === script.id;
            const isCopied = copiedId === script.id;

            return (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={cn(
                  "bg-white/5 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all",
                  isExpanded ? "border-purple-500/50 bg-white/[0.07]" : "border-white/10"
                )}>
                  {/* Header - Clickable */}
                  <div
                    className="p-4 cursor-pointer active:bg-white/5"
                    onClick={() => setExpandedId(isExpanded ? null : script.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Category & Creator badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            config.bg, config.color
                          )}>
                            <span>{config.icon}</span>
                            {script.category.replace(/_/g, " ")}
                          </span>
                          {script.creatorSlug && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400">
                              @{script.creatorSlug}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-white mb-1">
                          {script.name}
                        </h3>

                        {/* Preview */}
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {script.content}
                        </p>
                      </div>

                      {/* Expand indicator */}
                      <ChevronDown className={cn(
                        "w-5 h-5 text-gray-500 transition-transform flex-shrink-0",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Full Content */}
                        <div className="px-4 pb-3">
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {script.content}
                            </p>
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="px-4 pb-4 flex items-center justify-between gap-3">
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="text-gray-400">{script.usageCount}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-400">{script.salesGenerated}</span>
                            </span>
                            {script.conversionRate > 0 && (
                              <span className="hidden sm:flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-purple-400">{(script.conversionRate * 100).toFixed(0)}%</span>
                              </span>
                            )}
                          </div>

                          {/* Copy Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(script);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                              isCopied
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                            )}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Copy Button (when not expanded) */}
                  {!isExpanded && (
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {script.usageCount}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <DollarSign className="w-3.5 h-3.5" />
                          {script.salesGenerated}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(script);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          isCopied
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        )}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{isCopied ? "Copied!" : "Copy"}</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
