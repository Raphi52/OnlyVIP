"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowLeft,
  Settings,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Trash2,
  Code,
  Eye,
  ArrowRight,
  Bot,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import FlowVisualizer from "../components/FlowVisualizer";
import { parseScriptVariables, getSampleContext } from "@/lib/scripts/variables";

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
  variables: string | null;
  triggerKeywords: string | null;
  priority: number;
  minConfidence: number;
  aiInstructions: string | null;
  allowAiModify: boolean;
  preserveCore: string | null;
  nextScriptOnSuccess: string | null;
  nextScriptOnReject: string | null;
  followUpDelay: number | null;
  followUpScriptId: string | null;
  usageCount: number;
  messagesSent: number;
  salesGenerated: number;
  revenueGenerated: number;
  conversionRate: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  mediaItems: any[];
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

const STAGE_LABELS: Record<string, string> = {
  new: "New Fan",
  engaged: "Engaged",
  vip: "VIP",
  cooling_off: "Cooling Off",
  any: "Any Stage",
};

export default function ScriptDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const scriptId = params.id as string;

  const [script, setScript] = useState<Script | null>(null);
  const [allScripts, setAllScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get agency first
        const agencyRes = await fetch("/api/agency");
        if (!agencyRes.ok) return;

        const agencyData = await agencyRes.json();
        if (!agencyData.agencies?.[0]) return;

        const agency = agencyData.agencies[0];
        setAgencyId(agency.id);

        // Get all scripts for flow visualization
        const scriptsRes = await fetch(`/api/agency/scripts?agencyId=${agency.id}`);
        if (scriptsRes.ok) {
          const scriptsData = await scriptsRes.json();
          setAllScripts(scriptsData.scripts || []);

          // Find the current script
          const currentScript = scriptsData.scripts?.find((s: Script) => s.id === scriptId);
          if (currentScript) {
            setScript(currentScript);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner && scriptId) {
      fetchData();
    }
  }, [status, isAgencyOwner, scriptId]);

  const copyToClipboard = async () => {
    if (!script) return;
    const parsedContent = parseScriptVariables(script.content, getSampleContext());
    await navigator.clipboard.writeText(parsedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

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

  const toggleFavorite = async () => {
    if (!script) return;

    try {
      await fetch("/api/agency/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: script.id,
          isFavorite: !script.isFavorite,
        }),
      });
      setScript({ ...script, isFavorite: !script.isFavorite });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteScript = async () => {
    if (!script || !confirm(`Delete "${script.name}"?`)) return;

    try {
      const res = await fetch(`/api/agency/scripts?id=${script.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/agency/scripts`);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-white">Script not found</p>
          <Link
            href={`/${locale}/dashboard/agency/scripts`}
            className="text-purple-400 hover:text-purple-300 mt-2 inline-block"
          >
            Back to scripts
          </Link>
        </div>
      </div>
    );
  }

  const intentStyle = INTENT_COLORS[script.intent || "CUSTOM"] || INTENT_COLORS.CUSTOM;
  const parsedVariables = script.variables ? JSON.parse(script.variables) : [];
  const parsedKeywords = script.triggerKeywords ? JSON.parse(script.triggerKeywords) : [];
  const previewContent = parseScriptVariables(script.content, getSampleContext());
  const hasFlow = script.nextScriptOnSuccess || script.nextScriptOnReject || script.followUpScriptId;

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-28 overflow-x-hidden max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 mb-6"
      >
        <div className="flex items-start gap-4">
          <Link
            href={`/${locale}/dashboard/agency/scripts`}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {script.name}
              </h1>
              {script.isFavorite && (
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {script.intent && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  intentStyle.bg, intentStyle.color
                )}>
                  {script.intent.replace(/_/g, " ")}
                </span>
              )}
              {script.fanStage && script.fanStage !== "any" && (
                <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-gray-300">
                  {STAGE_LABELS[script.fanStage] || script.fanStage}
                </span>
              )}
              {script.language !== "any" && (
                <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-gray-300 uppercase">
                  {script.language}
                </span>
              )}
              {script.suggestedPrice && (
                <span className="px-3 py-1 rounded-full text-sm bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {script.suggestedPrice}
                </span>
              )}
              {script.isFreeTease && (
                <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                  Free Tease
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleFavorite}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              script.isFavorite
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            <Star className={cn("w-5 h-5", script.isFavorite && "fill-current")} />
          </button>
          <button
            onClick={deleteScript}
            className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <Link
            href={`/${locale}/dashboard/agency/scripts/${script.id}/edit`}
            className="h-10 px-4 rounded-xl bg-white/5 text-gray-300 flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button
            onClick={copyToClipboard}
            className={cn(
              "h-10 px-4 rounded-xl font-medium flex items-center gap-2 transition-all",
              isCopied
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
            )}
          >
            {isCopied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Usage</span>
          </div>
          <p className="text-2xl font-bold text-white">{script.usageCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Sent</span>
          </div>
          <p className="text-2xl font-bold text-white">{script.messagesSent}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Conversion</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {script.conversionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ${script.revenueGenerated.toFixed(0)}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Content */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Script Content
            </h3>
            <p className="text-white whitespace-pre-wrap">{script.content}</p>

            {/* Variables */}
            {parsedVariables.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-500">Variables</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedVariables.map((v: string) => (
                    <span key={v} className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview (with sample data)
            </h3>
            <p className="text-white whitespace-pre-wrap">{previewContent}</p>
          </div>

          {/* Trigger Keywords */}
          {parsedKeywords.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Trigger Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {parsedKeywords.map((kw: string) => (
                  <span key={kw} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-gray-500">
                <span>Priority: <strong className="text-white">{script.priority}</strong></span>
                <span>Min Confidence: <strong className="text-white">{script.minConfidence}</strong></span>
              </div>
            </div>
          )}

          {/* AI Instructions */}
          {(script.aiInstructions || script.preserveCore) && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
              <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Instructions
              </h3>
              {script.aiInstructions && (
                <p className="text-white text-sm mb-3">{script.aiInstructions}</p>
              )}
              <div className="flex items-center gap-4 text-xs">
                <span className={cn(
                  "px-2 py-1 rounded",
                  script.allowAiModify ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {script.allowAiModify ? "AI can modify" : "AI cannot modify"}
                </span>
                {script.preserveCore && (
                  <span className="text-gray-400">
                    Preserve: <strong className="text-white">{script.preserveCore}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Flow Visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Conversation Flow
            </h3>
            <FlowVisualizer
              rootScriptId={script.id}
              allScripts={allScripts}
              onScriptClick={(id) => {
                if (id !== script.id) {
                  router.push(`/${locale}/dashboard/agency/scripts/${id}`);
                }
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
