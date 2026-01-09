"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input, Badge } from "@/components/ui";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Package,
  X,
  Plus,
  Eye,
  EyeOff,
  Crown,
  Search,
  Edit,
  Trash2,
  Check,
  Loader2,
  RefreshCw,
  Play,
  LayoutGrid,
  EyeClosed,
  Tag,
  Bot,
  Unlock,
  Coins,
  CheckSquare,
  Square,
  Folder,
  Link2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface MediaItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "PACK";
  accessTier: "FREE" | "BASIC" | "VIP";
  thumbnailUrl: string | null;
  contentUrl: string;
  viewCount: number;
  createdAt: string;
  isPublished: boolean;
  // Tag fields
  tagGallery: boolean;
  tagPPV: boolean;
  tagAI: boolean;
  tagFree: boolean;
  tagVIP: boolean;
  ppvPriceCredits: number | null;
}

const mediaTypes = [
  { id: "PHOTO", label: "Photo", icon: ImageIcon },
  { id: "VIDEO", label: "Video", icon: Video },
  { id: "AUDIO", label: "Audio", icon: Music },
  { id: "PACK", label: "Pack", icon: Package },
];

const accessTiers = [
  { id: "FREE", label: "Free", color: "bg-emerald-500/20 text-emerald-400" },
  { id: "BASIC", label: "Basic", color: "bg-blue-500/20 text-blue-400" },
  { id: "VIP", label: "VIP", color: "bg-[var(--gold)]/20 text-[var(--gold)]" },
];

export default function CreatorMediaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Use shared creator context from sidebar
  const { selectedCreator, creators, isLoading: creatorsLoading } = useAdminCreator();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState("PHOTO");
  const [selectedTier, setSelectedTier] = useState("FREE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all"); // "all" | "gallery" | "ppv" | "ai" | "free" | "vip"
  const [uploadError, setUploadError] = useState("");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAccessTier, setEditAccessTier] = useState("FREE");
  const [isEditing, setIsEditing] = useState(false);

  // New tag states for upload
  const [tagGallery, setTagGallery] = useState(false);
  const [tagPPV, setTagPPV] = useState(false);
  const [tagAI, setTagAI] = useState(false);
  const [tagFree, setTagFree] = useState(false);
  const [tagVIP, setTagVIP] = useState(false);
  const [ppvPriceCredits, setPpvPriceCredits] = useState("");

  // Edit tag states
  const [editTagGallery, setEditTagGallery] = useState(false);
  const [editTagPPV, setEditTagPPV] = useState(false);
  const [editTagAI, setEditTagAI] = useState(false);
  const [editTagFree, setEditTagFree] = useState(false);
  const [editTagVIP, setEditTagVIP] = useState(false);
  const [editPpvPriceCredits, setEditPpvPriceCredits] = useState("");

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Bulk edit states
  const [bulkTagGallery, setBulkTagGallery] = useState<boolean | null>(null);
  const [bulkTagPPV, setBulkTagPPV] = useState<boolean | null>(null);
  const [bulkTagAI, setBulkTagAI] = useState<boolean | null>(null);
  const [bulkTagFree, setBulkTagFree] = useState<boolean | null>(null);
  const [bulkTagVIP, setBulkTagVIP] = useState<boolean | null>(null);
  const [bulkPpvPriceCredits, setBulkPpvPriceCredits] = useState("");

  // Multi-upload states
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");

  // PPV link copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isCreatorUser = (session?.user as any)?.isCreator === true;

  // Copy PPV link to clipboard
  const copyPPVLink = async (item: MediaItem) => {
    if (!selectedCreator) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/${selectedCreator.slug}/ppv/${item.id}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Redirect if not creator
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isCreatorUser) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, isCreatorUser, router]);

  // Fetch media from API
  const fetchMedia = useCallback(async () => {
    if (!selectedCreator) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("creator", selectedCreator.slug);
      if (filterType !== "all") params.set("type", filterType);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, searchQuery, selectedCreator]);

  useEffect(() => {
    if (selectedCreator) {
      fetchMedia();
    }
  }, [fetchMedia, selectedCreator]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allFiles = Array.from(e.target.files);

      // Filter for valid media files
      const validExtensions = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
        // Videos
        '.mp4', '.mov', '.avi', '.webm', '.mkv',
        // Audio
        '.mp3', '.wav', '.aac', '.ogg', '.m4a'
      ];

      const mediaFiles = allFiles.filter(file => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return validExtensions.includes(ext);
      });

      setFiles(mediaFiles);
    }
  };

  const handleUpload = async () => {
    if (!title || files.length === 0 || !selectedCreator) {
      console.log("[Upload] Missing required fields:", { title, filesCount: files.length, selectedCreator });
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      console.log("[Upload] Starting upload...");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", selectedType);
      formData.append("accessTier", selectedTier);
      formData.append("creatorSlug", selectedCreator.slug);

      // Add tag fields
      formData.append("tagGallery", tagGallery.toString());
      formData.append("tagPPV", tagPPV.toString());
      formData.append("tagAI", tagAI.toString());
      formData.append("tagFree", tagFree.toString());
      formData.append("tagVIP", tagVIP.toString());
      if (tagPPV && ppvPriceCredits) {
        formData.append("ppvPriceCredits", ppvPriceCredits);
      }

      files.forEach((file) => {
        console.log("[Upload] Adding file:", file.name, file.size);
        formData.append("files", file);
      });

      console.log("[Upload] Sending request to /api/media");
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      console.log("[Upload] Response status:", res.status);

      let data;
      try {
        const text = await res.text();
        console.log("[Upload] Response text:", text.substring(0, 500));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("[Upload] Failed to parse response:", parseError);
        setUploadError("Server returned invalid response");
        return;
      }

      console.log("[Upload] Response data:", data);

      if (res.ok && data.media) {
        console.log("[Upload] Success! Media created:", data.media.id);
        setMedia((prev) => [data.media, ...prev]);
        setShowUploadModal(false);
        // Reset form
        setTitle("");
        setDescription("");
        setFiles([]);
        setSelectedType("PHOTO");
        setSelectedTier("FREE");
        // Reset tags
        setTagGallery(false);
        setTagPPV(false);
        setTagAI(false);
        setTagFree(false);
        setTagVIP(false);
        setPpvPriceCredits("");
        // Also refresh the list
        fetchMedia();
      } else {
        console.error("[Upload] Error response:", data);
        setUploadError(data.error || `Upload failed (status: ${res.status})`);
      }
    } catch (error: any) {
      console.error("[Upload] Exception:", error);
      setUploadError(error?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const res = await fetch(`/api/media?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleToggleGallery = async (item: MediaItem) => {
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          tagGallery: !item.tagGallery,
        }),
      });

      if (res.ok) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === item.id ? { ...m, tagGallery: !m.tagGallery } : m
          )
        );
      }
    } catch (error) {
      console.error("Toggle gallery error:", error);
    }
  };

  const filteredMedia = media.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    // Tag filters
    if (filterTag === "gallery" && !item.tagGallery) return false;
    if (filterTag === "ppv" && !item.tagPPV) return false;
    if (filterTag === "ai" && !item.tagAI) return false;
    if (filterTag === "free" && !item.tagFree) return false;
    if (filterTag === "vip" && !item.tagVIP) return false;
    return true;
  });

  // Open edit modal
  const openEditModal = (item: MediaItem) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditAccessTier(item.accessTier);
    // Set tag states
    setEditTagGallery(item.tagGallery || false);
    setEditTagPPV(item.tagPPV || false);
    setEditTagAI(item.tagAI || false);
    setEditTagFree(item.tagFree || false);
    setEditTagVIP(item.tagVIP || false);
    setEditPpvPriceCredits(item.ppvPriceCredits ? String(item.ppvPriceCredits) : "");
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editItem) return;

    setIsEditing(true);
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          title: editTitle,
          description: editDescription || null,
          accessTier: editAccessTier,
          // Include tag fields
          tagGallery: editTagGallery,
          tagPPV: editTagPPV,
          tagAI: editTagAI,
          tagFree: editTagFree,
          tagVIP: editTagVIP,
          ppvPriceCredits: editTagPPV && editPpvPriceCredits ? parseInt(editPpvPriceCredits) : null,
        }),
      });

      if (res.ok) {
        const { media: updatedMedia } = await res.json();
        setMedia((prev) =>
          prev.map((m) => (m.id === editItem.id ? { ...m, ...updatedMedia } : m))
        );
        setEditItem(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update media");
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to update media");
    } finally {
      setIsEditing(false);
    }
  };

  // Toggle selection for an item
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all filtered items
  const selectAll = () => {
    setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // Bulk action handler
  const handleBulkAction = async (action: "delete" | "publish" | "unpublish") => {
    if (selectedIds.size === 0) return;

    if (action === "delete" && !confirm(`Delete ${selectedIds.size} items?`)) {
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const res = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (action === "delete") {
          setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
        }
        clearSelection();
      } else {
        alert("Failed to perform action");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      alert("Failed to perform action");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Open bulk edit modal
  const openBulkEditModal = () => {
    // Reset bulk edit states
    setBulkTagGallery(null);
    setBulkTagPPV(null);
    setBulkTagAI(null);
    setBulkTagFree(null);
    setBulkTagVIP(null);
    setBulkPpvPriceCredits("");
    setShowBulkEditModal(true);
  };

  // Handle bulk edit save
  const handleBulkEditSave = async () => {
    if (selectedIds.size === 0) return;

    const data: any = {};
    if (bulkTagGallery !== null) data.tagGallery = bulkTagGallery;
    if (bulkTagPPV !== null) data.tagPPV = bulkTagPPV;
    if (bulkTagAI !== null) data.tagAI = bulkTagAI;
    if (bulkTagFree !== null) data.tagFree = bulkTagFree;
    if (bulkTagVIP !== null) data.tagVIP = bulkTagVIP;
    if (bulkTagPPV === true && bulkPpvPriceCredits) {
      data.ppvPriceCredits = parseInt(bulkPpvPriceCredits);
    }

    if (Object.keys(data).length === 0) {
      alert("No changes to apply");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const res = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ids: Array.from(selectedIds),
          data,
        }),
      });

      if (res.ok) {
        // Update local state
        setMedia((prev) =>
          prev.map((m) =>
            selectedIds.has(m.id)
              ? {
                  ...m,
                  ...(bulkTagGallery !== null && { tagGallery: bulkTagGallery }),
                  ...(bulkTagPPV !== null && { tagPPV: bulkTagPPV }),
                  ...(bulkTagAI !== null && { tagAI: bulkTagAI }),
                  ...(bulkTagFree !== null && { tagFree: bulkTagFree }),
                  ...(bulkTagVIP !== null && { tagVIP: bulkTagVIP }),
                  ...(bulkTagPPV === true && bulkPpvPriceCredits && { ppvPriceCredits: parseInt(bulkPpvPriceCredits) }),
                }
              : m
          )
        );
        setShowBulkEditModal(false);
        clearSelection();
      } else {
        alert("Failed to update items");
      }
    } catch (error) {
      console.error("Bulk edit error:", error);
      alert("Failed to update items");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  if (status === "loading" || creatorsLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isCreatorUser) {
    return null;
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-24 overflow-x-hidden">
      {/* Current Creator indicator */}
      {selectedCreator && (
        <div className="mb-6 flex items-center gap-3 text-sm text-gray-400">
          <span>Managing media for:</span>
          <span className="px-3 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] font-medium">
            {selectedCreator.displayName}
          </span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-1">
            Media Library
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Gérer vos photos, vidéos et contenus
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={fetchMedia} className="flex-shrink-0">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          {selectionMode ? (
            <>
              <span className="text-xs sm:text-sm text-[var(--muted)]">
                {selectedIds.size} sel.
              </span>
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs sm:text-sm px-2 sm:px-3">
                Tout
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs sm:text-sm px-2 sm:px-3">
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
                className="px-2 sm:px-3"
              >
                <CheckSquare className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Select</span>
              </Button>
              <Button variant="premium" size="sm" onClick={() => setShowUploadModal(true)} className="px-3 sm:px-4">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filterType === "all"
                ? "bg-[var(--gold)] text-[var(--background)]"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            All
          </button>
          {mediaTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                filterType === type.id
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}

          {/* Tag filters */}
          <div className="h-6 w-px bg-[var(--border)] mx-2" />
          <button
            onClick={() => setFilterTag("all")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all",
              filterTag === "all"
                ? "bg-gray-500/20 text-gray-300"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            All Tags
          </button>
          <button
            onClick={() => setFilterTag("gallery")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              filterTag === "gallery"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Gallery
          </button>
          <button
            onClick={() => setFilterTag("ppv")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              filterTag === "ppv"
                ? "bg-orange-500/20 text-orange-400"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Coins className="w-4 h-4" />
            PPV
          </button>
          <button
            onClick={() => setFilterTag("ai")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              filterTag === "ai"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Bot className="w-4 h-4" />
            AI
          </button>
          <button
            onClick={() => setFilterTag("free")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              filterTag === "free"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Unlock className="w-4 h-4" />
            Free
          </button>
          <button
            onClick={() => setFilterTag("vip")}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              filterTag === "vip"
                ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Crown className="w-4 h-4" />
            VIP
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-[var(--gold)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No media found
          </h3>
          <p className="text-[var(--muted)] mb-6">
            Upload your first media to get started
          </p>
          <Button variant="premium" onClick={() => setShowUploadModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Upload Media
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
        >
          {filteredMedia.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                variant="luxury"
                hover
                className={cn(
                  "overflow-hidden p-0 transition-all",
                  selectedIds.has(item.id) && "ring-2 ring-[var(--gold)]"
                )}
              >
                <div
                  className="relative aspect-[4/5] cursor-pointer group"
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelection(item.id);
                    } else {
                      setPreviewItem(item);
                    }
                  }}
                >
                  {/* Selection checkbox */}
                  {selectionMode && (
                    <div
                      className="absolute top-3 left-3 z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(item.id);
                      }}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                          selectedIds.has(item.id)
                            ? "bg-[var(--gold)] text-[var(--background)]"
                            : "bg-black/50 text-white hover:bg-black/70"
                        )}
                      >
                        {selectedIds.has(item.id) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  )}
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
                      {item.type === "VIDEO" ? (
                        <Video className="w-16 h-16 text-[var(--muted)]" />
                      ) : item.type === "AUDIO" ? (
                        <Music className="w-16 h-16 text-[var(--muted)]" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-[var(--muted)]" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play overlay for videos */}
                  {item.type === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-[var(--gold)] flex items-center justify-center">
                        <Play className="w-8 h-8 text-[var(--background)] ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Status badges - based on tags (hidden in selection mode) */}
                  <div className={cn(
                    "absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]",
                    selectionMode && "hidden"
                  )}>
                    {item.tagPPV && (
                      <Badge className="bg-orange-500/20 text-orange-400">
                        <Coins className="w-3 h-3 mr-1" />
                        {item.ppvPriceCredits ? `${item.ppvPriceCredits}` : "PPV"}
                      </Badge>
                    )}
                    {item.tagVIP && (
                      <Badge className="bg-[var(--gold)]/20 text-[var(--gold)]">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    {item.tagAI && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        <Bot className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {item.tagFree && !item.tagPPV && !item.tagVIP && (
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        <Unlock className="w-3 h-3 mr-1" />
                        Free
                      </Badge>
                    )}
                    {!item.tagPPV && !item.tagVIP && !item.tagFree && (
                      <Badge className="bg-gray-500/20 text-gray-400">
                        No tag
                      </Badge>
                    )}
                  </div>

                  {/* Status buttons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {/* Gallery visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGallery(item);
                      }}
                      title={item.tagGallery ? "Visible in Gallery" : "Hidden from Gallery"}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          item.tagGallery
                            ? "bg-purple-500/80 hover:bg-purple-500"
                            : "bg-orange-500/80 hover:bg-orange-500"
                        )}
                      >
                        {item.tagGallery ? (
                          <LayoutGrid className="w-4 h-4 text-white" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Type icon */}
                  {item.type === "VIDEO" && (
                    <div className="absolute bottom-16 right-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--gold)]/80 flex items-center justify-center">
                        <Video className="w-5 h-5 text-[var(--background)]" />
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-lg mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {item.viewCount} views
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(item);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {/* PPV Link button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPPVLink(item);
                    }}
                    title="Copy PPV Link"
                    className={cn(
                      "p-2 transition-colors rounded-lg",
                      copiedId === item.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10"
                    )}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Link2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 text-[var(--muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card variant="luxury" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    Upload New Media
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    {uploadError}
                  </div>
                )}

                {!selectedCreator && (
                  <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                    No creator profile selected. Please select a creator profile first.
                  </div>
                )}

                {/* Media Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                    Media Type
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {mediaTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          selectedType === type.id
                            ? "border-[var(--gold)] bg-[var(--gold)]/10"
                            : "border-[var(--border)] hover:border-[var(--gold)]/50"
                        )}
                      >
                        <type.icon
                          className={cn(
                            "w-6 h-6",
                            selectedType === type.id
                              ? "text-[var(--gold)]"
                              : "text-[var(--muted)]"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            selectedType === type.id
                              ? "text-[var(--gold)]"
                              : "text-[var(--muted)]"
                          )}
                        >
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                      Upload Files
                    </label>
                    <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg p-1">
                      <button
                        onClick={() => {
                          setUploadMode("files");
                          setFiles([]);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                          uploadMode === "files"
                            ? "bg-[var(--gold)] text-[var(--background)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Upload className="w-4 h-4" />
                        Files
                      </button>
                      <button
                        onClick={() => {
                          setUploadMode("folder");
                          setFiles([]);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                          uploadMode === "folder"
                            ? "bg-[var(--gold)] text-[var(--background)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Folder className="w-4 h-4" />
                        Folder
                      </button>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                      files.length > 0
                        ? "border-[var(--gold)] bg-[var(--gold)]/5"
                        : "border-[var(--border)] hover:border-[var(--gold)]/50"
                    )}
                  >
                    {uploadMode === "folder" ? (
                      <input
                        type="file"
                        // @ts-ignore - webkitdirectory is not in types
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="folder-upload"
                      />
                    ) : (
                      <input
                        type="file"
                        multiple
                        accept={
                          selectedType === "PHOTO"
                            ? "image/*"
                            : selectedType === "VIDEO"
                            ? "video/*"
                            : selectedType === "AUDIO"
                            ? "audio/*"
                            : "*/*"
                        }
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                    )}
                    <label htmlFor={uploadMode === "folder" ? "folder-upload" : "file-upload"} className="cursor-pointer">
                      {uploadMode === "folder" ? (
                        <Folder className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                      ) : (
                        <Upload className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                      )}
                      {files.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          <p className="text-[var(--gold)] font-medium mb-2">
                            {files.length} file{files.length > 1 ? "s" : ""} selected
                          </p>
                          {files.slice(0, 5).map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center gap-2 text-[var(--foreground)] text-sm"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                          ))}
                          {files.length > 5 && (
                            <p className="text-[var(--muted)] text-sm">
                              +{files.length - 5} more files...
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-[var(--foreground)] font-medium mb-1">
                            {uploadMode === "folder"
                              ? "Click to select a folder"
                              : "Drop files here or click to upload"}
                          </p>
                          <p className="text-[var(--muted)] text-sm">
                            {uploadMode === "folder"
                              ? "All media files in the folder will be uploaded"
                              : "Supports JPG, PNG, MP4, MP3"}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-4 mb-6">
                  <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter media title"
                  />
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description (optional)"
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    />
                  </div>
                </div>

                {/* Media Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Media Tags
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Gallery Tag */}
                    <button
                      onClick={() => setTagGallery(!tagGallery)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        tagGallery
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-[var(--border)] hover:border-purple-500/50"
                      )}
                    >
                      <LayoutGrid className={cn("w-5 h-5", tagGallery ? "text-purple-400" : "text-[var(--muted)]")} />
                      <div className="text-left">
                        <div className={cn("font-medium", tagGallery ? "text-purple-400" : "text-[var(--foreground)]")}>Gallery</div>
                        <div className="text-xs text-[var(--muted)]">Show in public gallery</div>
                      </div>
                    </button>

                    {/* Free Tag */}
                    <button
                      onClick={() => {
                        const newValue = !tagFree;
                        setTagFree(newValue);
                        if (newValue) setTagPPV(false); // Free and PPV are mutually exclusive
                      }}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        tagFree
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-[var(--border)] hover:border-emerald-500/50"
                      )}
                    >
                      <Unlock className={cn("w-5 h-5", tagFree ? "text-emerald-400" : "text-[var(--muted)]")} />
                      <div className="text-left">
                        <div className={cn("font-medium", tagFree ? "text-emerald-400" : "text-[var(--foreground)]")}>Free</div>
                        <div className="text-xs text-[var(--muted)]">Visible to everyone</div>
                      </div>
                    </button>

                    {/* VIP Tag */}
                    <button
                      onClick={() => setTagVIP(!tagVIP)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        tagVIP
                          ? "border-[var(--gold)] bg-[var(--gold)]/10"
                          : "border-[var(--border)] hover:border-[var(--gold)]/50"
                      )}
                    >
                      <Crown className={cn("w-5 h-5", tagVIP ? "text-[var(--gold)]" : "text-[var(--muted)]")} />
                      <div className="text-left">
                        <div className={cn("font-medium", tagVIP ? "text-[var(--gold)]" : "text-[var(--foreground)]")}>VIP Only</div>
                        <div className="text-xs text-[var(--muted)]">VIP subscribers only</div>
                      </div>
                    </button>

                    {/* AI Tag */}
                    <button
                      onClick={() => setTagAI(!tagAI)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        tagAI
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[var(--border)] hover:border-blue-500/50"
                      )}
                    >
                      <Bot className={cn("w-5 h-5", tagAI ? "text-blue-400" : "text-[var(--muted)]")} />
                      <div className="text-left">
                        <div className={cn("font-medium", tagAI ? "text-blue-400" : "text-[var(--foreground)]")}>AI Chat</div>
                        <div className="text-xs text-[var(--muted)]">AI can send this</div>
                      </div>
                    </button>
                  </div>

                  {/* PPV Tag (full width with price input) */}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        const newValue = !tagPPV;
                        setTagPPV(newValue);
                        if (newValue) setTagFree(false); // PPV and Free are mutually exclusive
                      }}
                      className={cn(
                        "w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                        tagPPV
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-[var(--border)] hover:border-orange-500/50"
                      )}
                    >
                      <Coins className={cn("w-5 h-5", tagPPV ? "text-orange-400" : "text-[var(--muted)]")} />
                      <div className="text-left flex-1">
                        <div className={cn("font-medium", tagPPV ? "text-orange-400" : "text-[var(--foreground)]")}>PPV (Pay-Per-View)</div>
                        <div className="text-xs text-[var(--muted)]">Requires credits to unlock</div>
                      </div>
                    </button>
                    {tagPPV && (
                      <div className="mt-3 pl-4">
                        <Input
                          label="Price (credits)"
                          type="number"
                          value={ppvPriceCredits}
                          onChange={(e) => setPpvPriceCredits(e.target.value)}
                          placeholder="1000 (= 1 media)"
                          leftIcon={<Coins className="w-4 h-4" />}
                        />
                        <p className="text-xs text-[var(--muted)] mt-1">1000 credits = $10</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleUpload}
                    disabled={!title || files.length === 0 || isUploading || !selectedCreator}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <Card variant="luxury" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    Edit Media
                  </h2>
                  <button
                    onClick={() => setEditItem(null)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Preview */}
                <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-[var(--surface)]">
                  {editItem.thumbnailUrl ? (
                    <img
                      src={editItem.thumbnailUrl}
                      alt={editItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-[var(--muted)]" />
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter title"
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter description (optional)"
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    />
                  </div>

                  {/* Media Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                      <Tag className="w-4 h-4 inline mr-2" />
                      Media Tags
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Gallery Tag */}
                      <button
                        onClick={() => setEditTagGallery(!editTagGallery)}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all flex items-center gap-2",
                          editTagGallery
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-[var(--border)] hover:border-purple-500/50"
                        )}
                      >
                        <LayoutGrid className={cn("w-4 h-4", editTagGallery ? "text-purple-400" : "text-[var(--muted)]")} />
                        <span className={cn("text-sm", editTagGallery ? "text-purple-400" : "text-[var(--foreground)]")}>Gallery</span>
                      </button>

                      {/* Free Tag */}
                      <button
                        onClick={() => {
                          const newValue = !editTagFree;
                          setEditTagFree(newValue);
                          if (newValue) setEditTagPPV(false); // Free and PPV are mutually exclusive
                        }}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all flex items-center gap-2",
                          editTagFree
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-[var(--border)] hover:border-emerald-500/50"
                        )}
                      >
                        <Unlock className={cn("w-4 h-4", editTagFree ? "text-emerald-400" : "text-[var(--muted)]")} />
                        <span className={cn("text-sm", editTagFree ? "text-emerald-400" : "text-[var(--foreground)]")}>Free</span>
                      </button>

                      {/* VIP Tag */}
                      <button
                        onClick={() => setEditTagVIP(!editTagVIP)}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all flex items-center gap-2",
                          editTagVIP
                            ? "border-[var(--gold)] bg-[var(--gold)]/10"
                            : "border-[var(--border)] hover:border-[var(--gold)]/50"
                        )}
                      >
                        <Crown className={cn("w-4 h-4", editTagVIP ? "text-[var(--gold)]" : "text-[var(--muted)]")} />
                        <span className={cn("text-sm", editTagVIP ? "text-[var(--gold)]" : "text-[var(--foreground)]")}>VIP</span>
                      </button>

                      {/* AI Tag */}
                      <button
                        onClick={() => setEditTagAI(!editTagAI)}
                        className={cn(
                          "p-2 rounded-lg border-2 transition-all flex items-center gap-2",
                          editTagAI
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-[var(--border)] hover:border-blue-500/50"
                        )}
                      >
                        <Bot className={cn("w-4 h-4", editTagAI ? "text-blue-400" : "text-[var(--muted)]")} />
                        <span className={cn("text-sm", editTagAI ? "text-blue-400" : "text-[var(--foreground)]")}>AI</span>
                      </button>
                    </div>

                    {/* PPV Tag */}
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          const newValue = !editTagPPV;
                          setEditTagPPV(newValue);
                          if (newValue) setEditTagFree(false); // PPV and Free are mutually exclusive
                        }}
                        className={cn(
                          "w-full p-2 rounded-lg border-2 transition-all flex items-center gap-2",
                          editTagPPV
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-[var(--border)] hover:border-orange-500/50"
                        )}
                      >
                        <Coins className={cn("w-4 h-4", editTagPPV ? "text-orange-400" : "text-[var(--muted)]")} />
                        <span className={cn("text-sm", editTagPPV ? "text-orange-400" : "text-[var(--foreground)]")}>PPV</span>
                      </button>
                      {editTagPPV && (
                        <div className="mt-2 space-y-2">
                          <Input
                            label="Price (credits)"
                            type="number"
                            value={editPpvPriceCredits}
                            onChange={(e) => setEditPpvPriceCredits(e.target.value)}
                            placeholder="1000"
                            leftIcon={<Coins className="w-4 h-4" />}
                          />
                          {/* PPV Link */}
                          <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <Link2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            <span className="text-xs text-orange-300 truncate flex-1 font-mono">
                              {`${typeof window !== 'undefined' ? window.location.origin : ''}/${selectedCreator?.slug}/ppv/${editItem.id}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const link = `${window.location.origin}/${selectedCreator?.slug}/ppv/${editItem.id}`;
                                navigator.clipboard.writeText(link);
                                setCopiedId(editItem.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 transition-colors flex-shrink-0"
                            >
                              {copiedId === editItem.id ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-orange-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditItem(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="premium"
                      onClick={handleEditSave}
                      disabled={!editTitle || isEditing}
                      className="flex-1"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="relative">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {previewItem.type === "VIDEO" ? (
                  <video
                    src={previewItem.contentUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[80vh] bg-black rounded-xl"
                  />
                ) : previewItem.type === "AUDIO" ? (
                  <div className="bg-[var(--surface)] rounded-xl p-8">
                    <div className="w-32 h-32 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-6">
                      <Music className="w-16 h-16 text-[var(--gold)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] text-center mb-4">
                      {previewItem.title}
                    </h3>
                    <audio
                      src={previewItem.contentUrl}
                      controls
                      autoPlay
                      className="w-full"
                    />
                  </div>
                ) : (
                  <img
                    src={previewItem.contentUrl}
                    alt={previewItem.title}
                    className="w-full max-h-[80vh] object-contain rounded-xl"
                  />
                )}

                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {previewItem.title}
                  </h3>
                  {previewItem.description && (
                    <p className="text-white/60">{previewItem.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 px-6 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
              <div className="flex items-center gap-2 pr-4 border-r border-[var(--border)]">
                <CheckSquare className="w-5 h-5 text-[var(--gold)]" />
                <span className="font-medium text-[var(--foreground)]">
                  {selectedIds.size} selected
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openBulkEditModal}
                disabled={isBulkActionLoading}
              >
                <Tag className="w-4 h-4 mr-2" />
                Edit Tags
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("publish")}
                disabled={isBulkActionLoading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("unpublish")}
                disabled={isBulkActionLoading}
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("delete")}
                disabled={isBulkActionLoading}
                className="text-red-400 hover:text-red-300 hover:border-red-500/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <button
                onClick={clearSelection}
                className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card variant="luxury" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Edit {selectedIds.size} Items
                  </h2>
                  <button
                    onClick={() => setShowBulkEditModal(false)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-sm text-[var(--muted)] mb-4">
                  Set tags for all selected items. Leave unchanged to keep current values.
                </p>

                <div className="space-y-3">
                  {/* Gallery */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-5 h-5 text-purple-400" />
                      <span className="font-medium">Gallery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBulkTagGallery(bulkTagGallery === true ? null : true)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagGallery === true
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => setBulkTagGallery(bulkTagGallery === false ? null : false)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagGallery === false
                            ? "bg-red-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {/* Free */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <Unlock className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBulkTagFree(bulkTagFree === true ? null : true);
                          if (bulkTagFree !== true) setBulkTagPPV(null);
                        }}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagFree === true
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => setBulkTagFree(bulkTagFree === false ? null : false)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagFree === false
                            ? "bg-red-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {/* VIP */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-[var(--gold)]" />
                      <span className="font-medium">VIP Only</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBulkTagVIP(bulkTagVIP === true ? null : true)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagVIP === true
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => setBulkTagVIP(bulkTagVIP === false ? null : false)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagVIP === false
                            ? "bg-red-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {/* AI */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">AI Chat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBulkTagAI(bulkTagAI === true ? null : true)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagAI === true
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => setBulkTagAI(bulkTagAI === false ? null : false)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                          bulkTagAI === false
                            ? "bg-red-500 text-white"
                            : "bg-[var(--surface)] text-[var(--muted)]"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {/* PPV */}
                  <div className="p-3 rounded-xl bg-[var(--background)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-orange-400" />
                        <span className="font-medium">PPV</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setBulkTagPPV(bulkTagPPV === true ? null : true);
                            if (bulkTagPPV !== true) setBulkTagFree(null);
                          }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                            bulkTagPPV === true
                              ? "bg-emerald-500 text-white"
                              : "bg-[var(--surface)] text-[var(--muted)]"
                          )}
                        >
                          On
                        </button>
                        <button
                          onClick={() => setBulkTagPPV(bulkTagPPV === false ? null : false)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                            bulkTagPPV === false
                              ? "bg-red-500 text-white"
                              : "bg-[var(--surface)] text-[var(--muted)]"
                          )}
                        >
                          Off
                        </button>
                      </div>
                    </div>
                    {bulkTagPPV === true && (
                      <div className="mt-3">
                        <Input
                          label="Price (credits)"
                          type="number"
                          value={bulkPpvPriceCredits}
                          onChange={(e) => setBulkPpvPriceCredits(e.target.value)}
                          placeholder="1000"
                          leftIcon={<Coins className="w-4 h-4" />}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkEditModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleBulkEditSave}
                    disabled={isBulkActionLoading}
                    className="flex-1"
                  >
                    {isBulkActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Apply to {selectedIds.size} items
                      </>
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
