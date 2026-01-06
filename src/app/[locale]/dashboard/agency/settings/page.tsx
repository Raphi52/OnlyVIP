"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Save,
  Loader2,
  Camera,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
}

export default function AgencySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;
  const { refreshAgency } = useAdminCreator();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    try {
      const res = await fetch("/api/agency");
      if (res.ok) {
        const data = await res.json();
        if (data.agencies && data.agencies.length > 0) {
          const agencyData = data.agencies[0];
          setAgency(agencyData);
          setName(agencyData.name);
          setWebsite(agencyData.website || "");
          setLogoPreview(agencyData.logo);
        }
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 5MB" });
      return;
    }

    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!agency) return;
    setIsSaving(true);
    setMessage(null);

    try {
      let logoUrl = agency.logo;

      // Upload new logo if selected
      if (selectedLogo) {
        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append("files", selectedLogo);
        formData.append("type", "avatar");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.files?.[0]?.url || null;
        } else {
          const errorData = await uploadRes.json();
          setMessage({ type: "error", text: errorData.error || "Failed to upload logo" });
          setIsSaving(false);
          setIsUploadingLogo(false);
          return;
        }
        setIsUploadingLogo(false);
      }

      // Update agency
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          name: name.trim(),
          logo: logoUrl,
          website: website.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgency({ ...agency, ...data.agency });
        setSelectedLogo(null);
        setMessage({ type: "success", text: "Agency settings saved successfully!" });
        // Refresh the sidebar agency card
        await refreshAgency();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving agency:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
      setIsUploadingLogo(false);
    }
  };

  const handleDelete = async () => {
    if (!agency || deleteConfirmName !== agency.name) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/agency?id=${agency.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to delete agency" });
      }
    } catch (error) {
      console.error("Error deleting agency:", error);
      setMessage({ type: "error", text: "Failed to delete agency" });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Agency not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Agency Settings</h1>
          <p className="text-[var(--muted)] mt-1">Manage your agency profile and settings</p>
        </div>

        {/* Agency Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="default" className="p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Agency Profile
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

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-purple-500/30 bg-[var(--surface)]">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Agency Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-purple-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-[var(--muted)] mt-3">
                Click to change agency logo
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="My Agency"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="https://myagency.com"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Your agency's website (optional)
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8">
              <Button
                variant="default"
                onClick={handleSave}
                disabled={isSaving || (!selectedLogo && name === agency.name && website === (agency.website || ""))}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isUploadingLogo ? "Uploading logo..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" className="p-6 border-red-500/30">
            <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <p className="text-[var(--muted)] text-sm mb-4">
              Deleting your agency will remove all associated data including chatters and AI personas.
              This action cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Agency
            </Button>
          </Card>
        </motion.div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    Delete Agency
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-red-300 mb-4">
                This will permanently delete <strong>"{agency.name}"</strong> and all associated data.
                This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Type <strong>{agency.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-red-500/30 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Agency name"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmName !== agency.name}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
