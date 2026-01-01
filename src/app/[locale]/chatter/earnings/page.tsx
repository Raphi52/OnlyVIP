"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { formatDistanceToNow, format } from "date-fns";

interface Earning {
  id: string;
  type: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  delayedAttribution: boolean;
}

interface Summary {
  total: number;
  pending: number;
  paid: number;
  commissionRate: number;
}

interface ByType {
  type: string;
  amount: number;
  count: number;
}

export default function ChatterEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [status, setStatus] = useState("ALL");
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    pending: 0,
    paid: 0,
    commissionRate: 0.1,
  });
  const [byType, setByType] = useState<ByType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("period", period);
        params.set("status", status);
        params.set("page", page.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/chatter/earnings?${params}`);
        const data = await res.json();
        setEarnings(data.earnings || []);
        setSummary(data.summary || { total: 0, pending: 0, paid: 0, commissionRate: 0.1 });
        setByType(data.byType || []);
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period, status, page]);

  const typeLabels: Record<string, string> = {
    PPV: "PPV Unlock",
    TIP: "Tip",
    MEDIA_UNLOCK: "Media Unlock",
  };

  const typeColors: Record<string, string> = {
    PPV: "text-purple-400 bg-purple-500/10",
    TIP: "text-pink-400 bg-pink-500/10",
    MEDIA_UNLOCK: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <p className="text-sm text-gray-400">
          Track your commissions and payouts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="luxury" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {summary.total.toFixed(0)} <span className="text-sm text-gray-400">credits</span>
          </p>
        </Card>

        <Card variant="luxury" className="p-5 border-l-2 border-l-amber-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {summary.pending.toFixed(0)} <span className="text-sm text-amber-400/70">credits</span>
          </p>
        </Card>

        <Card variant="luxury" className="p-5 border-l-2 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-400">Paid Out</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {summary.paid.toFixed(0)} <span className="text-sm text-emerald-400/70">credits</span>
          </p>
        </Card>

        <Card variant="luxury" className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Rate</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {(summary.commissionRate * 100).toFixed(0)}%
          </p>
        </Card>
      </div>

      {/* Breakdown by Type */}
      {byType.length > 0 && (
        <Card variant="luxury" className="p-5">
          <h3 className="font-medium text-white mb-4">Breakdown by Type</h3>
          <div className="grid grid-cols-3 gap-4">
            {byType.map((item) => (
              <div key={item.type} className="text-center">
                <div
                  className={`inline-flex p-3 rounded-xl mb-2 ${typeColors[item.type] || "bg-gray-500/10"}`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-lg font-semibold text-white">
                  {item.amount.toFixed(0)} <span className="text-xs text-gray-400">credits</span>
                </p>
                <p className="text-xs text-gray-400">
                  {typeLabels[item.type] || item.type} ({item.count})
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {["7d", "30d", "90d", "all"].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {p === "all" ? "All" : p.replace("d", "d")}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["ALL", "PENDING", "PAID"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                status === s
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : earnings.length === 0 ? (
        <Card variant="luxury" className="p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No earnings found</p>
          <p className="text-sm text-gray-500 mt-1">
            {status !== "ALL"
              ? "Try changing the status filter"
              : "Start chatting to earn commissions"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {earnings.map((earning) => (
            <motion.div
              key={earning.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                variant="luxury"
                className="p-4 flex items-center gap-4"
              >
                <div
                  className={`p-2.5 rounded-xl ${typeColors[earning.type] || "bg-gray-500/10"}`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {typeLabels[earning.type] || earning.type}
                    </span>
                    {earning.creatorAvatar && (
                      <img
                        src={earning.creatorAvatar}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-xs text-gray-500">
                      @{earning.creatorSlug}
                    </span>
                    {earning.delayedAttribution && (
                      <span className="text-xs text-amber-400">
                        (delayed)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(earning.createdAt), "MMM d, yyyy HH:mm")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-emerald-400">
                    +{earning.commissionAmount.toFixed(0)} credits
                  </p>
                  <p className="text-xs text-gray-500">
                    {(earning.commissionRate * 100).toFixed(0)}% of {earning.grossAmount.toFixed(0)} credits
                  </p>
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    earning.status === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {earning.status}
                </span>
              </Card>
            </motion.div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
