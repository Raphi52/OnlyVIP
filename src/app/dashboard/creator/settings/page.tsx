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
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

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
  const [creatorImage, setCreatorImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [creatorBio, setCreatorBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [ppvEnabled, setPpvEnabled] = useState(true);

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
      const res = await fetch(`/api/admin/settings?creator=${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setCreatorName(data.creatorName || "");
        setCreatorImage(data.creatorImage);
        setCoverImage(data.coverImage);
        setCardImage(data.cardImage);
        setCreatorBio(data.creatorBio || "");
        setInstagram(data.instagram || "");
        setTwitter(data.twitter || "");
        setTiktok(data.tiktok || "");
        setSiteName(data.siteName || "");
        setSiteDescription(data.siteDescription || "");
        setWelcomeMessage(data.welcomeMessage || "");
        setChatEnabled(data.chatEnabled ?? true);
        setTipsEnabled(data.tipsEnabled ?? true);
        setPpvEnabled(data.ppvEnabled ?? true);
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

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          creatorName,
          creatorImage,
          coverImage,
          cardImage,
          creatorBio,
          instagram,
          twitter,
          tiktok,
          siteName,
          siteDescription,
          welcomeMessage,
          chatEnabled,
          tipsEnabled,
          ppvEnabled,
        }),
      });

      if (res.ok) {
        setSaved(true);
        refreshCreator(); // Refresh context
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || (isLoading && !selectedCreator?.slug)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!isCreator && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Creator Settings
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Settings for <span className="text-[var(--gold)]">{selectedCreator?.displayName || "..."}</span>
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--gold)]" />
                Creator Profile
              </h2>

              <div className="space-y-6">
                {/* Images Row */}
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Profile Photo <span className="text-red-400">*</span>
                    </p>
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-[var(--surface)] border-4 border-[var(--gold)]/30">
                        {creatorImage ? (
                          <img
                            src={creatorImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)]">
                            <User className="w-10 h-10 text-[var(--background)]" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[var(--gold)] hover:bg-[var(--gold-light)] flex items-center justify-center transition-colors shadow-lg"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-4 h-4 text-[var(--background)] animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-[var(--background)]" />
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
                    <p className="text-xs text-[var(--muted)] text-center">
                      Chat & navbar
                    </p>
                  </div>

                  {/* Card Image */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Card Image
                    </p>
                    <div className="relative">
                      <div className="w-28 h-36 rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors">
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
                                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => setCardImage(null)}
                                className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-4 h-4 text-white" />
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
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-xs">Add</span>
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
                    <p className="text-xs text-[var(--muted)] text-center">
                      Hero card (3:4)
                    </p>
                  </div>

                  {/* Cover Image */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                      Cover Image <span className="text-gray-500">(background)</span>
                    </p>
                    <div className="relative">
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors">
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
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Camera className="w-5 h-5 text-white" />
                              </button>
                              <button
                                onClick={() => setCoverImage(null)}
                                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUploadingCover}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                          >
                            {isUploadingCover ? (
                              <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8" />
                                <span className="text-sm">Add cover image</span>
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
                    <p className="text-xs text-[var(--muted)] mt-2">
                      Hero background (1920x1080)
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Creator Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                      placeholder="Enter creator name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Bio
                    </label>
                    <textarea
                      value={creatorBio}
                      onChange={(e) => setCreatorBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                      placeholder="Your bio..."
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--gold)]" />
                Social Links
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter / X
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
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
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--gold)]" />
                Site Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Site Description (SEO)
                  </label>
                  <textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    placeholder="Description for search engines..."
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Chat Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--gold)]" />
                Chat & Messages
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    placeholder="Automatic message sent to new subscribers..."
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Features Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <ToggleRight className="w-5 h-5 text-[var(--gold)]" />
                Features
              </h2>

              <div className="space-y-4">
                {/* Chat Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Chat</p>
                    <p className="text-sm text-[var(--muted)]">Allow subscribers to message this creator</p>
                  </div>
                  <button
                    onClick={() => setChatEnabled(!chatEnabled)}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      chatEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        chatEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Tips Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Tips</p>
                    <p className="text-sm text-[var(--muted)]">Allow subscribers to send tips</p>
                  </div>
                  <button
                    onClick={() => setTipsEnabled(!tipsEnabled)}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      tipsEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        tipsEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* PPV Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Pay-Per-View Messages</p>
                    <p className="text-sm text-[var(--muted)]">Allow sending paid content in chat</p>
                  </div>
                  <button
                    onClick={() => setPpvEnabled(!ppvEnabled)}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      ppvEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        ppvEnabled ? "translate-x-7" : "translate-x-1"
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
            transition={{ delay: 0.6 }}
            className="flex justify-end"
          >
            <Button
              variant="premium"
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
