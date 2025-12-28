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

export default function CreatorEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<EarningsData | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchEarnings();
  }, [session, status, page, typeFilter]);

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
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            My Earnings
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Track your revenue and commission details
          </p>
        </motion.div>

        {/* First Month Banner */}
        {data?.commission.inFirstMonth && data.commission.firstMonthFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent border border-[var(--gold)]/30 p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/20 rounded-full blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--gold)]/20">
                  <Sparkles className="w-8 h-8 text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    First Month - 0% Commission!
                  </h3>
                  <p className="text-[var(--muted)]">
                    You keep 100% of your earnings for the first month. {getDaysRemaining()} days remaining.
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Pending Balance</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.pendingBalance || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Total Earned</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.totalEarned || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Total Paid Out</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {formatEuro(data?.summary.totalPaid || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="luxury" className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Commission Rate</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {((data?.commission.currentRate || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
          <Card variant="luxury" className="overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              </div>
            ) : data?.earnings.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" />
                <p className="text-[var(--muted)]">No earnings yet</p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Start earning by creating content for your subscribers!
                </p>
              </div>
            ) : (
              <>
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

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--muted)]">
                      Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                      {Math.min(
                        data.pagination.page * data.pagination.limit,
                        data.pagination.total
                      )}{" "}
                      of {data.pagination.total} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-[var(--foreground)] px-4">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                        }
                        disabled={page === data.pagination.totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
