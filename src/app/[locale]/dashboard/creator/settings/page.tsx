"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  Upload,
  User,
  Globe,
  Instagram,
  Twitter,
  Loader2,
  Check,
  Camera,
  MessageSquare,
  ToggleRight,
  ImageIcon,
  X,
  Wallet,
  DollarSign,
  Crown,
  Link2,
  Play,
  Image as ImageLucide,
  FolderOpen,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";
import { CREATOR_CATEGORIES, getCategoryById } from "@/lib/categories";
import { cn } from "@/lib/utils";

export default function CreatorSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedCreator, refreshCreator } = useAdminCreator();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [creatorName, setCreatorName] = useState("");
  const [creatorSlug, setCreatorSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [creatorImage, setCreatorImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [creatorBio, setCreatorBio] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [ppvEnabled, setPpvEnabled] = useState(true);
  const [walletEth, setWalletEth] = useState("");
  const [walletBtc, setWalletBtc] = useState("");
  const [welcomeMediaId, setWelcomeMediaId] = useState<string | null>(null);
  const [welcomeMediaUrl, setWelcomeMediaUrl] = useState<string | null>(null);
  const [welcomeMediaType, setWelcomeMediaType] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingWelcomeMedia, setIsUploadingWelcomeMedia] = useState(false);
  const welcomeMediaInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Pricing state (in credits, 100 credits = $1)
  const [basicMonthlyCredits, setBasicMonthlyCredits] = useState("999");
  const [basicAnnualCredits, setBasicAnnualCredits] = useState("9588");
  const [basicBonusCredits, setBasicBonusCredits] = useState("500");
  const [vipMonthlyCredits, setVipMonthlyCredits] = useState("2999");
  const [vipAnnualCredits, setVipAnnualCredits] = useState("28788");
  const [vipBonusCredits, setVipBonusCredits] = useState("2000");

  const isCreator = (session?.user as any)?.isCreator === true;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Redirect if not a creator/admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || (!isCreator && !isAdmin)) {
      router.push("/dashboard");
    }
  }, [session, status, isCreator, isAdmin, router]);

  // Fetch settings for the selected creator
  const fetchSettings = useCallback(async () => {
    if (!selectedCreator) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/creator/settings?creator=${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setCreatorSlug(selectedCreator.slug);
        setCreatorName(data.creatorName || "");
        setCreatorImage(data.creatorImage);
        setCoverImage(data.coverImage);
        setCardImage(data.cardImage);
        setCreatorBio(data.creatorBio || "");
        setSelectedCategories(data.categories || []);
        setInstagram(data.instagram || "");
        setTwitter(data.twitter || "");
        setTiktok(data.tiktok || "");
        setSiteName(data.siteName || "");
        setSiteDescription(data.siteDescription || "");
        setWelcomeMessage(data.welcomeMessage || "");
        setChatEnabled(data.chatEnabled ?? true);
        setTipsEnabled(data.tipsEnabled ?? true);
        setPpvEnabled(data.ppvEnabled ?? true);
        setWalletEth(data.walletEth || "");
        setWalletBtc(data.walletBtc || "");
        setWelcomeMediaId(data.welcomeMediaId || null);
        setWelcomeMediaUrl(data.welcomeMediaUrl || null);
        setWelcomeMediaType(data.welcomeMediaType || null);

        // Load pricing (in credits)
        if (data.pricing?.plans) {
          const basicPlan = data.pricing.plans.find((p: any) => p.id === "basic");
          const vipPlan = data.pricing.plans.find((p: any) => p.id === "vip");
          if (basicPlan) {
            setBasicMonthlyCredits(basicPlan.monthlyCredits?.toString() || "999");
            setBasicAnnualCredits(basicPlan.annualCredits?.toString() || "9588");
            setBasicBonusCredits(basicPlan.bonusCredits?.toString() || "500");
          }
          if (vipPlan) {
            setVipMonthlyCredits(vipPlan.monthlyCredits?.toString() || "2999");
            setVipAnnualCredits(vipPlan.annualCredits?.toString() || "28788");
            setVipBonusCredits(vipPlan.bonusCredits?.toString() || "2000");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCreator]);

  useEffect(() => {
    if (selectedCreator) {
      fetchSettings();
    }
  }, [fetchSettings, selectedCreator]);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setCreatorImage(uploadedFile.url);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setCoverImage(uploadedFile.url);
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Load media library for picker
  const loadMediaLibrary = async () => {
    if (!selectedCreator) return;
    setIsLoadingMedia(true);
    try {
      const res = await fetch(`/api/media?creator=${selectedCreator.slug}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMediaLibrary(data.media || []);
      }
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Handle welcome media upload
  const handleWelcomeMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWelcomeMedia(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setWelcomeMediaUrl(uploadedFile.url);
        setWelcomeMediaId(null); // Clear library selection when uploading directly
        setWelcomeMediaType(file.type.startsWith("video/") ? "VIDEO" : "PHOTO");
      }
    } catch (error) {
      console.error("Error uploading welcome media:", error);
    } finally {
      setIsUploadingWelcomeMedia(false);
    }
  };

  // Select media from library
  const selectMediaFromLibrary = (media: any) => {
    setWelcomeMediaId(media.id);
    setWelcomeMediaUrl(media.thumbnailUrl || media.contentUrl);
    setWelcomeMediaType(media.type);
    setShowMediaPicker(false);
  };

  // Handle card image upload
  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCard(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setCardImage(uploadedFile.url);
      }
    } catch (error) {
      console.error("Error uploading card:", error);
    } finally {
      setIsUploadingCard(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!selectedCreator) return;

    setIsSaving(true);
    setSaved(false);
    setSlugError(null);

    try {
      const res = await fetch("/api/creator/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          newSlug: creatorSlug !== selectedCreator.slug ? creatorSlug : undefined,
          creatorName,
          creatorImage,
          coverImage,
          cardImage,
          creatorBio,
          categories: selectedCategories,
          instagram,
          twitter,
          tiktok,
          siteName,
          siteDescription,
          welcomeMessage,
          welcomeMediaId,
          welcomeMediaUrl,
          welcomeMediaType,
          chatEnabled,
          tipsEnabled,
          ppvEnabled,
          walletEth,
          walletBtc,
          pricing: {
            plans: [
              {
                id: "basic",
                monthlyCredits: parseInt(basicMonthlyCredits) || 999,
                annualCredits: parseInt(basicAnnualCredits) || 9588,
                bonusCredits: parseInt(basicBonusCredits) || 500,
              },
              {
                id: "vip",
                monthlyCredits: parseInt(vipMonthlyCredits) || 2999,
                annualCredits: parseInt(vipAnnualCredits) || 28788,
                bonusCredits: parseInt(vipBonusCredits) || 2000,
              },
            ],
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        refreshCreator(); // Refresh context
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        if (data.error?.includes("slug")) {
          setSlugError(data.error);
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete creator profile
  const handleDeleteCreator = async () => {
    if (!selectedCreator || deleteConfirmText !== selectedCreator.slug) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/creators/${selectedCreator.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Redirect to dashboard after deletion
        router.push("/dashboard");
        // Force refresh to update session
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete creator");
      }
    } catch (error) {
      console.error("Error deleting creator:", error);
      alert("Failed to delete creator");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || (isLoading && !selectedCreator?.slug)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!isCreator && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-3 pt-20 sm:p-4 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
            Creator Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5 sm:mt-1">
            <span className="text-[var(--gold)]">{selectedCreator?.displayName || "..."}</span>
          </p>
        </motion.div>

        <div className="space-y-4 sm:space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Creator Profile
              </h2>

              <div className="space-y-4 sm:space-y-6">
                {/* Images Row */}
                <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      Profile <span className="text-red-400">*</span>
                    </p>
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[var(--surface)] border-3 sm:border-4 border-[var(--gold)]/30">
                        {creatorImage ? (
                          <img
                            src={creatorImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)]">
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--background)]" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[var(--gold)] hover:bg-[var(--gold-light)] flex items-center justify-center transition-colors shadow-lg"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--background)] animate-spin" />
                        ) : (
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--background)]" />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--muted)] text-center">
                      Chat
                    </p>
                  </div>

                  {/* Card Image */}
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      Card
                    </p>
                    <div className="relative">
                      <div className="w-16 h-20 sm:w-28 sm:h-36 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors">
                        {cardImage ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={cardImage}
                              alt="Card"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                onClick={() => cardInputRef.current?.click()}
                                className="p-1 sm:p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </button>
                              <button
                                onClick={() => setCardImage(null)}
                                className="p-1 sm:p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => cardInputRef.current?.click()}
                            disabled={isUploadingCard}
                            className="w-full h-full flex flex-col items-center justify-center gap-1 text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                          >
                            {isUploadingCard ? (
                              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className="text-[10px] sm:text-xs">Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        ref={cardInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCardUpload}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--muted)] text-center">
                      Hero (3:4)
                    </p>
                  </div>

                  {/* Cover Image */}
                  <div className="flex-1 w-full sm:w-auto">
                    <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] mb-2 sm:mb-3">
                      Cover <span className="text-gray-500 text-[10px] sm:text-xs">(background)</span>
                    </p>
                    <div className="relative">
                      <div className="w-full h-24 sm:h-32 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors">
                        {coverImage ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={coverImage}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => coverInputRef.current?.click()}
                                className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </button>
                              <button
                                onClick={() => setCoverImage(null)}
                                className="p-1.5 sm:p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUploadingCover}
                            className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-2 text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                          >
                            {isUploadingCover ? (
                              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                                <span className="text-xs sm:text-sm">Add cover</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-1.5 sm:mt-2">
                      1920x1080 recommended
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                        Creator Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                        placeholder="Enter creator name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                        <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Slug (URL)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs sm:text-sm">
                          viponly.fun/
                        </span>
                        <input
                          type="text"
                          value={creatorSlug}
                          onChange={(e) => {
                            // Convert spaces to hyphens, remove invalid chars, clean up multiple hyphens
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                              .replace(/-+/g, "-");
                            setCreatorSlug(value);
                            setSlugError(null);
                          }}
                          className={`w-full pl-24 sm:pl-28 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border text-sm sm:text-base text-[var(--foreground)] focus:outline-none ${
                            slugError
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--border)] focus:border-[var(--gold)]"
                          }`}
                          placeholder="yourname"
                        />
                      </div>
                      {slugError && (
                        <p className="text-red-400 text-[10px] sm:text-xs mt-1">{slugError}</p>
                      )}
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-1">
                        Lowercase letters, numbers, hyphens
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                      Bio
                    </label>
                    <textarea
                      value={creatorBio}
                      onChange={(e) => setCreatorBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                      placeholder="Your bio..."
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Category Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-1 sm:mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Category Tags
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mb-4 sm:mb-6">
                Select up to 5 tags that describe your content.
              </p>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CREATOR_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  const canSelect = selectedCategories.length < 5 || isSelected;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                        } else if (canSelect) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        }
                      }}
                      disabled={!canSelect && !isSelected}
                      className={cn(
                        "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                        isSelected
                          ? category.color + " ring-2 ring-white/30"
                          : canSelect
                            ? "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                            : "bg-[var(--surface)] text-[var(--muted)] opacity-50 cursor-not-allowed"
                      )}
                    >
                      {category.label}
                      {isSelected && " ✓"}
                    </button>
                  );
                })}
              </div>

              {selectedCategories.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
                  <p className="text-xs sm:text-sm text-[var(--muted)] mb-2">Selected ({selectedCategories.length}/5):</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedCategories.map((catId) => {
                      const cat = getCategoryById(catId);
                      return cat ? (
                        <span
                          key={catId}
                          className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium", cat.color)}
                        >
                          {cat.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Social Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Twitter / X
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="@username"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Site Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Site Settings
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Slug (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)] text-xs sm:text-sm whitespace-nowrap">viponly.fans/</span>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                      placeholder="your-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Site Description (SEO)
                  </label>
                  <textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    placeholder="Description for search engines..."
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment Wallets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Payment Wallets
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mb-3 sm:mb-4">
                Crypto payments will be sent directly to these wallets.
              </p>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm5.5 9.5h-4.75v-2h-1.5v2H12v1.5h1.25v11H12v1.5h3.25v2h1.5v-2h4.75v-1.5h-1.25v-11h1.25V9.5zm-2.75 12.5h-2.5v-11h2.5v11z"/>
                    </svg>
                    Ethereum (ETH)
                  </label>
                  <input
                    type="text"
                    value={walletEth}
                    onChange={(e) => setWalletEth(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] font-mono text-xs sm:text-sm"
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm4.138 8.788c-2.068.619-4.438.619-6.186.619-.094 0-.156 0-.212-.006-.069-.006-.125-.006-.175-.006-.188 0-.625.106-.625.387 0 .125.062.213.237.388l.056.056c.125.125.294.294.463.556.312.5.375.888.375 1.625 0 .256-.019.531-.037.794l-.019.331c-.05.738-.075 1.506.019 2.206.094.75.281 1.388.469 1.813.094.219.188.406.269.563.081.156.15.281.181.344.15.306.25.525.25.775 0 .156-.031.306-.094.45l-.119.294c-.131.319-.281.681-.281 1.144 0 .763.538 1.456.956 1.844l.044.044c.25.225.531.481.863.706.5.356.569.619.569.813 0 .094-.019.175-.063.256-.075.144-.206.256-.363.338-.312.156-.712.187-1.044.187-.15 0-.287-.012-.406-.025l-.063-.006c-.162-.019-.312-.031-.475-.031-.25 0-.494.031-.688.138-.231.119-.356.294-.412.481-.044.156-.056.344-.056.544v.006c0 .481.125 1.019.4 1.494.625 1.088 1.763 1.788 3.219 1.788h.2c.125.006.244.006.375.006.806 0 1.738-.125 2.55-.563.438-.238.844-.563 1.169-.981.731-.938.887-2.188.887-3.056 0-.325-.025-.619-.056-.85-.013-.1-.025-.188-.038-.275-.013-.1-.025-.188-.031-.269-.019-.225-.031-.419.05-.575.081-.163.244-.25.481-.356.131-.056.294-.113.475-.188l.063-.025c.231-.094.5-.2.737-.331.669-.369 1.188-.988 1.188-1.925 0-.819-.419-1.388-.7-1.788-.106-.15-.194-.275-.244-.381-.119-.275-.081-.656-.006-1.225.038-.294.075-.594.094-.9v-.019c.019-.288.031-.563.031-.825 0-.706-.075-1.35-.45-1.831-.225-.288-.531-.494-.938-.619z"/>
                    </svg>
                    Bitcoin (BTC)
                  </label>
                  <input
                    type="text"
                    value={walletBtc}
                    onChange={(e) => setWalletBtc(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] font-mono text-xs sm:text-sm"
                    placeholder="bc1... or 1... or 3..."
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Subscription Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Subscription Pricing
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mb-1 sm:mb-2">
                Set prices in credits. 100 credits = $1
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-4 sm:mb-6">
                Bonus credits are given to subscribers monthly.
              </p>

              <div className="space-y-4 sm:space-y-6">
                {/* Basic Plan */}
                <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)]">Basic Plan</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Monthly
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={basicMonthlyCredits}
                        onChange={(e) => setBasicMonthlyCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-blue-400"
                        placeholder="999"
                      />
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-0.5 sm:mt-1">
                        ~${(parseInt(basicMonthlyCredits) / 100 || 0).toFixed(0)}/mo
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Annual
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={basicAnnualCredits}
                        onChange={(e) => setBasicAnnualCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-blue-400"
                        placeholder="9588"
                      />
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-0.5 sm:mt-1">
                        ~${(parseInt(basicAnnualCredits) / 100 || 0).toFixed(0)}/yr
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Bonus
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={basicBonusCredits}
                        onChange={(e) => setBasicBonusCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-green-400"
                        placeholder="500"
                      />
                      <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">
                        Free
                      </p>
                    </div>
                  </div>
                </div>

                {/* VIP Plan */}
                <div className="p-3 sm:p-4 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                    <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)]">VIP Plan</h3>
                    <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-bold bg-[var(--gold)] text-black rounded-full">Popular</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Monthly
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={vipMonthlyCredits}
                        onChange={(e) => setVipMonthlyCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                        placeholder="2999"
                      />
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-0.5 sm:mt-1">
                        ~${(parseInt(vipMonthlyCredits) / 100 || 0).toFixed(0)}/mo
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Annual
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={vipAnnualCredits}
                        onChange={(e) => setVipAnnualCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                        placeholder="28788"
                      />
                      <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-0.5 sm:mt-1">
                        ~${(parseInt(vipAnnualCredits) / 100 || 0).toFixed(0)}/yr
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-2">
                        Bonus
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={vipBonusCredits}
                        onChange={(e) => setVipBonusCredits(e.target.value)}
                        className="w-full px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-green-400"
                        placeholder="2000"
                      />
                      <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">
                        Free
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Chat Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Chat & Messages
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    placeholder="Automatic message sent to new subscribers..."
                  />
                </div>

                {/* Welcome Media */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Welcome Media (Optional)
                  </label>
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-2 sm:mb-3">
                    Attach a photo or video to your welcome message
                  </p>

                  {welcomeMediaUrl ? (
                    <div className="relative inline-block">
                      <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-lg sm:rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-[var(--gold)]/30">
                        {welcomeMediaType === "VIDEO" ? (
                          <div className="relative w-full h-full">
                            <video
                              src={welcomeMediaUrl}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={welcomeMediaUrl}
                            alt="Welcome media"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setWelcomeMediaUrl(null);
                          setWelcomeMediaId(null);
                          setWelcomeMediaType(null);
                        }}
                        className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 sm:gap-3">
                      {/* Upload button */}
                      <button
                        onClick={() => welcomeMediaInputRef.current?.click()}
                        disabled={isUploadingWelcomeMedia}
                        className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors flex flex-col items-center gap-1.5 sm:gap-2 text-[var(--muted)] hover:text-[var(--gold)]"
                      >
                        {isUploadingWelcomeMedia ? (
                          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span className="text-xs sm:text-sm">Upload</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={welcomeMediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleWelcomeMediaUpload}
                      />

                      {/* Library picker button */}
                      <button
                        onClick={() => {
                          loadMediaLibrary();
                          setShowMediaPicker(true);
                        }}
                        className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] hover:border-purple-500/50 transition-colors flex flex-col items-center gap-1.5 sm:gap-2 text-[var(--muted)] hover:text-purple-400"
                      >
                        <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span className="text-xs sm:text-sm">Library</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Media Library Picker Modal */}
          {showMediaPicker && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--card)] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
              >
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Select from Library
                  </h3>
                  <button
                    onClick={() => setShowMediaPicker(false)}
                    className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--muted)]" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
                    </div>
                  ) : mediaLibrary.length === 0 ? (
                    <div className="text-center py-12 text-[var(--muted)]">
                      <ImageLucide className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No media in library</p>
                      <p className="text-sm mt-1">Upload media first in the Media section</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {mediaLibrary.map((media) => (
                        <button
                          key={media.id}
                          onClick={() => selectMediaFromLibrary(media)}
                          className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)] hover:ring-2 hover:ring-[var(--gold)] transition-all group"
                        >
                          {media.type === "VIDEO" ? (
                            <div className="relative w-full h-full">
                              <img
                                src={media.thumbnailUrl || media.contentUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={media.thumbnailUrl || media.contentUrl}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Features Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="luxury" className="p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
                <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                Features
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {/* Chat Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--surface)] rounded-lg sm:rounded-xl gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base text-[var(--foreground)]">Chat</p>
                    <p className="text-xs sm:text-sm text-[var(--muted)] truncate">Allow subscribers to message</p>
                  </div>
                  <button
                    onClick={() => setChatEnabled(!chatEnabled)}
                    className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors flex-shrink-0 ${
                      chatEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow transition-transform ${
                        chatEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Tips Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--surface)] rounded-lg sm:rounded-xl gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base text-[var(--foreground)]">Tips</p>
                    <p className="text-xs sm:text-sm text-[var(--muted)] truncate">Allow subscribers to send tips</p>
                  </div>
                  <button
                    onClick={() => setTipsEnabled(!tipsEnabled)}
                    className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors flex-shrink-0 ${
                      tipsEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow transition-transform ${
                        tipsEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* PPV Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--surface)] rounded-lg sm:rounded-xl gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base text-[var(--foreground)]">PPV Messages</p>
                    <p className="text-xs sm:text-sm text-[var(--muted)] truncate">Paid content in chat</p>
                  </div>
                  <button
                    onClick={() => setPpvEnabled(!ppvEnabled)}
                    className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors flex-shrink-0 ${
                      ppvEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow transition-transform ${
                        ppvEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-end"
          >
            <Button
              variant="premium"
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-4 sm:p-6 border-red-500/30 bg-red-500/5">
              <h2 className="text-base sm:text-xl font-semibold text-red-400 mb-1.5 sm:mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                Danger Zone
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mb-3 sm:mb-4">
                Deleting your creator profile is permanent. All media, messages, and subscriber data will be lost.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm sm:text-base"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Delete Profile
                </Button>
              ) : (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-red-500/10 rounded-lg sm:rounded-xl border border-red-500/30">
                  <p className="text-xs sm:text-sm text-red-400 font-medium">
                    Type <code className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 rounded text-[11px] sm:text-sm">{selectedCreator?.slug}</code> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Enter creator slug"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--surface)] border border-red-500/50 text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:border-red-500"
                  />
                  <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                    <Button
                      variant="outline"
                      className="text-sm sm:text-base order-2 sm:order-1"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 bg-red-500 text-white hover:bg-red-600 text-sm sm:text-base order-1 sm:order-2"
                      onClick={handleDeleteCreator}
                      disabled={deleteConfirmText !== selectedCreator?.slug || isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
