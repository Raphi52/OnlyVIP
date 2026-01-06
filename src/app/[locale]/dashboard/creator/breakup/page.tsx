"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DoorOpen,
  Building2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Shield,
  Wallet,
  MessageCircle,
  Crown,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface BreakupStatus {
  canBreakup: boolean;
  isAgencyManaged: boolean;
  agencyName: string | null;
  agencyManagedAt: string | null;
}

export default function CreatorBreakupPage() {
  const router = useRouter();
  const { selectedCreator } = useAdminCreator();
  const [status, setStatus] = useState<BreakupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Fetch breakup eligibility
  useEffect(() => {
    const fetchStatus = async () => {
      if (!selectedCreator?.slug) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/creator/breakup?creator=${selectedCreator.slug}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to check eligibility");
        }
      } catch (err) {
        console.error("Error fetching breakup status:", err);
        setError("Failed to load breakup status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [selectedCreator?.slug]);

  const handleBreakup = async () => {
    if (confirmText.toLowerCase() !== "leave") {
      setError("Please type 'leave' to confirm");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/creator/breakup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSlug: selectedCreator?.slug }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/dashboard/creator");
        }, 3000);
      } else {
        setError(data.error || "Failed to process breakup");
      }
    } catch (err) {
      console.error("Error processing breakup:", err);
      setError("Failed to process breakup request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <DoorOpen className="w-8 h-8 text-red-400" />
              Leave Agency
            </h1>
            <p className="text-gray-400 mt-2">
              End your partnership and regain full control of your creator profile
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
            </div>
          ) : success ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Successfully Left Agency
              </h2>
              <p className="text-gray-400 mb-6">
                You now have full control of your creator profile. All features have been restored.
              </p>
              <p className="text-sm text-green-400">
                Redirecting to your dashboard...
              </p>
            </motion.div>
          ) : !status?.isAgencyManaged ? (
            /* Not Agency-Managed */
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                <Crown className="w-10 h-10 text-[var(--gold)]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                You're Independent
              </h2>
              <p className="text-gray-400">
                Your creator profile is not managed by any agency. You have full control over all features.
              </p>
            </div>
          ) : (
            /* Breakup Form */
            <>
              {/* Current Agency Info */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-300">Currently managed by</p>
                    <p className="text-xl font-bold text-white">{status?.agencyName}</p>
                    {status?.agencyManagedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Since {formatDate(status.agencyManagedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* What happens after breakup */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-[var(--gold)]" />
                  What happens when you leave
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Full profile control</p>
                      <p className="text-sm text-gray-400">
                        Edit your profile, settings, AI configuration, and all creator tools
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wallet className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Direct payouts</p>
                      <p className="text-sm text-gray-400">
                        Request payouts directly to your wallet without agency approval
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Full messaging access</p>
                      <p className="text-sm text-gray-400">
                        Send messages and manage conversations with your fans
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-medium">This action is immediate</p>
                    <p className="text-sm text-amber-300/70 mt-1">
                      Once you leave, you will immediately regain full control. The agency will no longer have access to manage your profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                <h3 className="font-semibold text-white mb-4">Confirm your decision</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Type <span className="text-red-400 font-mono font-bold">leave</span> to confirm you want to leave {status?.agencyName}.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type 'leave' to confirm"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 text-white placeholder-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all mb-4"
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleBreakup}
                  disabled={isProcessing || confirmText.toLowerCase() !== "leave"}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DoorOpen className="w-5 h-5" />
                      Leave {status?.agencyName}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
