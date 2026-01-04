"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Users,
  Image as ImageIcon,
  Film,
  MessageCircle,
  DollarSign,
  Loader2,
  Plus,
  Search,
  ExternalLink,
  X,
  Check,
  UserPlus,
  UserMinus,
  Eye,
  TrendingUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar: string | null;
  isActive: boolean;
  subscriberCount: number;
  photoCount: number;
  videoCount: number;
  agencyId: string | null;
}

interface Agency {
  id: string;
  name: string;
}

export default function AgencyCreatorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [availableCreators, setAvailableCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingCreator, setAddingCreator] = useState<string | null>(null);
  const [removingCreator, setRemovingCreator] = useState<string | null>(null);

  // Create new creator state
  const [modalTab, setModalTab] = useState<"add" | "create">("add");
  const [newCreatorSlug, setNewCreatorSlug] = useState("");
  const [newCreatorDisplayName, setNewCreatorDisplayName] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  // Get refreshAgency from context to update sidebar dropdown
  const { refreshAgency } = useAdminCreator();

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard/agency");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agency/creators");
        if (res.ok) {
          const data = await res.json();
          setAgency(data.agency);
          setCreators(data.creators || []);
          setAvailableCreators(data.availableCreators || []);
        }
      } catch (error) {
        console.error("Error fetching creators:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner]);

  const handleAddCreator = async (creatorId: string) => {
    if (!agency) return;
    setAddingCreator(creatorId);

    try {
      const res = await fetch("/api/agency/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, agencyId: agency.id }),
      });

      if (res.ok) {
        const creator = availableCreators.find((c) => c.id === creatorId);
        if (creator) {
          setCreators((prev) => [...prev, { ...creator, agencyId: agency.id }]);
          setAvailableCreators((prev) => prev.filter((c) => c.id !== creatorId));
        }
        // Refresh sidebar dropdown
        refreshAgency();
      }
    } catch (error) {
      console.error("Error adding creator:", error);
    } finally {
      setAddingCreator(null);
    }
  };

  const handleRemoveCreator = async (creatorId: string) => {
    if (!confirm("Remove this creator from your agency?")) return;
    setRemovingCreator(creatorId);

    try {
      const res = await fetch("/api/agency/creators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });

      if (res.ok) {
        const creator = creators.find((c) => c.id === creatorId);
        if (creator) {
          setAvailableCreators((prev) => [...prev, { ...creator, agencyId: null }]);
          setCreators((prev) => prev.filter((c) => c.id !== creatorId));
        }
        // Refresh sidebar dropdown
        refreshAgency();
      }
    } catch (error) {
      console.error("Error removing creator:", error);
    } finally {
      setRemovingCreator(null);
    }
  };

  // Check slug availability with debounce
  useEffect(() => {
    if (!newCreatorSlug || newCreatorSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newCreatorSlug.toLowerCase())) {
      setSlugStatus("invalid");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await fetch(`/api/user/become-creator?slug=${encodeURIComponent(newCreatorSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "taken");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newCreatorSlug]);

  const handleCreateCreator = async () => {
    if (!agency || !newCreatorSlug || slugStatus !== "available") return;
    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/agency/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          agencyId: agency.id,
          slug: newCreatorSlug.toLowerCase().trim(),
          displayName: newCreatorDisplayName || newCreatorSlug,
        }),
      });

      const data = await res.json();

      if (res.ok && data.creator) {
        setCreators((prev) => [...prev, data.creator]);
        setNewCreatorSlug("");
        setNewCreatorDisplayName("");
        setSlugStatus("idle");
        setIsModalOpen(false);
        setModalTab("add");
        // Refresh sidebar dropdown
        refreshAgency();
      } else {
        setCreateError(data.error || "Failed to create creator");
      }
    } catch (error) {
      console.error("Error creating creator:", error);
      setCreateError("Failed to create creator");
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setModalTab("add");
    setNewCreatorSlug("");
    setNewCreatorDisplayName("");
    setSlugStatus("idle");
    setCreateError(null);
    setSearchQuery("");
  };

  const filteredCreators = creators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailable = availableCreators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-20">
          <Crown className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
            No agency found
          </h2>
          <p className="text-[var(--muted)]">Please create an agency first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-1">
            My Creators
          </h1>
          <p className="text-sm md:text-base text-[var(--muted)]">
            {creators.length} creators in your agency
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-500 hover:bg-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Creator
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-purple-500"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
      >
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {creators.length}
              </p>
              <p className="text-xs md:text-sm text-[var(--muted)]">Creators</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {creators.reduce((sum, c) => sum + c.subscriberCount, 0)}
              </p>
              <p className="text-xs md:text-sm text-[var(--muted)]">Subscribers</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {creators.reduce((sum, c) => sum + c.photoCount, 0)}
              </p>
              <p className="text-xs md:text-sm text-[var(--muted)]">Photos</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {creators.reduce((sum, c) => sum + c.videoCount, 0)}
              </p>
              <p className="text-xs md:text-sm text-[var(--muted)]">Videos</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Creators List */}
      {filteredCreators.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16 md:py-20"
        >
          <Crown className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            {creators.length === 0 ? "No creators yet" : "No results"}
          </h3>
          <p className="text-[var(--muted)] mb-6">
            {creators.length === 0
              ? "Add creators to your agency to manage them"
              : "No creators match your search"}
          </p>
          {creators.length === 0 && (
            <Button
              variant="default"
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Creator
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 md:space-y-4"
        >
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="luxury" className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-[var(--surface)] flex-shrink-0">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                          <span className="text-[var(--background)] font-bold text-xl">
                            {creator.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {creator.displayName}
                        </h3>
                        <Badge
                          className={
                            creator.isActive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        >
                          {creator.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          AI
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--muted)]">@{creator.slug}</p>
                    </div>
                  </div>

                  {/* Stats - Mobile */}
                  <div className="grid grid-cols-3 gap-3 sm:hidden">
                    <div className="text-center p-2 rounded-lg bg-[var(--surface)]">
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {creator.subscriberCount}
                      </p>
                      <p className="text-xs text-[var(--muted)]">Subs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-[var(--surface)]">
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {creator.photoCount}
                      </p>
                      <p className="text-xs text-[var(--muted)]">Photos</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-[var(--surface)]">
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {creator.videoCount}
                      </p>
                      <p className="text-xs text-[var(--muted)]">Videos</p>
                    </div>
                  </div>

                  {/* Stats - Desktop */}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {creator.subscriberCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {creator.photoCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      {creator.videoCount}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/${creator.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCreator(creator.id)}
                      disabled={removingCreator === creator.id}
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      {removingCreator === creator.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Remove</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
            >
              <div
                className="w-full md:max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Card variant="luxury" className="p-4 md:p-6">
                  {/* Mobile handle */}
                  <div className="md:hidden flex justify-center mb-2">
                    <div className="w-12 h-1 bg-[var(--border)] rounded-full" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-400" />
                      <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">
                        Add Creator
                      </h2>
                    </div>
                    <button
                      onClick={resetModal}
                      className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setModalTab("add")}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                        modalTab === "add"
                          ? "bg-purple-500 text-white"
                          : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      )}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Add Existing
                    </button>
                    <button
                      onClick={() => setModalTab("create")}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                        modalTab === "create"
                          ? "bg-emerald-500 text-white"
                          : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      )}
                    >
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      Create New
                    </button>
                  </div>

                  {/* Tab Content: Add Existing */}
                  {modalTab === "add" && (
                    <>
                      {/* Search in modal */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                        <input
                          type="text"
                          placeholder="Search available creators..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Available creators list */}
                      <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {filteredAvailable.length === 0 ? (
                          <div className="text-center py-8">
                            <Crown className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
                            <p className="text-[var(--muted)] mb-2">
                              {availableCreators.length === 0
                                ? "No available creators"
                                : "No creators match your search"}
                            </p>
                            <button
                              onClick={() => setModalTab("create")}
                              className="text-emerald-400 text-sm hover:underline"
                            >
                              Create a new creator instead →
                            </button>
                          </div>
                        ) : (
                          filteredAvailable.map((creator) => (
                            <div
                              key={creator.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                {creator.avatar ? (
                                  <img
                                    src={creator.avatar}
                                    alt={creator.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                                    <span className="text-black font-bold">
                                      {creator.displayName?.[0] || "C"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--foreground)] truncate">
                                  {creator.displayName}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                  @{creator.slug} · {creator.subscriberCount} subs
                                </p>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAddCreator(creator.id)}
                                disabled={addingCreator === creator.id}
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                {addingCreator === creator.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">Add</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {/* Tab Content: Create New */}
                  {modalTab === "create" && (
                    <div className="space-y-4">
                      {/* Slug Input */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Profile URL (slug)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
                            viponly.fun/
                          </span>
                          <input
                            type="text"
                            placeholder="your-creator-name"
                            value={newCreatorSlug}
                            onChange={(e) => setNewCreatorSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                            className={cn(
                              "w-full pl-24 pr-10 py-2.5 bg-[var(--surface)] border rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none",
                              slugStatus === "available" && "border-emerald-500 focus:border-emerald-500",
                              slugStatus === "taken" && "border-red-500 focus:border-red-500",
                              slugStatus === "invalid" && "border-yellow-500 focus:border-yellow-500",
                              slugStatus === "idle" && "border-[var(--border)] focus:border-purple-500",
                              slugStatus === "checking" && "border-[var(--border)] focus:border-purple-500"
                            )}
                            maxLength={30}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugStatus === "checking" && (
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
                            )}
                            {slugStatus === "available" && (
                              <Check className="w-4 h-4 text-emerald-500" />
                            )}
                            {slugStatus === "taken" && (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            {slugStatus === "invalid" && (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          "text-xs mt-1",
                          slugStatus === "available" && "text-emerald-400",
                          slugStatus === "taken" && "text-red-400",
                          slugStatus === "invalid" && "text-yellow-400",
                          (slugStatus === "idle" || slugStatus === "checking") && "text-[var(--muted)]"
                        )}>
                          {slugStatus === "idle" && "3-30 characters, lowercase letters, numbers, and hyphens only"}
                          {slugStatus === "checking" && "Checking availability..."}
                          {slugStatus === "available" && "This URL is available!"}
                          {slugStatus === "taken" && "This URL is already taken"}
                          {slugStatus === "invalid" && "Only lowercase letters, numbers, and hyphens allowed"}
                        </p>
                      </div>

                      {/* Display Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          placeholder="Creator's display name"
                          value={newCreatorDisplayName}
                          onChange={(e) => setNewCreatorDisplayName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-purple-500"
                          maxLength={50}
                        />
                        <p className="text-xs text-[var(--muted)] mt-1">
                          This will be shown on the creator's profile
                        </p>
                      </div>

                      {/* Error Message */}
                      {createError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                          {createError}
                        </div>
                      )}

                      {/* Create Button */}
                      <Button
                        variant="default"
                        onClick={handleCreateCreator}
                        disabled={isCreating || slugStatus !== "available"}
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Creator
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                </Card>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
