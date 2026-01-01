"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  X,
  Loader2,
  DollarSign,
  MessageCircle,
  TrendingUp,
  Settings,
  Trash2,
  Sparkles,
  AlertTriangle,
  Sliders,
  ChevronRight,
  Image,
  Video,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AiPersonality {
  id: string;
  creatorSlug: string;
  name: string;
  personality: {
    tone?: string;
    style?: string;
    interests?: string[];
    customPrompt?: string;
  };
  primaryTone: string | null;
  trafficShare: number;
  isActive: boolean;
  // Media settings
  aiMediaEnabled: boolean;
  aiMediaFrequency: number;
  aiPPVRatio: number;
  aiTeasingEnabled: boolean;
  stats: {
    revenue30d: number;
    sales30d: number;
    messages30d: number;
    conversations30d: number;
    conversionRate: number;
  };
  createdAt: string;
}

interface Agency {
  id: string;
  name: string;
  aiEnabled: boolean;
  creators: { slug: string; displayName: string }[];
}

export default function AiPersonasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [personalities, setPersonalities] = useState<AiPersonality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<AiPersonality | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formCreatorSlug, setFormCreatorSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formTone, setFormTone] = useState("flirty");
  const [formStyle, setFormStyle] = useState("casual");
  const [formCustomPrompt, setFormCustomPrompt] = useState("");
  const [formTrafficShare, setFormTrafficShare] = useState(100);
  const [formPrimaryTone, setFormPrimaryTone] = useState<string>("");
  // Media settings form state
  const [formAiMediaEnabled, setFormAiMediaEnabled] = useState(true);
  const [formAiMediaFrequency, setFormAiMediaFrequency] = useState(4);
  const [formAiPPVRatio, setFormAiPPVRatio] = useState(30);
  const [formAiTeasingEnabled, setFormAiTeasingEnabled] = useState(true);

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

            if (ag.aiEnabled) {
              const personasRes = await fetch(`/api/agency/ai-personas?agencyId=${ag.id}`);
              if (personasRes.ok) {
                const personasData = await personasRes.json();
                setPersonalities(personasData.personalities || []);
              }
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
    setEditingPersonality(null);
    setFormCreatorSlug(agency?.creators[0]?.slug || "");
    setFormName("");
    setFormTone("flirty");
    setFormStyle("casual");
    setFormCustomPrompt("");
    setFormTrafficShare(100);
    setFormPrimaryTone("");
    // Reset media settings
    setFormAiMediaEnabled(true);
    setFormAiMediaFrequency(4);
    setFormAiPPVRatio(30);
    setFormAiTeasingEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (personality: AiPersonality) => {
    setEditingPersonality(personality);
    setFormCreatorSlug(personality.creatorSlug);
    setFormName(personality.name);
    setFormTone(personality.personality.tone || "flirty");
    setFormStyle(personality.personality.style || "casual");
    setFormCustomPrompt(personality.personality.customPrompt || "");
    setFormTrafficShare(personality.trafficShare);
    setFormPrimaryTone(personality.primaryTone || "");
    // Load media settings
    setFormAiMediaEnabled(personality.aiMediaEnabled ?? true);
    setFormAiMediaFrequency(personality.aiMediaFrequency ?? 4);
    setFormAiPPVRatio(personality.aiPPVRatio ?? 30);
    setFormAiTeasingEnabled(personality.aiTeasingEnabled ?? true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency) return;

    setIsSaving(true);
    try {
      const personalityData = {
        tone: formTone,
        style: formStyle,
        customPrompt: formCustomPrompt || undefined,
      };

      if (editingPersonality) {
        const res = await fetch("/api/agency/ai-personas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPersonality.id,
            name: formName,
            personality: personalityData,
            trafficShare: formTrafficShare,
            primaryTone: formPrimaryTone || null,
            aiMediaEnabled: formAiMediaEnabled,
            aiMediaFrequency: formAiMediaFrequency,
            aiPPVRatio: formAiPPVRatio,
            aiTeasingEnabled: formAiTeasingEnabled,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setPersonalities(prev => prev.map(p =>
            p.id === editingPersonality.id ? { ...p, ...data.personality } : p
          ));
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to update personality");
        }
      } else {
        const res = await fetch("/api/agency/ai-personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyId: agency.id,
            creatorSlug: formCreatorSlug,
            name: formName,
            personality: personalityData,
            trafficShare: formTrafficShare,
            primaryTone: formPrimaryTone || null,
            aiMediaEnabled: formAiMediaEnabled,
            aiMediaFrequency: formAiMediaFrequency,
            aiPPVRatio: formAiPPVRatio,
            aiTeasingEnabled: formAiTeasingEnabled,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setPersonalities(prev => [...prev, {
            ...data.personality,
            stats: { revenue30d: 0, sales30d: 0, messages30d: 0, conversations30d: 0, conversionRate: 0 }
          }]);
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to create personality");
        }
      }
    } catch (error) {
      console.error("Error saving personality:", error);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (personality: AiPersonality) => {
    try {
      const res = await fetch("/api/agency/ai-personas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: personality.id,
          isActive: !personality.isActive,
        }),
      });

      if (res.ok) {
        setPersonalities(prev => prev.map(p =>
          p.id === personality.id ? { ...p, isActive: !p.isActive } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling personality:", error);
    }
  };

  const deletePersonality = async (personality: AiPersonality) => {
    if (!confirm(`Are you sure you want to delete ${personality.name}?`)) return;

    try {
      const res = await fetch(`/api/agency/ai-personas?id=${personality.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPersonalities(prev => prev.filter(p => p.id !== personality.id));
      }
    } catch (error) {
      console.error("Error deleting personality:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // AI not enabled
  if (!agency?.aiEnabled) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-lg mx-auto text-center py-12 sm:py-20 px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">
            AI Features Disabled
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            AI personalities are not enabled for your agency.
            Contact the platform admin to enable this feature.
          </p>
        </div>
      </div>
    );
  }

  const toneOptions = [
    { value: "flirty", label: "Flirty", emoji: "💋" },
    { value: "sweet", label: "Sweet", emoji: "🥰" },
    { value: "spicy", label: "Spicy", emoji: "🔥" },
    { value: "playful", label: "Playful", emoji: "😜" },
    { value: "dominant", label: "Dominant", emoji: "👑" },
    { value: "submissive", label: "Submissive", emoji: "🙈" },
  ];

  const styleOptions = [
    { value: "casual", label: "Casual" },
    { value: "eloquent", label: "Eloquent" },
    { value: "teasing", label: "Teasing" },
    { value: "direct", label: "Direct" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            AI Personalities
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Create and manage AI personalities for A/B testing
          </p>
        </div>
        <Button
          variant="default"
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-purple-700 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Personality
        </Button>
      </motion.div>

      {/* List */}
      {personalities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-12 sm:py-20 px-4"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">
            No AI personalities yet
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] mb-6 sm:mb-8">
            Create AI personalities to automate messages and A/B test performance
          </p>
          <Button
            variant="default"
            onClick={openCreateModal}
            className="bg-gradient-to-r from-purple-500 to-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create First Personality
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {personalities.map((personality, index) => (
            <motion.div
              key={personality.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="luxury" className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
                            {personality.name}
                          </h3>
                          <span className={cn(
                            "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                            personality.isActive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          )}>
                            {personality.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--muted)]">
                          @{personality.creatorSlug}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-purple-500/20 text-purple-400">
                            {personality.personality.tone}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-[var(--surface)] text-[var(--muted)]">
                            {personality.personality.style}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-[var(--surface)] text-[var(--muted)]">
                            {personality.trafficShare}%
                          </span>
                          {personality.primaryTone && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs bg-purple-500/10 text-purple-400">
                              Auto: {personality.primaryTone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(personality)}
                        className={cn(
                          "relative w-12 h-6 rounded-full transition-colors",
                          personality.isActive ? "bg-emerald-500" : "bg-[var(--border)]"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          personality.isActive ? "left-7" : "left-1"
                        )} />
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(personality)}>
                        <Settings className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePersonality(personality)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Mobile Edit Button */}
                    <button
                      onClick={() => openEditModal(personality)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-0.5">Revenue 30d</p>
                      <p className="text-sm sm:text-lg font-bold text-emerald-400">
                        {formatCurrency(personality.stats.revenue30d)}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-0.5">Messages</p>
                      <p className="text-sm sm:text-lg font-bold text-[var(--foreground)]">
                        {personality.stats.messages30d}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-0.5">Sales</p>
                      <p className="text-sm sm:text-lg font-bold text-[var(--foreground)]">
                        {personality.stats.sales30d}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-0.5">Conversion</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-400">
                        {personality.stats.conversionRate}%
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions Row */}
                  <div className="flex lg:hidden items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">Active</span>
                      <button
                        onClick={() => toggleActive(personality)}
                        className={cn(
                          "relative w-10 h-5 rounded-full transition-colors",
                          personality.isActive ? "bg-emerald-500" : "bg-[var(--border)]"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          personality.isActive ? "left-5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePersonality(personality)}
                      className="text-xs text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
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
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                    {editingPersonality ? "Edit Personality" : "Create Personality"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-5 sm:mb-6">
                  {!editingPersonality && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Creator
                      </label>
                      <select
                        value={formCreatorSlug}
                        onChange={(e) => setFormCreatorSlug(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm"
                      >
                        {agency?.creators.map((creator) => (
                          <option key={creator.slug} value={creator.slug}>
                            {creator.displayName} (@{creator.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Personality Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Flirty AI"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Tone
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {toneOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormTone(opt.value)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm transition-colors",
                            formTone === opt.value
                              ? "bg-purple-500/20 border-purple-500 text-purple-400"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-purple-500/50"
                          )}
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {styleOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormStyle(opt.value)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm transition-colors",
                            formStyle === opt.value
                              ? "bg-purple-500/20 border-purple-500 text-purple-400"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-purple-500/50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Custom Instructions (optional)
                    </label>
                    <textarea
                      value={formCustomPrompt}
                      onChange={(e) => setFormCustomPrompt(e.target.value)}
                      placeholder="Add specific instructions..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Traffic Share */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      <Sliders className="w-4 h-4 inline mr-1" />
                      Conversation Share ({formTrafficShare}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formTrafficShare}
                      onChange={(e) => setFormTrafficShare(parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">
                      % of new conversations assigned to this personality
                    </p>
                  </div>

                  {/* Primary Tone (Auto-Switch) */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Auto-Switch Tone
                    </label>
                    <select
                      value={formPrimaryTone}
                      onChange={(e) => setFormPrimaryTone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-sm"
                    >
                      <option value="">None</option>
                      <option value="romantic">Romantic</option>
                      <option value="playful">Playful</option>
                      <option value="explicit">Explicit</option>
                      <option value="casual">Casual</option>
                      <option value="demanding">Demanding</option>
                    </select>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Auto-switch when conversation matches this tone
                    </p>
                  </div>

                  {/* Media Settings Section */}
                  <div className="pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Image className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">
                        Media Settings
                      </h3>
                    </div>

                    {/* AI Media Enabled Toggle */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-[var(--surface)] rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          Enable AI Media Sending
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          AI can automatically send photos/videos
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormAiMediaEnabled(!formAiMediaEnabled)}
                        className={cn(
                          "relative w-12 h-6 rounded-full transition-colors",
                          formAiMediaEnabled ? "bg-purple-500" : "bg-[var(--border)]"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          formAiMediaEnabled ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    {formAiMediaEnabled && (
                      <div className="space-y-4">
                        {/* Media Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            Media Frequency (every {formAiMediaFrequency} messages)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={formAiMediaFrequency}
                            onChange={(e) => setFormAiMediaFrequency(parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                            <span>Very frequent</span>
                            <span>Rarely</span>
                          </div>
                        </div>

                        {/* PPV Ratio */}
                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            PPV Media Ratio ({formAiPPVRatio}% paid)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formAiPPVRatio}
                            onChange={(e) => setFormAiPPVRatio(parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                            <span>All free</span>
                            <span>All PPV</span>
                          </div>
                        </div>

                        {/* Teasing Enabled Toggle */}
                        <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              Enable Teasing
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              AI teases about PPV before sending
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormAiTeasingEnabled(!formAiTeasingEnabled)}
                            className={cn(
                              "relative w-12 h-6 rounded-full transition-colors",
                              formAiTeasingEnabled ? "bg-purple-500" : "bg-[var(--border)]"
                            )}
                          >
                            <span className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                              formAiTeasingEnabled ? "left-7" : "left-1"
                            )} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={isSaving || !formName || !formCreatorSlug}
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-purple-700"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPersonality ? "Update" : "Create")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
