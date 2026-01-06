"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Save,
  Loader2,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Send,
  Key,
  Server,
  Coins,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Trash2,
  ChevronDown,
  Copy,
  User,
  ArrowRightLeft,
  UserX,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";
import { cn } from "@/lib/utils";

// ==================== TYPES ====================

interface PersonalityConfig {
  tone?: string;
  style?: string;
  customPrompt?: string;
  background?: string;
  coreTraits?: string[];
  flaws?: string[];
  quirks?: string[];
  writingStyle?: {
    sentenceLength?: "short" | "medium" | "long" | "mixed";
    emojiUsage?: "none" | "rare" | "moderate" | "frequent";
    typicalExpressions?: string[];
    punctuation?: string;
  };
  innerVoice?: string;
  boundaries?: {
    neverSay?: string[];
    avoidTopics?: string[];
    alwaysDo?: string[];
  };
}

interface AiPersona {
  id: string;
  creatorSlug: string;
  name: string;
  personality: PersonalityConfig;
  primaryTone: string | null;
  toneKeywords: string[] | null;
  trafficShare: number;
  isActive: boolean;
  aiMediaEnabled: boolean;
  aiMediaFrequency: number;
  aiPPVRatio: number;
  aiTeasingEnabled: boolean;
  autoHandoffEnabled: boolean;
  handoffSpendThreshold: number;
  handoffOnHighIntent: boolean;
  handoffKeywords: string[] | null;
  giveUpOnNonPaying: boolean;
  giveUpMessageThreshold: number;
  giveUpAction: string;
  stats: {
    revenue30d: number;
    sales30d: number;
    messages30d: number;
    conversations30d: number;
    conversionRate: number;
  };
  createdAt: string;
}

type AiProvider = "anthropic" | "openai" | "openrouter";

interface AiModel {
  id: string;
  name: string;
  tier: "free" | "fast" | "balanced" | "premium";
  credits?: number; // credits per message (default 1)
  default?: boolean;
}

// ==================== CONSTANTS ====================

const AI_PROVIDERS: Record<AiProvider, { name: string; models: AiModel[]; keyPlaceholder: string }> = {
  anthropic: {
    name: "Anthropic (Claude)",
    models: [
      { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku", tier: "fast", credits: 1, default: true },
      { id: "claude-sonnet-4-5-20250929", name: "Claude 4.5 Sonnet", tier: "balanced", credits: 2 },
      { id: "claude-opus-4-5-20251101", name: "Claude 4.5 Opus", tier: "premium", credits: 3 },
    ],
    keyPlaceholder: "sk-ant-api03-...",
  },
  openai: {
    name: "OpenAI (GPT)",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tier: "fast", default: true },
      { id: "gpt-4o", name: "GPT-4o", tier: "balanced" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", tier: "premium" },
    ],
    keyPlaceholder: "sk-proj-...",
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B (Free)", tier: "free", default: true },
      { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", tier: "fast" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", tier: "balanced" },
      { id: "openai/gpt-4o", name: "GPT-4o", tier: "balanced" },
    ],
    keyPlaceholder: "sk-or-v1-...",
  },
};

const TIER_COLORS: Record<string, string> = {
  free: "text-green-400 bg-green-500/10",
  fast: "text-blue-400 bg-blue-500/10",
  balanced: "text-purple-400 bg-purple-500/10",
  premium: "text-amber-400 bg-amber-500/10",
};

const TONE_OPTIONS = [
  { value: "flirty", label: "Flirty", emoji: "💋" },
  { value: "sweet", label: "Sweet", emoji: "🥰" },
  { value: "spicy", label: "Spicy", emoji: "🔥" },
  { value: "playful", label: "Playful", emoji: "😜" },
  { value: "dominant", label: "Dominant", emoji: "👑" },
  { value: "submissive", label: "Submissive", emoji: "🙈" },
  { value: "mysterious", label: "Mysterious", emoji: "🌙" },
  { value: "intellectual", label: "Intellectual", emoji: "🧠" },
];

const PERSONA_STYLE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "eloquent", label: "Eloquent" },
  { value: "teasing", label: "Teasing" },
  { value: "direct", label: "Direct" },
  { value: "poetic", label: "Poetic" },
  { value: "sarcastic", label: "Sarcastic" },
];

// ==================== COMPONENTS ====================

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-[var(--foreground)]">{title}</span>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-[var(--muted)] transition-transform", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4 border-t border-[var(--border)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    if (input.trim() && !value.includes(input.trim())) {
      onChange([...value, input.trim()]);
      setInput("");
    }
  };
  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-purple-500"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function CreatorAiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedCreator, agency, agencyCreators } = useAdminCreator();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"settings" | "personas">("settings");

  // Global Settings
  const [responseDelay, setResponseDelay] = useState(120);
  const [aiProvider, setAiProvider] = useState<AiProvider>("anthropic");
  const [aiModel, setAiModel] = useState("claude-haiku-4-5-20251001");
  const [aiUseCustomKey, setAiUseCustomKey] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiApiKeyHash, setAiApiKeyHash] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  // AI Media Settings (global)
  const [aiMediaEnabled, setAiMediaEnabled] = useState(true);
  const [aiMediaFrequency, setAiMediaFrequency] = useState(4);
  const [aiPPVRatio, setAiPPVRatio] = useState(30);
  const [aiTeasingEnabled, setAiTeasingEnabled] = useState(true);

  // Personas (for all creators)
  const [personas, setPersonas] = useState<AiPersona[]>([]);
  const [agencyPersonas, setAgencyPersonas] = useState<AiPersona[]>([]);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<AiPersona | null>(null);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Persona form state
  const [formName, setFormName] = useState("");
  const [formTone, setFormTone] = useState("flirty");
  const [formStyle, setFormStyle] = useState("casual");
  const [formCustomPrompt, setFormCustomPrompt] = useState("");
  const [formBackground, setFormBackground] = useState("");
  const [formCoreTraits, setFormCoreTraits] = useState<string[]>([]);
  const [formFlaws, setFormFlaws] = useState<string[]>([]);
  const [formQuirks, setFormQuirks] = useState<string[]>([]);
  const [formSentenceLength, setFormSentenceLength] = useState<string>("mixed");
  const [formEmojiUsage, setFormEmojiUsage] = useState<string>("moderate");
  const [formTypicalExpressions, setFormTypicalExpressions] = useState<string[]>([]);
  const [formPunctuation, setFormPunctuation] = useState("");
  const [formInnerVoice, setFormInnerVoice] = useState("");
  const [formNeverSay, setFormNeverSay] = useState<string[]>([]);
  const [formAvoidTopics, setFormAvoidTopics] = useState<string[]>([]);
  const [formAlwaysDo, setFormAlwaysDo] = useState<string[]>([]);
  const [formTrafficShare, setFormTrafficShare] = useState(100);
  const [formPrimaryTone, setFormPrimaryTone] = useState<string>("");
  const [formToneKeywords, setFormToneKeywords] = useState<string[]>([]);
  const [formAiMediaEnabled, setFormAiMediaEnabled] = useState(true);
  const [formAiMediaFrequency, setFormAiMediaFrequency] = useState(4);
  const [formAiPPVRatio, setFormAiPPVRatio] = useState(30);
  const [formAiTeasingEnabled, setFormAiTeasingEnabled] = useState(true);
  const [formAutoHandoffEnabled, setFormAutoHandoffEnabled] = useState(true);
  const [formHandoffSpendThreshold, setFormHandoffSpendThreshold] = useState(40);
  const [formHandoffOnHighIntent, setFormHandoffOnHighIntent] = useState(true);
  const [formHandoffKeywords, setFormHandoffKeywords] = useState<string[]>([]);
  const [formGiveUpOnNonPaying, setFormGiveUpOnNonPaying] = useState(false);
  const [formGiveUpMessageThreshold, setFormGiveUpMessageThreshold] = useState(20);
  const [formGiveUpAction, setFormGiveUpAction] = useState("stop");

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;
  const isCreator = (session?.user as any)?.isCreator === true;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (selectedCreator) {
      fetchData();
    }
  }, [session, status, selectedCreator, router]);

  const fetchData = async () => {
    if (!selectedCreator?.slug) return;
    setIsLoading(true);

    try {
      // Fetch global creator settings
      const res = await fetch(`/api/creators/${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setResponseDelay(data.aiResponseDelay || 120);
        setAiProvider((data.aiProvider as AiProvider) || "anthropic");
        setAiModel(data.aiModel || "claude-haiku-4-5-20241022");
        setAiUseCustomKey(data.aiUseCustomKey || false);
        setAiApiKeyHash(data.aiApiKeyHash || null);
        setAiMediaEnabled(data.aiMediaEnabled ?? true);
        setAiMediaFrequency(data.aiMediaFrequency ?? 4);
        setAiPPVRatio(data.aiPPVRatio ?? 30);
        setAiTeasingEnabled(data.aiTeasingEnabled ?? true);

      }

      // Fetch personas for this creator (available to all creators)
      const personasRes = await fetch(`/api/creator/ai-personas?creatorSlug=${selectedCreator.slug}`);
      if (personasRes.ok) {
        const personasData = await personasRes.json();
        setPersonas(personasData.personalities || []);
      }

      // Fetch all agency personas for import (only for agency owners)
      if (isAgencyOwner && agency?.id) {
        const allRes = await fetch(`/api/agency/ai-personas?agencyId=${agency.id}`);
        if (allRes.ok) {
          const allData = await allRes.json();
          setAgencyPersonas((allData.personalities || []).filter((p: AiPersona) => p.creatorSlug !== selectedCreator.slug));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== GLOBAL SETTINGS HANDLERS ====================

  const handleSaveGlobalSettings = async () => {
    if (!selectedCreator?.slug) return;
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch(`/api/creator/ai-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          aiResponseDelay: responseDelay,
          aiProvider,
          aiModel,
          aiUseCustomKey,
          aiApiKey: aiApiKey || undefined,
          aiMediaEnabled,
          aiMediaFrequency,
          aiPPVRatio,
          aiTeasingEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiApiKeyHash) setAiApiKeyHash(data.aiApiKeyHash);
        setAiApiKey("");
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidateKey = async () => {
    if (!aiApiKey) return;
    setIsValidatingKey(true);
    setKeyValidation(null);

    try {
      const res = await fetch("/api/ai/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: aiProvider, apiKey: aiApiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeyValidation(data);
      } else {
        setKeyValidation({ valid: false, error: "Failed to validate key" });
      }
    } catch {
      setKeyValidation({ valid: false, error: "Network error" });
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!selectedCreator?.slug) return;
    try {
      const res = await fetch(`/api/creator/ai-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSlug: selectedCreator.slug, aiApiKey: null, aiUseCustomKey: false }),
      });
      if (res.ok) {
        setAiApiKey("");
        setAiApiKeyHash(null);
        setAiUseCustomKey(false);
        setKeyValidation(null);
      }
    } catch (error) {
      console.error("Error clearing key:", error);
    }
  };

  const handleProviderChange = (newProvider: AiProvider) => {
    setAiProvider(newProvider);
    const defaultModel = AI_PROVIDERS[newProvider].models.find((m) => m.default);
    setAiModel(defaultModel?.id || AI_PROVIDERS[newProvider].models[0].id);
    setKeyValidation(null);
    setAiApiKey("");
  };

  // ==================== PERSONA HANDLERS ====================

  const resetPersonaForm = () => {
    setFormName("");
    setFormTone("flirty");
    setFormStyle("casual");
    setFormCustomPrompt("");
    setFormBackground("");
    setFormCoreTraits([]);
    setFormFlaws([]);
    setFormQuirks([]);
    setFormSentenceLength("mixed");
    setFormEmojiUsage("moderate");
    setFormTypicalExpressions([]);
    setFormPunctuation("");
    setFormInnerVoice("");
    setFormNeverSay([]);
    setFormAvoidTopics([]);
    setFormAlwaysDo([]);
    setFormTrafficShare(100);
    setFormPrimaryTone("");
    setFormToneKeywords([]);
    setFormAiMediaEnabled(true);
    setFormAiMediaFrequency(4);
    setFormAiPPVRatio(30);
    setFormAiTeasingEnabled(true);
    setFormAutoHandoffEnabled(true);
    setFormHandoffSpendThreshold(40);
    setFormHandoffOnHighIntent(true);
    setFormHandoffKeywords([]);
    setFormGiveUpOnNonPaying(false);
    setFormGiveUpMessageThreshold(20);
    setFormGiveUpAction("stop");
  };

  const openCreatePersonaModal = () => {
    setEditingPersona(null);
    resetPersonaForm();
    setShowPersonaModal(true);
  };

  const openEditPersonaModal = (persona: AiPersona) => {
    setEditingPersona(persona);
    const p = persona.personality;
    setFormName(persona.name);
    setFormTone(p.tone || "flirty");
    setFormStyle(p.style || "casual");
    setFormCustomPrompt(p.customPrompt || "");
    setFormBackground(p.background || "");
    setFormCoreTraits(p.coreTraits || []);
    setFormFlaws(p.flaws || []);
    setFormQuirks(p.quirks || []);
    setFormSentenceLength(p.writingStyle?.sentenceLength || "mixed");
    setFormEmojiUsage(p.writingStyle?.emojiUsage || "moderate");
    setFormTypicalExpressions(p.writingStyle?.typicalExpressions || []);
    setFormPunctuation(p.writingStyle?.punctuation || "");
    setFormInnerVoice(p.innerVoice || "");
    setFormNeverSay(p.boundaries?.neverSay || []);
    setFormAvoidTopics(p.boundaries?.avoidTopics || []);
    setFormAlwaysDo(p.boundaries?.alwaysDo || []);
    setFormTrafficShare(persona.trafficShare);
    setFormPrimaryTone(persona.primaryTone || "");
    setFormToneKeywords(persona.toneKeywords || []);
    setFormAiMediaEnabled(persona.aiMediaEnabled ?? true);
    setFormAiMediaFrequency(persona.aiMediaFrequency ?? 4);
    setFormAiPPVRatio(persona.aiPPVRatio ?? 30);
    setFormAiTeasingEnabled(persona.aiTeasingEnabled ?? true);
    setFormAutoHandoffEnabled(persona.autoHandoffEnabled ?? true);
    setFormHandoffSpendThreshold(persona.handoffSpendThreshold ?? 40);
    setFormHandoffOnHighIntent(persona.handoffOnHighIntent ?? true);
    setFormHandoffKeywords(persona.handoffKeywords || []);
    setFormGiveUpOnNonPaying(persona.giveUpOnNonPaying ?? false);
    setFormGiveUpMessageThreshold(persona.giveUpMessageThreshold ?? 20);
    setFormGiveUpAction(persona.giveUpAction ?? "stop");
    setShowPersonaModal(true);
  };

  const handleSavePersona = async () => {
    if (!selectedCreator?.slug) return;
    setIsSavingPersona(true);

    try {
      const personalityData: PersonalityConfig = {
        tone: formTone,
        style: formStyle,
        customPrompt: formCustomPrompt || undefined,
        background: formBackground || undefined,
        coreTraits: formCoreTraits.length > 0 ? formCoreTraits : undefined,
        flaws: formFlaws.length > 0 ? formFlaws : undefined,
        quirks: formQuirks.length > 0 ? formQuirks : undefined,
        writingStyle: {
          sentenceLength: formSentenceLength as any,
          emojiUsage: formEmojiUsage as any,
          typicalExpressions: formTypicalExpressions.length > 0 ? formTypicalExpressions : undefined,
          punctuation: formPunctuation || undefined,
        },
        innerVoice: formInnerVoice || undefined,
        boundaries: {
          neverSay: formNeverSay.length > 0 ? formNeverSay : undefined,
          avoidTopics: formAvoidTopics.length > 0 ? formAvoidTopics : undefined,
          alwaysDo: formAlwaysDo.length > 0 ? formAlwaysDo : undefined,
        },
      };

      const payload = {
        name: formName,
        personality: personalityData,
        trafficShare: formTrafficShare,
        primaryTone: formPrimaryTone || null,
        toneKeywords: formToneKeywords.length > 0 ? formToneKeywords : null,
        aiMediaEnabled: formAiMediaEnabled,
        aiMediaFrequency: formAiMediaFrequency,
        aiPPVRatio: formAiPPVRatio,
        aiTeasingEnabled: formAiTeasingEnabled,
        autoHandoffEnabled: formAutoHandoffEnabled,
        handoffSpendThreshold: formHandoffSpendThreshold,
        handoffOnHighIntent: formHandoffOnHighIntent,
        handoffKeywords: formHandoffKeywords.length > 0 ? formHandoffKeywords : null,
        giveUpOnNonPaying: formGiveUpOnNonPaying,
        giveUpMessageThreshold: formGiveUpMessageThreshold,
        giveUpAction: formGiveUpAction,
      };

      if (editingPersona) {
        const res = await fetch("/api/creator/ai-personas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPersona.id, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          setPersonas((prev) => prev.map((p) => (p.id === editingPersona.id ? { ...p, ...data.personality } : p)));
          setShowPersonaModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to update persona");
        }
      } else {
        const res = await fetch("/api/creator/ai-personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorSlug: selectedCreator.slug, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          setPersonas((prev) => [
            ...prev,
            { ...data.personality, stats: { revenue30d: 0, sales30d: 0, messages30d: 0, conversations30d: 0, conversionRate: 0 } },
          ]);
          setShowPersonaModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to create persona");
        }
      }
    } catch (error) {
      console.error("Error saving persona:", error);
      alert("Something went wrong");
    } finally {
      setIsSavingPersona(false);
    }
  };

  const handleImportPersona = async (sourcePersona: AiPersona) => {
    if (!agency?.id || !selectedCreator?.slug) return;
    setImportingId(sourcePersona.id);

    try {
      const res = await fetch("/api/agency/ai-personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          creatorSlug: selectedCreator.slug,
          name: `${sourcePersona.name} (copy)`,
          personality: sourcePersona.personality,
          trafficShare: sourcePersona.trafficShare,
          primaryTone: sourcePersona.primaryTone,
          toneKeywords: sourcePersona.toneKeywords,
          aiMediaEnabled: sourcePersona.aiMediaEnabled,
          aiMediaFrequency: sourcePersona.aiMediaFrequency,
          aiPPVRatio: sourcePersona.aiPPVRatio,
          aiTeasingEnabled: sourcePersona.aiTeasingEnabled,
          autoHandoffEnabled: sourcePersona.autoHandoffEnabled,
          handoffSpendThreshold: sourcePersona.handoffSpendThreshold,
          handoffOnHighIntent: sourcePersona.handoffOnHighIntent,
          handoffKeywords: sourcePersona.handoffKeywords,
          giveUpOnNonPaying: sourcePersona.giveUpOnNonPaying,
          giveUpMessageThreshold: sourcePersona.giveUpMessageThreshold,
          giveUpAction: sourcePersona.giveUpAction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPersonas((prev) => [
          ...prev,
          { ...data.personality, stats: { revenue30d: 0, sales30d: 0, messages30d: 0, conversations30d: 0, conversionRate: 0 } },
        ]);
        setShowImportModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to import persona");
      }
    } catch (error) {
      console.error("Error importing persona:", error);
    } finally {
      setImportingId(null);
    }
  };

  const togglePersonaActive = async (persona: AiPersona) => {
    try {
      const res = await fetch("/api/creator/ai-personas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: persona.id, isActive: !persona.isActive }),
      });
      if (res.ok) {
        setPersonas((prev) => prev.map((p) => (p.id === persona.id ? { ...p, isActive: !p.isActive } : p)));
      }
    } catch (error) {
      console.error("Error toggling persona:", error);
    }
  };

  const deletePersona = async (persona: AiPersona) => {
    if (!confirm(`Delete ${persona.name}?`)) return;
    try {
      const res = await fetch(`/api/creator/ai-personas?id=${persona.id}`, { method: "DELETE" });
      if (res.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== persona.id));
      }
    } catch (error) {
      console.error("Error deleting persona:", error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(amount);

  const getCreatorName = (slug: string) => agencyCreators.find((c) => c.slug === slug)?.displayName || slug;

  // ==================== RENDER ====================

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 pt-20 lg:pt-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!selectedCreator) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card variant="luxury" className="p-8 text-center">
          <Bot className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Select a Creator</h2>
          <p className="text-[var(--muted)]">Please select a creator from the sidebar.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Girlfriend</h1>
            <p className="text-gray-400">
              Configure AI for <span className="text-purple-400">@{selectedCreator.slug}</span>
            </p>
          </div>
        </div>

        {/* Tabs for all creators */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "settings" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab("personas")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "personas" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Personas ({personas.length})
          </button>
        </div>
      </motion.div>

      {/* ==================== PERSONAS TAB (All Creators) ==================== */}
      {activeTab === "personas" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Personas Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-400">A/B test different personalities</p>
            <div className="flex gap-2">
              {agencyPersonas.length > 0 && (
                <Button variant="outline" onClick={() => setShowImportModal(true)} className="border-purple-500/50 text-purple-400">
                  <Copy className="w-4 h-4 mr-2" />
                  Import
                </Button>
              )}
              <Button variant="default" onClick={openCreatePersonaModal} className="bg-gradient-to-r from-purple-500 to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Persona
              </Button>
            </div>
          </div>

          {/* Personas List */}
          {personas.length === 0 ? (
            <Card variant="luxury" className="p-12 text-center">
              <Bot className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No personas yet</h2>
              <p className="text-gray-400 mb-6">Create AI personas to A/B test different personalities</p>
              <Button onClick={openCreatePersonaModal} className="bg-gradient-to-r from-purple-500 to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Persona
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {personas.map((persona) => (
                <Card key={persona.id} variant="luxury" className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white">{persona.name}</h3>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                persona.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                              )}
                            >
                              {persona.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                              {persona.personality.tone}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-gray-400">{persona.trafficShare}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePersonaActive(persona)}
                          className={cn("relative w-12 h-6 rounded-full transition-colors", persona.isActive ? "bg-emerald-500" : "bg-gray-600")}
                        >
                          <span
                            className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", persona.isActive ? "left-7" : "left-1")}
                          />
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => openEditPersonaModal(persona)}>
                          <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePersona(persona)} className="text-red-400">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-500">Revenue 30d</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(persona.stats.revenue30d)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-500">Messages</p>
                        <p className="text-lg font-bold text-white">{persona.stats.messages30d}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-500">Sales</p>
                        <p className="text-lg font-bold text-white">{persona.stats.sales30d}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5">
                        <p className="text-xs text-gray-500">Conversion</p>
                        <p className="text-lg font-bold text-purple-400">{persona.stats.conversionRate}%</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {activeTab === "settings" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Response Delay */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-[var(--gold)]" />
              <h3 className="font-semibold text-white">Response Delay</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Average time before AI responds (varies for realism)</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="30"
                max="600"
                step="30"
                value={responseDelay}
                onChange={(e) => setResponseDelay(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[var(--gold)]"
              />
              <span className="text-lg font-semibold text-white min-w-[80px] text-right">
                {responseDelay < 60 ? `${responseDelay}s` : `${Math.floor(responseDelay / 60)}m ${responseDelay % 60}s`}
              </span>
            </div>
          </Card>

          {/* AI Provider */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-5 h-5 text-[var(--gold)]" />
              <h3 className="font-semibold text-white">AI Provider & Model</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">Choose your AI provider. Use your own API key for free messaging.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    aiProvider === provider ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-white/10 hover:border-[var(--gold)]/50"
                  )}
                >
                  <p className="font-medium text-white">{AI_PROVIDERS[provider].name}</p>
                  <p className="text-xs text-gray-400">{AI_PROVIDERS[provider].models.length} models</p>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Model</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_PROVIDERS[aiProvider].models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setAiModel(model.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      aiModel === model.id ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-purple-500/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{model.name}</p>
                      <div className="flex items-center gap-2">
                        {model.credits && model.credits > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--gold)]/20 text-[var(--gold)]">
                            {model.credits} cr/msg
                          </span>
                        )}
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", TIER_COLORS[model.tier])}>{model.tier}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-[var(--gold)]/10 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-[var(--gold)]" />
                  <div>
                    <p className="font-medium text-white">API Key</p>
                    <p className="text-xs text-gray-400">{aiUseCustomKey && aiApiKeyHash ? "Using your custom key" : "Using platform key"}</p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full",
                    aiUseCustomKey ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"
                  )}
                >
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {aiUseCustomKey
                      ? "0 credit/msg"
                      : `${AI_PROVIDERS[aiProvider].models.find(m => m.id === aiModel)?.credits || 1} credit/msg`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 mb-4">
                <div>
                  <p className="text-sm font-medium text-white">Use my own API key</p>
                  <p className="text-xs text-gray-400">No credits charged per message</p>
                </div>
                <button
                  onClick={() => setAiUseCustomKey(!aiUseCustomKey)}
                  className={cn("relative w-12 h-6 rounded-full transition-colors", aiUseCustomKey ? "bg-emerald-500" : "bg-gray-600")}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", aiUseCustomKey ? "left-7" : "left-1")} />
                </button>
              </div>

              {aiUseCustomKey && (
                <div className="space-y-3">
                  {aiApiKeyHash && !aiApiKey && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-mono">{aiApiKeyHash}</span>
                      </div>
                      <button onClick={handleClearApiKey} className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400">
                        Remove
                      </button>
                    </div>
                  )}

                  {(!aiApiKeyHash || aiApiKey) && (
                    <div>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={aiApiKey}
                          onChange={(e) => {
                            setAiApiKey(e.target.value);
                            setKeyValidation(null);
                          }}
                          placeholder={AI_PROVIDERS[aiProvider].keyPlaceholder}
                          className="w-full px-4 py-3 pr-24 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[var(--gold)]"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={handleValidateKey}
                            disabled={!aiApiKey || isValidatingKey}
                            className="px-3 py-1.5 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] text-xs font-medium disabled:opacity-50"
                          >
                            {isValidatingKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Test"}
                          </button>
                        </div>
                      </div>
                      {keyValidation && (
                        <div className={cn("mt-2 flex items-center gap-2 text-sm", keyValidation.valid ? "text-emerald-400" : "text-red-400")}>
                          {keyValidation.valid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span>{keyValidation.valid ? "API key is valid" : keyValidation.error || "Invalid API key"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* AI Media Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-5 h-5 text-[var(--gold)]" />
              <h3 className="font-semibold text-white">AI Media Sending</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">Configure how AI sends media in conversations</p>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <div>
                <p className="font-medium text-white">Enable AI Media Sending</p>
                <p className="text-sm text-gray-400">AI can send media content in chats</p>
              </div>
              <button
                onClick={() => setAiMediaEnabled(!aiMediaEnabled)}
                className={cn("relative w-14 h-7 rounded-full transition-colors", aiMediaEnabled ? "bg-emerald-500" : "bg-gray-600")}
              >
                <span className={cn("absolute top-1 w-5 h-5 rounded-full bg-white transition-transform", aiMediaEnabled ? "left-8" : "left-1")} />
              </button>
            </div>

            {aiMediaEnabled && (
              <>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">Media Frequency</p>
                    <span className="text-lg font-semibold text-[var(--gold)]">Every ~{aiMediaFrequency} messages</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={aiMediaFrequency}
                    onChange={(e) => setAiMediaFrequency(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[var(--gold)]"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">PPV Ratio</p>
                    <span className="text-lg font-semibold text-purple-400">
                      {aiPPVRatio}% PPV / {100 - aiPPVRatio}% Free
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={aiPPVRatio}
                    onChange={(e) => setAiPPVRatio(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-medium text-white">Enable Teasing</p>
                    <p className="text-sm text-gray-400">AI teases about PPV before sending</p>
                  </div>
                  <button
                    onClick={() => setAiTeasingEnabled(!aiTeasingEnabled)}
                    className={cn("relative w-14 h-7 rounded-full transition-colors", aiTeasingEnabled ? "bg-purple-500" : "bg-gray-600")}
                  >
                    <span className={cn("absolute top-1 w-5 h-5 rounded-full bg-white transition-transform", aiTeasingEnabled ? "left-8" : "left-1")} />
                  </button>
                </div>
              </>
            )}
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div>
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Settings saved!</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>Error saving</span>
                </div>
              )}
            </div>
            <Button onClick={handleSaveGlobalSettings} disabled={isSaving} variant="premium">
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ==================== PERSONA MODAL ==================== */}
      <AnimatePresence>
        {showPersonaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto"
            >
              <Card variant="luxury" className="p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">{editingPersona ? "Edit Persona" : "Create Persona"}</h2>
                  <button onClick={() => setShowPersonaModal(false)} className="p-2 text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-400">
                      For: <span className="font-semibold">@{selectedCreator.slug}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Persona Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Flirty AI"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <Section title="Basic Personality" icon={Sparkles} defaultOpen={true}>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Tone</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TONE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormTone(opt.value)}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs transition-colors",
                              formTone === opt.value
                                ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                : "bg-[var(--surface)] border-[var(--border)] text-gray-400"
                            )}
                          >
                            {opt.emoji} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Style</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PERSONA_STYLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormStyle(opt.value)}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs transition-colors",
                              formStyle === opt.value
                                ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                : "bg-[var(--surface)] border-[var(--border)] text-gray-400"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Custom Instructions</label>
                      <textarea
                        value={formCustomPrompt}
                        onChange={(e) => setFormCustomPrompt(e.target.value)}
                        placeholder="Additional instructions..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                  </Section>

                  <Section title="Deep Character" icon={User}>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Background / Backstory</label>
                      <textarea
                        value={formBackground}
                        onChange={(e) => setFormBackground(e.target.value)}
                        placeholder="Born in Paris, moved to LA..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Core Traits</label>
                      <TagInput value={formCoreTraits} onChange={setFormCoreTraits} placeholder="spontaneous, curious..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Flaws</label>
                      <TagInput value={formFlaws} onChange={setFormFlaws} placeholder="impatient, jealous..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Quirks</label>
                      <TagInput value={formQuirks} onChange={setFormQuirks} placeholder="says 'anyway' when nervous..." />
                    </div>
                  </Section>

                  <Section title="Traffic & Handoff" icon={ArrowRightLeft}>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Traffic Share ({formTrafficShare}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formTrafficShare}
                        onChange={(e) => setFormTrafficShare(parseInt(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-white">Auto Handoff</p>
                        <p className="text-xs text-gray-400">Transfer to human chatter</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormAutoHandoffEnabled(!formAutoHandoffEnabled)}
                        className={cn("relative w-12 h-6 rounded-full transition-colors", formAutoHandoffEnabled ? "bg-purple-500" : "bg-gray-600")}
                      >
                        <span
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                            formAutoHandoffEnabled ? "left-7" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                    {formAutoHandoffEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Spend Threshold (€{formHandoffSpendThreshold})</label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          step="5"
                          value={formHandoffSpendThreshold}
                          onChange={(e) => setFormHandoffSpendThreshold(parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    )}
                  </Section>

                  <Section title="Non-Paying Fans" icon={UserX}>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
                      <p className="text-xs text-amber-400">
                        Stop AI from responding to fans who haven&apos;t made any purchases after X messages.
                        Saves AI credits on non-converting users.
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-white">Give Up on Non-Paying</p>
                        <p className="text-xs text-gray-400">Stop AI after X messages with €0 spent</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormGiveUpOnNonPaying(!formGiveUpOnNonPaying)}
                        className={cn("relative w-12 h-6 rounded-full transition-colors", formGiveUpOnNonPaying ? "bg-amber-500" : "bg-gray-600")}
                      >
                        <span
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                            formGiveUpOnNonPaying ? "left-7" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                    {formGiveUpOnNonPaying && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Message Threshold ({formGiveUpMessageThreshold} messages)
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={formGiveUpMessageThreshold}
                            onChange={(e) => setFormGiveUpMessageThreshold(parseInt(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            AI will stop after {formGiveUpMessageThreshold} messages if fan spent €0
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Action</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormGiveUpAction("stop")}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-colors",
                                formGiveUpAction === "stop"
                                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                  : "bg-[var(--surface)] border-[var(--border)] text-gray-400"
                              )}
                            >
                              <p className="font-medium text-sm">Stop</p>
                              <p className="text-xs opacity-70">No more AI responses</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormGiveUpAction("minimal")}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-colors",
                                formGiveUpAction === "minimal"
                                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                  : "bg-[var(--surface)] border-[var(--border)] text-gray-400"
                              )}
                            >
                              <p className="font-medium text-sm">Minimal</p>
                              <p className="text-xs opacity-70">Rare short responses</p>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </Section>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPersonaModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePersona}
                    disabled={isSavingPersona || !formName}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-700"
                  >
                    {isSavingPersona ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPersona ? "Update" : "Create"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== IMPORT MODAL ==================== */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <Card variant="luxury" className="p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">Import Persona</h2>
                  <button onClick={() => setShowImportModal(false)} className="p-2 text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  Copy a persona from another creator to <span className="text-purple-400">@{selectedCreator.slug}</span>
                </p>

                <div className="space-y-3">
                  {agencyPersonas.map((persona) => (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{persona.name}</p>
                          <p className="text-xs text-gray-400">
                            from @{persona.creatorSlug} ({getCreatorName(persona.creatorSlug)})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImportPersona(persona)}
                        disabled={importingId === persona.id}
                        className="border-purple-500/50 text-purple-400"
                      >
                        {importingId === persona.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
