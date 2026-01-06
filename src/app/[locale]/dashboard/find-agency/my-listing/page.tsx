"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  Loader2,
  X,
  Plus,
  Instagram,
  Twitter,
  MessageCircle,
  Percent,
  Image as ImageIcon,
  Tag,
  Trash2,
  Eye,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { CREATOR_CATEGORIES } from "@/lib/categories";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface ModelListing {
  id: string;
  bio: string | null;
  photos: string[];
  socialLinks: Record<string, string>;
  tags: string[];
  revenueShare: number;
  chattingEnabled: boolean;
  isActive: boolean;
}


export default function MyListingPage() {
  const router = useRouter();
  const { selectedCreator } = useAdminCreator();
  const [listing, setListing] = useState<ModelListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [revenueShare, setRevenueShare] = useState(70);
  const [chattingEnabled, setChattingEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-fetch when selected creator changes
  useEffect(() => {
    if (selectedCreator?.slug) {
      fetchData();
    }
  }, [selectedCreator?.slug]);

  const fetchData = async () => {
    if (!selectedCreator?.slug) return;

    setIsLoading(true);
    // Reset form when switching creators
    setListing(null);
    setBio("");
    setPhotos([]);
    setInstagram("");
    setTwitter("");
    setTiktok("");
    setSelectedTags([]);
    setRevenueShare(70);
    setChattingEnabled(true);
    setIsActive(true);

    try {
      // Fetch listing for specific creator
      const listingRes = await fetch(`/api/model-listing?creatorSlug=${selectedCreator.slug}`);

      // Process listing data
      if (listingRes.ok) {
        const data = await listingRes.json();

        // Always pre-select creator's categories first (as default)
        if (data.creator?.categories && data.creator.categories.length > 0) {
          setSelectedTags(data.creator.categories);
        }

        // If listing exists, override with listing data
        if (data.listing) {
          setListing(data.listing);
          setBio(data.listing.bio || "");
          setPhotos(data.listing.photos || []);
          const socialLinks = typeof data.listing.socialLinks === 'string'
            ? JSON.parse(data.listing.socialLinks)
            : data.listing.socialLinks || {};
          setInstagram(socialLinks.instagram || "");
          setTwitter(socialLinks.twitter || "");
          setTiktok(socialLinks.tiktok || "");
          // Override tags only if listing has tags
          if (data.listing.tags && data.listing.tags.length > 0) {
            setSelectedTags(data.listing.tags);
          }
          setRevenueShare(data.listing.revenueShare || 70);
          setChattingEnabled(data.listing.chattingEnabled !== false);
          setIsActive(data.listing.isActive !== false);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 5) {
      setMessage({ type: "error", text: "Maximum 5 photos allowed" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({ type: "error", text: "Invalid format. Use JPEG, PNG or WebP." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Maximum 5MB." });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "listing");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhotos([...photos, data.url]);
        setMessage(null);
      } else {
        setMessage({ type: "error", text: "Failed to upload photo" });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({ type: "error", text: "Failed to upload photo" });
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!selectedCreator?.slug) {
      setMessage({ type: "error", text: "No creator selected" });
      return;
    }

    if (photos.length === 0) {
      setMessage({ type: "error", text: "Please add at least one photo" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        creatorSlug: selectedCreator.slug,
        bio,
        photos,
        socialLinks: { instagram, twitter, tiktok },
        tags: selectedTags,
        revenueShare,
        chattingEnabled,
        isActive,
      };

      const method = listing ? "PATCH" : "POST";
      const res = await fetch("/api/model-listing", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setListing(data.listing);
        setMessage({ type: "success", text: listing ? "Listing updated!" : "Listing created!" });
      } else {
        const error = await res.json();
        const errorText = error.details ? `${error.error}: ${error.details}` : (error.error || "Failed to save");
        setMessage({ type: "error", text: errorText });
      }
    } catch (error) {
      console.error("Error saving listing:", error);
      setMessage({ type: "error", text: "Failed to save listing" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCreator?.slug) return;
    if (!confirm("Are you sure you want to delete your listing?")) return;

    try {
      const res = await fetch(`/api/model-listing?creatorSlug=${selectedCreator.slug}`, { method: "DELETE" });
      if (res.ok) {
        setListing(null);
        setBio("");
        setPhotos([]);
        setInstagram("");
        setTwitter("");
        setTiktok("");
        setSelectedTags([]);
        setRevenueShare(70);
        setChattingEnabled(true);
        setMessage({ type: "success", text: "Listing deleted" });
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  if (!selectedCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card variant="luxury" className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[var(--gold)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Creator Selected</h2>
          <p className="text-[var(--muted)]">
            Please select a creator profile from the sidebar to manage their listing.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/find-agency"
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--muted)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {listing ? "Edit My Listing" : "Create My Listing"}
            </h1>
            <p className="text-[var(--muted)] text-sm">
              Listing for <span className="text-[var(--gold)] font-medium">{selectedCreator.displayName || selectedCreator.name}</span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Photos */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[var(--gold)]" />
              Photos (max 5)
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 hover:border-[var(--gold)] transition-colors text-[var(--muted)] hover:text-[var(--gold)]"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      <span className="text-xs">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </Card>

          {/* Bio */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Bio</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 resize-none"
              placeholder="Tell agencies about yourself, your experience, what makes you unique..."
            />
          </Card>

          {/* Social Links */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Social Links</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-400" />
                </div>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
                  placeholder="@username"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-sky-400" />
                </div>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
                  placeholder="@username"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
                  placeholder="@username"
                />
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[var(--gold)]" />
              Content Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {CREATOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleTag(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(cat.id)
                      ? "bg-[var(--gold)] text-black"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Revenue Share */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-[var(--gold)]" />
              Revenue Share
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              What percentage of earnings do you want to keep? (Agency gets the rest)
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="95"
                value={revenueShare}
                onChange={(e) => setRevenueShare(parseInt(e.target.value))}
                className="flex-1 accent-[var(--gold)]"
              />
              <div className="min-w-[80px] text-center px-4 py-2 rounded-xl bg-[var(--gold)]/20 text-[var(--gold)] font-bold">
                {revenueShare}%
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">
              You keep {revenueShare}% • Agency gets {100 - revenueShare}%
            </p>
          </Card>

          {/* Chatting */}
          <Card variant="luxury" className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">Chatting Enabled</h3>
                  <p className="text-sm text-[var(--muted)]">Willing to do subscriber chatting</p>
                </div>
              </div>
              <button
                onClick={() => setChattingEnabled(!chattingEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  chattingEnabled ? "bg-purple-500" : "bg-[var(--border)]"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  chattingEnabled ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </Card>

          {/* Active Toggle */}
          {listing && (
            <Card variant="luxury" className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Listing Active</h3>
                    <p className="text-sm text-[var(--muted)]">Visible to agencies in Find Model</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isActive ? "bg-green-500" : "bg-[var(--border)]"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isActive ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>
            </Card>
          )}

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-3 rounded-xl ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="premium"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {listing ? "Save Changes" : "Create Listing"}
            </Button>
            {listing && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
