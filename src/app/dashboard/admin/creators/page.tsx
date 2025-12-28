"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Crown,
  Image as ImageIcon,
  Film,
  DollarSign,
  X,
  Upload,
  Bot,
  Settings,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar: string | null;
  coverImage: string | null;
  isActive: boolean;
  aiEnabled: boolean;
  subscriberCount: number;
  photoCount: number;
  videoCount: number;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminCreatorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    slug: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { refreshCreators } = useAdminCreator();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Open modal if ?new=true in URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      openAddModal();
      // Remove the query param
      router.replace("/dashboard/admin/creators");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchCreators();
  }, [session, status, isAdmin, router]);

  const fetchCreators = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/creators");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (creator: Creator) => {
    try {
      const res = await fetch(`/api/admin/creators/${creator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !creator.isActive }),
      });
      if (res.ok) {
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creator.id ? { ...c, isActive: !c.isActive } : c
          )
        );
      }
    } catch (error) {
      console.error("Error updating creator:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this creator? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/creators/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCreators((prev) => prev.filter((c) => c.id !== id));
        refreshCreators();
      }
    } catch (error) {
      console.error("Error deleting creator:", error);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingCreator(null);
    setFormData({ name: "", displayName: "", slug: "", bio: "" });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (creator: Creator) => {
    setModalMode("edit");
    setEditingCreator(creator);
    setFormData({
      name: creator.name,
      displayName: creator.displayName,
      slug: creator.slug,
      bio: "",
    });
    setAvatarPreview(creator.avatar);
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCreator(null);
    setFormData({ name: "", displayName: "", slug: "", bio: "" });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("displayName", formData.displayName || formData.name);
      submitData.append("slug", formData.slug || formData.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, ""));
      if (formData.bio) submitData.append("bio", formData.bio);
      if (avatarFile) submitData.append("avatar", avatarFile);

      if (modalMode === "edit" && editingCreator) {
        submitData.append("id", editingCreator.id);
        const res = await fetch("/api/admin/creators", {
          method: "PATCH",
          body: submitData,
        });
        if (res.ok) {
          const data = await res.json();
          setCreators((prev) =>
            prev.map((c) => (c.id === editingCreator.id ? data.creator : c))
          );
          closeModal();
          refreshCreators();
        }
      } else {
        const res = await fetch("/api/admin/creators", {
          method: "POST",
          body: submitData,
        });
        if (res.ok) {
          const data = await res.json();
          setCreators((prev) => [...prev, data.creator]);
          closeModal();
          refreshCreators();
        }
      }
    } catch (error) {
      console.error("Error saving creator:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCreators = creators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Creators
          </h1>
          <p className="text-[var(--muted)]">
            Manage all creator profiles on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={fetchCreators}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="premium" onClick={openAddModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add Creator
          </Button>
        </div>
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
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{creators.length}</p>
              <p className="text-sm text-[var(--muted)]">Total Creators</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {creators.filter((c) => c.isActive).length}
              </p>
              <p className="text-sm text-[var(--muted)]">Active</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {creators.reduce((sum, c) => sum + c.subscriberCount, 0)}
              </p>
              <p className="text-sm text-[var(--muted)]">Total Subscribers</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Creators List */}
      {filteredCreators.length === 0 ? (
        <div className="text-center py-20">
          <Crown className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No creators found
          </h3>
          <p className="text-[var(--muted)]">
            {creators.length === 0
              ? "No creators have been added yet"
              : "No creators match your search"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="luxury" className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--surface)] flex-shrink-0">
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
                    <div className="flex items-center gap-2 mb-1">
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
                      {creator.aiEnabled && (
                        <Badge className="bg-purple-500/20 text-purple-400 flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-2">
                      @{creator.slug}
                      {creator.user && (
                        <span className="ml-2 text-[var(--gold)]">
                          ({creator.user.email})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {creator.subscriberCount} subscribers
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {creator.photoCount} photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Film className="w-4 h-4" />
                        {creator.videoCount} videos
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${creator.slug}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(creator)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant={creator.aiEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/creators/${creator.slug}/ai`)}
                      className={creator.aiEnabled ? "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30" : ""}
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(creator)}
                    >
                      {creator.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <button
                      onClick={() => handleDelete(creator.id)}
                      className="p-2 text-[var(--muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add/Edit Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {modalMode === "add" ? "Add New Creator" : "Edit Creator"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--background)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)] transition-colors cursor-pointer flex items-center justify-center"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-[var(--muted)] mx-auto mb-1" />
                          <span className="text-xs text-[var(--muted)]">Avatar</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--muted)] mb-2">
                        Upload a profile picture for this creator
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mia Costa"
                      required
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Leave empty to use name"
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="px-4 py-3 bg-[var(--background)] border border-r-0 border-[var(--border)] rounded-l-xl text-[var(--muted)]">
                        /
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })}
                        placeholder="miacosta"
                        disabled={modalMode === "edit"}
                        className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-r-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] disabled:opacity-50"
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      This will be the creator's page URL. Cannot be changed after creation.
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Short description about this creator..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                    <Button type="button" variant="ghost" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="premium" disabled={isSubmitting || !formData.name}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          {modalMode === "add" ? "Create Creator" : "Save Changes"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
