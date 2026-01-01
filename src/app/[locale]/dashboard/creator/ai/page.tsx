"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot,
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
  Send,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

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
];

const DEFAULT_MEDIA_KEYWORDS: Record<string, string[]> = {
  sexy: ["hot", "nude", "naked", "explicit", "naughty", "spicy", "pics", "photos", "show me"],
  fitness: ["workout", "gym", "sport", "exercise", "fit", "body", "abs", "muscles"],
  lingerie: ["lingerie", "underwear", "bra", "panties", "sexy outfit", "lace"],
  beach: ["beach", "bikini", "pool", "swim", "tan", "summer", "vacation"],
  casual: ["selfie", "daily", "lifestyle", "chill", "relax", "cute", "morning"],
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

export default function CreatorAiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedCreator } = useAdminCreator();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const [responseDelay, setResponseDelay] = useState(120);

  // AI Media Settings
  const [aiMediaEnabled, setAiMediaEnabled] = useState(true);
  const [aiMediaFrequency, setAiMediaFrequency] = useState(4);
  const [aiPPVRatio, setAiPPVRatio] = useState(30);
  const [aiTeasingEnabled, setAiTeasingEnabled] = useState(true);

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

  const [newCategory, setNewCategory] = useState("");
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (selectedCreator) {
      fetchCreatorSettings();
    }
  }, [session, status, selectedCreator, router]);

  const fetchCreatorSettings = async () => {
    if (!selectedCreator?.slug) return;

    try {
      const res = await fetch(`/api/creators/${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setResponseDelay(data.aiResponseDelay || 120);

        // Load AI Media Settings
        setAiMediaEnabled(data.aiMediaEnabled ?? true);
        setAiMediaFrequency(data.aiMediaFrequency ?? 4);
        setAiPPVRatio(data.aiPPVRatio ?? 30);
        setAiTeasingEnabled(data.aiTeasingEnabled ?? true);

        if (data.aiPersonality) {
          try {
            const parsed = JSON.parse(data.aiPersonality);
            setPersonality({
              name: parsed.name || selectedCreator.displayName || "",
              age: parsed.age || 24,
              traits: parsed.traits || ["flirty", "playful", "confident"],
              interests: parsed.interests || ["fitness", "photography", "travel"],
              style: parsed.style || "casual_sexy",
              language: parsed.language || "en",
              customPrompt: parsed.customPrompt || "",
              mediaKeywords: parsed.mediaKeywords || DEFAULT_MEDIA_KEYWORDS,
            });
          } catch {
            setPersonality((prev) => ({ ...prev, name: selectedCreator.displayName || "" }));
          }
        } else {
          setPersonality((prev) => ({ ...prev, name: selectedCreator.displayName || "" }));
        }
      }
    } catch (error) {
      console.error("Error fetching creator settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
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
          aiPersonality: JSON.stringify(personality),
          // AI Media Settings
          aiMediaEnabled,
          aiMediaFrequency,
          aiPPVRatio,
          aiTeasingEnabled,
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
        setTestResponse("Error generating response.");
      }
    } catch {
      setTestResponse("Error generating response.");
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

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const categoryKey = newCategory.toLowerCase().replace(/\s+/g, "_");
    if (personality.mediaKeywords?.[categoryKey]) return;

    setPersonality((prev) => ({
      ...prev,
      mediaKeywords: { ...prev.mediaKeywords, [categoryKey]: [] },
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
      <div className="p-8 pt-20 lg:pt-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!selectedCreator?.aiEnabled) {
    return (
      <div className="p-8 pt-20 lg:pt-8 flex items-center justify-center min-h-[50vh]">
        <Card className="p-8 text-center max-w-md">
          <Bot className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">AI Not Enabled</h2>
          <p className="text-gray-400">
            Contact the platform admin to enable AI Girlfriend mode for your profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Girlfriend Settings</h1>
            <p className="text-gray-400">Configure your AI personality</p>
          </div>
        </div>
      </motion.div>

      {/* Response Delay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">Response Delay</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Average time before AI responds (varies for realism)
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
            <span className="text-lg font-semibold text-white min-w-[80px] text-right">
              {responseDelay < 60
                ? `${responseDelay}s`
                : `${Math.floor(responseDelay / 60)}m ${responseDelay % 60}s`}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* AI Media Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">AI Media Sending</h3>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Configure how AI sends free and PPV media in conversations
          </p>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div>
              <p className="font-medium text-white">Enable AI Media Sending</p>
              <p className="text-sm text-gray-400">AI can send media content in chats</p>
            </div>
            <button
              onClick={() => setAiMediaEnabled(!aiMediaEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                aiMediaEnabled ? "bg-emerald-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  aiMediaEnabled ? "left-8" : "left-1"
                }`}
              />
            </button>
          </div>

          {aiMediaEnabled && (
            <>
              {/* Media Frequency */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">Media Frequency</p>
                  <span className="text-lg font-semibold text-[var(--gold)]">
                    Every ~{aiMediaFrequency} messages
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Average number of messages before AI sends media
                </p>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={aiMediaFrequency}
                  onChange={(e) => setAiMediaFrequency(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--gold)]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More frequent (2)</span>
                  <span>Less frequent (10)</span>
                </div>
              </div>

              {/* PPV Ratio */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">PPV Ratio</p>
                  <span className="text-lg font-semibold text-purple-400">
                    {aiPPVRatio}% PPV / {100 - aiPPVRatio}% Free
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Percentage of media that are paid (PPV) vs free
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={aiPPVRatio}
                  onChange={(e) => setAiPPVRatio(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>All free (0%)</span>
                  <span>All PPV (100%)</span>
                </div>
              </div>

              {/* Teasing Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="font-medium text-white">Enable Teasing</p>
                  <p className="text-sm text-gray-400">
                    AI sometimes teases about PPV content before sending
                  </p>
                </div>
                <button
                  onClick={() => setAiTeasingEnabled(!aiTeasingEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    aiTeasingEnabled ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      aiTeasingEnabled ? "left-8" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Personality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">Personality</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Character Name</label>
              <input
                type="text"
                value={personality.name}
                onChange={(e) => setPersonality({ ...personality, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={personality.age}
                onChange={(e) => setPersonality({ ...personality, age: parseInt(e.target.value) || 24 })}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Language</label>
              <select
                value={personality.language}
                onChange={(e) => setPersonality({ ...personality, language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--gold)]"
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
            <label className="block text-sm font-medium text-white mb-3">Communication Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setPersonality({ ...personality, style: style.value as AiPersonality["style"] })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    personality.style === style.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 hover:border-[var(--gold)]/50"
                  }`}
                >
                  <p className="font-medium text-white">{style.label}</p>
                  <p className="text-xs text-gray-400">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Traits */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-white mb-3">Personality Traits</label>
            <div className="flex flex-wrap gap-2">
              {TRAIT_OPTIONS.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    personality.traits.includes(trait)
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-white mb-3">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    personality.interests.includes(interest)
                      ? "bg-[var(--gold)] text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-white mb-2">Custom Instructions (Optional)</label>
            <textarea
              value={personality.customPrompt}
              onChange={(e) => setPersonality({ ...personality, customPrompt: e.target.value })}
              placeholder="Add any specific behavior or context..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)] resize-none"
            />
          </div>
        </Card>
      </motion.div>

      {/* Media Keywords */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Image className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">PPV Media Keywords</h3>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Configure which keywords trigger which type of paid content
          </p>

          <div className="space-y-4 mb-6">
            {Object.entries(personality.mediaKeywords || {}).map(([category, keywords]) => (
              <div key={category} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-white capitalize">{category.replace(/_/g, " ")}</span>
                  </div>
                  <button
                    onClick={() => removeCategory(category)}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm"
                    >
                      {keyword}
                      <button onClick={() => removeKeyword(category, keyword)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword[category] || ""}
                    onChange={(e) => setNewKeyword((prev) => ({ ...prev, [category]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addKeywordToCategory(category)}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => addKeywordToCategory(category)}
                    className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="New category name..."
              className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]"
            />
            <Button onClick={addCategory} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Test AI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">Test AI Response</h3>
          </div>

          <Button onClick={handleTestAi} disabled={isTesting} variant="outline" className="mb-4">
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test Response
              </>
            )}
          </Button>

          {testResponse && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <p className="text-sm text-white">{testResponse}</p>
            </div>
          )}
        </Card>
      </motion.div>

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
              <span>Error saving</span>
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
