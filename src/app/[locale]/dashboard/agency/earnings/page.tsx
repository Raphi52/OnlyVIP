"use client";

import { useState, useEffect, useCallback } from "react";
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
  Building2,
  Crown,
  User,
  Wallet,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Earning {
  id: string;
  type: string;
  grossAmount: number;
  agencyShare: number;
  agencyGross: number;
  chatterAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  creatorSlug: string;
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
  creatorBreakdown: {
    creatorSlug: string;
    total: number;
    count: number;
  }[];
}

const typeLabels: Record<string, { label: string; icon: typeof DollarSign; color: string; bg: string }> = {
  MEDIA_UNLOCK: { label: "Media", icon: ImageIcon, color: "text-blue-400", bg: "bg-blue-500/20" },
  TIP: { label: "Tip", icon: Gift, color: "text-pink-400", bg: "bg-pink-500/20" },
  PPV: { label: "PPV", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/20" },
  SUBSCRIPTION: { label: "Sub", icon: CreditCard, color: "text-green-400", bg: "bg-green-500/20" },
};

interface PayoutRequest {
  id: string;
  amount: number;
  walletType: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  txHash: string | null;
}

interface AgencyPayoutData {
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  minimumPayout: number;
  walletEth: string | null;
  walletBtc: string | null;
  latestRequest: PayoutRequest | null;
  canRequest: boolean;
  cooldownPassed: boolean;
  hasEnoughBalance: boolean;
  payoutHistory: PayoutRequest[];
}

export default function AgencyEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<EarningsData | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Payout state
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [payoutData, setPayoutData] = useState<AgencyPayoutData | null>(null);
  const [walletType, setWalletType] = useState<"ETH" | "BTC">("ETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAgencyOwner) return;
    fetchEarnings();
    fetchAgencyId();
  }, [session, status, isAgencyOwner, page, typeFilter]);

  // Fetch agency ID
  const fetchAgencyId = async () => {
    try {
      const res = await fetch("/api/agency");
      if (res.ok) {
        const data = await res.json();
        if (data.agencies?.[0]?.id) {
          setAgencyId(data.agencies[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    }
  };

  // Fetch payout data when agencyId is available
  useEffect(() => {
    if (!agencyId) return;
    fetchPayoutData();
  }, [agencyId]);

  const fetchPayoutData = async () => {
    try {
      const res = await fetch(`/api/agency/payout-request?agencyId=${agencyId}`);
      if (res.ok) {
        const data = await res.json();
        setPayoutData(data);
        if (data.walletEth) {
          setWalletType("ETH");
          setWalletAddress(data.walletEth);
        } else if (data.walletBtc) {
          setWalletType("BTC");
          setWalletAddress(data.walletBtc);
        }
      }
    } catch (error) {
      console.error("Error fetching payout data:", error);
    }
  };

  const handlePayoutRequest = async () => {
    if (!agencyId || !walletAddress) return;
    setIsRequesting(true);
    try {
      const res = await fetch("/api/agency/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, walletType, walletAddress }),
      });
      if (res.ok) {
        fetchPayoutData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create payout request");
      }
    } catch (error) {
      console.error("Error creating payout request:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (typeFilter) params.append("type", typeFilter);

      const res = await fetch(`/api/agency/earnings?${params}`);
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
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
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

  const formatEuroShort = (amount: number) => {
    if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(1)}k`;
    }
    return `€${amount.toFixed(0)}`;
  };

  if (status === "loading" || (isLoading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const stats = [
    {
      label: "Pending",
      value: formatEuroShort(data?.summary.pendingBalance || 0),
      icon: Clock,
      color: "text-yellow-400",
      gradient: "from-yellow-500/20 to-yellow-700/20",
    },
    {
      label: "Total Earned",
      value: formatEuroShort(data?.summary.totalEarned || 0),
      icon: TrendingUp,
      color: "text-emerald-400",
      gradient: "from-emerald-500/20 to-emerald-700/20",
    },
    {
      label: "Paid Out",
      value: formatEuroShort(data?.summary.totalPaid || 0),
      icon: CheckCircle,
      color: "text-blue-400",
      gradient: "from-blue-500/20 to-blue-700/20",
    },
    {
      label: "Transactions",
      value: data?.summary.earningsCount || 0,
      icon: DollarSign,
      color: "text-purple-400",
      gradient: "from-purple-500/20 to-purple-700/20",
    },
  ];

  return (
    <div className="p-3 pt-20 sm:p-4 sm:pt-20 lg:p-8 lg:pt-8 space-y-3 sm:space-y-4 lg:space-y-6 overflow-x-hidden">
      {/* Header - Compact on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            Earnings
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Agency revenue tracking
          </p>
        </div>
      </motion.div>

      {/* Stats Cards - 2x2 grid on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
      >
        {stats.map((stat, index) => (
          <div key={index} className="relative group">
            <div className={cn(
              "absolute -inset-[0.5px] rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br",
              stat.gradient.replace('/20', '/40')
            )} />
            <div className="relative p-3 sm:p-4 rounded-xl bg-[#0a0a0c]/90 border border-white/5 backdrop-blur-sm">
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                stat.gradient
              )}>
                <stat.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", stat.color)} />
              </div>
              <p className="text-sm sm:text-lg font-bold text-white truncate">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Payout Request Card - Compact mobile design */}
      {payoutData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-700/10 border border-purple-500/20 p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-medium text-white">Request Payout</h2>
          </div>

          {payoutData.latestRequest?.status === "PENDING" ? (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Pending Request</span>
              </div>
              <p className="text-sm text-white font-bold">
                {formatEuro(payoutData.latestRequest.amount)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {payoutData.latestRequest.walletType}: {payoutData.latestRequest.walletAddress.slice(0, 10)}...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Wallet Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setWalletType("ETH");
                    setWalletAddress(payoutData.walletEth || "");
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                    walletType === "ETH"
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400"
                  )}
                >
                  ETH
                </button>
                <button
                  onClick={() => {
                    setWalletType("BTC");
                    setWalletAddress(payoutData.walletBtc || "");
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                    walletType === "BTC"
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400"
                  )}
                >
                  BTC
                </button>
              </div>

              {/* Wallet Address */}
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={`${walletType} address`}
                className="bg-black/30 border-white/10 text-sm h-9"
              />

              {/* Request Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-gray-400">
                  Min: {formatEuro(payoutData.minimumPayout)}
                  {!payoutData.hasEnoughBalance && (
                    <span className="text-red-400 ml-1">• Insufficient</span>
                  )}
                </div>
                <Button
                  onClick={handlePayoutRequest}
                  disabled={!payoutData.canRequest || !walletAddress || isRequesting}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-xs h-8 px-3"
                >
                  {isRequesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Request {formatEuro(payoutData.pendingBalance)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Recent Payout History - Compact */}
          {payoutData.payoutHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-gray-500 mb-2">Recent</p>
              <div className="space-y-1.5">
                {payoutData.payoutHistory.slice(0, 2).map((req) => (
                  <div key={req.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{formatEuro(req.amount)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{req.walletType}</span>
                      {req.status === "PAID" ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-yellow-400">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Creator Breakdown - Horizontal scroll on mobile */}
      {data?.creatorBreakdown && data.creatorBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-medium text-gray-400">By Creator</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            {data.creatorBreakdown.map((creator) => (
              <div
                key={creator.creatorSlug}
                className="flex-shrink-0 p-3 rounded-xl bg-white/5 border border-white/10 min-w-[120px]"
              >
                <p className="text-xs text-gray-400 truncate">@{creator.creatorSlug}</p>
                <p className="text-sm font-bold text-purple-400">
                  {formatEuroShort(Number(creator.total) || 0)}
                </p>
                <p className="text-[10px] text-gray-500">{creator.count} tx</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters - Pills horizontal scroll */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        <button
          onClick={() => setTypeFilter("")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
            typeFilter === ""
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          )}
        >
          All
        </button>
        {Object.entries(typeLabels).map(([key, { label, icon: Icon, color }]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5",
              typeFilter === key
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Earnings List - Cards on mobile, Table on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : data?.earnings.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">No earnings yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Revenue will appear here when creators earn
            </p>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {data?.earnings.map((earning) => {
                const typeInfo = typeLabels[earning.type] || {
                  label: earning.type,
                  icon: DollarSign,
                  color: "text-gray-400",
                  bg: "bg-gray-500/20",
                };
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={earning.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", typeInfo.bg)}>
                          <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
                        </div>
                        <div>
                          <p className="text-xs text-purple-400">@{earning.creatorSlug}</p>
                          <p className="text-[10px] text-gray-500">
                            {formatDate(earning.createdAt)} · {formatTime(earning.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium",
                          earning.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        )}
                      >
                        {earning.status === "PAID" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {earning.user.image ? (
                          <img
                            src={earning.user.image}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                        <span className="text-xs text-gray-300 truncate max-w-[100px]">
                          {earning.user.name || "Anonymous"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-400">
                          {formatEuro(earning.netAmount)}
                        </p>
                        {earning.chatterAmount > 0 && (
                          <p className="text-[10px] text-orange-400">
                            -{formatEuro(earning.chatterAmount)} chatter
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <Card className="overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Creator</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fan</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Gross</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Chatter</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Net</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data?.earnings.map((earning) => {
                      const typeInfo = typeLabels[earning.type] || {
                        label: earning.type,
                        icon: DollarSign,
                        color: "text-gray-400",
                        bg: "bg-gray-500/20",
                      };
                      const TypeIcon = typeInfo.icon;

                      return (
                        <tr key={earning.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {formatDate(earning.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TypeIcon className={cn("w-4 h-4", typeInfo.color)} />
                              <span className="text-sm text-gray-300">{typeInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-purple-400">@{earning.creatorSlug}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {earning.user.image ? (
                                <img src={earning.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm text-gray-300">{earning.user.name || "Anonymous"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {formatEuro(earning.agencyGross)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {earning.chatterAmount > 0 ? (
                              <span className="text-orange-400">-{formatEuro(earning.chatterAmount)}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-purple-400">
                            {formatEuro(earning.netAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                earning.status === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              )}
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

            {/* Pagination - Compact on mobile */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] sm:text-xs text-gray-500">
                  <span className="hidden sm:inline">Showing </span>
                  {(data.pagination.page - 1) * data.pagination.limit + 1}-
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                  <span className="hidden sm:inline"> of {data.pagination.total}</span>
                </p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 sm:p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-400 px-2">
                    {data.pagination.page}/{data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                    className="p-1.5 sm:p-2"
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
  );
}
