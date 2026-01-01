"use client";

import { useState, useEffect, useCallback } from "react";
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
  BarChart3,
  FileText,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

export default function CreatorAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState("7d");
  const [error, setError] = useState<string | null>(null);

  const isCreator = (session?.user as any)?.isCreator === true;

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (status === "loading" || (isLoading && !selectedCreator)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  const statsDisplay = [
    {
      label: "Views",
      value: data?.summary.totalViews || 0,
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "Visitors",
      value: data?.summary.uniqueVisitors || 0,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Sessions",
      value: data?.summary.uniqueSessions || 0,
      icon: MousePointer,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "Views/User",
      value: data?.summary.avgViewsPerVisitor || 0,
      icon: TrendingUp,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    },
  ];

  return (
    <div className="p-4 pt-20 pb-24 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Analytics</h1>
            </div>
            <p className="text-sm text-gray-400">
              {selectedCreator?.displayName || "Your profile"}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Creator Selector (if multiple) */}
        {creators.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 scrollbar-hide">
            {creators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => setSelectedCreator(creator)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all flex-shrink-0",
                  selectedCreator?.id === creator.id
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <div className="w-5 h-5 rounded-lg overflow-hidden">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-500/30 flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-xs">
                        {creator.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{creator.displayName}</span>
              </button>
            ))}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0",
                period === p.value
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : data && (
        <>
          {/* Stats Grid - 2x2 on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {statsDisplay.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </h3>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chart - Mobile Optimized */}
          {data.chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
            >
              <h2 className="text-sm font-medium text-gray-400 mb-4">Views Over Time</h2>
              <div className="h-40 flex items-end gap-1">
                {data.chartData.slice(-14).map((day, index) => {
                  const maxViews = Math.max(...data.chartData.map((d) => d.views));
                  const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.views} views`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                <span>{new Date(data.chartData[Math.max(0, data.chartData.length - 14)]?.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <span>{new Date(data.chartData[data.chartData.length - 1]?.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
              </div>
            </motion.div>
          )}

          {/* Top Pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-medium text-gray-400">Top Pages</h2>
            </div>
            <div className="space-y-3">
              {data.topPages.length > 0 ? (
                data.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white truncate">
                        {formatPath(page.path)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {page.views}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
              )}
            </div>
          </motion.div>

          {/* Traffic Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-medium text-gray-400">Traffic Sources</h2>
            </div>
            <div className="space-y-3">
              {data.topReferrers.length > 0 ? (
                data.topReferrers.slice(0, 5).map((ref, index) => (
                  <div
                    key={ref.source}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-white truncate">
                        {ref.source}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {ref.views}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
              )}
            </div>
          </motion.div>

          {/* Devices & Browsers - 2 column grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Devices */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
            >
              <h2 className="text-xs font-medium text-gray-500 mb-3">Devices</h2>
              <div className="space-y-2">
                {Object.entries(data.deviceStats).slice(0, 3).map(([device, count]) => {
                  const total = Object.values(data.deviceStats).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={device}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(device)}
                          <span className="text-xs text-white capitalize">{device}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Browsers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
            >
              <h2 className="text-xs font-medium text-gray-500 mb-3">Browsers</h2>
              <div className="space-y-2">
                {Object.entries(data.browserStats).slice(0, 3).map(([browser, count]) => {
                  const total = Object.values(data.browserStats).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={browser}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white truncate">{browser}</span>
                        <span className="text-[10px] text-gray-500">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Recent Views - Card layout for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-medium text-gray-400">Recent Views</h2>
            </div>

            {data.recentViews.length > 0 ? (
              <div className="space-y-3">
                {data.recentViews.slice(0, 5).map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        {getDeviceIcon(view.device)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {formatPath(view.path)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {view.browser}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimeAgo(view.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent views</p>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
