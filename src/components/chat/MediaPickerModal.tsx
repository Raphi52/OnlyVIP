"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  Check,
  Lock,
  Coins,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  title: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  thumbnailUrl: string | null;
  contentUrl: string;
  previewUrl: string | null;
  ppvPriceCredits: number | null;
  tagPPV: boolean;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  creatorSlug: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  creatorSlug,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "PHOTO" | "VIDEO">("all");

  useEffect(() => {
    if (isOpen && creatorSlug) {
      fetchMedia();
    }
  }, [isOpen, creatorSlug]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("creator", creatorSlug);
      params.set("tagPPV", "true");
      params.set("limit", "100");

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error("Error fetching PPV media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMedia = media.filter((item) => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleConfirm = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      setSelectedMedia(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#0a0a0c] border border-white/10"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Select PPV Content</h2>
                  <p className="text-xs text-gray-400">Choose from your library</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/50"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "PHOTO", "VIDEO"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      filterType === type
                        ? "bg-[var(--gold)] text-black"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {type === "all" ? "All" : type === "PHOTO" ? "Photos" : "Videos"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 font-medium">No PPV content found</p>
                <p className="text-white/20 text-sm mt-1">
                  Upload media with the PPV tag in your media library
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredMedia.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMedia(item)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                      selectedMedia?.id === item.id
                        ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                        : "border-transparent hover:border-white/20"
                    )}
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.thumbnailUrl || item.contentUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Type indicator */}
                    {item.type === "VIDEO" && (
                      <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 backdrop-blur-sm">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Price badge */}
                    {item.ppvPriceCredits && (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--gold)]/90 text-black text-[10px] font-bold">
                        <Coins className="w-2.5 h-2.5" />
                        {item.ppvPriceCredits}
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {selectedMedia?.id === item.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-[var(--gold)]/20 flex items-center justify-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center">
                          <Check className="w-5 h-5 text-black" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 p-4 border-t border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl">
            {selectedMedia && (
              <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/5">
                <img
                  src={selectedMedia.thumbnailUrl || selectedMedia.contentUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedMedia.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{selectedMedia.type}</span>
                    {selectedMedia.ppvPriceCredits && (
                      <span className="flex items-center gap-1 text-xs text-[var(--gold)]">
                        <Coins className="w-3 h-3" />
                        {selectedMedia.ppvPriceCredits} credits
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleConfirm}
                disabled={!selectedMedia}
                className="flex-1 gap-2"
              >
                <Lock className="w-4 h-4" />
                Send as PPV
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
