"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Bot,
  MessageCircle,
  DollarSign,
  TrendingUp,
  FileText,
  Loader2,
  Plus,
  Crown,
  BarChart3,
  ArrowUpRight,
  Upload,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
  slug: string;
  creators: {
    slug: string;
    name: string;
    displayName: string;
    avatar: string | null;
  }[];
  stats: {
    totalRevenue: number;
    revenue30d: number;
    chatterRevenue30d: number;
    aiRevenue30d: number;
    creatorsCount: number;
    chattersCount: number;
    aiPersonalitiesCount: number;
    scriptsCount: number;
  };
}

export default function AgencyDashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Agency creation form state
  const [agencyName, setAgencyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;
  const isCreator = (session?.user as any)?.isCreator === true;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const res = await fetch("/api/agency");
        if (res.ok) {
          const data = await res.json();
          setAgencies(data.agencies || []);
          if (data.agencies?.length > 0) {
            setSelectedAgency(data.agencies[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching agencies:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchAgencies();
    }
  }, [status]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCreateError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCreateError("Image must be less than 5MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setCreateError("");
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
    setIsCreating(true);
    setCreateError("");

    if (!agencyName.trim()) {
      setCreateError("Please enter an agency name");
      setIsCreating(false);
      return;
    }

    try {
      let logoUrl = null;

      if (logoFile) {
        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append("files", logoFile);
        formData.append("type", "avatar");

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
        setCreateError(data.error || "Failed to create agency");
        return;
      }

      await update();
      // Reload the page to show the new agency
      window.location.reload();
    } catch (err) {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
      setIsUploadingLogo(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Show agency creation form if user has no agency
  if (!selectedAgency) {
    // If user is already an agency owner but no agency loaded, there's a data issue
    // Redirect to dashboard to avoid showing the "become agency" form
    if (isAgencyOwner) {
      return (
        <div className="p-8">
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Loading your agency...
            </h2>
            <p className="text-[var(--muted)] mb-8">
              If this persists, please refresh the page.
            </p>
            <Button variant="default" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    // If user is not a creator, redirect to become-creator
    if (!isCreator) {
      return (
        <div className="p-8">
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Become a Creator First
            </h2>
            <p className="text-[var(--muted)] mb-8">
              You need to be a creator before creating an agency.
            </p>
            <Button variant="default" onClick={() => router.push("/dashboard/become-creator")}>
              Become a Creator
            </Button>
          </div>
        </div>
      );
    }

    // Show agency creation form
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

              {createError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {createError}
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
                  disabled={isCreating || !agencyName.trim()}
                >
                  {isCreating ? (
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

  const stats = [
    {
      label: "Revenue (30d)",
      value: formatCurrency(selectedAgency.stats.revenue30d),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-700/20",
    },
    {
      label: "Chatter Revenue",
      value: formatCurrency(selectedAgency.stats.chatterRevenue30d),
      icon: MessageCircle,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-700/20",
    },
    {
      label: "AI Revenue",
      value: formatCurrency(selectedAgency.stats.aiRevenue30d),
      icon: Bot,
      color: "text-purple-400",
      bg: "from-purple-500/20 to-purple-700/20",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(selectedAgency.stats.totalRevenue),
      icon: TrendingUp,
      color: "text-[var(--gold)]",
      bg: "from-[var(--gold)]/20 to-yellow-700/20",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/agency/chatters",
      icon: Users,
      label: "Chatters",
      count: selectedAgency.stats.chattersCount,
      color: "text-blue-400",
    },
    {
      href: "/dashboard/creator/ai",
      icon: Bot,
      label: "AI Personalities",
      count: selectedAgency.stats.aiPersonalitiesCount,
      color: "text-purple-400",
    },
    {
      href: "/dashboard/agency/scripts",
      icon: FileText,
      label: "Scripts",
      count: selectedAgency.stats.scriptsCount,
      color: "text-emerald-400",
    },
    {
      href: "/dashboard/agency/performance",
      icon: BarChart3,
      label: "Performance",
      count: null,
      color: "text-[var(--gold)]",
    },
  ];

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {selectedAgency.name}
            </h1>
            <p className="text-[var(--muted)]">
              Agency Dashboard
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, index) => (
          <Card key={index} variant="default" className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
          >
            <Card variant="default" className="p-5 hover:border-purple-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <link.icon className={cn("w-6 h-6", link.color)} />
                <ArrowUpRight className="w-4 h-4 text-[var(--muted)] group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="font-semibold text-[var(--foreground)]">{link.label}</p>
              {link.count !== null && (
                <p className="text-sm text-[var(--muted)]">{link.count}</p>
              )}
            </Card>
          </Link>
        ))}
      </motion.div>

      {/* Creators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="default" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--gold)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Creators ({selectedAgency.stats.creatorsCount})
              </h2>
            </div>
            <Link href="/dashboard/agency/creators">
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Creator
              </Button>
            </Link>
          </div>

          {selectedAgency.creators.length === 0 ? (
            <div className="text-center py-10">
              <Crown className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-[var(--muted)]">No creators in this agency yet</p>
              <p className="text-sm text-[var(--muted)]">
                Click &quot;Add Creator&quot; to add creators to your agency
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedAgency.creators.map((creator) => (
                <Link
                  key={creator.slug}
                  href={`/${creator.slug}`}
                  target="_blank"
                  className="group"
                >
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[var(--gold)]/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                          <span className="text-black font-bold">
                            {creator.displayName?.[0] || "C"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          @{creator.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
