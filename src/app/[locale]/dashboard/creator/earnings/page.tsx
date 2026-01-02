"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Gift,
  Image as ImageIcon,
  MessageSquare,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wallet,
  Send,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

interface Earning {
  id: string;
  type: string;
  sourceId: string | null;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface EarningsData {
  earnings: Earning[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    pendingBalance: number;
    totalEarned: number;
    totalPaid: number;
    earningsCount: number;
  };
  commission: {
    currentRate: number;
    inFirstMonth: boolean;
    firstMonthFree: boolean;
    createdAt: string;
  };
}

const typeLabels: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  MEDIA_UNLOCK: { label: "Media Unlock", icon: ImageIcon, color: "text-blue-400" },
  TIP: { label: "Tip", icon: Gift, color: "text-pink-400" },
  PPV: { label: "PPV Message", icon: MessageSquare, color: "text-purple-400" },
  SUBSCRIPTION: { label: "Subscription", icon: CreditCard, color: "text-green-400" },
};

interface PayoutRequestData {
  pendingBalance: number;
  minimumPayout: number;
  walletEth: string | null;
  walletBtc: string | null;
  latestRequest: {
    id: string;
    amount: number;
    walletType: string;
    walletAddress: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
  } | null;
  canRequest: boolean;
  cooldownPassed: boolean;
  hasEnoughBalance: boolean;
}

export default function CreatorEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<EarningsData | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Payout request state
  const [payoutData, setPayoutData] = useState<PayoutRequestData | null>(null);
  const [walletType, setWalletType] = useState<"ETH" | "BTC">("ETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchEarnings();
    fetchPayoutData();
  }, [session, status, page, typeFilter]);

  const fetchPayoutData = async () => {
    try {
      const res = await fetch("/api/creator/payout-request");
      if (res.ok) {
        const result = await res.json();
        setPayoutData(result);
        // Pre-fill wallet address if available
        if (result.walletEth) {
          setWalletType("ETH");
          setWalletAddress(result.walletEth);
        } else if (result.walletBtc) {
          setWalletType("BTC");
          setWalletAddress(result.walletBtc);
        }
      }
    } catch (error) {
      console.error("Error fetching payout data:", error);
    }
  };

  const handleRequestPayout = async () => {
    if (!walletAddress.trim()) {
      setPayoutError("Please enter your wallet address");
      return;
    }

    setIsRequestingPayout(true);
    setPayoutError(null);
    setPayoutSuccess(false);

    try {
      const res = await fetch("/api/creator/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletType, walletAddress: walletAddress.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setPayoutError(result.error || "Failed to request payout");
        return;
      }

      setPayoutSuccess(true);
      fetchPayoutData(); // Refresh data
    } catch (error) {
      console.error("Error requesting payout:", error);
      setPayoutError("Failed to request payout");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (typeFilter) params.append("type", typeFilter);

      const res = await fetch(`/api/creator/earnings?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getDaysRemaining = () => {
    if (!data?.commission.createdAt) return 0;
    const createdAt = new Date(data.commission.createdAt);
    const oneMonthLater = new Date(createdAt);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const now = new Date();
    const diffTime = oneMonthLater.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (status === "loading" || (isLoading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 pt-20 sm:p-4 sm:pt-20 lg:p-8 lg:pt-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
            My Earnings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5 sm:mt-1">
            Track your revenue and commissions
          </p>
        </motion.div>

        {/* First Month Banner */}
        {data?.commission.inFirstMonth && data.commission.firstMonthFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 sm:mb-6"
          >
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent border border-[var(--gold)]/30 p-4 sm:p-6">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[var(--gold)]/20 rounded-full blur-3xl" />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--gold)]/20 flex-shrink-0">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--gold)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold text-[var(--foreground)]">
                    First Month - 0% Commission!
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] truncate sm:whitespace-normal">
                    Keep 100% of earnings. {getDaysRemaining()} days left.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8"
        >
          <Card variant="luxury" className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-yellow-500/20 flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Pending</p>
                <p className="text-base sm:text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.pendingBalance || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-green-500/20 flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Earned</p>
                <p className="text-base sm:text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.totalEarned || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/20 flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Paid Out</p>
                <p className="text-base sm:text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.totalPaid || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/20 flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Commission</p>
                <p className="text-base sm:text-2xl font-bold text-[var(--foreground)]">
                  {((data?.commission.currentRate || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payout Request Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-4 sm:mb-8"
        >
          <Card variant="luxury" className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--gold)]/20 flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--gold)]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                  Request Payout
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  Minimum {formatEuro(payoutData?.minimumPayout || 100)} • 1 request per day
                </p>
              </div>
            </div>

            {/* Latest Request Status */}
            {payoutData?.latestRequest && (
              <div className={`mb-4 p-3 rounded-lg ${
                payoutData.latestRequest.status === "PAID"
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-yellow-500/10 border border-yellow-500/20"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {payoutData.latestRequest.status === "PAID" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      payoutData.latestRequest.status === "PAID" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {payoutData.latestRequest.status === "PAID" ? "Last payout completed" : "Payout request pending"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)]">
                    {formatEuro(payoutData.latestRequest.amount)}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {payoutData.latestRequest.walletType}: {payoutData.latestRequest.walletAddress.slice(0, 10)}...{payoutData.latestRequest.walletAddress.slice(-6)}
                  {" • "}
                  {new Date(payoutData.latestRequest.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Success Message */}
            {payoutSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Payout request submitted successfully!</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {payoutError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{payoutError}</span>
                </div>
              </div>
            )}

            {/* Request Form */}
            {(!payoutData?.latestRequest || payoutData.latestRequest.status === "PAID") && (
              <div className="space-y-4">
                {/* Wallet Type Selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWalletType("ETH");
                      setWalletAddress(payoutData?.walletEth || "");
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      walletType === "ETH"
                        ? "bg-[var(--gold)] text-black"
                        : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    ETH (Ethereum)
                  </button>
                  <button
                    onClick={() => {
                      setWalletType("BTC");
                      setWalletAddress(payoutData?.walletBtc || "");
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      walletType === "BTC"
                        ? "bg-[var(--gold)] text-black"
                        : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    BTC (Bitcoin)
                  </button>
                </div>

                {/* Wallet Address Input */}
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={walletType === "ETH" ? "0x..." : "bc1... or 1... or 3..."}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
                />

                {/* Request Button */}
                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    isRequestingPayout ||
                    !payoutData?.canRequest ||
                    !walletAddress.trim()
                  }
                  className="w-full"
                >
                  {isRequestingPayout ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : !payoutData?.hasEnoughBalance ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Minimum {formatEuro(payoutData?.minimumPayout || 100)} required
                    </>
                  ) : !payoutData?.cooldownPassed ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Wait 24h between requests
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Request Payout ({formatEuro(payoutData?.pendingBalance || 0)})
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                typeFilter === ""
                  ? "bg-[var(--gold)] text-black"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              All
            </button>
            {Object.entries(typeLabels).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  typeFilter === key
                    ? "bg-[var(--gold)] text-black"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Earnings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Loading State */}
          {isLoading ? (
            <Card variant="luxury" className="p-8 sm:p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[var(--gold)]" />
            </Card>
          ) : data?.earnings.length === 0 ? (
            /* Empty State */
            <Card variant="luxury" className="p-8 sm:p-12 text-center">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-[var(--muted)] mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-[var(--muted)]">No earnings yet</p>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Start earning by creating content for your subscribers!
              </p>
            </Card>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-3">
                {data?.earnings.map((earning) => {
                  const typeInfo = typeLabels[earning.type] || {
                    label: earning.type,
                    icon: DollarSign,
                    color: "text-gray-400",
                  };
                  const TypeIcon = typeInfo.icon;

                  return (
                    <Card key={`mobile-${earning.id}`} variant="luxury" className="p-3">
                      {/* Header: User & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {earning.user.image ? (
                            <img
                              src={earning.user.image}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-[var(--muted)]">
                                {earning.user.name?.[0] || "?"}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {earning.user.name || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className={`w-3 h-3 ${typeInfo.color}`} />
                              <span className="text-xs text-[var(--muted)]">{typeInfo.label}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                            earning.status === "PAID"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {earning.status === "PAID" ? (
                            <CheckCircle className="w-2.5 h-2.5" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                          {earning.status === "PAID" ? "Paid" : "Pending"}
                        </span>
                      </div>

                      {/* Amounts Grid */}
                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[var(--surface)]/50">
                        <div className="text-center">
                          <p className="text-[10px] text-[var(--muted)] mb-0.5">Gross</p>
                          <p className="text-xs font-medium text-[var(--foreground)]">
                            {formatEuro(earning.grossAmount)}
                          </p>
                        </div>
                        <div className="text-center border-x border-[var(--border)]">
                          <p className="text-[10px] text-[var(--muted)] mb-0.5">Commission</p>
                          <p className={`text-xs font-medium ${earning.commissionRate > 0 ? "text-red-400" : "text-green-400"}`}>
                            {earning.commissionRate > 0 ? `-${(earning.commissionRate * 100).toFixed(0)}%` : "0%"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-[var(--muted)] mb-0.5">Net</p>
                          <p className="text-xs font-bold text-[var(--gold)]">
                            {formatEuro(earning.netAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-[10px] text-[var(--muted)] mt-2 text-right">
                        {formatDate(earning.createdAt)}
                      </p>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <Card variant="luxury" className="overflow-hidden hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--surface)]">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Date
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Type
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          User
                        </th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Gross
                        </th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Commission
                        </th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Net
                        </th>
                        <th className="text-center px-6 py-4 text-sm font-medium text-[var(--muted)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {data?.earnings.map((earning) => {
                        const typeInfo = typeLabels[earning.type] || {
                          label: earning.type,
                          icon: DollarSign,
                          color: "text-gray-400",
                        };
                        const TypeIcon = typeInfo.icon;

                        return (
                          <tr
                            key={earning.id}
                            className="hover:bg-[var(--surface)]/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                              {formatDate(earning.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                                <span className="text-sm text-[var(--foreground)]">
                                  {typeInfo.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {earning.user.image ? (
                                  <img
                                    src={earning.user.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center">
                                    <span className="text-xs text-[var(--muted)]">
                                      {earning.user.name?.[0] || "?"}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm text-[var(--foreground)]">
                                  {earning.user.name || "Anonymous"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-[var(--foreground)]">
                              {formatEuro(earning.grossAmount)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {earning.commissionRate > 0 ? (
                                <span className="text-red-400">
                                  -{formatEuro(earning.commissionAmount)} ({(earning.commissionRate * 100).toFixed(0)}%)
                                </span>
                              ) : (
                                <span className="text-green-400">0%</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-[var(--gold)]">
                              {formatEuro(earning.netAmount)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  earning.status === "PAID"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {earning.status === "PAID" ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-1">
                  <p className="text-xs sm:text-sm text-[var(--muted)] text-center sm:text-left">
                    <span className="hidden sm:inline">Showing </span>
                    {(data.pagination.page - 1) * data.pagination.limit + 1}-{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                    <span className="sm:hidden"> / {data.pagination.total}</span>
                    <span className="hidden sm:inline"> of {data.pagination.total} transactions</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs sm:text-sm text-[var(--foreground)] px-2 sm:px-4 min-w-[80px] text-center">
                      {data.pagination.page} / {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                      }
                      disabled={page === data.pagination.totalPages}
                      className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
