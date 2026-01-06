"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  Loader2,
  User,
  Mail,
  Crown,
  Sparkles,
  Building2,
  Shield,
  AlertTriangle,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui";

interface RolesData {
  role: string;
  isCreator: boolean;
  isAgencyOwner: boolean;
  canDisableCreator: boolean;
  canDisableAgency: boolean;
  hasCreatorProfiles: number;
  hasAgency: boolean;
  agencyName: string | null;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Roles state
  const [rolesData, setRolesData] = useState<RolesData | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: string;
    title: string;
    message: string;
    warning?: boolean;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    if (session?.user?.image) {
      setPreviewImage(session.user.image);
    }
  }, [session]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/user/roles");
      if (res.ok) {
        const data = await res.json();
        setRolesData(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({ type: "error", text: "Invalid format. Use JPEG, PNG or WebP." });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Maximum 5MB." });
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();

      if (name && name !== session?.user?.name) {
        formData.append("name", name);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error saving profile");
      }

      const updatedUser = await response.json();

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updatedUser.name,
          image: updatedUser.image,
        },
      });

      setSelectedFile(null);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Error saving profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleAction = async (action: string) => {
    setActionLoading(action);
    setConfirmModal(null);

    try {
      const res = await fetch("/api/user/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error updating role" });
        return;
      }

      setMessage({ type: "success", text: data.message });

      // Refresh roles data
      await fetchRoles();

      // Refresh session to get updated user data
      await updateSession();

      // Redirect if needed
      if (data.redirectTo) {
        router.push(data.redirectTo);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setMessage({ type: "error", text: "Error updating role" });
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmModal = (action: string, title: string, message: string, warning = false) => {
    setConfirmModal({ action, title, message, warning });
  };

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <div className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Account Settings</h1>
          <p className="text-[var(--muted)] mt-1">Manage your profile and permissions</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--gold)]" />
            Profile
          </h2>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--gold)]/30">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--gold)]/20 flex items-center justify-center">
                    <Crown className="w-12 h-12 text-[var(--gold)]" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-[var(--muted)] mt-3">
              Click to change your profile picture
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <Mail className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-[var(--muted)]">{session?.user?.email}</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <Button
              variant="premium"
              onClick={handleSave}
              disabled={isSaving || (!selectedFile && name === session?.user?.name)}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Roles & Permissions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--gold)]" />
            Roles & Permissions
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

          {rolesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[var(--gold)] animate-spin" />
            </div>
          ) : rolesData ? (
            <div className="space-y-4">
              {/* Creator Mode */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      rolesData.isCreator ? "bg-[var(--gold)]/20" : "bg-gray-500/20"
                    }`}>
                      <Sparkles className={`w-5 h-5 ${
                        rolesData.isCreator ? "text-[var(--gold)]" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">Creator Mode</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {rolesData.isCreator
                          ? `${rolesData.hasCreatorProfiles} creator profile(s)`
                          : "Create and manage creator profiles"
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (rolesData.isCreator) {
                        if (!rolesData.canDisableCreator) {
                          setMessage({
                            type: "error",
                            text: `You must delete your ${rolesData.hasCreatorProfiles} creator profile(s) first`
                          });
                          return;
                        }
                        openConfirmModal(
                          "disableCreator",
                          "Disable Creator Mode",
                          "You will lose access to creator features. This will also disable Agency mode if enabled.",
                          true
                        );
                      } else {
                        handleRoleAction("enableCreator");
                      }
                    }}
                    disabled={actionLoading === "enableCreator" || actionLoading === "disableCreator"}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      rolesData.isCreator ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    } ${actionLoading?.includes("Creator") ? "opacity-50" : ""}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      rolesData.isCreator ? "left-7" : "left-1"
                    }`} />
                    {actionLoading?.includes("Creator") && (
                      <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Agency Mode */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      rolesData.isAgencyOwner ? "bg-purple-500/20" : "bg-gray-500/20"
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        rolesData.isAgencyOwner ? "text-purple-400" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">Agency Mode</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {rolesData.isAgencyOwner
                          ? rolesData.hasAgency
                            ? `Managing "${rolesData.agencyName}"`
                            : "Create your agency to get started"
                          : "Manage creators with chatters"
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (rolesData.isAgencyOwner) {
                        if (!rolesData.canDisableAgency) {
                          setMessage({
                            type: "error",
                            text: "You must delete your agency first"
                          });
                          return;
                        }
                        openConfirmModal(
                          "disableAgency",
                          "Disable Agency Mode",
                          "You will lose access to agency features and your chatters.",
                          true
                        );
                      } else {
                        if (!rolesData.isCreator) {
                          setMessage({
                            type: "error",
                            text: "You must enable Creator mode first"
                          });
                          return;
                        }
                        handleRoleAction("enableAgency");
                      }
                    }}
                    disabled={
                      actionLoading === "enableAgency" ||
                      actionLoading === "disableAgency" ||
                      (!rolesData.isAgencyOwner && !rolesData.isCreator)
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      rolesData.isAgencyOwner ? "bg-purple-500" : "bg-[var(--border)]"
                    } ${actionLoading?.includes("Agency") ? "opacity-50" : ""}
                    ${!rolesData.isAgencyOwner && !rolesData.isCreator ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      rolesData.isAgencyOwner ? "left-7" : "left-1"
                    }`} />
                    {actionLoading?.includes("Agency") && (
                      <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />
                    )}
                  </button>
                </div>
                {!rolesData.isCreator && !rolesData.isAgencyOwner && (
                  <p className="text-xs text-amber-400 mt-2 ml-13">
                    Requires Creator mode to be enabled
                  </p>
                )}
              </div>

              {/* Admin Status (if admin) */}
              {isAdmin && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-400">Administrator</h3>
                        <p className="text-sm text-red-400/70">Full platform access</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/admin")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Admin Panel
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--muted)] text-center py-4">Failed to load roles</p>
          )}
        </motion.div>

        {/* Danger Zone (if admin) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-[var(--muted)] text-sm mb-4">
              These actions are irreversible. Proceed with caution.
            </p>
            <Button
              variant="outline"
              onClick={() => openConfirmModal(
                "resignAdmin",
                "Resign Admin Role",
                "You will lose all admin privileges. Only another admin can restore them.",
                true
              )}
              disabled={actionLoading === "resignAdmin"}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {actionLoading === "resignAdmin" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Resign as Admin
            </Button>
          </motion.div>
        )}

      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-[var(--surface)] border rounded-2xl p-6 w-full max-w-md shadow-2xl ${
                confirmModal.warning ? "border-red-500/30" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {confirmModal.warning ? (
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[var(--gold)]" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {confirmModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className={`text-sm mb-6 ${confirmModal.warning ? "text-red-300" : "text-[var(--muted)]"}`}>
                {confirmModal.message}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setConfirmModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    confirmModal.warning
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : ""
                  }`}
                  variant={confirmModal.warning ? undefined : "premium"}
                  onClick={() => handleRoleAction(confirmModal.action)}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
