"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GitBranch,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  ArrowRight,
  Check,
  X,
  Clock,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import FlowVisualizer from "../components/FlowVisualizer";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Script {
  id: string;
  name: string;
  intent: string | null;
  content: string;
  nextScriptOnSuccess: string | null;
  nextScriptOnReject: string | null;
  followUpScriptId: string | null;
  followUpDelay: number | null;
  usageCount: number;
  conversionRate: number;
}

interface FlowChain {
  rootScript: Script;
  connectedScripts: Script[];
  totalNodes: number;
  hasSuccessBranch: boolean;
  hasRejectBranch: boolean;
  hasFollowUp: boolean;
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
  CUSTOM: { color: "text-gray-400", bg: "bg-gray-500/20" },
};

export default function FlowsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { agency } = useAdminCreator();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [flowChains, setFlowChains] = useState<FlowChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [filterIntent, setFilterIntent] = useState<string | null>(null);

  // Fetch all scripts
  useEffect(() => {
    async function fetchScripts() {
      if (!agency?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/agency/scripts?agencyId=${agency.id}`);
        if (res.ok) {
          const data = await res.json();
          setScripts(data.scripts || []);
        }
      } catch (error) {
        console.error("Error fetching scripts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScripts();
  }, [agency?.id]);

  // Build flow chains from scripts
  const buildFlowChains = useCallback(() => {
    if (scripts.length === 0) return;

    // Find all scripts that are part of a flow (have connections or are connected to)
    const connectedScriptIds = new Set<string>();
    const childScriptIds = new Set<string>();

    scripts.forEach((script) => {
      if (script.nextScriptOnSuccess) {
        connectedScriptIds.add(script.id);
        connectedScriptIds.add(script.nextScriptOnSuccess);
        childScriptIds.add(script.nextScriptOnSuccess);
      }
      if (script.nextScriptOnReject) {
        connectedScriptIds.add(script.id);
        connectedScriptIds.add(script.nextScriptOnReject);
        childScriptIds.add(script.nextScriptOnReject);
      }
      if (script.followUpScriptId) {
        connectedScriptIds.add(script.id);
        connectedScriptIds.add(script.followUpScriptId);
        childScriptIds.add(script.followUpScriptId);
      }
    });

    // Root scripts are scripts that have connections but are not children of other scripts
    const rootScriptIds = new Set<string>();
    connectedScriptIds.forEach((id) => {
      if (!childScriptIds.has(id)) {
        rootScriptIds.add(id);
      }
    });

    // Also include scripts with outgoing connections even if they're children
    scripts.forEach((script) => {
      if (
        script.nextScriptOnSuccess ||
        script.nextScriptOnReject ||
        script.followUpScriptId
      ) {
        if (!childScriptIds.has(script.id)) {
          rootScriptIds.add(script.id);
        }
      }
    });

    // Build chains for each root
    const chains: FlowChain[] = [];
    const scriptMap = new Map(scripts.map((s) => [s.id, s]));

    rootScriptIds.forEach((rootId) => {
      const rootScript = scriptMap.get(rootId);
      if (!rootScript) return;

      // BFS to find all connected scripts
      const visited = new Set<string>();
      const connected: Script[] = [];
      const queue = [rootId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const current = scriptMap.get(currentId);
        if (!current) continue;

        if (currentId !== rootId) {
          connected.push(current);
        }

        if (current.nextScriptOnSuccess && !visited.has(current.nextScriptOnSuccess)) {
          queue.push(current.nextScriptOnSuccess);
        }
        if (current.nextScriptOnReject && !visited.has(current.nextScriptOnReject)) {
          queue.push(current.nextScriptOnReject);
        }
        if (current.followUpScriptId && !visited.has(current.followUpScriptId)) {
          queue.push(current.followUpScriptId);
        }
      }

      chains.push({
        rootScript,
        connectedScripts: connected,
        totalNodes: visited.size,
        hasSuccessBranch: !!rootScript.nextScriptOnSuccess,
        hasRejectBranch: !!rootScript.nextScriptOnReject,
        hasFollowUp: !!rootScript.followUpScriptId,
      });
    });

    // Sort by total nodes (biggest flows first)
    chains.sort((a, b) => b.totalNodes - a.totalNodes);

    setFlowChains(chains);
  }, [scripts]);

  useEffect(() => {
    buildFlowChains();
  }, [buildFlowChains]);

  // Filter chains
  const filteredChains = flowChains.filter((chain) => {
    const matchesSearch =
      !searchQuery ||
      chain.rootScript.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.connectedScripts.some((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesIntent =
      !filterIntent || chain.rootScript.intent === filterIntent;

    return matchesSearch && matchesIntent;
  });

  // Get unique intents from flow chains
  const availableIntents = [
    ...new Set(flowChains.map((c) => c.rootScript.intent).filter(Boolean)),
  ] as string[];

  // Stats
  const totalFlows = flowChains.length;
  const totalNodesInFlows = flowChains.reduce((acc, c) => acc + c.totalNodes, 0);
  const scriptsWithoutFlows = scripts.filter(
    (s) =>
      !s.nextScriptOnSuccess &&
      !s.nextScriptOnReject &&
      !s.followUpScriptId &&
      !flowChains.some(
        (c) =>
          c.connectedScripts.some((cs) => cs.id === s.id) ||
          c.rootScript.id === s.id
      )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen pt-20 lg:pt-0">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-28 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/dashboard/creator/scripts`}
              className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-purple-400" />
                Script Flows
              </h1>
              <p className="text-gray-400 text-sm">
                Visualize and manage all script conversation flows
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/dashboard/creator/scripts/new`}
            className="h-10 px-4 rounded-xl bg-purple-600 text-white font-medium flex items-center gap-2 hover:bg-purple-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Script
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{totalFlows}</div>
            <div className="text-sm text-gray-400">Active Flows</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{totalNodesInFlows}</div>
            <div className="text-sm text-gray-400">Connected Scripts</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">{scripts.length}</div>
            <div className="text-sm text-gray-400">Total Scripts</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-white">
              {scriptsWithoutFlows.length}
            </div>
            <div className="text-sm text-gray-400">Standalone Scripts</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <select
            value={filterIntent || ""}
            onChange={(e) => setFilterIntent(e.target.value || null)}
            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">All Intents</option>
            {availableIntents.map((intent) => (
              <option key={intent} value={intent}>
                {intent.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flow List */}
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredChains.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
            <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Flows Found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filterIntent
                ? "Try adjusting your search or filters"
                : "Create scripts and connect them to build conversation flows"}
            </p>
            <Link
              href={`/${locale}/dashboard/creator/scripts/new`}
              className="inline-flex h-10 px-6 rounded-xl bg-purple-600 text-white font-medium items-center gap-2 hover:bg-purple-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Script
            </Link>
          </div>
        ) : (
          filteredChains.map((chain) => {
            const isExpanded = expandedFlow === chain.rootScript.id;
            const intentStyle =
              INTENT_COLORS[chain.rootScript.intent || "CUSTOM"] ||
              INTENT_COLORS.CUSTOM;

            return (
              <motion.div
                key={chain.rootScript.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* Flow Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() =>
                    setExpandedFlow(isExpanded ? null : chain.rootScript.id)
                  }
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Expand icon */}
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      {/* Flow info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white truncate">
                            {chain.rootScript.name}
                          </h3>
                          {chain.rootScript.intent && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                intentStyle.bg,
                                intentStyle.color
                              )}
                            >
                              {chain.rootScript.intent.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {chain.rootScript.content}
                        </p>
                      </div>
                    </div>

                    {/* Flow stats */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Branch indicators */}
                      <div className="flex items-center gap-2">
                        {chain.hasSuccessBranch && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Success</span>
                          </div>
                        )}
                        {chain.hasRejectBranch && (
                          <div className="flex items-center gap-1 text-xs text-red-400">
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Reject</span>
                          </div>
                        )}
                        {chain.hasFollowUp && (
                          <div className="flex items-center gap-1 text-xs text-purple-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Follow-up</span>
                          </div>
                        )}
                      </div>

                      {/* Node count */}
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {chain.totalNodes} scripts
                        </span>
                      </div>

                      {/* View detail link */}
                      <Link
                        href={`/${locale}/dashboard/creator/scripts/${chain.rootScript.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 px-3 rounded-lg bg-white/5 text-gray-400 text-sm flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Connected scripts preview (collapsed) */}
                  {!isExpanded && chain.connectedScripts.length > 0 && (
                    <div className="mt-3 ml-11 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Leads to:</span>
                      {chain.connectedScripts.slice(0, 3).map((script) => (
                        <span
                          key={script.id}
                          className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400"
                        >
                          {script.name}
                        </span>
                      ))}
                      {chain.connectedScripts.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{chain.connectedScripts.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Flow Visualizer */}
                {isExpanded && (
                  <div className="border-t border-white/10">
                    <FlowVisualizer
                      rootScriptId={chain.rootScript.id}
                      allScripts={scripts}
                      onScriptClick={(scriptId) => {
                        // Navigate to script detail
                        window.location.href = `/${locale}/dashboard/creator/scripts/${scriptId}`;
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Standalone Scripts Section */}
      {scriptsWithoutFlows.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Standalone Scripts
            <span className="text-sm font-normal text-gray-500">
              (not part of any flow)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scriptsWithoutFlows.slice(0, 6).map((script) => {
              const intentStyle =
                INTENT_COLORS[script.intent || "CUSTOM"] || INTENT_COLORS.CUSTOM;

              return (
                <Link
                  key={script.id}
                  href={`/${locale}/dashboard/creator/scripts/${script.id}`}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-white truncate">
                      {script.name}
                    </h3>
                    {script.intent && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                          intentStyle.bg,
                          intentStyle.color
                        )}
                      >
                        {script.intent.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {script.content}
                  </p>
                </Link>
              );
            })}
          </div>
          {scriptsWithoutFlows.length > 6 && (
            <div className="mt-4 text-center">
              <Link
                href={`/${locale}/dashboard/creator/scripts`}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all {scriptsWithoutFlows.length} standalone scripts
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
