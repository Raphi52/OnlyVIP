"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowLeft,
  Save,
  Loader2,
  ChevronDown,
  Plus,
  X,
  Code,
  Eye,
  DollarSign,
  ArrowRight,
  Bot,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { extractVariables, parseScriptVariables, getSampleContext } from "@/lib/scripts/variables";

const INTENTS = [
  { value: "GREETING", label: "Greeting" },
  { value: "PPV_PITCH", label: "PPV Pitch" },
  { value: "PPV_FOLLOWUP", label: "PPV Follow-up" },
  { value: "OBJECTION_PRICE", label: "Objection: Price" },
  { value: "OBJECTION_TIME", label: "Objection: Time" },
  { value: "OBJECTION_TRUST", label: "Objection: Trust" },
  { value: "CLOSING", label: "Closing" },
  { value: "REENGAGEMENT", label: "Re-engagement" },
  { value: "UPSELL", label: "Upsell" },
  { value: "THANK_YOU", label: "Thank You" },
  { value: "SEXTING_START", label: "Sexting Start" },
  { value: "CUSTOM_REQUEST", label: "Custom Request" },
  { value: "FLASH_SALE", label: "Flash Sale" },
  { value: "CUSTOM", label: "Custom" },
];

const FAN_STAGES = [
  { value: "any", label: "Any Stage" },
  { value: "new", label: "New Fan" },
  { value: "engaged", label: "Engaged" },
  { value: "vip", label: "VIP" },
  { value: "cooling_off", label: "Cooling Off" },
];

const LANGUAGES = [
  { value: "any", label: "Any Language" },
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "es", label: "Espanol" },
  { value: "de", label: "Deutsch" },
];

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
}

export default function EditScriptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const scriptId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allScripts, setAllScripts] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [intent, setIntent] = useState("GREETING");
  const [fanStage, setFanStage] = useState("any");
  const [language, setLanguage] = useState("any");

  // Trigger state
  const [triggerKeywords, setTriggerKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [priority, setPriority] = useState(50);
  const [minConfidence, setMinConfidence] = useState(0.5);

  // Pricing state
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [isFreeTease, setIsFreeTease] = useState(false);

  // Flow state
  const [nextScriptOnSuccess, setNextScriptOnSuccess] = useState<string | null>(null);
  const [nextScriptOnReject, setNextScriptOnReject] = useState<string | null>(null);
  const [followUpDelay, setFollowUpDelay] = useState<number | null>(null);
  const [followUpScriptId, setFollowUpScriptId] = useState<string | null>(null);

  // AI state
  const [aiInstructions, setAiInstructions] = useState("");
  const [allowAiModify, setAllowAiModify] = useState(true);
  const [preserveCore, setPreserveCore] = useState("");

  // Sections
  const [sections, setSections] = useState<Section[]>([
    { id: "basic", title: "Basic Info", icon: FileText, isOpen: true },
    { id: "trigger", title: "Trigger & Matching", icon: MessageSquare, isOpen: true },
    { id: "pricing", title: "Pricing", icon: DollarSign, isOpen: true },
    { id: "flow", title: "Conversation Flow", icon: ArrowRight, isOpen: true },
    { id: "ai", title: "AI Instructions", icon: Bot, isOpen: true },
  ]);

  const toggleSection = (id: string) => {
    setSections(sections.map(s =>
      s.id === id ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agency");
        if (!res.ok) return;

        const data = await res.json();
        if (!data.agencies?.[0]) return;

        const agency = data.agencies[0];

        // Fetch all scripts
        const scriptsRes = await fetch(`/api/agency/scripts?agencyId=${agency.id}`);
        if (scriptsRes.ok) {
          const scriptsData = await scriptsRes.json();
          setAllScripts(scriptsData.scripts || []);

          // Find current script
          const currentScript = scriptsData.scripts?.find((s: any) => s.id === scriptId);
          if (currentScript) {
            // Populate form
            setName(currentScript.name || "");
            setContent(currentScript.content || "");
            setIntent(currentScript.intent || "GREETING");
            setFanStage(currentScript.fanStage || "any");
            setLanguage(currentScript.language || "any");
            setTriggerKeywords(currentScript.triggerKeywords ? JSON.parse(currentScript.triggerKeywords) : []);
            setPriority(currentScript.priority || 50);
            setMinConfidence(currentScript.minConfidence || 0.5);
            setSuggestedPrice(currentScript.suggestedPrice);
            setIsFreeTease(currentScript.isFreeTease || false);
            setNextScriptOnSuccess(currentScript.nextScriptOnSuccess);
            setNextScriptOnReject(currentScript.nextScriptOnReject);
            setFollowUpDelay(currentScript.followUpDelay);
            setFollowUpScriptId(currentScript.followUpScriptId);
            setAiInstructions(currentScript.aiInstructions || "");
            setAllowAiModify(currentScript.allowAiModify ?? true);
            setPreserveCore(currentScript.preserveCore || "");
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

  const addKeyword = () => {
    if (newKeyword.trim() && !triggerKeywords.includes(newKeyword.trim())) {
      setTriggerKeywords([...triggerKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    setTriggerKeywords(triggerKeywords.filter(k => k !== kw));
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/agency/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scriptId,
          name,
          content,
          category: intent.includes("PPV") ? "PPV_PITCH" :
                   intent === "GREETING" ? "GREETING" :
                   intent.includes("OBJECTION") ? "FOLLOW_UP" :
                   intent === "CLOSING" ? "CLOSING" : "CUSTOM",
          intent,
          fanStage: fanStage !== "any" ? fanStage : null,
          language,
          triggerKeywords: triggerKeywords.length > 0 ? triggerKeywords : null,
          priority,
          minConfidence,
          suggestedPrice,
          isFreeTease,
          nextScriptOnSuccess,
          nextScriptOnReject,
          followUpDelay,
          followUpScriptId,
          aiInstructions: aiInstructions || null,
          allowAiModify,
          preserveCore: preserveCore || null,
        }),
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/agency/scripts/${scriptId}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update script");
      }
    } catch (error) {
      console.error("Error updating script:", error);
      alert("Failed to update script");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this script?")) return;

    try {
      const res = await fetch(`/api/agency/scripts?id=${scriptId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push(`/${locale}/dashboard/agency/scripts`);
      }
    } catch (error) {
      console.error("Error deleting script:", error);
    }
  };

  const extractedVariables = extractVariables(content);
  const previewContent = parseScriptVariables(content, getSampleContext());

  // Filter out current script from flow options
  const flowScriptOptions = allScripts.filter(s => s.id !== scriptId);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-28 overflow-x-hidden max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Link
          href={`/${locale}/dashboard/agency/scripts/${scriptId}`}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Script</h1>
          <p className="text-sm text-gray-400">{name || "Untitled"}</p>
        </div>
        <button
          onClick={handleDelete}
          className="h-11 px-4 rounded-xl bg-red-500/20 text-red-400 font-medium flex items-center gap-2 hover:bg-red-500/30 transition-all"
        >
          <Trash2 className="w-5 h-5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !content.trim() || isSaving}
          className={cn(
            "h-11 px-5 rounded-xl font-medium shadow-lg flex items-center gap-2 transition-all",
            name.trim() && content.trim() && !isSaving
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/25 hover:opacity-90"
              : "bg-white/10 text-gray-500 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Save</span>
        </button>
      </motion.div>

      {/* Form Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="font-medium text-white">{section.title}</span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-gray-400 transition-transform",
                  section.isOpen && "rotate-180"
                )} />
              </button>

              {section.isOpen && (
                <div className="p-4 pt-0 space-y-4">
                  {/* BASIC INFO */}
                  {section.id === "basic" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Intent
                          </label>
                          <select
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            {INTENTS.map((i) => (
                              <option key={i.value} value={i.value}>
                                {i.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fan Stage
                          </label>
                          <select
                            value={fanStage}
                            onChange={(e) => setFanStage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            {FAN_STAGES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Language
                          </label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Content *
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                        {extractedVariables.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Code className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-gray-500">Variables:</span>
                            {extractedVariables.map((v) => (
                              <span key={v} className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs">
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {content && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-400">Preview</span>
                          </div>
                          <p className="text-sm text-white whitespace-pre-wrap">{previewContent}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* TRIGGER */}
                  {section.id === "trigger" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Trigger Keywords
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                            placeholder="Add keyword..."
                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                          />
                          <button
                            onClick={addKeyword}
                            className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        {triggerKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {triggerKeywords.map((kw) => (
                              <span
                                key={kw}
                                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm flex items-center gap-2"
                              >
                                {kw}
                                <button onClick={() => removeKeyword(kw)} className="text-gray-400 hover:text-white">
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                          <input
                            type="number"
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value))}
                            min={1}
                            max={100}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Min Confidence</label>
                          <input
                            type="number"
                            value={minConfidence}
                            onChange={(e) => setMinConfidence(Number(e.target.value))}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* PRICING */}
                  {section.id === "pricing" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Suggested Price</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="number"
                            value={suggestedPrice || ""}
                            onChange={(e) => setSuggestedPrice(e.target.value ? Number(e.target.value) : null)}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isFreeTease}
                              onChange={(e) => setIsFreeTease(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                          </div>
                          <span className="text-sm text-white">Free tease</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* FLOW */}
                  {section.id === "flow" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">On Success</label>
                          <select
                            value={nextScriptOnSuccess || ""}
                            onChange={(e) => setNextScriptOnSuccess(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {flowScriptOptions.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">On Reject</label>
                          <select
                            value={nextScriptOnReject || ""}
                            onChange={(e) => setNextScriptOnReject(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {flowScriptOptions.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Follow-up Delay (min)</label>
                          <input
                            type="number"
                            value={followUpDelay || ""}
                            onChange={(e) => setFollowUpDelay(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g., 1440"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Follow-up Script</label>
                          <select
                            value={followUpScriptId || ""}
                            onChange={(e) => setFollowUpScriptId(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {flowScriptOptions.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* AI */}
                  {section.id === "ai" && (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={allowAiModify}
                              onChange={(e) => setAllowAiModify(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-purple-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                          </div>
                          <span className="text-sm text-white">Allow AI to modify</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">AI Instructions</label>
                        <textarea
                          value={aiInstructions}
                          onChange={(e) => setAiInstructions(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Preserve Core</label>
                        <input
                          type="text"
                          value={preserveCore}
                          onChange={(e) => setPreserveCore(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
