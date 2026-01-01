"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input } from "@/components/ui";
import {
  Building2,
  Plus,
  X,
  Users,
  Bot,
  MessageSquare,
  DollarSign,
  Loader2,
  RefreshCw,
  Settings,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
  slug: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  aiEnabled: boolean;
  platformFee: number;
  status: string;
  totalRevenue: number;
  stats: {
    creators: number;
    chatters: number;
    aiPersonalities: number;
    revenue30d: number;
  };
  createdAt: string;
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new agency
  const [formName, setFormName] = useState("");
  const [formOwnerEmail, setFormOwnerEmail] = useState("");

  // Settings form state
  const [settingsAiEnabled, setSettingsAiEnabled] = useState(false);
  const [settingsPlatformFee, setSettingsPlatformFee] = useState(10);

  const fetchAgencies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/agencies");
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const openCreateModal = () => {
    setFormName("");
    setFormOwnerEmail("");
    setShowModal(true);
  };

  const openSettingsModal = (agency: Agency) => {
    setSelectedAgency(agency);
    setSettingsAiEnabled(agency.aiEnabled);
    setSettingsPlatformFee(agency.platformFee * 100);
    setShowSettingsModal(true);
  };

  const handleCreate = async () => {
    if (!formName || !formOwnerEmail) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          ownerEmail: formOwnerEmail,
        }),
      });

      if (res.ok) {
        await fetchAgencies();
        setShowModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create agency");
      }
    } catch (error) {
      console.error("Error creating agency:", error);
      alert("Failed to create agency");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedAgency) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAgency.id,
          aiEnabled: settingsAiEnabled,
          platformFee: settingsPlatformFee / 100,
        }),
      });

      if (res.ok) {
        await fetchAgencies();
        setShowSettingsModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update agency");
      }
    } catch (error) {
      console.error("Error updating agency:", error);
      alert("Failed to update agency");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAI = async (agency: Agency) => {
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          aiEnabled: !agency.aiEnabled,
        }),
      });

      if (res.ok) {
        setAgencies((prev) =>
          prev.map((a) =>
            a.id === agency.id ? { ...a, aiEnabled: !a.aiEnabled } : a
          )
        );
      }
    } catch (error) {
      console.error("Error toggling AI:", error);
    }
  };

  const toggleStatus = async (agency: Agency) => {
    const newStatus = agency.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setAgencies((prev) =>
          prev.map((a) => (a.id === agency.id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            Agencies
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Manage all agencies on the platform
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={fetchAgencies}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="premium" onClick={openCreateModal} className="flex-1 sm:flex-none">
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Agency</span>
          </Button>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
        </div>
      ) : agencies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center py-12 sm:py-20 px-4"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--gold)]/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--gold)]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">
            No agencies yet
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] mb-6 sm:mb-8">
            Create your first agency to manage multiple creators with chatters and AI.
          </p>
          <Button variant="premium" onClick={openCreateModal}>
            <Plus className="w-5 h-5 mr-2" />
            Create Agency
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {agencies.map((agency, index) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="luxury" className="p-4 sm:p-6">
                {/* Mobile Layout */}
                <div className="flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--gold)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base sm:text-xl font-bold text-[var(--foreground)] truncate">
                            {agency.name}
                          </h3>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                              agency.status === "ACTIVE"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : agency.status === "SUSPENDED"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            )}
                          >
                            {agency.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--muted)] truncate">
                          {agency.owner.name || agency.owner.email}
                        </p>
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted)]">AI</span>
                        <button
                          onClick={() => toggleAI(agency)}
                          className={cn(
                            "relative w-12 h-6 rounded-full transition-colors",
                            agency.aiEnabled
                              ? "bg-[var(--gold)]"
                              : "bg-[var(--border)]"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                              agency.aiEnabled ? "left-7" : "left-1"
                            )}
                          />
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSettingsModal(agency)}
                      >
                        <Settings className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(agency)}
                        className={
                          agency.status === "ACTIVE"
                            ? "text-yellow-500 hover:text-yellow-400"
                            : "text-emerald-500 hover:text-emerald-400"
                        }
                      >
                        {agency.status === "ACTIVE" ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </Button>
                    </div>

                    {/* Mobile Settings Button */}
                    <button
                      onClick={() => openSettingsModal(agency)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                  </div>

                  {/* Stats Grid - Responsive */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <div className="flex items-center gap-1 text-[var(--muted)] mb-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs">Creators</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-[var(--foreground)]">
                        {agency.stats.creators}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <div className="flex items-center gap-1 text-[var(--muted)] mb-1">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs">Chatters</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-[var(--foreground)]">
                        {agency.stats.chatters}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <div className="flex items-center gap-1 text-[var(--muted)] mb-1">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs">AI</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-[var(--foreground)]">
                        {agency.stats.aiPersonalities}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-[var(--surface)]">
                      <div className="flex items-center gap-1 text-[var(--muted)] mb-1">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs">30d</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-[var(--gold)]">
                        {formatCurrency(agency.stats.revenue30d)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions Row */}
                  <div className="flex lg:hidden items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">AI</span>
                      <button
                        onClick={() => toggleAI(agency)}
                        className={cn(
                          "relative w-10 h-5 rounded-full transition-colors",
                          agency.aiEnabled
                            ? "bg-[var(--gold)]"
                            : "bg-[var(--border)]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            agency.aiEnabled ? "left-5" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(agency)}
                      className={cn(
                        "text-xs",
                        agency.status === "ACTIVE"
                          ? "text-yellow-500"
                          : "text-emerald-500"
                      )}
                    >
                      {agency.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Agency Modal */}
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
              className="w-full sm:max-w-md"
            >
              <Card variant="luxury" className="p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                    Create Agency
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-5 sm:mb-6">
                  <Input
                    label="Agency Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Hot Models Agency"
                  />
                  <Input
                    label="Owner Email"
                    type="email"
                    value={formOwnerEmail}
                    onChange={(e) => setFormOwnerEmail(e.target.value)}
                    placeholder="owner@agency.com"
                  />
                  <p className="text-xs text-[var(--muted)]">
                    The owner must already have an account on the platform.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleCreate}
                    disabled={!formName || !formOwnerEmail || isSaving}
                    className="w-full sm:flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && selectedAgency && (
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
              className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            >
              <Card variant="luxury" className="p-5 sm:p-6 rounded-t-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                      Agency Settings
                    </h2>
                    <p className="text-sm text-[var(--muted)]">{selectedAgency.name}</p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-5 sm:mb-6">
                  {/* AI Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        AI Enabled
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Allow AI personalities
                      </p>
                    </div>
                    <button
                      onClick={() => setSettingsAiEnabled(!settingsAiEnabled)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        settingsAiEnabled
                          ? "bg-[var(--gold)]"
                          : "bg-[var(--border)]"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          settingsAiEnabled ? "left-7" : "left-1"
                        )}
                      />
                    </button>
                  </div>

                  <Input
                    label="Platform Fee (%)"
                    type="number"
                    value={settingsPlatformFee}
                    onChange={(e) =>
                      setSettingsPlatformFee(parseFloat(e.target.value) || 10)
                    }
                  />

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        Status
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {selectedAgency.status === "ACTIVE" ? "Agency is active" : "Agency is suspended"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleStatus(selectedAgency)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        selectedAgency.status === "ACTIVE"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {selectedAgency.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    className="w-full sm:flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full sm:flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Save"
                    )}
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
