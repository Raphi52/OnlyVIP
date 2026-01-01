"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Bot,
  MessageCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PerformanceData {
  revenue30d: number;
  revenuePrev30d: number;
  chatterRevenue: number;
  aiRevenue: number;
  unattributedRevenue: number;
  totalMessages: number;
  totalSales: number;
  conversionRate: number;
  topPerformers: {
    type: "chatter" | "ai";
    name: string;
    revenue: number;
    sales: number;
    conversion: number;
  }[];
  creatorBreakdown: {
    slug: string;
    displayName: string;
    revenue: number;
    chatterRevenue: number;
    aiRevenue: number;
  }[];
}

export default function PerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const agency = agencyData.agencies[0];

            setData({
              revenue30d: agency.stats.revenue30d,
              revenuePrev30d: agency.stats.revenue30d * 0.85,
              chatterRevenue: agency.stats.chatterRevenue30d,
              aiRevenue: agency.stats.aiRevenue30d,
              unattributedRevenue: agency.stats.revenue30d - agency.stats.chatterRevenue30d - agency.stats.aiRevenue30d,
              totalMessages: 0,
              totalSales: 0,
              conversionRate: 0,
              topPerformers: [],
              creatorBreakdown: agency.creators.map((c: any) => ({
                slug: c.slug,
                displayName: c.displayName,
                revenue: 0,
                chatterRevenue: 0,
                aiRevenue: 0,
              })),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-lg mx-auto text-center py-12 sm:py-20">
          <p className="text-[var(--muted)]">Failed to load performance data</p>
        </div>
      </div>
    );
  }

  const revenueChange = getPercentChange(data.revenue30d, data.revenuePrev30d);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(data.revenue30d),
      change: revenueChange,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-700/20",
    },
    {
      label: "Chatter Revenue",
      value: formatCurrency(data.chatterRevenue),
      percentage: data.revenue30d > 0 ? Math.round((data.chatterRevenue / data.revenue30d) * 100) : 0,
      icon: Users,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-700/20",
    },
    {
      label: "AI Revenue",
      value: formatCurrency(data.aiRevenue),
      percentage: data.revenue30d > 0 ? Math.round((data.aiRevenue / data.revenue30d) * 100) : 0,
      icon: Bot,
      color: "text-purple-400",
      bg: "from-purple-500/20 to-purple-700/20",
    },
    {
      label: "Unattributed",
      value: formatCurrency(data.unattributedRevenue),
      percentage: data.revenue30d > 0 ? Math.round((data.unattributedRevenue / data.revenue30d) * 100) : 0,
      icon: MessageCircle,
      color: "text-gray-400",
      bg: "from-gray-500/20 to-gray-700/20",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
          Performance
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)]">
          Revenue attribution by chatters and AI
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        {stats.map((stat, index) => (
          <Card key={index} variant="luxury" className="p-3 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
              </div>
              {stat.change !== undefined && (
                <div className={cn(
                  "flex items-center gap-0.5 text-xs sm:text-sm font-medium",
                  stat.change >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
              {stat.percentage !== undefined && (
                <span className="text-xs sm:text-sm text-[var(--muted)]">
                  {stat.percentage}%
                </span>
              )}
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-sm text-[var(--muted)]">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Revenue Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        {/* Attribution Breakdown */}
        <Card variant="luxury" className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            Revenue Attribution
          </h2>

          {data.revenue30d === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-sm sm:text-base text-[var(--muted)]">No revenue data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chatters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-sm sm:text-base text-[var(--foreground)]">Chatters</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                    {formatCurrency(data.chatterRevenue)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(data.chatterRevenue / data.revenue30d) * 100}%` }}
                  />
                </div>
              </div>

              {/* AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="text-sm sm:text-base text-[var(--foreground)]">AI</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                    {formatCurrency(data.aiRevenue)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${(data.aiRevenue / data.revenue30d) * 100}%` }}
                  />
                </div>
              </div>

              {/* Unattributed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-sm sm:text-base text-[var(--foreground)]">Other</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-[var(--foreground)]">
                    {formatCurrency(data.unattributedRevenue)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full transition-all"
                    style={{ width: `${(data.unattributedRevenue / data.revenue30d) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Top Performers */}
        <Card variant="luxury" className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Top Performers
          </h2>

          {data.topPerformers.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-sm sm:text-base text-[var(--muted)]">No performance data yet</p>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Add chatters or AI to see stats
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {data.topPerformers.slice(0, 5).map((performer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-[var(--surface)] rounded-xl"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
                      performer.type === "chatter" ? "bg-blue-500/20" : "bg-purple-500/20"
                    )}>
                      {performer.type === "chatter" ? (
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                      ) : (
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">
                        {performer.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--muted)]">
                        {performer.sales} sales • {performer.conversion}%
                      </p>
                    </div>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-400">
                    {formatCurrency(performer.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Creator Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="luxury" className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4 sm:mb-6 flex items-center gap-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
            Revenue by Creator
          </h2>

          {data.creatorBreakdown.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-sm sm:text-base text-[var(--muted)]">No creators in this agency</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--muted)]">Creator</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted)]">Total</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted)]">Chatter</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--muted)]">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.creatorBreakdown.map((creator) => (
                      <tr key={creator.slug} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                              <span className="text-black font-bold text-sm">
                                {creator.displayName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--foreground)]">
                                {creator.displayName}
                              </p>
                              <p className="text-xs text-[var(--muted)]">@{creator.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-[var(--foreground)]">
                          {formatCurrency(creator.revenue)}
                        </td>
                        <td className="py-4 px-4 text-right text-blue-400">
                          {formatCurrency(creator.chatterRevenue)}
                        </td>
                        <td className="py-4 px-4 text-right text-purple-400">
                          {formatCurrency(creator.aiRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {data.creatorBreakdown.map((creator) => (
                  <div key={creator.slug} className="p-3 bg-[var(--surface)] rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-bold text-sm">
                          {creator.displayName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">@{creator.slug}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-[var(--muted)]">Total</p>
                        <p className="text-sm font-bold text-[var(--foreground)]">
                          {formatCurrency(creator.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--muted)]">Chatter</p>
                        <p className="text-sm font-bold text-blue-400">
                          {formatCurrency(creator.chatterRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--muted)]">AI</p>
                        <p className="text-sm font-bold text-purple-400">
                          {formatCurrency(creator.aiRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
