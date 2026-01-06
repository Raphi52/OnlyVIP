"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Loader2,
  Search,
  Filter,
  X,
  GitBranch,
  Download,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import IntentSidebar from "./components/IntentSidebar";
import ScriptCard from "./components/ScriptCard";
import { parseScriptVariables, getSampleContext } from "@/lib/scripts/variables";

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

interface IntentCount {
  value: string | null;
  label: string;
  count: number;
}

interface Agency {
  id: string;
  name: string;
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
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [agency, setAgency] = useState<Agency | null>(null);
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [importingTemplates, setImportingTemplates] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingDemo, setDeletingDemo] = useState(false);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;
  const hasDemoScripts = scripts.some((s) => s.name.startsWith("[DEMO]"));

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  const fetchScripts = useCallback(async (agencyId: string) => {
    const params = new URLSearchParams({ agencyId });
    if (selectedIntent) params.set("intent", selectedIntent);
    if (selectedStage) params.set("fanStage", selectedStage);
    if (selectedLanguage) params.set("language", selectedLanguage);
    if (searchQuery) params.set("search", searchQuery);

    const res = await fetch(`/api/agency/scripts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setScripts(data.scripts || []);
      setIntents(data.intents || []);
    }
  }, [selectedIntent, selectedStage, selectedLanguage, searchQuery]);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const ag = agencyData.agencies[0];
            setAgency(ag);
            await fetchScripts(ag.id);
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

  // Refetch when filters change
  useEffect(() => {
    if (agency) {
      fetchScripts(agency.id);
    }
  }, [agency, selectedIntent, selectedStage, selectedLanguage, searchQuery, fetchScripts]);

  const copyToClipboard = async (script: Script) => {
    const parsedContent = parseScriptVariables(script.content, getSampleContext());
    await navigator.clipboard.writeText(parsedContent);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Track usage
    try {
      await fetch("/api/agency/scripts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: script.id }),
      });
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  };

  const toggleFavorite = async (script: Script) => {
    if (!agency) return;

    try {
      await fetch("/api/agency/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          isFavorite: !script.isFavorite,
        }),
      });
      await fetchScripts(agency.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteScript = async (script: Script) => {
    if (!confirm(`Delete "${script.name}"?`)) return;
    if (!agency) return;

    try {
      const res = await fetch(`/api/agency/scripts?id=${script.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchScripts(agency.id);
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

  // Seed demo flows
  const handleSeedDemo = async () => {
    if (!agency?.id || seeding) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/agency/scripts/seed-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency.id }),
      });
      if (res.ok) {
        await fetchScripts(agency.id);
      }
    } catch (error) {
      console.error("Error seeding demo:", error);
    } finally {
      setSeeding(false);
    }
  };

  // Delete demo flows
  const handleDeleteDemo = async () => {
    if (!agency?.id || deletingDemo) return;
    if (!confirm("Supprimer tous les scripts de démo?")) return;
    setDeletingDemo(true);
    try {
      const res = await fetch(`/api/agency/scripts/seed-flows?agencyId=${agency.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchScripts(agency.id);
      }
    } catch (error) {
      console.error("Error deleting demo:", error);
    } finally {
      setDeletingDemo(false);
    }
  };

  const importTemplates = async (languages: string[] = ["fr", "en"]) => {
    if (!agency) return;

    setImportingTemplates(true);
    try {
      const res = await fetch("/api/agency/scripts/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          languages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchScripts(agency.id);
        setShowTemplateModal(false);
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
                {scripts.length} scripts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasDemoScripts ? (
              <button
                onClick={handleDeleteDemo}
                disabled={deletingDemo}
                className="h-11 px-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-600/30 transition-all disabled:opacity-50"
              >
                {deletingDemo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Suppr. démo</span>
              </button>
            ) : (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {seeding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Générer démo</span>
              </button>
            )}
            <Link
              href={`/${locale}/dashboard/agency/scripts/flows`}
              className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
            >
              <GitBranch className="w-5 h-5" />
              <span className="hidden sm:inline">Flows</span>
            </Link>
            <Link
              href={`/${locale}/dashboard/agency/scripts/new`}
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
                Create your first script or import our proven templates to get started quickly.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
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
                  href={`/${locale}/dashboard/agency/scripts/new`}
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
    </div>
  );
}
