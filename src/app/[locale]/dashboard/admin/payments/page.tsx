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
  ArrowUpRight,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface Payment {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  type: string;
  provider: string;
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
      const res = await fetch("/api/admin/credit-purchases");
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
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider?.toLowerCase().includes("crypto") || provider?.toLowerCase().includes("now") || provider?.toLowerCase().includes("mix")) {
      return <Bitcoin className="w-4 h-4 text-orange-400" />;
    }
    return <CreditCard className="w-4 h-4 text-blue-400" />;
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === "" ||
      payment.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.provider?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || payment.status === filterStatus;

    return matchesSearch && matchesFilter;
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
    <div className="p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">
            Credit Purchases
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Crypto & card payments for credits
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
        className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8"
      >
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <ArrowUpRight className="hidden sm:block w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)] text-center sm:text-left">
            ${(stats.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs sm:text-sm text-[var(--muted)] text-center sm:text-left">Total Revenue</p>
        </Card>
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between sm:mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-1 sm:mb-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)] text-center sm:text-left">
            {stats.totalTransactions}
          </p>
          <p className="text-xs sm:text-sm text-[var(--muted)] text-center sm:text-left">Transactions</p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4 mb-4 sm:mb-6"
      >
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by user or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] text-base"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {["all", "COMPLETED", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize ${
                filterStatus === s
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s === "all" ? "All" : s.toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">
            No credit purchases found
          </h3>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {payments.length === 0
              ? "No credit purchases have been made yet"
              : "No purchases match your search"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} variant="luxury" className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center">
                      {getProviderIcon(payment.provider)}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {payment.amount.toLocaleString()} credits
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(payment.status)} text-[10px] px-1.5 py-0.5`}>
                    {payment.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">User</span>
                    <span className="text-[var(--foreground)] truncate max-w-[150px]">{payment.user || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Provider</span>
                    <span className="text-[var(--foreground)]">{payment.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Date</span>
                    <span className="text-[var(--foreground)]">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <Card variant="luxury" className="overflow-hidden hidden sm:block">
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
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Provider
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
                            {getProviderIcon(payment.provider)}
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
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[var(--foreground)]">
                          ${(payment.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {payment.amount.toLocaleString()} credits
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-[var(--surface)] text-[var(--foreground)]">
                          {payment.provider}
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
