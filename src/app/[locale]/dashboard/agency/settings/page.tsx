"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Save,
  Loader2,
  Camera,
  AlertTriangle,
  Trash2,
  X,
  Users,
  Bot,
  Crown,
  Server,
  Key,
  Coins,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  aiEnabled: boolean;
  // AI Provider Settings
  aiProvider: string;
  aiModel: string;
  aiApiKeyHash: string | null;
  aiUseCustomKey: boolean;
  stats: {
    creatorsCount: number;
    chattersCount: number;
    aiPersonalitiesCount: number;
  };
}

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

export default function AgencySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Provider Settings
  const [aiProvider, setAiProvider] = useState<AiProvider>("anthropic");
  const [aiModel, setAiModel] = useState("claude-haiku-4-5-20241022");
  const [aiUseCustomKey, setAiUseCustomKey] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiApiKeyHash, setAiApiKeyHash] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [isSavingAi, setIsSavingAi] = useState(false);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;
  const { refreshAgency } = useAdminCreator();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    try {
      const res = await fetch("/api/agency");
      if (res.ok) {
        const data = await res.json();
        if (data.agencies && data.agencies.length > 0) {
          const agencyData = data.agencies[0];
          setAgency(agencyData);
          setName(agencyData.name);
          setWebsite(agencyData.website || "");
          setLogoPreview(agencyData.logo);
          // Load AI Provider Settings
          setAiProvider((agencyData.aiProvider as AiProvider) || "anthropic");
          setAiModel(agencyData.aiModel || "claude-haiku-4-5-20241022");
          setAiUseCustomKey(agencyData.aiUseCustomKey || false);
          setAiApiKeyHash(agencyData.aiApiKeyHash || null);
        }
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 5MB" });
      return;
    }

    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!agency) return;
    setIsSaving(true);
    setMessage(null);

    try {
      let logoUrl = agency.logo;

      // Upload new logo if selected
      if (selectedLogo) {
        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append("files", selectedLogo);
        formData.append("type", "avatar");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.files?.[0]?.url || null;
        } else {
          const errorData = await uploadRes.json();
          setMessage({ type: "error", text: errorData.error || "Failed to upload logo" });
          setIsSaving(false);
          setIsUploadingLogo(false);
          return;
        }
        setIsUploadingLogo(false);
      }

      // Update agency
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          name: name.trim(),
          logo: logoUrl,
          website: website.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgency({ ...agency, ...data.agency });
        setSelectedLogo(null);
        setMessage({ type: "success", text: "Agency settings saved successfully!" });
        // Refresh the sidebar agency card
        await refreshAgency();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving agency:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
      setIsUploadingLogo(false);
    }
  };

  const handleDelete = async () => {
    if (!agency || deleteConfirmName !== agency.name) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/agency?id=${agency.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to delete agency" });
      }
    } catch (error) {
      console.error("Error deleting agency:", error);
      setMessage({ type: "error", text: "Failed to delete agency" });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // AI Provider handlers
  const handleProviderChange = (newProvider: AiProvider) => {
    setAiProvider(newProvider);
    const defaultModel = AI_PROVIDERS[newProvider].models.find((m) => m.default);
    setAiModel(defaultModel?.id || AI_PROVIDERS[newProvider].models[0].id);
    setKeyValidation(null);
    setAiApiKey("");
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

  const handleSaveAi = async () => {
    if (!agency) return;
    setIsSavingAi(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agency/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          aiProvider,
          aiModel,
          aiUseCustomKey,
          aiApiKey: aiApiKey || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiApiKeyHash) {
          setAiApiKeyHash(data.aiApiKeyHash);
        }
        setAiApiKey("");
        setMessage({ type: "success", text: "AI settings saved!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save AI settings" });
      }
    } catch (error) {
      console.error("Error saving AI settings:", error);
      setMessage({ type: "error", text: "Failed to save AI settings" });
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!agency) return;

    try {
      const res = await fetch("/api/agency/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.id,
          aiApiKey: null,
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Agency not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Agency Settings</h1>
          <p className="text-[var(--muted)] mt-1">Manage your agency profile and settings</p>
        </div>

        {/* Agency Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" className="p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Agency Profile
            </h2>

            {/* Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 px-4 py-3 rounded-xl ${
                  message.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-purple-500/30 bg-[var(--surface)]">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Agency Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-purple-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-[var(--muted)] mt-3">
                Click to change agency logo
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="My Agency"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="https://myagency.com"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Your agency's website (optional)
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8">
              <Button
                variant="default"
                onClick={handleSave}
                disabled={isSaving || (!selectedLogo && name === agency.name && website === (agency.website || ""))}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isUploadingLogo ? "Uploading logo..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* AI Provider Settings Card */}
        {agency?.aiEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                AI Provider & Model
              </h2>
              <p className="text-sm text-[var(--muted)] mb-6">
                Configure the default AI provider for all creators. Use your own API key for free messaging.
              </p>

              {/* Provider Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => handleProviderChange(provider)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      aiProvider === provider
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-[var(--border)] hover:border-purple-500/50"
                    }`}
                  >
                    <p className="font-medium text-[var(--foreground)]">{AI_PROVIDERS[provider].name}</p>
                    <p className="text-xs text-[var(--muted)]">{AI_PROVIDERS[provider].models.length} models</p>
                  </button>
                ))}
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Model</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_PROVIDERS[aiProvider].models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        aiModel === model.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-[var(--border)] hover:border-purple-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[var(--foreground)]">{model.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${TIER_COLORS[model.tier]}`}>
                          {model.tier}
                        </span>
                      </div>
                      {model.default && (
                        <p className="text-xs text-[var(--muted)] mt-1">Recommended</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Section */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">API Key</p>
                      <p className="text-xs text-[var(--muted)]">
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] mb-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Use my own API key</p>
                    <p className="text-xs text-[var(--muted)]">No credits charged per message</p>
                  </div>
                  <button
                    onClick={() => setAiUseCustomKey(!aiUseCustomKey)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      aiUseCustomKey ? "bg-emerald-500" : "bg-[var(--border)]"
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
                            className="w-full px-4 py-3 pr-24 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--muted)]"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={handleValidateKey}
                              disabled={!aiApiKey || isValidatingKey}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 disabled:opacity-50"
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
                                <AlertTriangle className="w-4 h-4" />
                                <span>{keyValidation.error || "Invalid API key"}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[var(--muted)]">
                      Get your API key from{" "}
                      {aiProvider === "anthropic" && (
                        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          console.anthropic.com
                        </a>
                      )}
                      {aiProvider === "openai" && (
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          platform.openai.com
                        </a>
                      )}
                      {aiProvider === "openrouter" && (
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                          openrouter.ai
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Save AI Settings Button */}
              <div className="mt-6">
                <Button
                  variant="default"
                  onClick={handleSaveAi}
                  disabled={isSavingAi}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  {isSavingAi ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving AI Settings...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save AI Settings
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Limits & Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" className="p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              Limits & Usage
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Creators */}
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-[var(--muted)]">Creators</span>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {agency.stats.creatorsCount}
                </p>
              </div>

              {/* Chatters */}
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-[var(--muted)]">Chatters</span>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {agency.stats.chattersCount}
                </p>
              </div>

              {/* AI Personas */}
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-[var(--muted)]">AI Personas</span>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {agency.stats.aiPersonalitiesCount}
                </p>
                {!agency.aiEnabled && (
                  <p className="text-xs text-amber-400 mt-1">AI disabled</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" className="p-6 border-red-500/30">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-[var(--muted)] text-sm mb-4">
              Deleting your agency will remove all associated data including chatters and AI personas.
              This action cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Agency
            </Button>
          </Card>
        </motion.div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    Delete Agency
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-red-300 mb-4">
                This will permanently delete <strong>"{agency.name}"</strong> and all associated data.
                This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Type <strong>{agency.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-red-500/30 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Agency name"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmName !== agency.name}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
