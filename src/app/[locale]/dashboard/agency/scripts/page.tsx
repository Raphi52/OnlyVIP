"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  X,
  Loader2,
  Copy,
  Settings,
  Trash2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Check,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
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
  isActive: boolean;
  createdAt: string;
}

interface Agency {
  id: string;
  name: string;
  creators: { slug: string; displayName: string }[];
}

const CATEGORIES = [
  { value: "GREETING", label: "Greeting", icon: "👋", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { value: "PPV_PITCH", label: "PPV Pitch", icon: "💎", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  { value: "FOLLOW_UP", label: "Follow Up", icon: "💬", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  { value: "CLOSING", label: "Closing", icon: "🎯", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { value: "CUSTOM", label: "Custom", icon: "✨", color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30" },
];

export default function ScriptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("GREETING");
  const [formCreatorSlug, setFormCreatorSlug] = useState<string | null>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const ag = agencyData.agencies[0];
            setAgency(ag);

            const scriptsRes = await fetch(`/api/agency/scripts?agencyId=${ag.id}`);
            if (scriptsRes.ok) {
              const scriptsData = await scriptsRes.json();
              setScripts(scriptsData.scripts || []);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner]);

  const openCreateModal = () => {
    setEditingScript(null);
    setFormName("");
    setFormContent("");
    setFormCategory("GREETING");
    setFormCreatorSlug(null);
    setShowModal(true);
  };

  const openEditModal = (script: Script) => {
    setEditingScript(script);
    setFormName(script.name);
    setFormContent(script.content);
    setFormCategory(script.category);
    setFormCreatorSlug(script.creatorSlug);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency) return;

    setIsSaving(true);
    try {
      if (editingScript) {
        const res = await fetch("/api/agency/scripts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingScript.id,
            name: formName,
            content: formContent,
            category: formCategory,
            creatorSlug: formCreatorSlug,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setScripts(prev => prev.map(s =>
            s.id === editingScript.id ? { ...s, ...data.script } : s
          ));
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to update script");
        }
      } else {
        const res = await fetch("/api/agency/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyId: agency.id,
            name: formName,
            content: formContent,
            category: formCategory,
            creatorSlug: formCreatorSlug,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setScripts(prev => [...prev, { ...data.script, usageCount: 0, salesGenerated: 0, conversionRate: 0 }]);
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to create script");
        }
      }
    } catch (error) {
      console.error("Error saving script:", error);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async (script: Script) => {
    await navigator.clipboard.writeText(script.content);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Track usage
    try {
      await fetch("/api/agency/scripts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: script.id }),
      });
      setScripts(prev => prev.map(s =>
        s.id === script.id ? { ...s, usageCount: s.usageCount + 1 } : s
      ));
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  };

  const deleteScript = async (script: Script) => {
    if (!confirm(`Are you sure you want to delete "${script.name}"?`)) return;

    try {
      const res = await fetch(`/api/agency/scripts?id=${script.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setScripts(prev => prev.filter(s => s.id !== script.id));
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          script.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || script.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-3 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-24 overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Scripts Library
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              {scripts.length} scripts available
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Script</span>
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Category Pills - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5",
              !filterCategory
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={cn(
                "px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5",
                filterCategory === cat.value
                  ? `${cat.bg} ${cat.color} ${cat.border} border`
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Scripts List */}
      {filteredScripts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2 text-center">
            {scripts.length === 0 ? "No scripts yet" : "No matching scripts"}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6 max-w-xs">
            {scripts.length === 0
              ? "Create your first script to help chatters respond faster"
              : "Try adjusting your search or filters"}
          </p>
          {scripts.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Script
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredScripts.map((script, index) => {
            const catInfo = getCategoryInfo(script.category);
            const isCopied = copiedId === script.id;

            return (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group"
              >
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          catInfo.bg, catInfo.color
                        )}>
                          <span>{catInfo.icon}</span>
                          {catInfo.label}
                        </span>
                        {script.creatorSlug && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400">
                            @{script.creatorSlug}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate">
                        {script.name}
                      </h3>
                    </div>

                    {/* Actions - Desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(script)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteScript(script)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {script.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-gray-400">{script.usageCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="text-gray-400">{script.salesGenerated}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-gray-400">{script.conversionRate}%</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Mobile actions */}
                      <button
                        onClick={() => openEditModal(script)}
                        className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteScript(script)}
                        className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Copy button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(script)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          isCopied
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        )}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-lg max-h-[90vh] overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute -inset-[1px] rounded-t-3xl sm:rounded-3xl blur-sm bg-gradient-to-b from-purple-500/30 via-pink-500/20 to-transparent" />

              <div className="relative bg-[#0a0a0c]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden backdrop-blur-2xl">
                {/* Drag indicator */}
                <div className="sm:hidden flex justify-center pt-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        {editingScript ? <Settings className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {editingScript ? "Edit Script" : "New Script"}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {editingScript ? "Update your script" : "Create a reusable message"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Script Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Welcome Message"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormCategory(cat.value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                            formCategory === cat.value
                              ? `${cat.bg} ${cat.color} ${cat.border}`
                              : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                          )}
                        >
                          <span className="text-base">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Creator */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      For Creator (optional)
                    </label>
                    <select
                      value={formCreatorSlug || ""}
                      onChange={(e) => setFormCreatorSlug(e.target.value || null)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                    >
                      <option value="">Global (all creators)</option>
                      {agency?.creators.map((creator) => (
                        <option key={creator.slug} value={creator.slug}>
                          {creator.displayName} (@{creator.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Script Content
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Hey babe! Thanks for subscribing..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formContent.length} characters
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving || !formName || !formContent}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {editingScript ? "Update" : "Create"}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
