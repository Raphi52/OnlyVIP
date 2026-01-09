"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Crown,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Loader2,
  Globe,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  FileText,
  Link2,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { RevenueKpiCard } from "@/components/charts/RevenueKpiCard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { RevenueBreakdown } from "@/components/charts/RevenueBreakdown";
import { UserGrowthChart } from "@/components/charts/UserGrowthChart";
import { AiPerformanceChart } from "@/components/charts/AiPerformanceChart";
import { ConversionFunnel } from "@/components/charts/ConversionFunnel";
import { TopCreatorsChart } from "@/components/charts/TopCreatorsChart";
import { formatDistanceToNow, format, subDays, addDays } from "date-fns";
import type { Period } from "@/components/charts/PeriodSelector";

interface AdminAnalytics {
  kpis: {
    totalRevenue: number;
    revenueChange: number;
    totalUsers: number;
    usersChange: number;
    totalCreators: number;
    creatorsChange: number;
    activeSubscriptions: number;
    subscriptionsChange: number;
    avgRevenuePerUser: number;
    conversionRate: number;
  };
  revenueChart: {
    date: string;
    revenue: number;
    subscriptions: number;
    ppv: number;
    tips: number;
    media: number;
  }[];
  revenueBreakdown: {
    type: string;
    amount: number;
    percentage: number;
  }[];
  userGrowth: {
    date: string;
    newUsers: number;
    totalUsers: number;
    newCreators: number;
  }[];
  aiPerformance: {
    date: string;
    aiRevenue: number;
    aiMessages: number;
    chatterRevenue: number;
    chatterMessages: number;
  }[];
  aiSummary: {
    totalAiRevenue: number;
    totalChatterRevenue: number;
    aiConversionRate: number;
    chatterConversionRate: number;
  };
  topCreators: {
    slug: string;
    name: string;
    avatar: string | null;
    revenue: number;
    subscribers: number;
  }[];
  funnel: {
    visitors: number;
    signups: number;
    subscribers: number;
    spenders: number;
  };
  recentPayments: {
    id: string;
    type: string;
    amount: number;
    user: string;
    userImage: string | null;
    creator: string;
    createdAt: string;
  }[];
  trafficAnalytics: {
    totalPageViews: number;
    uniqueVisitors: number;
    topPages: { path: string; views: number }[];
    referrerSources: { source: string; visits: number }[];
    deviceBreakdown: { device: string; count: number }[];
    countryBreakdown: { country: string; visits: number }[];
  };
}

const periods = [
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
];

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      fetchData();
    }
  }, [period, selectedDate, isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/admin/analytics?period=${period}`;
      if (period === "1d") {
        url += `&date=${format(selectedDate, "yyyy-MM-dd")}`;
      }
      const response = await fetch(url);
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

  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    const tomorrow = addDays(new Date(), 1);
    const nextDay = addDays(selectedDate, 1);
    if (nextDay <= tomorrow) {
      setSelectedDate(nextDay);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setSelectedDate(date);
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    const types: Record<string, { bg: string; text: string; label: string }> = {
      SUBSCRIPTION: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Sub" },
      PPV: { bg: "bg-amber-500/20", text: "text-amber-400", label: "PPV" },
      TIP: { bg: "bg-pink-500/20", text: "text-pink-400", label: "Tip" },
      MEDIA_UNLOCK: { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "Media" },
    };
    const style = types[type] || types.PPV;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
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

  // Prepare sparkline data for KPI cards
  const revenueSparkline = data?.revenueChart.slice(-7).map((d) => d.revenue) || [];
  const usersSparkline = data?.userGrowth.slice(-7).map((d) => d.newUsers) || [];
  const subscriptionsSparkline = data?.revenueChart.slice(-7).map((d) => d.subscriptions) || [];

  return (
    <div className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Analytics Dashboard</h1>
            <p className="text-[var(--muted)] mt-1">Platform-wide statistics and insights</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <div className="flex bg-[var(--surface)] rounded-lg p-1">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as Period)}
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

            {/* Date picker for 1 day */}
            {period === "1d" && (
              <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg p-1">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={handleDateChange}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="bg-transparent text-sm text-[var(--foreground)] border-none outline-none cursor-pointer px-2 py-1"
                  />
                </div>
                <button
                  onClick={handleNextDay}
                  disabled={format(selectedDate, "yyyy-MM-dd") >= format(new Date(), "yyyy-MM-dd")}
                  className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

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

        {data && (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <RevenueKpiCard
                title="Total Revenue"
                value={data.kpis.totalRevenue}
                change={data.kpis.revenueChange}
                sparklineData={revenueSparkline}
                icon={DollarSign}
                color="yellow"
                delay={0}
              />
              <RevenueKpiCard
                title="Total Users"
                value={data.kpis.totalUsers}
                change={data.kpis.usersChange}
                sparklineData={usersSparkline}
                icon={Users}
                color="cyan"
                formatter={(v) => v.toLocaleString()}
                delay={0.1}
              />
              <RevenueKpiCard
                title="Creators"
                value={data.kpis.totalCreators}
                change={data.kpis.creatorsChange}
                sparklineData={[]}
                icon={Crown}
                color="amber"
                formatter={(v) => v.toLocaleString()}
                delay={0.2}
              />
              <RevenueKpiCard
                title="Active Subs"
                value={data.kpis.activeSubscriptions}
                change={data.kpis.subscriptionsChange}
                sparklineData={subscriptionsSparkline}
                icon={CreditCard}
                color="purple"
                formatter={(v) => v.toLocaleString()}
                delay={0.3}
              />
            </div>

            {/* Revenue Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <RevenueChart
                  data={data.revenueChart}
                  period={period}
                  onPeriodChange={setPeriod}
                  total={data.kpis.totalRevenue}
                  change={data.kpis.revenueChange}
                  avgDaily={data.kpis.totalRevenue / (period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365)}
                  isLoading={isLoading}
                  title="Revenue Over Time"
                />
              </div>
              <RevenueBreakdown
                data={data.revenueBreakdown}
                total={data.kpis.totalRevenue}
                isLoading={isLoading}
              />
            </div>

            {/* User Growth & AI Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <UserGrowthChart data={data.userGrowth} isLoading={isLoading} />
              <AiPerformanceChart
                data={data.aiPerformance}
                summary={data.aiSummary}
                isLoading={isLoading}
              />
            </div>

            {/* Funnel & Top Creators Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ConversionFunnel data={data.funnel} isLoading={isLoading} />
              <TopCreatorsChart data={data.topCreators} isLoading={isLoading} />
            </div>

            {/* Recent Payments & Traffic Sources Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-transparent to-pink-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Recent Payments</h3>
                        <p className="text-xs text-gray-500">Last 24 hours</p>
                      </div>
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-3">
                      {data.recentPayments.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No recent payments</p>
                      ) : (
                        data.recentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white truncate">
                                  {payment.user}
                                </span>
                                {getPaymentTypeBadge(payment.type)}
                              </div>
                              <p className="text-xs text-gray-500">
                                to {payment.creator} • {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-[var(--gold)]">
                              €{payment.amount}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Traffic Sources (placeholder for now) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Quick Stats</h3>
                        <p className="text-xs text-gray-500">Key metrics at a glance</p>
                      </div>
                      <Globe className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">Avg Revenue/User</p>
                        <p className="text-xl font-bold text-white">
                          €{data.kpis.avgRevenuePerUser.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">AI Revenue</p>
                        <p className="text-xl font-bold text-purple-400">
                          €{data.aiSummary.totalAiRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">Chatter Revenue</p>
                        <p className="text-xl font-bold text-cyan-400">
                          €{data.aiSummary.totalChatterRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">Active Visitors</p>
                        <p className="text-xl font-bold text-blue-400">
                          {data.funnel.visitors.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Traffic Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Top Pages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Top Pages</h3>
                        <p className="text-xs text-gray-500">{data.trafficAnalytics.totalPageViews.toLocaleString()} total views</p>
                      </div>
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-2">
                      {data.trafficAnalytics.topPages.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No page views recorded</p>
                      ) : (
                        data.trafficAnalytics.topPages.slice(0, 8).map((page, index) => (
                          <div
                            key={page.path}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate font-mono">
                                {page.path}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-[var(--gold)]">
                              {page.views.toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Traffic Sources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Traffic Sources</h3>
                        <p className="text-xs text-gray-500">{data.trafficAnalytics.uniqueVisitors.toLocaleString()} unique visitors</p>
                      </div>
                      <Link2 className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-2">
                      {data.trafficAnalytics.referrerSources.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No referrer data</p>
                      ) : (
                        data.trafficAnalytics.referrerSources.map((source) => {
                          const totalVisits = data.trafficAnalytics.referrerSources.reduce((sum, s) => sum + s.visits, 0);
                          const percentage = totalVisits > 0 ? (source.visits / totalVisits) * 100 : 0;
                          return (
                            <div
                              key={source.source}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm text-white truncate">
                                    {source.source}
                                  </p>
                                  <span className="text-sm font-medium text-cyan-400">
                                    {source.visits.toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                  <div
                                    className="bg-cyan-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Device & Country Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Device Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Device Breakdown</h3>
                        <p className="text-xs text-gray-500">By device type</p>
                      </div>
                      <Monitor className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {data.trafficAnalytics.deviceBreakdown.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4 col-span-3">No device data</p>
                      ) : (
                        data.trafficAnalytics.deviceBreakdown.map((device) => {
                          const Icon = device.device === "mobile" ? Smartphone :
                                       device.device === "tablet" ? Tablet : Monitor;
                          const total = data.trafficAnalytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                          const percentage = total > 0 ? ((device.count / total) * 100).toFixed(1) : 0;
                          return (
                            <div
                              key={device.device}
                              className="p-4 bg-white/5 rounded-xl text-center"
                            >
                              <Icon className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                              <p className="text-lg font-bold text-white">
                                {device.count.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">{device.device}</p>
                              <p className="text-xs text-gray-500">{percentage}%</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Country Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/5 via-transparent to-pink-500/5 pointer-events-none" />
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Top Countries</h3>
                        <p className="text-xs text-gray-500">By visitor location</p>
                      </div>
                      <MapPin className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-2">
                      {data.trafficAnalytics.countryBreakdown.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No country data</p>
                      ) : (
                        data.trafficAnalytics.countryBreakdown.slice(0, 6).map((country, index) => {
                          const total = data.trafficAnalytics.countryBreakdown.reduce((sum, c) => sum + c.visits, 0);
                          const percentage = total > 0 ? (country.visits / total) * 100 : 0;
                          return (
                            <div
                              key={country.country}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm text-white">
                                    {country.country}
                                  </p>
                                  <span className="text-sm font-medium text-pink-400">
                                    {country.visits.toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                  <div
                                    className="bg-pink-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
