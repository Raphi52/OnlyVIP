"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Check,
  Loader2,
  Link2,
  ArrowLeft,
  Rocket,
  DollarSign,
  MessageCircle,
  Image,
  Clock,
  XCircle,
  Send,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export default function BecomeCreatorPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(null);
  const [applicationDate, setApplicationDate] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugError, setSlugError] = useState("");

  const isCreator = (session?.user as any)?.isCreator === true;

  // Fetch application status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/user/become-creator?status=true");
        if (res.ok) {
          const data = await res.json();
          setApplicationStatus(data.applicationStatus);
          setApplicationDate(data.applicationDate);
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    }

    if (status === "authenticated") {
      fetchStatus();
    } else if (status === "unauthenticated") {
      setIsLoadingStatus(false);
    }
  }, [status]);

  // Redirect if already a creator
  useEffect(() => {
    if (status === "authenticated" && isCreator) {
      router.push("/dashboard/creator");
    }
  }, [status, isCreator, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Auto-generate slug from display name
  useEffect(() => {
    if (displayName && !slug) {
      const generatedSlug = displayName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [displayName]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugStatus("invalid");
      setSlugError("Only lowercase letters, numbers, and hyphens");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/become-creator?slug=${slug}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus("available");
          setSlugError("");
        } else {
          setSlugStatus("taken");
          setSlugError(data.reason === "reserved" ? "This URL is reserved" : "This URL is already taken");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  // Submit application
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/become-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", note }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit application");
        return;
      }

      setApplicationStatus("PENDING");
      setApplicationDate(new Date().toISOString());
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create creator profile (after approval)
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!slug || slug.length < 3) {
      setError("Please choose a URL for your page (at least 3 characters)");
      setIsLoading(false);
      return;
    }

    if (slugStatus === "taken" || slugStatus === "invalid") {
      setError("Please choose a valid and available URL");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/become-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          displayName: displayName || session?.user?.name || slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create creator profile");
        return;
      }

      await update();
      router.push("/dashboard/creator");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  const benefits = [
    { icon: Image, title: "Share Content", description: "Upload photos and videos for your fans" },
    { icon: DollarSign, title: "Earn Money", description: "Subscriptions, tips, and PPV content" },
    { icon: MessageCircle, title: "Connect", description: "Direct messaging with your subscribers" },
    { icon: Rocket, title: "Your Page", description: "Get your own custom URL on VipOnly" },
  ];

  // PENDING STATE - Waiting for approval
  if (applicationStatus === "PENDING") {
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
          >
            <Card variant="luxury" className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Application Pending
              </h1>
              <p className="text-[var(--muted)] mb-4">
                Your creator application is being reviewed by our team.
                We'll notify you once it's approved.
              </p>
              {applicationDate && (
                <p className="text-sm text-[var(--muted)]">
                  Submitted on {new Date(applicationDate).toLocaleDateString()}
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // REJECTED STATE
  if (applicationStatus === "REJECTED") {
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
          >
            <Card variant="luxury" className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Application Not Approved
              </h1>
              <p className="text-[var(--muted)] mb-6">
                Unfortunately, your application was not approved at this time.
                You can contact support for more information.
              </p>
              <Link href="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // APPROVED STATE - Show profile creation form
  if (applicationStatus === "APPROVED") {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Application Approved!
            </h1>
            <p className="text-[var(--muted)]">
              Set up your creator profile to get started
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="luxury" className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Set up your creator profile
                </h2>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Creator Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={session?.user?.name || "Your name or brand"}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    This is how fans will see you
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Your Page URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                      viponly.fun/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        setSlug(value);
                      }}
                      placeholder="yourname"
                      className={`w-full pl-28 pr-12 py-3 rounded-xl bg-[var(--surface)] border text-[var(--foreground)] focus:outline-none transition-colors ${
                        slugStatus === "available"
                          ? "border-green-500 focus:border-green-500"
                          : slugStatus === "taken" || slugStatus === "invalid"
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--border)] focus:border-[var(--gold)]"
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {slugStatus === "checking" && (
                        <Loader2 className="w-4 h-4 text-[var(--muted)] animate-spin" />
                      )}
                      {slugStatus === "available" && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  {slugError ? (
                    <p className="text-xs text-red-400 mt-1">{slugError}</p>
                  ) : (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Only lowercase letters, numbers, and hyphens
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || slugStatus === "taken" || slugStatus === "invalid" || !slug}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating profile...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Create My Profile
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // DEFAULT STATE - Show application form
  return (
    <div className="min-h-screen px-4 pt-20 sm:pt-20 lg:pt-8 pb-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-yellow-600 mb-4">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Become a Creator
          </h1>
          <p className="text-[var(--muted)]">
            Start sharing exclusive content and earning money
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
              <benefit.icon className="w-6 h-6 text-[var(--gold)] mb-2" />
              <h3 className="font-semibold text-[var(--foreground)] text-sm">
                {benefit.title}
              </h3>
              <p className="text-xs text-[var(--muted)]">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-[var(--gold)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Create your creator profile
              </h2>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Creator Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={session?.user?.name || "Your name or brand"}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  This is how fans will see you
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Your Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    viponly.fun/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      setSlug(value);
                    }}
                    placeholder="yourname"
                    className={`w-full pl-28 pr-12 py-3 rounded-xl bg-[var(--surface)] border text-[var(--foreground)] focus:outline-none transition-colors ${
                      slugStatus === "available"
                        ? "border-green-500 focus:border-green-500"
                        : slugStatus === "taken" || slugStatus === "invalid"
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--border)] focus:border-[var(--gold)]"
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <Loader2 className="w-4 h-4 text-[var(--muted)] animate-spin" />
                    )}
                    {slugStatus === "available" && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                {slugError ? (
                  <p className="text-xs text-red-400 mt-1">{slugError}</p>
                ) : (
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Only lowercase letters, numbers, and hyphens (min 3 characters)
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full"
                disabled={isLoading || slugStatus === "taken" || slugStatus === "invalid" || !slug || slug.length < 3}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating profile...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Become a Creator
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-[var(--muted)] text-center mt-4">
              By creating a profile, you agree to our{" "}
              <Link href="/terms" className="text-[var(--gold)] hover:underline">
                Creator Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[var(--gold)] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
