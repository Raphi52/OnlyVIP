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
  Key,
  Server,
  Coins,
  Eye,
  EyeOff,
  RefreshCw,
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

// AI Provider configurations
type AiProvider = "anthropic" | "openai" | "openrouter";

interface AiModel {
  id: string;
  name: string;
  tier: "free" | "fast" | "balanced" | "premium";
  default?: boolean;
}

const AI_PROVIDERS: Record<AiProvider, { name: string; models: AiModel[]; keyPlaceholder: string }> = {
  anthropic: {
    name: "Anthropic (Claude)",
    models: [
      { id: "claude-haiku-4-5-20241022", name: "Claude Haiku 4.5", tier: "fast", default: true },
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", tier: "balanced" },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4", tier: "premium" },
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

  // AI Provider Settings
  const [aiProvider, setAiProvider] = useState<AiProvider>("anthropic");
  const [aiModel, setAiModel] = useState("claude-haiku-4-5-20241022");
  const [aiUseCustomKey, setAiUseCustomKey] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiApiKeyHash, setAiApiKeyHash] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; error?: string } | null>(null);

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

        // Load AI Provider Settings
        setAiProvider((data.aiProvider as AiProvider) || "anthropic");
        setAiModel(data.aiModel || "claude-haiku-4-5-20241022");
        setAiUseCustomKey(data.aiUseCustomKey || false);
        setAiApiKeyHash(data.aiApiKeyHash || null);
        // Don't load the actual key, just the hash for display

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
          // AI Provider Settings
          aiProvider,
          aiModel,
          aiUseCustomKey,
          aiApiKey: aiApiKey || undefined, // Only send if user entered a new key
          // AI Media Settings
          aiMediaEnabled,
          aiMediaFrequency,
          aiPPVRatio,
          aiTeasingEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update the key hash from response
        if (data.aiApiKeyHash) {
          setAiApiKeyHash(data.aiApiKeyHash);
        }
        setAiApiKey(""); // Clear the input after saving
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

  // Validate API key
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

  // Clear custom API key
  const handleClearApiKey = async () => {
    if (!selectedCreator?.slug) return;

    try {
      const res = await fetch(`/api/creator/ai-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          aiApiKey: null, // Signal to remove key
          aiUseCustomKey: false,
        }),
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

  // Handle provider change - reset model to default for that provider
  const handleProviderChange = (newProvider: AiProvider) => {
    setAiProvider(newProvider);
    const defaultModel = AI_PROVIDERS[newProvider].models.find((m) => m.default);
    setAiModel(defaultModel?.id || AI_PROVIDERS[newProvider].models[0].id);
    // Clear key validation when switching providers
    setKeyValidation(null);
    setAiApiKey("");
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

      {/* AI Provider Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-[var(--gold)]" />
            <h3 className="font-semibold text-white">AI Provider & Model</h3>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Choose your AI provider and model. Use your own API key for free messaging.
          </p>

          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((provider) => (
              <button
                key={provider}
                onClick={() => handleProviderChange(provider)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  aiProvider === provider
                    ? "border-[var(--gold)] bg-[var(--gold)]/10"
                    : "border-white/10 hover:border-[var(--gold)]/50"
                }`}
              >
                <p className="font-medium text-white">{AI_PROVIDERS[provider].name}</p>
                <p className="text-xs text-gray-400">{AI_PROVIDERS[provider].models.length} models</p>
              </button>
            ))}
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Model</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AI_PROVIDERS[aiProvider].models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAiModel(model.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiModel === model.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 hover:border-purple-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{model.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${TIER_COLORS[model.tier]}`}>
                      {model.tier}
                    </span>
                  </div>
                  {model.default && (
                    <p className="text-xs text-gray-500 mt-1">Recommended</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-[var(--gold)]/10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-[var(--gold)]" />
                <div>
                  <p className="font-medium text-white">API Key</p>
                  <p className="text-xs text-gray-400">
                    {aiUseCustomKey && aiApiKeyHash ? "Using your custom key" : "Using platform key"}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                aiUseCustomKey && aiApiKeyHash
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-purple-500/20 text-purple-400"
              }`}>
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {aiUseCustomKey && aiApiKeyHash ? "FREE" : "1 credit/msg"}
                </span>
              </div>
            </div>

            {/* Toggle Custom Key */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 mb-4">
              <div>
                <p className="text-sm font-medium text-white">Use my own API key</p>
                <p className="text-xs text-gray-400">No credits charged per message</p>
              </div>
              <button
                onClick={() => setAiUseCustomKey(!aiUseCustomKey)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  aiUseCustomKey ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    aiUseCustomKey ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* API Key Input */}
            {aiUseCustomKey && (
              <div className="space-y-3">
                {/* Show existing key hash */}
                {aiApiKeyHash && !aiApiKey && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-mono">{aiApiKeyHash}</span>
                    </div>
                    <button
                      onClick={handleClearApiKey}
                      className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* New key input */}
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
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleValidateKey}
                          disabled={!aiApiKey || isValidatingKey}
                          className="px-3 py-1.5 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] text-xs font-medium hover:bg-[var(--gold)]/30 disabled:opacity-50"
                        >
                          {isValidatingKey ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Validation result */}
                    {keyValidation && (
                      <div className={`mt-2 flex items-center gap-2 text-sm ${
                        keyValidation.valid ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {keyValidation.valid ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>API key is valid</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            <span>{keyValidation.error || "Invalid API key"}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Get your API key from{" "}
                  {aiProvider === "anthropic" && (
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
                      console.anthropic.com
                    </a>
                  )}
                  {aiProvider === "openai" && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
                      platform.openai.com
                    </a>
                  )}
                  {aiProvider === "openrouter" && (
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
                      openrouter.ai
                    </a>
                  )}
                </p>
              </div>
            )}
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
