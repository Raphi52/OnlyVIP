"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  Search,
  Loader2,
  RefreshCw,
  CreditCard,
  Bitcoin,
  Crown,
  Heart,
  Lock,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  user: { id: string; name: string; image: string | null };
  creator: { slug: string; displayName: string; avatar: string | null } | null;
  description: string;
  createdAt: string;
}

interface Stats {
  total: number;
  totalCreditPurchases: number;
  totalCreditPurchaseAmount: number;
  totalSubscriptions: number;
  totalSubscriptionAmount: number;
  totalPPV: number;
  totalPPVAmount: number;
  totalTips: number;
  totalTipsAmount: number;
  totalMediaUnlocks: number;
  totalMediaUnlockAmount: number;
}

const typeConfig: Record<string, { label: string; icon: typeof DollarSign; color: string; bgColor: string }> = {
  CREDIT_PURCHASE: { label: "Credit Purchase", icon: CreditCard, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  SUBSCRIPTION: { label: "Subscription", icon: Crown, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  PPV: { label: "PPV", icon: Lock, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  TIP: { label: "Tip", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-500/20" },
  MEDIA_UNLOCK: { label: "Media Unlock", icon: ImageIcon, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
};

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [period, setPeriod] = useState("30d");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalCreditPurchases: 0,
    totalCreditPurchaseAmount: 0,
    totalSubscriptions: 0,
    totalSubscriptionAmount: 0,
    totalPPV: 0,
    totalPPVAmount: 0,
    totalTips: 0,
    totalTipsAmount: 0,
    totalMediaUnlocks: 0,
    totalMediaUnlockAmount: 0,
  });

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchTransactions();
  }, [session, status, isAdmin, router, page, filterType, period]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      params.set("period", period);
      if (searchQuery) params.set("search", searchQuery);
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider?.toLowerCase().includes("crypto") || provider?.toLowerCase().includes("now") || provider?.toLowerCase().includes("mix")) {
      return <Bitcoin className="w-4 h-4 text-orange-400" />;
    }
    if (provider === "CREDITS") {
      return <DollarSign className="w-4 h-4 text-[var(--gold)]" />;
    }
    return <CreditCard className="w-4 h-4 text-blue-400" />;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      searchQuery === "" ||
      tx.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.creator?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-1 truncate">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Achats crédits & transactions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            className="px-2 sm:px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
          >
            <option value="7d">7j</option>
            <option value="30d">30j</option>
            <option value="90d">90j</option>
            <option value="1y">1 an</option>
            <option value="all">Tout</option>
          </select>
          <Button variant="ghost" size="icon" onClick={fetchTransactions} className="flex-shrink-0">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6"
      >
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-500/20 flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">Total</p>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              €{(stats.totalCreditPurchaseAmount / 100).toFixed(0)}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">Credits ({stats.totalCreditPurchases})</p>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-1">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              €{stats.totalSubscriptionAmount.toFixed(0)}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">Subs ({stats.totalSubscriptions})</p>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-1">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              €{stats.totalPPVAmount.toFixed(0)}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">PPV ({stats.totalPPV})</p>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              €{stats.totalTipsAmount.toFixed(0)}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">Tips ({stats.totalTips})</p>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-1">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              €{stats.totalMediaUnlockAmount.toFixed(0)}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted)]">Media ({stats.totalMediaUnlocks})</p>
          </div>
        </Card>
      </motion.div>

      {/* Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 mb-4 overflow-x-auto pb-2"
      >
        <button
          onClick={() => { setFilterType(""); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            filterType === ""
              ? "bg-[var(--gold)] text-[var(--background)]"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          All Types
        </button>
        {Object.entries(typeConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => { setFilterType(key); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                filterType === key
                  ? `${config.bgColor} ${config.color}`
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </motion.div>

      {/* Search & Status Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 mb-4 sm:mb-6"
      >
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by user or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
        <Button onClick={handleSearch} className="flex-shrink-0">Search</Button>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
          {["all", "COMPLETED", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all capitalize whitespace-nowrap ${
                filterStatus === s
                  ? s === "COMPLETED" ? "bg-emerald-500 text-white" :
                    s === "PENDING" ? "bg-yellow-500 text-black" :
                    s === "FAILED" ? "bg-red-500 text-white" :
                    "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s === "all" ? "All" : s.toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">
            No transactions found
          </h3>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {transactions.length === 0
              ? "No transactions in this period"
              : "No transactions match your filters"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {filteredTransactions.map((tx) => {
              const config = typeConfig[tx.type] || typeConfig.CREDIT_PURCHASE;
              const Icon = config.icon;
              return (
                <Card key={tx.id} variant="luxury" className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">
                          €{tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {config.label}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(tx.status)} text-[10px] px-1.5 py-0.5`}>
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">User</span>
                      <span className="text-[var(--foreground)] truncate max-w-[150px]">{tx.user?.name || "Unknown"}</span>
                    </div>
                    {tx.creator && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted)]">Creator</span>
                        <span className="text-[var(--gold)] truncate max-w-[150px]">{tx.creator.displayName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">Date</span>
                      <span className="text-[var(--foreground)]">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <Card variant="luxury" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Type</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Creator</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Amount</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Provider</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const config = typeConfig[tx.type] || typeConfig.CREDIT_PURCHASE;
                    const Icon = config.icon;
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)]"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{config.label}</p>
                              <p className="text-xs text-[var(--muted)] font-mono">{tx.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--surface)]">
                              {tx.user?.image ? (
                                <img src={tx.user.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-[var(--foreground)]">{tx.user?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {tx.creator ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--surface)]">
                                {tx.creator.avatar ? (
                                  <img src={tx.creator.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[var(--gold)]/20 flex items-center justify-center">
                                    <Crown className="w-4 h-4 text-[var(--gold)]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[var(--gold)]">{tx.creator.displayName}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--muted)]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-[var(--foreground)]">
                            €{tx.amount.toFixed(2)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getProviderIcon(tx.provider)}
                            <span className="text-[var(--foreground)] text-sm">{tx.provider}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(tx.status)}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-[var(--muted)] text-sm">
                          {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
