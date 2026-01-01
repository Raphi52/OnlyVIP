"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Loader2,
  ArrowLeft,
  Users,
  Bot,
  MessageCircle,
  BarChart3,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function BecomeAgencyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [agencyName, setAgencyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const isCreator = (session?.user as any)?.isCreator === true;
  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  // Redirect if already an agency owner
  useEffect(() => {
    if (status === "authenticated" && isAgencyOwner) {
      router.push("/dashboard/agency");
    }
  }, [status, isAgencyOwner, router]);

  // Redirect if not a creator
  useEffect(() => {
    if (status === "authenticated" && !isCreator) {
      router.push("/dashboard/become-creator");
    }
  }, [status, isCreator, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!agencyName.trim()) {
      setError("Please enter an agency name");
      setIsLoading(false);
      return;
    }

    try {
      let logoUrl = null;

      // Upload logo if selected
      if (logoFile) {
        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append("files", logoFile);
        formData.append("type", "avatar"); // Use avatar type for logos

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.urls?.[0] || null;
        }
        setIsUploadingLogo(false);
      }

      const res = await fetch("/api/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agencyName.trim(),
          logo: logoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create agency");
        return;
      }

      await update();
      router.push("/dashboard/agency/creators");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploadingLogo(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  const benefits = [
    { icon: Users, title: "Manage Chatters", description: "Hire and manage chatters for your creators" },
    { icon: Bot, title: "AI Personalities", description: "Create AI personas with A/B testing" },
    { icon: MessageCircle, title: "Scripts Library", description: "Pre-written responses for your team" },
    { icon: BarChart3, title: "Performance Tracking", description: "Track revenue by chatter and AI" },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Become an Agency
          </h1>
          <p className="text-[var(--muted)]">
            Scale your creator business with chatters and AI
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
            >
              <benefit.icon className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="font-semibold text-[var(--foreground)] text-sm">
                {benefit.title}
              </h3>
              <p className="text-xs text-[var(--muted)]">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Create your agency
              </h2>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAgency} className="space-y-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Agency Logo <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/50">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-purple-500/50 bg-[var(--surface)] flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Upload className="w-6 h-6 text-[var(--muted)]" />
                        <span className="text-xs text-[var(--muted)] mt-1">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoSelect}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--muted)]">
                      Upload a logo for your agency
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Agency Name
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="My Agency"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Choose a name for your agency
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <h3 className="font-medium text-purple-400 mb-2">What you get:</h3>
                <ul className="space-y-1 text-sm text-[var(--muted)]">
                  <li>• Up to 10 creators under your agency</li>
                  <li>• Up to 20 chatters to manage messages</li>
                  <li>• Revenue tracking per chatter</li>
                  <li>• AI personalities (requires admin approval)</li>
                  <li>• Scripts library for your team</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                disabled={isLoading || !agencyName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isUploadingLogo ? "Uploading logo..." : "Creating agency..."}
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 mr-2" />
                    Create Agency
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-[var(--muted)] text-center mt-4">
              By creating an agency, you agree to our{" "}
              <Link href="/terms" className="text-purple-400 hover:underline">
                Terms of Service
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
