"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  Music,
  Package,
  Search,
  Loader2,
  RefreshCw,
  Crown,
  Eye,
  X,
  Trash2,
  Play,
  Lock,
  Star,
  Bot,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

interface MediaItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "PACK";
  accessTier: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  contentUrl: string;
  isPurchaseable: boolean;
  price: number | null;
  tagGallery: boolean;
  tagPPV: boolean;
  tagAI: boolean;
  tagFree: boolean;
  tagVIP: boolean;
  ppvPriceCredits: number | null;
  viewCount: number;
  purchaseCount: number;
  isFeatured: boolean;
  creator: { slug: string; displayName: string; avatar: string | null };
  createdAt: string;
}

interface Creator {
  slug: string;
  displayName: string;
}

const typeIcons: Record<string, typeof ImageIcon> = {
  PHOTO: ImageIcon,
  VIDEO: Video,
  AUDIO: Music,
  PACK: Package,
};

const typeColors: Record<string, string> = {
  PHOTO: "bg-blue-500/20 text-blue-400",
  VIDEO: "bg-purple-500/20 text-purple-400",
  AUDIO: "bg-pink-500/20 text-pink-400",
  PACK: "bg-amber-500/20 text-amber-400",
};

export default function AdminMediaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, photos: 0, videos: 0, audio: 0, packs: 0 });
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchMedia();
  }, [session, status, isAdmin, router, page, filterCreator, filterType, filterTag]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "48");
      if (searchQuery) params.set("search", searchQuery);
      if (filterCreator) params.set("creator", filterCreator);
      if (filterType) params.set("type", filterType);
      if (filterTag) params.set("tag", filterTag);

      const res = await fetch(`/api/admin/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        setCreators(data.creators || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMedia();
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/media?id=${deleteModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== deleteModal.id));
        setDeleteModal(null);
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">
            All Media
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            View all media uploaded on the platform
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchMedia}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 mb-4 sm:mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
            />
          </div>

          {/* Creator filter */}
          <select
            value={filterCreator}
            onChange={(e) => { setFilterCreator(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
          >
            <option value="">All Creators</option>
            {creators.map((c) => (
              <option key={c.slug} value={c.slug}>{c.displayName}</option>
            ))}
          </select>

          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Type & Tag filters */}
        <div className="flex flex-wrap gap-2">
          {/* Type filters */}
          {["", "PHOTO", "VIDEO", "AUDIO", "PACK"].map((t) => {
            const Icon = t ? typeIcons[t] : ImageIcon;
            return (
              <button
                key={t || "all"}
                onClick={() => { setFilterType(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  filterType === t
                    ? "bg-[var(--gold)] text-[var(--background)]"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t || "All"}
              </button>
            );
          })}

          <div className="w-px bg-[var(--border)] mx-2" />

          {/* Tag filters */}
          {[
            { key: "", label: "All Tags" },
            { key: "gallery", label: "Gallery" },
            { key: "ppv", label: "PPV" },
            { key: "ai", label: "AI" },
            { key: "free", label: "Free" },
            { key: "vip", label: "VIP" },
          ].map((tag) => (
            <button
              key={tag.key}
              onClick={() => { setFilterTag(tag.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterTag === tag.key
                  ? "bg-purple-500 text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8"
      >
        {[
          { label: "Total", value: stats.total, icon: Package, color: "bg-gray-500/20 text-gray-400" },
          { label: "Photos", value: stats.photos, icon: ImageIcon, color: "bg-blue-500/20 text-blue-400" },
          { label: "Videos", value: stats.videos, icon: Video, color: "bg-purple-500/20 text-purple-400" },
          { label: "Audio", value: stats.audio, icon: Music, color: "bg-pink-500/20 text-pink-400" },
          { label: "Packs", value: stats.packs, icon: Package, color: "bg-amber-500/20 text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} variant="luxury" className="p-2 sm:p-4">
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 ${stat.color}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">{stat.label}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">
            No media found
          </h3>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {searchQuery || filterCreator || filterType || filterTag
              ? "No media match your filters"
              : "No media uploaded yet"}
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {media.map((item) => {
              const TypeIcon = typeIcons[item.type] || ImageIcon;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] cursor-pointer"
                  onClick={() => setSelectedMedia(item)}
                >
                  {/* Thumbnail */}
                  {item.thumbnailUrl || item.previewUrl || (item.type === "PHOTO" && item.contentUrl) ? (
                    <img
                      src={item.thumbnailUrl || item.previewUrl || item.contentUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--background)]">
                      <TypeIcon className="w-12 h-12 text-[var(--muted)]" />
                    </div>
                  )}

                  {/* Type badge */}
                  <div className={`absolute top-2 left-2 p-1.5 rounded-lg ${typeColors[item.type]}`}>
                    <TypeIcon className="w-3 h-3" />
                  </div>

                  {/* Video play button */}
                  {item.type === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Tags overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {item.tagPPV && (
                      <Badge className="bg-amber-500/80 text-white text-[10px] px-1.5 py-0.5">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        PPV
                      </Badge>
                    )}
                    {item.tagAI && (
                      <Badge className="bg-purple-500/80 text-white text-[10px] px-1.5 py-0.5">
                        <Bot className="w-2.5 h-2.5 mr-0.5" />
                        AI
                      </Badge>
                    )}
                    {item.isFeatured && (
                      <Badge className="bg-[var(--gold)]/80 text-black text-[10px] px-1.5 py-0.5">
                        <Star className="w-2.5 h-2.5 mr-0.5" />
                      </Badge>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {item.creator.avatar ? (
                        <img src={item.creator.avatar} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <Crown className="w-3 h-3 text-[var(--gold)]" />
                      )}
                      <span className="text-white/70 text-[10px] truncate">{item.creator.displayName}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Media Preview Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
              onClick={() => setSelectedMedia(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-10 z-50 flex flex-col"
              onClick={() => setSelectedMedia(null)}
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)]">
                      {selectedMedia.creator.avatar ? (
                        <img src={selectedMedia.creator.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                          <Crown className="w-5 h-5 text-[var(--background)]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{selectedMedia.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        by {selectedMedia.creator.displayName} • {formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMedia(null);
                        setDeleteModal(selectedMedia);
                      }}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <button
                      onClick={() => setSelectedMedia(null)}
                      className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Media preview */}
                    <div className="flex-1 flex items-center justify-center bg-black/50 rounded-xl overflow-hidden min-h-[300px]">
                      {selectedMedia.type === "VIDEO" ? (
                        <video
                          src={selectedMedia.contentUrl}
                          controls
                          className="max-w-full max-h-[60vh]"
                        />
                      ) : selectedMedia.type === "AUDIO" ? (
                        <div className="p-8">
                          <Music className="w-24 h-24 text-pink-400 mx-auto mb-4" />
                          <audio src={selectedMedia.contentUrl} controls className="w-full" />
                        </div>
                      ) : (
                        <img
                          src={selectedMedia.contentUrl}
                          alt={selectedMedia.title}
                          className="max-w-full max-h-[60vh] object-contain"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="w-full lg:w-80 space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={typeColors[selectedMedia.type]}>
                          {selectedMedia.type}
                        </Badge>
                        {selectedMedia.tagGallery && (
                          <Badge className="bg-emerald-500/20 text-emerald-400">Gallery</Badge>
                        )}
                        {selectedMedia.tagPPV && (
                          <Badge className="bg-amber-500/20 text-amber-400">
                            <Lock className="w-3 h-3 mr-1" />
                            PPV {selectedMedia.ppvPriceCredits && `${selectedMedia.ppvPriceCredits}c`}
                          </Badge>
                        )}
                        {selectedMedia.tagAI && (
                          <Badge className="bg-purple-500/20 text-purple-400">
                            <Bot className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        {selectedMedia.tagFree && (
                          <Badge className="bg-cyan-500/20 text-cyan-400">Free</Badge>
                        )}
                        {selectedMedia.tagVIP && (
                          <Badge className="bg-[var(--gold)]/20 text-[var(--gold)]">VIP</Badge>
                        )}
                        {selectedMedia.isFeatured && (
                          <Badge className="bg-[var(--gold)] text-black">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {selectedMedia.description && (
                        <div>
                          <p className="text-sm text-[var(--muted)] mb-1">Description</p>
                          <p className="text-[var(--foreground)]">{selectedMedia.description}</p>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--background)] rounded-xl p-3">
                          <p className="text-xs text-[var(--muted)]">Views</p>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {selectedMedia.viewCount.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-[var(--background)] rounded-xl p-3">
                          <p className="text-xs text-[var(--muted)]">Purchases</p>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {selectedMedia.purchaseCount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* URL */}
                      <div>
                        <p className="text-sm text-[var(--muted)] mb-1">Content URL</p>
                        <p className="text-xs text-[var(--foreground)] bg-[var(--background)] rounded-lg p-2 break-all">
                          {selectedMedia.contentUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Media</h3>
                    <p className="text-sm text-[var(--muted)]">This cannot be undone</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300">
                    Delete <strong className="text-red-400">{deleteModal.title}</strong>?
                  </p>
                  <p className="text-xs text-red-300/70 mt-1">
                    From {deleteModal.creator.displayName}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setDeleteModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
