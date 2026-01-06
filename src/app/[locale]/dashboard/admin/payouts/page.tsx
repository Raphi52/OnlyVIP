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
  Clock,
  AlertCircle,
  Eye,
  CheckCircle,
  X,
  Image,
  MessageCircle,
  Gift,
  CreditCard,
  ChevronRight,
  Building2,
  Crown,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// Creator payout types
interface CreatorPayoutRequest {
  id: string;
  creatorSlug: string;
  amount: number;
  walletType: string;
  walletAddress: string;
  businessNumber: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
  creator: {
    slug: string;
    displayName: string;
    avatar: string | null;
    pendingBalance: number;
    walletEth: string | null;
    walletBtc: string | null;
  };
}

// Agency payout types
interface AgencyPayoutRequest {
  id: string;
  agencyId: string;
  amount: number;
  walletType: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  txHash: string | null;
  agency: {
    name: string;
    slug: string;
    logo: string | null;
    pendingBalance: number;
    totalEarned: number;
    totalPaid: number;
    walletEth: string | null;
    walletBtc: string | null;
    ownerName: string;
    ownerEmail: string;
  };
}

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

type TabType = "creators" | "agencies";

export default function AdminPayoutsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("creators");

  // Creator state
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorTotals, setCreatorTotals] = useState<Totals | null>(null);
  const [creatorPayoutRequests, setCreatorPayoutRequests] = useState<CreatorPayoutRequest[]>([]);
  const [creatorPayoutCounts, setCreatorPayoutCounts] = useState({ PENDING: 0, PAID: 0 });
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [loadingCreatorRequests, setLoadingCreatorRequests] = useState(true);

  // Agency state
  const [agencyPayoutRequests, setAgencyPayoutRequests] = useState<AgencyPayoutRequest[]>([]);
  const [agencyTotals, setAgencyTotals] = useState({ pendingCount: 0, pendingAmount: 0, paidCount: 0, paidAmount: 0 });
  const [loadingAgencies, setLoadingAgencies] = useState(true);

  // Shared state
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorDetail, setCreatorDetail] = useState<CreatorDetailStats | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);

  // Fetch creator data
  const fetchCreatorData = async () => {
    setLoadingCreators(true);
    try {
      const res = await fetch("/api/admin/payouts");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setCreatorTotals(data.totals || null);
      }
    } catch (err) {
      console.error("Error fetching creator payouts:", err);
    } finally {
      setLoadingCreators(false);
    }
  };

  const fetchCreatorPayoutRequests = async () => {
    setLoadingCreatorRequests(true);
    try {
      const res = await fetch("/api/admin/payout-requests?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setCreatorPayoutRequests(data.payoutRequests || []);
        setCreatorPayoutCounts(data.counts || { PENDING: 0, PAID: 0 });
      }
    } catch (err) {
      console.error("Error fetching creator payout requests:", err);
    } finally {
      setLoadingCreatorRequests(false);
    }
  };

  // Fetch agency data
  const fetchAgencyData = async () => {
    setLoadingAgencies(true);
    try {
      const res = await fetch("/api/admin/agency-payouts");
      if (res.ok) {
        const data = await res.json();
        setAgencyPayoutRequests(data.requests || []);
        setAgencyTotals(data.totals || { pendingCount: 0, pendingAmount: 0, paidCount: 0, paidAmount: 0 });
      }
    } catch (err) {
      console.error("Error fetching agency payouts:", err);
    } finally {
      setLoadingAgencies(false);
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

  const handleMarkCreatorPaid = async (requestId: string) => {
    if (!confirm("Are you sure you want to mark this payout as paid? This will deduct the amount from the creator's balance.")) {
      return;
    }

    setProcessingPayout(requestId);
    try {
      const res = await fetch(`/api/admin/payout-requests/${requestId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        fetchCreatorPayoutRequests();
        fetchCreatorData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process payout");
      }
    } catch (err) {
      console.error("Error processing payout:", err);
      alert("Failed to process payout");
    } finally {
      setProcessingPayout(null);
    }
  };

  const handleMarkAgencyPaid = async (requestId: string) => {
    if (!confirm("Are you sure you want to mark this agency payout as paid?")) {
      return;
    }

    setProcessingPayout(requestId);
    try {
      const res = await fetch(`/api/admin/agency-payouts/${requestId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        fetchAgencyData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process payout");
      }
    } catch (err) {
      console.error("Error processing payout:", err);
      alert("Failed to process payout");
    } finally {
      setProcessingPayout(null);
    }
  };

  useEffect(() => {
    fetchCreatorData();
    fetchCreatorPayoutRequests();
    fetchAgencyData();
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
    const headers = ["Type", "Name", "Pending", "Total Earned", "Total Paid", "Wallet ETH", "Wallet BTC"];
    const creatorRows = creators.map(c => [
      "Creator",
      c.displayName,
      c.pendingBalance.toFixed(2),
      c.totalEarned.toFixed(2),
      c.totalPaid.toFixed(2),
      c.walletEth || "",
      c.walletBtc || "",
    ]);

    const agencyRows = agencyPayoutRequests
      .filter(r => r.status === "PENDING")
      .map(r => [
        "Agency",
        r.agency.name,
        r.agency.pendingBalance.toFixed(2),
        r.agency.totalEarned.toFixed(2),
        r.agency.totalPaid.toFixed(2),
        r.agency.walletEth || "",
        r.agency.walletBtc || "",
      ]);

    const csv = [headers, ...creatorRows, ...agencyRows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalPendingRequests = creatorPayoutCounts.PENDING + agencyTotals.pendingCount;
  const pendingAgencyRequests = agencyPayoutRequests.filter(r => r.status === "PENDING");

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Payouts</h1>
          <p className="text-sm sm:text-base text-white/50">Manage creator and agency payouts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={loadingCreators || (creators.length === 0 && agencyPayoutRequests.length === 0)}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchCreatorData();
              fetchCreatorPayoutRequests();
              fetchAgencyData();
            }}
            disabled={loadingCreators || loadingAgencies}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", (loadingCreators || loadingAgencies) && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab("creators")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
            activeTab === "creators"
              ? "bg-[var(--gold)] text-black"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Crown className="w-4 h-4" />
          <span>Creators</span>
          {creatorPayoutCounts.PENDING > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-bold rounded-full",
              activeTab === "creators" ? "bg-black/20 text-black" : "bg-yellow-500 text-black"
            )}>
              {creatorPayoutCounts.PENDING}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("agencies")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
            activeTab === "agencies"
              ? "bg-purple-500 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Agencies</span>
          {agencyTotals.pendingCount > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-bold rounded-full",
              activeTab === "agencies" ? "bg-white/20 text-white" : "bg-purple-500 text-white"
            )}>
              {agencyTotals.pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* CREATORS TAB */}
      {activeTab === "creators" && (
        <>
          {/* Pending Creator Payout Requests */}
          {creatorPayoutCounts.PENDING > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Pending Requests ({creatorPayoutCounts.PENDING})
                    </h2>
                    <p className="text-xs text-white/50">Creators waiting for payout</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCreatorPayoutRequests}
                  disabled={loadingCreatorRequests}
                >
                  <RefreshCw className={cn("w-4 h-4", loadingCreatorRequests && "animate-spin")} />
                </Button>
              </div>

              {loadingCreatorRequests ? (
                <div className="p-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {creatorPayoutRequests.map((request) => (
                    <div key={request.id} className="p-3 sm:p-4">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          {request.creator.avatar ? (
                            <img
                              src={request.creator.avatar}
                              alt={request.creator.displayName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                              {request.creator.displayName.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{request.creator.displayName}</p>
                            <p className="text-[10px] text-white/50">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-500">{request.amount.toFixed(0)}€</p>
                            <p className="text-[10px] text-white/40">{request.walletType}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => copyToClipboard(request.walletAddress, `payout-${request.id}`)}
                          className="w-full flex items-center justify-between gap-1 px-3 py-2 bg-white/5 rounded text-xs text-white/70 hover:bg-white/10 font-mono"
                        >
                          <span className="truncate">{request.walletAddress}</span>
                          {copiedWallet === `payout-${request.id}` ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Copy className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>

                        {request.businessNumber && (
                          <div className="px-3 py-2 bg-purple-500/10 rounded text-xs text-purple-400">
                            Business: {request.businessNumber}
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleMarkCreatorPaid(request.id)}
                          disabled={processingPayout === request.id}
                          className="w-full gap-1.5 bg-green-600 hover:bg-green-700"
                        >
                          {processingPayout === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Mark as Paid
                        </Button>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-4">
                          {request.creator.avatar ? (
                            <img
                              src={request.creator.avatar}
                              alt={request.creator.displayName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                              {request.creator.displayName.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{request.creator.displayName}</p>
                            <p className="text-xs text-white/50">
                              Requested {new Date(request.createdAt).toLocaleDateString()} • Balance: {request.creator.pendingBalance.toFixed(0)}€
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-yellow-500">{request.amount.toFixed(0)}€</p>
                            <p className="text-[10px] text-white/40">{request.walletType}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3 ml-16">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(request.walletAddress, `payout-${request.id}`)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded text-xs text-white/70 hover:bg-white/10 font-mono"
                            >
                              {request.walletType}: {request.walletAddress.slice(0, 10)}...{request.walletAddress.slice(-6)}
                              {copiedWallet === `payout-${request.id}` ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {request.businessNumber && (
                              <span className="px-3 py-1.5 bg-purple-500/10 rounded text-xs text-purple-400">
                                Business: {request.businessNumber}
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleMarkCreatorPaid(request.id)}
                            disabled={processingPayout === request.id}
                            className="gap-1.5 bg-green-600 hover:bg-green-700"
                          >
                            {processingPayout === request.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Creator Stats Cards */}
          {creatorTotals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center mb-1 sm:mb-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-sm text-white/50">Pending Payouts</p>
                    <p className="text-base sm:text-xl font-bold text-yellow-500">
                      {creatorTotals.pending.net.toFixed(0)}€
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
                      {creatorTotals.paid.net.toFixed(0)}€
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
                      {(creatorTotals.pending.commission + creatorTotals.paid.commission).toFixed(0)}€
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

            {loadingCreators ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              </div>
            ) : creators.length === 0 ? (
              <div className="p-10 text-center text-white/50 text-sm sm:text-base">
                No creator earnings yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {creators.map((creator) => {
                  const hasPendingRequest = creatorPayoutRequests.some(r => r.creatorSlug === creator.slug);
                  return (
                    <motion.div
                      key={creator.id}
                      className={cn(
                        "p-3 sm:p-4 hover:bg-white/5 cursor-pointer transition-colors active:bg-white/10",
                        hasPendingRequest && "border-l-4 border-yellow-500"
                      )}
                      onClick={() => fetchCreatorDetail(creator.slug)}
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {creator.avatar ? (
                              <img
                                src={creator.avatar}
                                alt={creator.displayName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                                {creator.displayName.charAt(0)}
                              </div>
                            )}
                            {hasPendingRequest && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Clock className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{creator.displayName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                              <span>Earned: <span className="text-white">{creator.totalEarned.toFixed(0)}€</span></span>
                              <span>Paid: <span className="text-green-500">{creator.totalPaid.toFixed(0)}€</span></span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className={cn(
                              "text-base font-bold",
                              creator.pendingBalance > 0 ? "text-yellow-500" : "text-white/30"
                            )}>
                              {creator.pendingBalance.toFixed(0)}€
                            </p>
                            <p className="text-[10px] text-white/40">pending</p>
                          </div>

                          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-4">
                          <div className="relative">
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
                            {hasPendingRequest && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{creator.displayName}</p>
                              <span className="text-xs text-white/40">@{creator.slug}</span>
                              {hasPendingRequest && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-500 rounded-full">
                                  PAYOUT REQUESTED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                              <span>Earned: <span className="text-white">{creator.totalEarned.toFixed(0)}€</span></span>
                              <span>Paid: <span className="text-green-500">{creator.totalPaid.toFixed(0)}€</span></span>
                              {creator.earningsBreakdown.length > 0 && (
                                <span className="hidden lg:inline">
                                  {creator.earningsBreakdown.map(e => `${formatEarningType(e.type)}: ${e.count}`).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className={cn(
                              "text-lg font-bold",
                              creator.pendingBalance > 0 ? "text-yellow-500" : "text-white/30"
                            )}>
                              {creator.pendingBalance.toFixed(0)}€
                            </p>
                            <p className="text-[10px] text-white/40">pending</p>
                          </div>

                          <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                        </div>

                        {/* Wallets - Desktop only */}
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
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* AGENCIES TAB */}
      {activeTab === "agencies" && (
        <>
          {/* Pending Agency Payout Requests */}
          {pendingAgencyRequests.length > 0 && (
            <Card className="border-purple-500/30 bg-purple-500/5">
              <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Pending Requests ({pendingAgencyRequests.length})
                    </h2>
                    <p className="text-xs text-white/50">Agencies waiting for payout</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAgencyData}
                  disabled={loadingAgencies}
                >
                  <RefreshCw className={cn("w-4 h-4", loadingAgencies && "animate-spin")} />
                </Button>
              </div>

              {loadingAgencies ? (
                <div className="p-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {pendingAgencyRequests.map((request) => (
                    <div key={request.id} className="p-3 sm:p-4">
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          {request.agency.logo ? (
                            <img
                              src={request.agency.logo}
                              alt={request.agency.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{request.agency.name}</p>
                            <p className="text-[10px] text-white/50">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-400">{request.amount.toFixed(0)}€</p>
                            <p className="text-[10px] text-white/40">{request.walletType}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => copyToClipboard(request.walletAddress, `agency-payout-${request.id}`)}
                          className="w-full flex items-center justify-between gap-1 px-3 py-2 bg-white/5 rounded text-xs text-white/70 hover:bg-white/10 font-mono"
                        >
                          <span className="truncate">{request.walletAddress}</span>
                          {copiedWallet === `agency-payout-${request.id}` ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Copy className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>

                        <div className="px-3 py-2 bg-white/5 rounded text-xs text-white/70">
                          Owner: {request.agency.ownerName} ({request.agency.ownerEmail})
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleMarkAgencyPaid(request.id)}
                          disabled={processingPayout === request.id}
                          className="w-full gap-1.5 bg-green-600 hover:bg-green-700"
                        >
                          {processingPayout === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Mark as Paid
                        </Button>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-4">
                          {request.agency.logo ? (
                            <img
                              src={request.agency.logo}
                              alt={request.agency.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{request.agency.name}</p>
                            <p className="text-xs text-white/50">
                              Requested {new Date(request.createdAt).toLocaleDateString()} • Balance: {request.agency.pendingBalance.toFixed(0)}€
                            </p>
                            <p className="text-xs text-purple-400 mt-0.5">
                              Owner: {request.agency.ownerName}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-purple-400">{request.amount.toFixed(0)}€</p>
                            <p className="text-[10px] text-white/40">{request.walletType}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3 ml-16">
                          <button
                            onClick={() => copyToClipboard(request.walletAddress, `agency-payout-${request.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded text-xs text-white/70 hover:bg-white/10 font-mono"
                          >
                            {request.walletType}: {request.walletAddress.slice(0, 10)}...{request.walletAddress.slice(-6)}
                            {copiedWallet === `agency-payout-${request.id}` ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>

                          <Button
                            size="sm"
                            onClick={() => handleMarkAgencyPaid(request.id)}
                            disabled={processingPayout === request.id}
                            className="gap-1.5 bg-green-600 hover:bg-green-700"
                          >
                            {processingPayout === request.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Agency Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 sm:mb-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-white/50">Pending Amount</p>
                  <p className="text-base sm:text-xl font-bold text-purple-400">
                    {agencyTotals.pendingAmount.toFixed(0)}€
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
                    {agencyTotals.paidAmount.toFixed(0)}€
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center mb-1 sm:mb-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-white/50">Pending Requests</p>
                  <p className="text-base sm:text-xl font-bold text-yellow-500">
                    {agencyTotals.pendingCount}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 sm:mb-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-white/50">Total Paid Out</p>
                  <p className="text-base sm:text-xl font-bold text-white">
                    {agencyTotals.paidCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* No Pending Agencies Message */}
          {!loadingAgencies && pendingAgencyRequests.length === 0 && (
            <Card className="p-10 text-center">
              <Building2 className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
              <p className="text-white/50">No pending agency payout requests</p>
            </Card>
          )}
        </>
      )}

      {/* Creator Detail Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] rounded-t-2xl sm:rounded-xl w-full sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          >
            {loadingDetail ? (
              <div className="p-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              </div>
            ) : creatorDetail ? (
              <>
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[var(--surface)] z-10">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {creatorDetail.creator.avatar ? (
                      <img
                        src={creatorDetail.creator.avatar}
                        alt={creatorDetail.creator.displayName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                        {creatorDetail.creator.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-base sm:text-lg truncate">{creatorDetail.creator.displayName}</h3>
                      <p className="text-xs sm:text-sm text-white/50 truncate">@{creatorDetail.creator.slug}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedCreator(null); setCreatorDetail(null); }}
                    className="p-2 rounded-lg hover:bg-white/10 flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-white/5">
                      <p className="text-[10px] sm:text-xs text-white/50">Total Gross</p>
                      <p className="text-base sm:text-xl font-bold text-white">{creatorDetail.stats.totalGross.toFixed(0)}€</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-white/5">
                      <p className="text-[10px] sm:text-xs text-white/50">Creator Net</p>
                      <p className="text-base sm:text-xl font-bold text-green-500">{creatorDetail.stats.totalNet.toFixed(0)}€</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10">
                      <p className="text-[10px] sm:text-xs text-white/50">Commission</p>
                      <p className="text-base sm:text-xl font-bold text-purple-500">{creatorDetail.stats.totalCommission.toFixed(0)}€</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-[10px] sm:text-xs text-white/50">Pending</p>
                      <p className="text-base sm:text-xl font-bold text-yellow-500">{creatorDetail.creator.pendingBalance.toFixed(0)}€</p>
                    </div>
                  </div>

                  {/* Earnings by Type */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Earnings by Type</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {creatorDetail.earnings.byType.map((earning) => (
                        <div key={earning.type} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]">
                              {getTypeIcon(earning.type)}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{formatEarningType(earning.type)}</p>
                              <p className="text-[10px] sm:text-xs text-white/50">{earning.count} transactions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white text-sm sm:text-base">{earning.grossAmount.toFixed(0)}€</p>
                            <p className="text-[10px] sm:text-xs text-purple-400">-{earning.commission.toFixed(0)}€</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Content Stats</h4>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-white/5 text-center">
                        <Image className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-blue-400" />
                        <p className="text-sm sm:text-lg font-bold text-white">{creatorDetail.stats.totalMedia}</p>
                        <p className="text-[8px] sm:text-xs text-white/50">Total</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-white/5 text-center">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-yellow-400" />
                        <p className="text-sm sm:text-lg font-bold text-white">{creatorDetail.stats.ppvMedia}</p>
                        <p className="text-[8px] sm:text-xs text-white/50">PPV</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-white/5 text-center">
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-green-400" />
                        <p className="text-sm sm:text-lg font-bold text-white">{creatorDetail.stats.freeMedia}</p>
                        <p className="text-[8px] sm:text-xs text-white/50">Free</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-white/5 text-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-purple-400" />
                        <p className="text-sm sm:text-lg font-bold text-white">{creatorDetail.stats.subscriberCount}</p>
                        <p className="text-[8px] sm:text-xs text-white/50">Subs</p>
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
                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Payout Wallets</h4>
                      <div className="space-y-2">
                        {creatorDetail.creator.walletEth && (
                          <button
                            onClick={() => copyToClipboard(creatorDetail.creator.walletEth!, "detail-eth")}
                            className="w-full flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <span className="text-xs sm:text-sm text-white/70">ETH</span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-white font-mono text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                                {creatorDetail.creator.walletEth}
                              </span>
                              {copiedWallet === "detail-eth" ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-4 h-4 text-white/50 flex-shrink-0" />}
                            </div>
                          </button>
                        )}
                        {creatorDetail.creator.walletBtc && (
                          <button
                            onClick={() => copyToClipboard(creatorDetail.creator.walletBtc!, "detail-btc")}
                            className="w-full flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <span className="text-xs sm:text-sm text-white/70">BTC</span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-white font-mono text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                                {creatorDetail.creator.walletBtc}
                              </span>
                              {copiedWallet === "detail-btc" ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-4 h-4 text-white/50 flex-shrink-0" />}
                            </div>
                          </button>
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
