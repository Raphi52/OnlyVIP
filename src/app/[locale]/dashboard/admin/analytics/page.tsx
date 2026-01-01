"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  Users,
  MousePointer,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  TrendingUp,
  RefreshCw,
  Loader2,
  DollarSign,
  Crown,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    avgViewsPerVisitor: string | number;
  };
  topPages: { path: string; views: number }[];
  topReferrers: { source: string; views: number }[];
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  chartData: { date: string; views: number; visitors: number }[];
  recentViews: {
    id: string;
    path: string;
    device: string;
    browser: string;
    referrer: string | null;
    createdAt: string;
  }[];
}

interface SiteStats {
  totalUsers: number;
  totalCreators: number;
  totalMedia: number;
  totalMessages: number;
  totalPageViews: number;
  totalRevenue: number;
}

const periods = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, status, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [period, isAdmin]);

  const fetchData = async () => {
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        fetch(`/api/analytics/stats?period=${period}`),
        fetch("/api/admin/site-stats"),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setData(analyticsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSiteStats(statsData);
      }
    } catch (err) {
      setError("Error loading analytics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/stats?period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Error loading analytics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const formatPath = (path: string) => {
    if (path === "/") return "Home";
    return path.replace(/^\//, "").replace(/-/g, " ").replace(/\//g, " > ");
  };

  if (status === "loading" || (isLoading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Site Analytics</h1>
            <p className="text-[var(--muted)] mt-1">Platform-wide statistics and metrics</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="flex bg-[var(--surface)] rounded-lg p-1">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    period === p.value
                      ? "bg-[var(--gold)] text-[var(--background)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Site-wide Stats */}
        {siteStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-[var(--muted)]">Users</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {siteStats.totalUsers.toLocaleString()}
              </p>
            </Card>
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-[var(--gold)]" />
                <span className="text-xs text-[var(--muted)]">Creators</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {siteStats.totalCreators.toLocaleString()}
              </p>
            </Card>
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-[var(--muted)]">Media</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {siteStats.totalMedia.toLocaleString()}
              </p>
            </Card>
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-[var(--muted)]">Messages</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {siteStats.totalMessages.toLocaleString()}
              </p>
            </Card>
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-pink-400" />
                <span className="text-xs text-[var(--muted)]">Page Views</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {siteStats.totalPageViews.toLocaleString()}
              </p>
            </Card>
            <Card variant="luxury" className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-[var(--muted)]">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                ${siteStats.totalRevenue.toLocaleString()}
              </p>
            </Card>
          </motion.div>
        )}

        {data && (
          <>
            {/* Traffic Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[var(--muted)] text-sm">Total Views</span>
                </div>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.summary.totalViews.toLocaleString()}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[var(--muted)] text-sm">Unique Visitors</span>
                </div>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.summary.uniqueVisitors.toLocaleString()}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[var(--muted)] text-sm">Sessions</span>
                </div>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.summary.uniqueSessions.toLocaleString()}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <span className="text-[var(--muted)] text-sm">Views/Visitor</span>
                </div>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.summary.avgViewsPerVisitor}
                </p>
              </motion.div>
            </div>

            {/* Chart */}
            {data.chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
                  Traffic Over Time
                </h2>
                <div className="relative">
                  {/* Chart area */}
                  <div className="h-48 flex items-end gap-1 mb-8">
                    {data.chartData.map((day) => {
                      const maxViews = Math.max(...data.chartData.map((d) => d.views), 1);
                      const height = (day.views / maxViews) * 100;
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          <span className="text-xs text-[var(--muted)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.views}
                          </span>
                          <div
                            className="w-full bg-[var(--gold)]/80 rounded-t transition-all hover:bg-[var(--gold)] min-h-[4px]"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.views} views, ${day.visitors} visitors`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Date labels */}
                  <div className="flex gap-1">
                    {data.chartData.map((day, index) => (
                      <div key={day.date} className="flex-1 text-center">
                        {index % Math.ceil(data.chartData.length / 7) === 0 && (
                          <span className="text-xs text-[var(--muted)]">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Pages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Top Pages
                </h2>
                <div className="space-y-3">
                  {data.topPages.length > 0 ? (
                    data.topPages.map((page, index) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <span className="text-[var(--foreground)] text-sm truncate max-w-[200px]">
                            {formatPath(page.path)}
                          </span>
                        </div>
                        <span className="text-[var(--muted)] text-sm">
                          {page.views} views
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[var(--muted)] text-sm">No data</p>
                  )}
                </div>
              </motion.div>

              {/* Top Referrers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Traffic Sources
                </h2>
                <div className="space-y-3">
                  {data.topReferrers.length > 0 ? (
                    data.topReferrers.map((ref, index) => (
                      <div
                        key={ref.source}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-[var(--muted)]" />
                          <span className="text-[var(--foreground)] text-sm truncate max-w-[200px]">
                            {ref.source}
                          </span>
                        </div>
                        <span className="text-[var(--muted)] text-sm">
                          {ref.views} visits
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[var(--muted)] text-sm">No data</p>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Devices
                </h2>
                <div className="space-y-4">
                  {Object.entries(data.deviceStats).map(([device, count]) => {
                    const total = Object.values(data.deviceStats).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device)}
                            <span className="text-[var(--foreground)] text-sm capitalize">
                              {device}
                            </span>
                          </div>
                          <span className="text-[var(--muted)] text-sm">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--gold)] rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Browser Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Browsers
                </h2>
                <div className="space-y-4">
                  {Object.entries(data.browserStats).map(([browser, count]) => {
                    const total = Object.values(data.browserStats).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={browser}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[var(--foreground)] text-sm">
                            {browser}
                          </span>
                          <span className="text-[var(--muted)] text-sm">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
