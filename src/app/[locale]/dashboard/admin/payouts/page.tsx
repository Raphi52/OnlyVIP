"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  DollarSign,
  Loader2,
  Copy,
  RefreshCw,
  TrendingUp,
  Users,
  Download,
  Check,
  FileSpreadsheet,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle,
  X,
  Image,
  MessageCircle,
  Video,
  Gift,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface EarningsBreakdown {
  type: string;
  count: number;
  netAmount: number;
  grossAmount: number;
  commission: number;
}

interface Creator {
  id: string;
  slug: string;
  displayName: string;
  avatar: string | null;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  walletEth: string | null;
  walletBtc: string | null;
  pendingEarningsCount: number;
  earningsBreakdown: EarningsBreakdown[];
}

interface Totals {
  pending: { gross: number; commission: number; net: number };
  paid: { gross: number; commission: number; net: number };
}

interface CreatorDetailStats {
  creator: {
    id: string;
    slug: string;
    displayName: string;
    avatar: string | null;
    email: string;
    pendingBalance: number;
    totalEarned: number;
    totalPaid: number;
    walletEth: string | null;
    walletBtc: string | null;
    subscriptionPrice: number;
    createdAt: string;
  };
  stats: {
    totalGross: number;
    totalNet: number;
    totalCommission: number;
    commissionRate: string;
    subscriberCount: number;
    totalSubscribers: number;
    totalMedia: number;
    ppvMedia: number;
    freeMedia: number;
    mediaPurchaseCount: number;
    mediaPurchaseRevenue: number;
  };
  earnings: {
    byType: EarningsBreakdown[];
    byStatus: { status: string; count: number; grossAmount: number; netAmount: number; commission: number }[];
    recent: { id: string; type: string; grossAmount: number; netAmount: number; commissionAmount: number; status: string; createdAt: string }[];
  };
  messagePayments: { type: string; count: number; amount: number }[];
  mediaStats: { type: string; count: number }[];
}

export default function AdminCreatorRevenuesPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorDetail, setCreatorDetail] = useState<CreatorDetailStats | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setTotals(data.totals || null);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorDetail = async (slug: string) => {
    setLoadingDetail(true);
    setSelectedCreator(slug);
    try {
      const res = await fetch(`/api/admin/creator-stats/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCreatorDetail(data);
      }
    } catch (err) {
      console.error("Error fetching creator detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(id);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const formatEarningType = (type: string) => {
    const types: Record<string, string> = {
      MEDIA_UNLOCK: "Media Sales",
      TIP: "Tips",
      PPV: "PPV Messages",
      SUBSCRIPTION: "Subscriptions",
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MEDIA_UNLOCK":
        return <Image className="w-4 h-4" />;
      case "TIP":
        return <Gift className="w-4 h-4" />;
      case "PPV":
        return <MessageCircle className="w-4 h-4" />;
      case "SUBSCRIPTION":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const exportCSV = () => {
    const headers = ["Creator", "Slug", "Pending", "Total Earned", "Total Paid", "Commission", "Wallet ETH", "Wallet BTC"];
    const rows = creators.map(c => {
      const commission = c.totalEarned - (c.totalEarned * 0.95);
      return [
        c.displayName,
        c.slug,
        c.pendingBalance.toFixed(2),
        c.totalEarned.toFixed(2),
        c.totalPaid.toFixed(2),
        commission.toFixed(2),
        c.walletEth || "",
        c.walletBtc || "",
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creator-revenues-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Creator Revenues</h1>
          <p className="text-sm sm:text-base text-white/50">Earnings, commissions & payouts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={loading || creators.length === 0}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Pending Payouts</p>
                <p className="text-base sm:text-xl font-bold text-yellow-500">
                  {totals.pending.net.toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Total Paid</p>
                <p className="text-base sm:text-xl font-bold text-green-500">
                  {totals.paid.net.toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Your Commission</p>
                <p className="text-base sm:text-xl font-bold text-purple-500">
                  {(totals.pending.commission + totals.paid.commission).toFixed(0)}€
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 sm:mb-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-white/50">Creators to Pay</p>
                <p className="text-base sm:text-xl font-bold text-white">
                  {creators.filter((c) => c.pendingBalance > 0).length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Creators List */}
      <Card>
        <div className="p-3 sm:p-4 border-b border-white/10">
          <h2 className="text-base sm:text-lg font-semibold text-white">All Creators</h2>
          <p className="text-xs text-white/50">Click on a creator to see detailed stats</p>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
          </div>
        ) : creators.length === 0 ? (
          <div className="p-10 text-center text-white/50 text-sm sm:text-base">
            No creator earnings yet
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {creators.map((creator) => (
              <motion.div
                key={creator.id}
                className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => fetchCreatorDetail(creator.slug)}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                      {creator.displayName.charAt(0)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white truncate">{creator.displayName}</p>
                      <span className="text-xs text-white/40">@{creator.slug}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                      <span>Earned: <span className="text-white">{creator.totalEarned.toFixed(0)}€</span></span>
                      <span>Paid: <span className="text-green-500">{creator.totalPaid.toFixed(0)}€</span></span>
                      {creator.earningsBreakdown.length > 0 && (
                        <span className="hidden sm:inline">
                          {creator.earningsBreakdown.map(e => `${formatEarningType(e.type)}: ${e.count}`).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pending Balance */}
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      "text-lg font-bold",
                      creator.pendingBalance > 0 ? "text-yellow-500" : "text-white/30"
                    )}>
                      {creator.pendingBalance.toFixed(0)}€
                    </p>
                    <p className="text-[10px] text-white/40">pending</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                </div>

                {/* Wallets */}
                {(creator.walletEth || creator.walletBtc) && (
                  <div className="mt-3 flex items-center gap-2 ml-16">
                    {creator.walletEth && (
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(creator.walletEth!, `eth-${creator.id}`); }}
                        className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-white/70 hover:bg-white/10"
                      >
                        ETH: {creator.walletEth.slice(0, 6)}...{creator.walletEth.slice(-4)}
                        {copiedWallet === `eth-${creator.id}` ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    {creator.walletBtc && (
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(creator.walletBtc!, `btc-${creator.id}`); }}
                        className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] text-white/70 hover:bg-white/10"
                      >
                        BTC: {creator.walletBtc.slice(0, 6)}...{creator.walletBtc.slice(-4)}
                        {copiedWallet === `btc-${creator.id}` ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Creator Detail Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--surface)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {loadingDetail ? (
              <div className="p-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              </div>
            ) : creatorDetail ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[var(--surface)] z-10">
                  <div className="flex items-center gap-4">
                    {creatorDetail.creator.avatar ? (
                      <img
                        src={creatorDetail.creator.avatar}
                        alt={creatorDetail.creator.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold">
                        {creatorDetail.creator.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white text-lg">{creatorDetail.creator.displayName}</h3>
                      <p className="text-sm text-white/50">@{creatorDetail.creator.slug} • {creatorDetail.creator.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedCreator(null); setCreatorDetail(null); }}
                    className="p-2 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-white/50">Total Gross</p>
                      <p className="text-xl font-bold text-white">{creatorDetail.stats.totalGross.toFixed(0)}€</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-white/50">Creator Net</p>
                      <p className="text-xl font-bold text-green-500">{creatorDetail.stats.totalNet.toFixed(0)}€</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <p className="text-xs text-white/50">Your Commission</p>
                      <p className="text-xl font-bold text-purple-500">{creatorDetail.stats.totalCommission.toFixed(0)}€</p>
                      <p className="text-[10px] text-white/40">{creatorDetail.stats.commissionRate}% rate</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-xs text-white/50">Pending</p>
                      <p className="text-xl font-bold text-yellow-500">{creatorDetail.creator.pendingBalance.toFixed(0)}€</p>
                    </div>
                  </div>

                  {/* Earnings by Type */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Earnings by Type</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {creatorDetail.earnings.byType.map((earning) => (
                        <div key={earning.type} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]">
                              {getTypeIcon(earning.type)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{formatEarningType(earning.type)}</p>
                              <p className="text-xs text-white/50">{earning.count} transactions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{earning.grossAmount.toFixed(0)}€</p>
                            <p className="text-xs text-purple-400">-{earning.commission.toFixed(0)}€ comm.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Content Stats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-white/5 text-center">
                        <Image className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                        <p className="text-lg font-bold text-white">{creatorDetail.stats.totalMedia}</p>
                        <p className="text-xs text-white/50">Total Media</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 text-center">
                        <DollarSign className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                        <p className="text-lg font-bold text-white">{creatorDetail.stats.ppvMedia}</p>
                        <p className="text-xs text-white/50">PPV Media</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 text-center">
                        <Gift className="w-5 h-5 mx-auto mb-1 text-green-400" />
                        <p className="text-lg font-bold text-white">{creatorDetail.stats.freeMedia}</p>
                        <p className="text-xs text-white/50">Free Media</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 text-center">
                        <Users className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                        <p className="text-lg font-bold text-white">{creatorDetail.stats.subscriberCount}</p>
                        <p className="text-xs text-white/50">Active Subs</p>
                      </div>
                    </div>
                  </div>

                  {/* Message Payments (PPV & Tips) */}
                  {creatorDetail.messagePayments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Message Payments</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {creatorDetail.messagePayments.map((mp) => (
                          <div key={mp.type} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-1">
                              {mp.type === "TIP" ? <Gift className="w-4 h-4 text-pink-400" /> : <MessageCircle className="w-4 h-4 text-blue-400" />}
                              <span className="text-sm text-white">{mp.type === "TIP" ? "Tips" : "PPV Unlocks"}</span>
                            </div>
                            <p className="text-lg font-bold text-white">{mp.amount.toFixed(0)}€</p>
                            <p className="text-xs text-white/50">{mp.count} transactions</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Earnings */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Recent Earnings</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {creatorDetail.earnings.recent.map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs",
                              earning.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                            )}>
                              {earning.status}
                            </span>
                            <span className="text-white/70">{formatEarningType(earning.type)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-medium">{earning.grossAmount.toFixed(2)}€</span>
                            <span className="text-xs text-white/40 ml-2">
                              {new Date(earning.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wallets */}
                  {(creatorDetail.creator.walletEth || creatorDetail.creator.walletBtc) && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Payout Wallets</h4>
                      <div className="space-y-2">
                        {creatorDetail.creator.walletEth && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <span className="text-white/70">ETH Wallet</span>
                            <button
                              onClick={() => copyToClipboard(creatorDetail.creator.walletEth!, "detail-eth")}
                              className="flex items-center gap-2 text-white font-mono text-sm"
                            >
                              {creatorDetail.creator.walletEth}
                              {copiedWallet === "detail-eth" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/50" />}
                            </button>
                          </div>
                        )}
                        {creatorDetail.creator.walletBtc && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <span className="text-white/70">BTC Wallet</span>
                            <button
                              onClick={() => copyToClipboard(creatorDetail.creator.walletBtc!, "detail-btc")}
                              className="flex items-center gap-2 text-white font-mono text-sm"
                            >
                              {creatorDetail.creator.walletBtc}
                              {copiedWallet === "detail-btc" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/50" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-20 text-center text-white/50">
                Failed to load creator details
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
