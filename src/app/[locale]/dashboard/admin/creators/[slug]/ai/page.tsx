"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Clock,
  MessageSquare,
  Zap,
  AlertCircle,
  CheckCircle,
  Image,
  Plus,
  X,
  Tag,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

interface AiPersonality {
  name: string;
  age: number;
  traits: string[];
  interests: string[];
  style: "casual_sexy" | "romantic" | "dominant" | "submissive" | "girlfriend";
  language: string;
  customPrompt?: string;
  mediaKeywords?: Record<string, string[]>;
}

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "nl", label: "Nederlands", flag: "🇳🇱" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
];

const DEFAULT_MEDIA_KEYWORDS: Record<string, string[]> = {
  sexy: ["hot", "nude", "naked", "explicit", "naughty", "spicy", "pics", "photos", "show me", "see you", "uncensored", "wild", "dirty", "horny"],
  fitness: ["workout", "gym", "sport", "exercise", "fit", "body", "abs", "muscles", "training", "sweat", "yoga", "stretching"],
  lingerie: ["lingerie", "underwear", "bra", "panties", "sexy outfit", "lace", "thong", "corset", "stockings", "garter"],
  beach: ["beach", "bikini", "pool", "swim", "tan", "summer", "vacation", "tropical", "sun", "water"],
  casual: ["selfie", "daily", "lifestyle", "chill", "relax", "cute", "morning", "night", "bed", "cozy"],
  cosplay: ["cosplay", "costume", "anime", "character", "roleplay", "fantasy", "dress up", "halloween"],
  outdoor: ["outdoor", "nature", "forest", "park", "hiking", "adventure", "outside", "garden"],
  shower: ["shower", "bath", "wet", "water", "soap", "bubbles", "bathroom", "towel", "steam"],
  mirror: ["mirror", "reflection", "selfie", "bathroom", "dressing room", "fitting room"],
  feet: ["feet", "toes", "foot", "soles", "pedicure", "barefoot", "heels", "shoes"],
  ass: ["ass", "booty", "butt", "behind", "back", "twerk", "booty pics"],
  boobs: ["boobs", "tits", "chest", "cleavage", "topless", "braless", "breasts"],
  face: ["face", "smile", "eyes", "lips", "kiss", "tongue", "wink", "expression"],
  video: ["video", "clip", "watch", "motion", "moving", "action", "live"],
  exclusive: ["exclusive", "special", "private", "vip", "premium", "rare", "limited"],
};

const STYLE_OPTIONS = [
  { value: "casual_sexy", label: "Casual & Sexy", description: "Flirty, confident, teasing" },
  { value: "romantic", label: "Romantic", description: "Sweet, caring, emotional" },
  { value: "dominant", label: "Dominant", description: "Confident, in control, demanding" },
  { value: "submissive", label: "Submissive", description: "Shy, eager to please, sweet" },
  { value: "girlfriend", label: "Girlfriend Experience", description: "Caring, personal, remembers details" },
];

const TRAIT_OPTIONS = [
  "flirty", "playful", "mysterious", "confident", "shy", "sweet",
  "teasing", "caring", "naughty", "innocent", "bold", "romantic",
];

const INTEREST_OPTIONS = [
  "fitness", "photography", "travel", "fashion", "music", "art",
  "cooking", "gaming", "reading", "yoga", "dancing", "nature",
];

export default function CreatorAiSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Creator data
  const [creatorName, setCreatorName] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [responseDelay, setResponseDelay] = useState(120);

  // Personality
  const [personality, setPersonality] = useState<AiPersonality>({
    name: "",
    age: 24,
    traits: ["flirty", "playful", "confident"],
    interests: ["fitness", "photography", "travel"],
    style: "casual_sexy",
    language: "en",
    customPrompt: "",
    mediaKeywords: DEFAULT_MEDIA_KEYWORDS,
  });

  // For adding new category/keyword
  const [newCategory, setNewCategory] = useState("");
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (status === "loading" || !slug) return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchCreator();
  }, [session, status, isAdmin, router, slug]);

  const fetchCreator = async () => {
    try {
      const res = await fetch(`/api/admin/creators/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCreatorName(data.displayName || data.name);
        setAiEnabled(data.aiEnabled || false);
        setResponseDelay(data.aiResponseDelay || 120);

        if (data.aiPersonality) {
          try {
            const parsed = JSON.parse(data.aiPersonality);
            setPersonality({
              name: parsed.name || data.displayName || "",
              age: parsed.age || 24,
              traits: parsed.traits || ["flirty", "playful", "confident"],
              interests: parsed.interests || ["fitness", "photography", "travel"],
              style: parsed.style || "casual_sexy",
              language: parsed.language || "en",
              customPrompt: parsed.customPrompt || "",
              mediaKeywords: parsed.mediaKeywords || DEFAULT_MEDIA_KEYWORDS,
            });
          } catch {
            // Use defaults
          }
        } else {
          setPersonality((prev) => ({ ...prev, name: data.displayName || "", language: "en", mediaKeywords: DEFAULT_MEDIA_KEYWORDS }));
        }
      }
    } catch (error) {
      console.error("Error fetching creator:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch(`/api/admin/creators/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiEnabled,
          aiResponseDelay: responseDelay,
          aiPersonality: JSON.stringify(personality),
        }),
      });

      if (res.ok) {
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

  const handleTestAi = async () => {
    setIsTesting(true);
    setTestResponse(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality,
          testMessage: "Hey beautiful, how are you today?",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResponse(data.response);
      } else {
        setTestResponse("Error generating response. Check your API key.");
      }
    } catch (error) {
      setTestResponse("Error generating response. Check your API key.");
    } finally {
      setIsTesting(false);
    }
  };

  const toggleTrait = (trait: string) => {
    setPersonality((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait],
    }));
  };

  const toggleInterest = (interest: string) => {
    setPersonality((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  // Media Keywords management
  const addCategory = () => {
    if (!newCategory.trim()) return;
    const categoryKey = newCategory.toLowerCase().replace(/\s+/g, "_");
    if (personality.mediaKeywords?.[categoryKey]) return;

    setPersonality((prev) => ({
      ...prev,
      mediaKeywords: {
        ...prev.mediaKeywords,
        [categoryKey]: [],
      },
    }));
    setNewCategory("");
  };

  const removeCategory = (category: string) => {
    setPersonality((prev) => {
      const updated = { ...prev.mediaKeywords };
      delete updated[category];
      return { ...prev, mediaKeywords: updated };
    });
  };

  const addKeywordToCategory = (category: string) => {
    const keyword = newKeyword[category]?.trim().toLowerCase();
    if (!keyword) return;
    if (personality.mediaKeywords?.[category]?.includes(keyword)) return;

    setPersonality((prev) => ({
      ...prev,
      mediaKeywords: {
        ...prev.mediaKeywords,
        [category]: [...(prev.mediaKeywords?.[category] || []), keyword],
      },
    }));
    setNewKeyword((prev) => ({ ...prev, [category]: "" }));
  };

  const removeKeyword = (category: string, keyword: string) => {
    setPersonality((prev) => ({
      ...prev,
      mediaKeywords: {
        ...prev.mediaKeywords,
        [category]: prev.mediaKeywords?.[category]?.filter((k) => k !== keyword) || [],
      },
    }));
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/dashboard/admin/creators"
          className="inline-flex items-center text-[var(--muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Creators
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              AI Settings - {creatorName}
            </h1>
            <p className="text-[var(--muted)]">
              Configure AI auto-responses for this creator
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiEnabled ? "bg-purple-500/20" : "bg-gray-500/20"}`}>
                <Zap className={`w-6 h-6 ${aiEnabled ? "text-purple-400" : "text-gray-400"}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  AI Girlfriend Mode
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  When enabled, AI will automatically respond to fan messages
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                aiEnabled ? "bg-purple-500" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  aiEnabled ? "translate-x-7" : ""
                }`}
              />
            </button>
          </div>
        </Card>
      </motion.div>

      {aiEnabled && (
        <>
          {/* Response Delay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Response Delay</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-4">
                Average time before AI responds (will vary ±50% for realism)
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="30"
                  value={responseDelay}
                  onChange={(e) => setResponseDelay(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--gold)]"
                />
                <span className="text-lg font-semibold text-[var(--foreground)] min-w-[80px] text-right">
                  {responseDelay < 60
                    ? `${responseDelay}s`
                    : `${Math.floor(responseDelay / 60)}m ${responseDelay % 60}s`}
                </span>
              </div>
            </Card>
          </motion.div>

          {/* Personality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Personality</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={personality.name}
                    onChange={(e) => setPersonality({ ...personality, name: e.target.value })}
                    placeholder="Mia"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={personality.age}
                    onChange={(e) => setPersonality({ ...personality, age: parseInt(e.target.value) || 24 })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Language
                  </label>
                  <select
                    value={personality.language}
                    onChange={(e) => setPersonality({ ...personality, language: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Style */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                  Communication Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setPersonality({ ...personality, style: style.value as AiPersonality["style"] })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        personality.style === style.value
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-[var(--border)] hover:border-[var(--gold)]/50"
                      }`}
                    >
                      <p className="font-medium text-[var(--foreground)]">{style.label}</p>
                      <p className="text-xs text-[var(--muted)]">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Traits */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                  Personality Traits
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRAIT_OPTIONS.map((trait) => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        personality.traits.includes(trait)
                          ? "bg-purple-500 text-white"
                          : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface)]/80"
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        personality.interests.includes(interest)
                          ? "bg-[var(--gold)] text-black"
                          : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface)]/80"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={personality.customPrompt}
                  onChange={(e) => setPersonality({ ...personality, customPrompt: e.target.value })}
                  placeholder="Add any specific behavior or context for the AI..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] resize-none"
                />
              </div>
            </Card>
          </motion.div>

          {/* Media Keywords */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Image className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-semibold text-[var(--foreground)]">PPV Media Keywords</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6">
                Configure which keywords trigger which type of paid content. When a fan&apos;s message contains these keywords, the AI will suggest relevant PPV media.
              </p>

              {/* Existing Categories */}
              <div className="space-y-4 mb-6">
                {Object.entries(personality.mediaKeywords || {}).map(([category, keywords]) => (
                  <div key={category} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        <span className="font-medium text-[var(--foreground)] capitalize">
                          {category.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          ({keywords.length} keywords)
                        </span>
                      </div>
                      <button
                        onClick={() => removeCategory(category)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Remove category"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => removeKeyword(category, keyword)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add keyword input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword[category] || ""}
                        onChange={(e) => setNewKeyword((prev) => ({ ...prev, [category]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addKeywordToCategory(category)}
                        placeholder="Add keyword..."
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => addKeywordToCategory(category)}
                        className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Category */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="New category name (e.g., 'cosplay', 'outdoor')..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
                />
                <Button onClick={addCategory} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              </div>

              {/* Help text */}
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  <strong>Tip:</strong> Make sure your media titles, descriptions, or tags match these keywords.
                  For example, if you have a &quot;Beach Photoshoot&quot; media with price $9.99,
                  the AI will suggest it when a fan asks about &quot;bikini&quot; or &quot;beach&quot;.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Test AI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Test AI Response</h3>
              </div>
              <p className="text-sm text-[var(--muted)] mb-4">
                Send a test message to see how the AI will respond
              </p>

              <Button
                onClick={handleTestAi}
                disabled={isTesting}
                variant="outline"
                className="mb-4"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test: "Hey beautiful, how are you today?"
                  </>
                )}
              </Button>

              {testResponse && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <p className="text-sm text-[var(--foreground)]">{testResponse}</p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between"
      >
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
              <span>Error saving settings</span>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} variant="premium">
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
      </motion.div>
    </div>
  );
}
