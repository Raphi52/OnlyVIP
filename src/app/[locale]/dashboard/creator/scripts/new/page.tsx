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
  Image,
  DollarSign,
  ArrowRight,
  Bot,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { extractVariables, parseScriptVariables, getSampleContext } from "@/lib/scripts/variables";

const INTENTS = [
  { value: "GREETING", label: "Greeting", desc: "Welcome new fans" },
  { value: "PPV_PITCH", label: "PPV Pitch", desc: "Sell content" },
  { value: "PPV_FOLLOWUP", label: "PPV Follow-up", desc: "Follow up on PPV" },
  { value: "OBJECTION_PRICE", label: "Objection: Price", desc: "Handle price objections" },
  { value: "OBJECTION_TIME", label: "Objection: Time", desc: "Handle 'later' responses" },
  { value: "OBJECTION_TRUST", label: "Objection: Trust", desc: "Build trust" },
  { value: "CLOSING", label: "Closing", desc: "Close the sale" },
  { value: "REENGAGEMENT", label: "Re-engagement", desc: "Win back inactive fans" },
  { value: "UPSELL", label: "Upsell", desc: "Sell more" },
  { value: "THANK_YOU", label: "Thank You", desc: "After purchase" },
  { value: "SEXTING_START", label: "Sexting Start", desc: "Initiate sexting" },
  { value: "CUSTOM_REQUEST", label: "Custom Request", desc: "Handle custom requests" },
  { value: "FLASH_SALE", label: "Flash Sale", desc: "Limited time offer" },
  { value: "CUSTOM", label: "Custom", desc: "Other purpose" },
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

export default function NewScriptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
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
    { id: "trigger", title: "Trigger & Matching", icon: MessageSquare, isOpen: false },
    { id: "pricing", title: "Pricing", icon: DollarSign, isOpen: false },
    { id: "flow", title: "Conversation Flow", icon: ArrowRight, isOpen: false },
    { id: "ai", title: "AI Instructions", icon: Bot, isOpen: false },
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
        if (res.ok) {
          const data = await res.json();
          if (data.agencies?.[0]) {
            const ag = data.agencies[0];
            setAgencyId(ag.id);

            // Fetch all scripts for flow selection
            const scriptsRes = await fetch(`/api/agency/scripts?agencyId=${ag.id}`);
            if (scriptsRes.ok) {
              const scriptsData = await scriptsRes.json();
              setAllScripts(scriptsData.scripts || []);
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
    if (!name.trim() || !content.trim() || !agencyId) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/agency/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
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
        router.push(`/${locale}/dashboard/agency/scripts`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create script");
      }
    } catch (error) {
      console.error("Error creating script:", error);
      alert("Failed to create script");
    } finally {
      setIsSaving(false);
    }
  };

  const extractedVariables = extractVariables(content);
  const previewContent = parseScriptVariables(content, getSampleContext());

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
          href={`/${locale}/dashboard/agency/scripts`}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">New Script</h1>
          <p className="text-sm text-gray-400">Create a new script for your chatters and AI</p>
        </div>
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
          <span className="hidden sm:inline">Save Script</span>
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
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Welcome Message, PPV Pitch..."
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      {/* Intent & Stage row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Intent *
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

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Script Content *
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Write your script here... Use {{fanName}}, {{creatorName}}, etc. for variables"
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

                      {/* Preview */}
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
                        <p className="text-xs text-gray-500 mb-2">
                          Words or phrases that trigger this script when detected in fan messages
                        </p>
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
                                <button
                                  onClick={() => removeKeyword(kw)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Priority (1-100)
                          </label>
                          <input
                            type="number"
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value))}
                            min={1}
                            max={100}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Higher = more priority when multiple scripts match</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Min Confidence (0-1)
                          </label>
                          <input
                            type="number"
                            value={minConfidence}
                            onChange={(e) => setMinConfidence(Number(e.target.value))}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum score to use this script</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PRICING */}
                  {section.id === "pricing" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Suggested Price
                          </label>
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
                          <p className="text-xs text-gray-500 mt-1">For PPV content</p>
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
                            <span className="text-sm text-white">Send as free tease</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* FLOW */}
                  {section.id === "flow" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            On Success (positive response)
                          </label>
                          <select
                            value={nextScriptOnSuccess || ""}
                            onChange={(e) => setNextScriptOnSuccess(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {allScripts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            On Reject (negative response)
                          </label>
                          <select
                            value={nextScriptOnReject || ""}
                            onChange={(e) => setNextScriptOnReject(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {allScripts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Follow-up Delay (minutes)
                          </label>
                          <input
                            type="number"
                            value={followUpDelay || ""}
                            onChange={(e) => setFollowUpDelay(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g., 1440 for 24h"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Follow-up Script
                          </label>
                          <select
                            value={followUpScriptId || ""}
                            onChange={(e) => setFollowUpScriptId(e.target.value || null)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                          >
                            <option value="">None</option>
                            {allScripts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
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
                          <span className="text-sm text-white">Allow AI to modify this script</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          AI Instructions
                        </label>
                        <textarea
                          value={aiInstructions}
                          onChange={(e) => setAiInstructions(e.target.value)}
                          placeholder="Instructions for how AI should use or modify this script..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Preserve Core (AI must keep this part)
                        </label>
                        <input
                          type="text"
                          value={preserveCore}
                          onChange={(e) => setPreserveCore(e.target.value)}
                          placeholder="e.g., the main call-to-action"
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
