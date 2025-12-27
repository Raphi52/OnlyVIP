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
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface Payment {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  type: string;
  user: string;
  description: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    subscriptionRevenue: 0,
    mediaRevenue: 0,
    tipsRevenue: 0,
    ppvRevenue: 0,
    totalTransactions: 0,
  });

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchPayments();
  }, [session, status, isAdmin, router]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400";
      case "REFUNDED":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION":
        return "Subscription";
      case "TIP":
        return "Tip";
      case "PPV":
        return "Pay-Per-View";
      case "PURCHASE":
        return "Purchase";
      default:
        return type;
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === "" ||
      payment.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || payment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Payments
          </h1>
          <p className="text-[var(--muted)]">
            View all transactions on the platform
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPayments}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card variant="luxury" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            ${stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-[var(--muted)]">Total Revenue</p>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            ${stats.subscriptionRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-[var(--muted)]">Subscriptions</p>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            ${(stats.tipsRevenue + stats.ppvRevenue).toLocaleString()}
          </p>
          <p className="text-sm text-[var(--muted)]">Tips & PPV</p>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[var(--gold)]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {stats.totalTransactions}
          </p>
          <p className="text-sm text-[var(--muted)]">Transactions</p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "COMPLETED", "PENDING", "FAILED", "REFUNDED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filterStatus === status
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {status === "all" ? "All" : status.toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-20">
          <DollarSign className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No payments found
          </h3>
          <p className="text-[var(--muted)]">
            {payments.length === 0
              ? "No payments have been made yet"
              : "No payments match your search"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="luxury" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Transaction
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      User
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Description
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)]"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-[var(--gold)]" />
                          </div>
                          <div>
                            <p className="font-mono text-sm text-[var(--foreground)]">
                              {payment.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-[var(--foreground)]">
                          {payment.user || "Unknown"}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-[var(--foreground)]">
                        {payment.description || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[var(--foreground)]">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {payment.currency || "USD"}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-[var(--surface)] text-[var(--foreground)]">
                          {getTypeLabel(payment.type)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[var(--muted)] text-sm">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
