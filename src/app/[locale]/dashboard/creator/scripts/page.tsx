"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Loader2,
  Search,
  Filter,
  X,
  GitBranch,
  Sparkles,
  Users,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import IntentSidebar from "./components/IntentSidebar";
import ScriptCard from "./components/ScriptCard";
import { parseScriptVariables, getSampleContext } from "@/lib/scripts/variables";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

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
  importedFrom?: string | null;
  importedFromName?: string | null;
}

interface IntentCount {
  value: string | null;
  label: string;
  count: number;
}

interface OtherCreatorScripts {
  creatorSlug: string;
  creatorName: string;
  scripts: Script[];
}

const FAN_STAGES = [
  { value: null, label: "All Stages" },
  { value: "new", label: "New Fan" },
  { value: "engaged", label: "Engaged" },
  { value: "vip", label: "VIP" },
  { value: "cooling_off", label: "Cooling Off" },
];

const LANGUAGES = [
  { value: null, label: "All Languages" },
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "es", label: "Espanol" },
  { value: "de", label: "Deutsch" },
];

export default function ScriptsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = params.locale as string;
  const { selectedCreator, agency, agencyCreators, isLoading: contextLoading } = useAdminCreator();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [intents, setIntents] = useState<IntentCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [otherCreatorsScripts, setOtherCreatorsScripts] = useState<OtherCreatorScripts[]>([]);
  const [selectedImportScripts, setSelectedImportScripts] = useState<Set<string>>(new Set());
  const [importingScripts, setImportingScripts] = useState(false);
  const [loadingOtherScripts, setLoadingOtherScripts] = useState(false);

  // Template import
  const [importingTemplates, setImportingTemplates] = useState(false);

  const isCreator = (session?.user as any)?.isCreator === true;

  // Check if user can import from other creators (agency with multiple creators)
  const canImportFromOthers = agency && agencyCreators.length > 1;

  const fetchScripts = useCallback(async (creatorSlug: string) => {
    const queryParams = new URLSearchParams({ creatorSlug });
    if (selectedIntent) queryParams.set("intent", selectedIntent);
    if (selectedStage) queryParams.set("fanStage", selectedStage);
    if (selectedLanguage) queryParams.set("language", selectedLanguage);
    if (searchQuery) queryParams.set("search", searchQuery);

    const res = await fetch(`/api/creator/scripts?${queryParams}`);
    if (res.ok) {
      const data = await res.json();
      setScripts(data.scripts || []);
      setIntents(data.intents || []);
    }
  }, [selectedIntent, selectedStage, selectedLanguage, searchQuery]);

  useEffect(() => {
    if (status === "authenticated" && isCreator && selectedCreator?.slug && !contextLoading) {
      fetchScripts(selectedCreator.slug).finally(() => setIsLoading(false));
    } else if (!contextLoading && status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, isCreator, selectedCreator?.slug, contextLoading, fetchScripts]);

  // Refetch when filters change
  useEffect(() => {
    if (selectedCreator?.slug) {
      fetchScripts(selectedCreator.slug);
    }
  }, [selectedCreator?.slug, selectedIntent, selectedStage, selectedLanguage, searchQuery, fetchScripts]);

  const copyToClipboard = async (script: Script) => {
    const parsedContent = parseScriptVariables(script.content, getSampleContext());
    await navigator.clipboard.writeText(parsedContent);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Track usage
    try {
      await fetch("/api/creator/scripts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: script.id }),
      });
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  };

  const toggleFavorite = async (script: Script) => {
    if (!selectedCreator?.slug) return;

    try {
      await fetch("/api/creator/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          isFavorite: !script.isFavorite,
        }),
      });
      await fetchScripts(selectedCreator.slug);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteScript = async (script: Script) => {
    if (!confirm(`Delete "${script.name}"?`)) return;
    if (!selectedCreator?.slug) return;

    try {
      const res = await fetch(`/api/creator/scripts?id=${script.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchScripts(selectedCreator.slug);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  const clearFilters = () => {
    setSelectedIntent(null);
    setSelectedStage(null);
    setSelectedLanguage(null);
    setSearchQuery("");
  };

  // Import from other creators
  const openImportModal = async () => {
    if (!agency || !selectedCreator?.slug) return;

    setShowImportModal(true);
    setLoadingOtherScripts(true);
    setSelectedImportScripts(new Set());

    try {
      // Get scripts from other creators in the agency
      const otherCreators = agencyCreators.filter(c => c.slug !== selectedCreator.slug);
      const results: OtherCreatorScripts[] = [];

      for (const creator of otherCreators) {
        const res = await fetch(`/api/creator/scripts?creatorSlug=${creator.slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.scripts && data.scripts.length > 0) {
            results.push({
              creatorSlug: creator.slug,
              creatorName: creator.displayName || creator.name,
              scripts: data.scripts,
            });
          }
        }
      }

      setOtherCreatorsScripts(results);
    } catch (error) {
      console.error("Error fetching other creators scripts:", error);
    } finally {
      setLoadingOtherScripts(false);
    }
  };

  const toggleImportScript = (scriptId: string) => {
    setSelectedImportScripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scriptId)) {
        newSet.delete(scriptId);
      } else {
        newSet.add(scriptId);
      }
      return newSet;
    });
  };

  const importSelectedScripts = async () => {
    if (!selectedCreator?.slug || selectedImportScripts.size === 0) return;

    setImportingScripts(true);
    try {
      const res = await fetch("/api/creator/scripts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          scriptIds: Array.from(selectedImportScripts),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchScripts(selectedCreator.slug);
        setShowImportModal(false);
        alert(`Imported ${data.imported} scripts!`);
      }
    } catch (error) {
      console.error("Error importing scripts:", error);
      alert("Error importing scripts");
    } finally {
      setImportingScripts(false);
    }
  };

  // Import templates
  const importTemplates = async (languages: string[] = ["fr", "en"]) => {
    if (!selectedCreator?.slug) return;

    setImportingTemplates(true);
    try {
      const res = await fetch("/api/creator/scripts/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          languages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchScripts(selectedCreator.slug);
        alert(`Imported ${data.imported} scripts! ${data.skipped > 0 ? `(${data.skipped} skipped - already exist)` : ""}`);
      }
    } catch (error) {
      console.error("Error importing templates:", error);
      alert("Error importing templates");
    } finally {
      setImportingTemplates(false);
    }
  };

  const hasActiveFilters = selectedIntent || selectedStage || selectedLanguage || searchQuery;

  if (status === "loading" || isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!selectedCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No creator selected</h2>
          <p className="text-gray-400">Please select a creator from the dropdown above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-28 overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Scripts
              </h1>
              <p className="text-sm text-gray-400">
                {scripts.length} scripts for {selectedCreator.displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canImportFromOthers && (
              <button
                onClick={openImportModal}
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}
            <Link
              href={`/${locale}/dashboard/creator/scripts/flows`}
              className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
            >
              <GitBranch className="w-5 h-5" />
              <span className="hidden sm:inline">Flows</span>
            </Link>
            <Link
              href={`/${locale}/dashboard/creator/scripts/new`}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Script</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-12 px-4 rounded-xl border flex items-center gap-2 transition-all",
              showFilters || hasActiveFilters
                ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            )}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                {[selectedIntent, selectedStage, selectedLanguage, searchQuery].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
          >
            {/* Intent filter - Mobile only (sidebar hidden) */}
            <div className="lg:hidden w-full sm:w-auto">
              <label className="block text-xs text-gray-500 mb-1">Intent</label>
              <select
                value={selectedIntent || ""}
                onChange={(e) => setSelectedIntent(e.target.value || null)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                <option value="">All Intents</option>
                {intents.map((intent) => (
                  <option key={intent.value || "custom"} value={intent.value || ""}>
                    {intent.label} ({intent.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage filter */}
            <div className="flex-1 sm:flex-none min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Fan Stage</label>
              <select
                value={selectedStage || ""}
                onChange={(e) => setSelectedStage(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                {FAN_STAGES.map((stage) => (
                  <option key={stage.value || "all"} value={stage.value || ""}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language filter */}
            <div className="flex-1 sm:flex-none min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Language</label>
              <select
                value={selectedLanguage || ""}
                onChange={(e) => setSelectedLanguage(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value || "all"} value={lang.value || ""}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="self-end px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Intent Sidebar */}
        <IntentSidebar
          intents={intents}
          selectedIntent={selectedIntent}
          onSelectIntent={setSelectedIntent}
          totalCount={scripts.length}
        />

        {/* Scripts Grid */}
        <div className="flex-1 min-w-0">
          {scripts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 text-center">
                No scripts yet
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6 max-w-xs">
                Create your first script or import templates to get started quickly.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {canImportFromOthers && (
                  <button
                    onClick={openImportModal}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Users className="w-5 h-5" />
                    Import from Other Creator
                  </button>
                )}
                <button
                  onClick={() => importTemplates(["fr", "en"])}
                  disabled={importingTemplates}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium shadow-lg shadow-orange-500/25 flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {importingTemplates ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Import 45+ Templates
                </button>
                <span className="text-gray-500 text-sm">or</span>
                <Link
                  href={`/${locale}/dashboard/creator/scripts/new`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Create From Scratch
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {scripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onCopy={copyToClipboard}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteScript}
                  isCopied={copiedId === script.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import from Other Creator Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-gray-900 rounded-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Import from Other Creator
                      </h2>
                      <p className="text-sm text-gray-400">
                        Copy scripts from other creators in your agency
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {loadingOtherScripts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : otherCreatorsScripts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No scripts found from other creators</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {otherCreatorsScripts.map((creatorScripts) => (
                      <div key={creatorScripts.creatorSlug}>
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">
                            {creatorScripts.creatorName[0].toUpperCase()}
                          </span>
                          {creatorScripts.creatorName}
                          <span className="text-gray-500">({creatorScripts.scripts.length} scripts)</span>
                        </h3>
                        <div className="space-y-2">
                          {creatorScripts.scripts.map((script) => (
                            <button
                              key={script.id}
                              onClick={() => toggleImportScript(script.id)}
                              className={cn(
                                "w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3",
                                selectedImportScripts.has(script.id)
                                  ? "bg-purple-500/20 border-purple-500/50"
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5",
                                selectedImportScripts.has(script.id)
                                  ? "bg-purple-500 border-purple-500"
                                  : "border-white/30"
                              )}>
                                {selectedImportScripts.has(script.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white truncate">
                                    {script.name}
                                  </span>
                                  {script.intent && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400">
                                      {script.intent.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-1">
                                  {script.content}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {selectedImportScripts.size} scripts selected
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importSelectedScripts}
                    disabled={selectedImportScripts.size === 0 || importingScripts}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {importingScripts ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Import Selected
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
