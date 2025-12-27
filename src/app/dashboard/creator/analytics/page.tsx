"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  Users,
  MousePointer,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar?: string;
}

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

const periods = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function CreatorAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [error, setError] = useState<string | null>(null);

  const isCreator = (session?.user as any)?.isCreator === true;

  // Fetch creator profiles
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isCreator) {
      router.push("/dashboard");
      return;
    }
    fetchCreators();
  }, [session, status, isCreator, router]);

  const fetchCreators = async () => {
    try {
      const res = await fetch("/api/creator/my-profiles");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        if (data.creators?.length > 0) {
          setSelectedCreator(data.creators[0]);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setIsLoading(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    if (!selectedCreator) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/stats?period=${period}&creator=${selectedCreator.slug}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Error loading analytics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [period, selectedCreator]);

  useEffect(() => {
    if (selectedCreator) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, selectedCreator]);

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

  if (status === "loading" || (isLoading && !selectedCreator)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Analytics</h1>
            <p className="text-[var(--muted)] mt-1">
              View statistics for {selectedCreator?.displayName || "your profile"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Creator Selector */}
            {creators.length > 1 && (
              <select
                value={selectedCreator?.id || ""}
                onChange={(e) => {
                  const creator = creators.find((c) => c.id === e.target.value);
                  if (creator) setSelectedCreator(creator);
                }}
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
              >
                {creators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.displayName}
                  </option>
                ))}
              </select>
            )}

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
              onClick={fetchAnalytics}
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

        {data && (
          <>
            {/* Summary Cards */}
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
                  Views Over Time
                </h2>
                <div className="h-64 flex items-end gap-1">
                  {data.chartData.map((day, index) => {
                    const maxViews = Math.max(...data.chartData.map((d) => d.views));
                    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs text-[var(--muted)] mb-1">
                            {day.views}
                          </span>
                          <div
                            className="w-full bg-[var(--gold)]/80 rounded-t-sm transition-all hover:bg-[var(--gold)]"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${day.views} views, ${day.visitors} visitors`}
                          />
                        </div>
                        <span className="text-xs text-[var(--muted)] -rotate-45 origin-left whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    );
                  })}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

            {/* Recent Views */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Recent Views
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">
                        Page
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">
                        Device
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">
                        Browser
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentViews.map((view) => (
                      <tr
                        key={view.id}
                        className="border-b border-[var(--border)]/50 last:border-0"
                      >
                        <td className="py-3 px-2 text-sm text-[var(--foreground)]">
                          {formatPath(view.path)}
                        </td>
                        <td className="py-3 px-2 text-sm text-[var(--muted)] capitalize">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(view.device)}
                            {view.device}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-[var(--muted)]">
                          {view.browser}
                        </td>
                        <td className="py-3 px-2 text-sm text-[var(--muted)]">
                          {new Date(view.createdAt).toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
