"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Users,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Crown,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OverviewStats {
  totalScripts: number;
  activeScripts: number;
  scriptsWithSales: number;
  totalUsages: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TopScript {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  messagesSent: number;
  salesGenerated: number;
  revenueGenerated: number;
  conversionRate: number;
  creatorSlug: string | null;
}

interface CategoryStat {
  category: string;
  label: string;
  count: number;
  usages: number;
  sales: number;
  revenue: number;
}

interface ChartData {
  date: string;
  usages: number;
  sales: number;
  revenue: number;
}

interface ChatterStat {
  chatterId: string;
  chatterName: string;
  scriptsUsed: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  scriptId: string;
  scriptName: string;
  category: string;
  chatterName: string;
  action: string;
  resultedInSale: boolean;
  saleAmount: number | null;
  usedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  GREETING: "bg-blue-500",
  PPV_PITCH: "bg-emerald-500",
  FOLLOW_UP: "bg-yellow-500",
  CLOSING: "bg-purple-500",
  CUSTOM: "bg-pink-500",
};

const CATEGORY_ICONS: Record<string, string> = {
  GREETING: "👋",
  PPV_PITCH: "💎",
  FOLLOW_UP: "💬",
  CLOSING: "🎯",
  CUSTOM: "✨",
};

export default function ScriptsAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("30d");

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topScripts, setTopScripts] = useState<TopScript[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chatterStats, setChatterStats] = useState<ChatterStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  const fetchAnalytics = useCallback(async (agId: string, selectedPeriod: string) => {
    try {
      const res = await fetch(
        `/api/agency/scripts/analytics?agencyId=${agId}&period=${selectedPeriod}`
      );
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setTopScripts(data.topScripts);
        setCategoryStats(data.categoryStats);
        setChartData(data.chartData);
        setChatterStats(data.chatterStats);
        setRecentActivity(data.recentActivity);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const ag = agencyData.agencies[0];
            setAgencyId(ag.id);
            await fetchAnalytics(ag.id, period);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner, period, fetchAnalytics]);

  const handleRefresh = async () => {
    if (!agencyId) return;
    setIsRefreshing(true);

    try {
      // Recalculate stats
      await fetch("/api/agency/scripts/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      // Refetch
      await fetchAnalytics(agencyId, period);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    if (agencyId) {
      setIsLoading(true);
      await fetchAnalytics(agencyId, newPeriod);
      setIsLoading(false);
    }
  };

  // Calculate max values for chart scaling
  const maxUsages = Math.max(...chartData.map((d) => d.usages), 1);
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-3 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 pb-24 pb-safe overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard/agency/scripts"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Scripts Analytics
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              Track performance and revenue attribution
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-white/5 rounded-xl p-1">
            {[
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
              { value: "90d", label: "90 days" },
              { value: "all", label: "All time" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  period === p.value
                    ? "bg-purple-500 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-white">
                ${overview?.totalRevenue.toFixed(0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Script Uses</p>
              <p className="text-xl font-bold text-white">
                {overview?.totalUsages.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sales</p>
              <p className="text-xl font-bold text-white">
                {overview?.totalSales || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Conversion</p>
              <p className="text-xl font-bold text-white">
                {overview?.conversionRate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Categories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usage Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Usage & Revenue Over Time
            </h3>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data for this period
              </div>
            ) : (
              <div className="h-48 flex items-end gap-1">
                {chartData.slice(-30).map((d, i) => (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col gap-1 group relative"
                  >
                    {/* Revenue bar */}
                    <div
                      className="bg-emerald-500/60 rounded-t transition-all hover:bg-emerald-500"
                      style={{
                        height: `${(d.revenue / maxRevenue) * 100}%`,
                        minHeight: d.revenue > 0 ? "4px" : "0",
                      }}
                    />
                    {/* Usage bar */}
                    <div
                      className="bg-purple-500/60 rounded-t transition-all hover:bg-purple-500"
                      style={{
                        height: `${(d.usages / maxUsages) * 60}%`,
                        minHeight: d.usages > 0 ? "4px" : "0",
                      }}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <p className="font-medium">{d.date}</p>
                      <p className="text-purple-400">{d.usages} uses</p>
                      <p className="text-emerald-400">${d.revenue.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-purple-500" />
                Uses
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                Revenue
              </span>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Performance by Category
            </h3>

            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const totalUsages = categoryStats.reduce((sum, c) => sum + c.usages, 0);
                const percentage = totalUsages > 0 ? (cat.usages / totalUsages) * 100 : 0;

                return (
                  <div key={cat.category} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_ICONS[cat.category]}</span>
                        <span className="text-sm font-medium text-white">{cat.label}</span>
                        <span className="text-xs text-gray-500">({cat.count} scripts)</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{cat.usages} uses</span>
                        <span className="text-emerald-400">${cat.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          CATEGORY_COLORS[cat.category]
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Scripts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Top Performing Scripts
            </h3>

            {topScripts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No script data yet</p>
            ) : (
              <div className="space-y-3">
                {topScripts.slice(0, 5).map((script, index) => (
                  <div
                    key={script.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{script.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{CATEGORY_ICONS[script.category]}</span>
                        <span>{script.usageCount} uses</span>
                        <span>•</span>
                        <span>{script.conversionRate.toFixed(1)}% conv.</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        ${script.revenueGenerated.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">{script.salesGenerated} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Chatters & Activity */}
        <div className="space-y-6">
          {/* Chatter Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Chatter Performance
            </h3>

            {chatterStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No chatter data</p>
            ) : (
              <div className="space-y-3">
                {chatterStats.slice(0, 5).map((chatter, index) => (
                  <div
                    key={chatter.chatterId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {chatter.chatterName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {chatter.chatterName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chatter.scriptsUsed} scripts used
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        ${chatter.revenue.toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Recent Activity
            </h3>

            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        activity.resultedInSale ? "bg-emerald-500" : "bg-gray-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {activity.scriptName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.chatterName} • {activity.action}
                        {activity.resultedInSale && (
                          <span className="text-emerald-400">
                            {" "}• ${activity.saleAmount?.toFixed(0)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">
                      {new Date(activity.usedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-purple-400 mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Scripts</span>
                <span className="text-white font-medium">{overview?.totalScripts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Scripts</span>
                <span className="text-white font-medium">{overview?.activeScripts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scripts with Sales</span>
                <span className="text-emerald-400 font-medium">{overview?.scriptsWithSales || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Revenue/Script</span>
                <span className="text-emerald-400 font-medium">
                  ${overview && overview.scriptsWithSales > 0
                    ? (overview.totalRevenue / overview.scriptsWithSales).toFixed(0)
                    : 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
