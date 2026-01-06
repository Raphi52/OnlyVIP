"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  DollarSign,
  Percent,
  Clock,
  Bot,
  User,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import ChatterNav from "@/components/chatter/ChatterNav";

interface Analytics {
  summary: {
    messagesSent: number;
    revenue: number;
    conversionRate: number;
    avgResponseTime: number;
    sales: number;
  };
  trends: {
    messages: number;
    revenue: number;
  };
  aiVsManual: {
    ai: { messages: number; revenue: number; conversion: number };
    manual: { messages: number; revenue: number; conversion: number };
  };
  topScripts: Array<{
    id: string;
    name: string;
    category: string;
    uses: number;
    revenue: number;
    conversion: number;
  }>;
  scriptStats: {
    totalUsed: number;
    conversions: number;
    conversionRate: number;
  };
  period: string;
}

export default function ChatterAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Check auth
  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as any).role !== "CHATTER") {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chatter/analytics?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchAnalytics();
    }
  }, [session, period]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--background]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <ChatterNav />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm">
              Track your performance and optimize your strategy
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 bg-[--surface-elevated] rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  period === p
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Messages Sent"
                value={analytics.summary.messagesSent.toLocaleString()}
                trend={analytics.trends.messages}
                icon={<MessageSquare className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Revenue Generated"
                value={`$${analytics.summary.revenue.toFixed(2)}`}
                trend={analytics.trends.revenue}
                icon={<DollarSign className="w-5 h-5" />}
                color="emerald"
              />
              <StatCard
                title="Conversion Rate"
                value={`${analytics.summary.conversionRate}%`}
                icon={<Percent className="w-5 h-5" />}
                color="purple"
              />
              <StatCard
                title="Avg Response Time"
                value={`${analytics.summary.avgResponseTime.toFixed(1)} min`}
                icon={<Clock className="w-5 h-5" />}
                color="orange"
              />
            </div>

            {/* AI vs Manual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  AI vs Manual Performance
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* AI Stats */}
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-5 h-5 text-purple-400" />
                      <span className="font-medium text-white">AI Assisted</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white">
                          {analytics.aiVsManual.ai.messages}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-emerald-400">
                          ${analytics.aiVsManual.ai.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Conversion</span>
                        <span className="text-purple-400">
                          {analytics.aiVsManual.ai.conversion}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Stats */}
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">Manual</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white">
                          {analytics.aiVsManual.manual.messages}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-emerald-400">
                          ${analytics.aiVsManual.manual.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Conversion</span>
                        <span className="text-blue-400">
                          {analytics.aiVsManual.manual.conversion}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison bar */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Message Distribution</p>
                  <div className="h-3 bg-[--background] rounded-full overflow-hidden flex">
                    <div
                      className="bg-purple-500 transition-all"
                      style={{
                        width: `${
                          (analytics.aiVsManual.ai.messages /
                            (analytics.aiVsManual.ai.messages +
                              analytics.aiVsManual.manual.messages)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-blue-500 transition-all"
                      style={{
                        width: `${
                          (analytics.aiVsManual.manual.messages /
                            (analytics.aiVsManual.ai.messages +
                              analytics.aiVsManual.manual.messages)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>AI: {Math.round(
                      (analytics.aiVsManual.ai.messages /
                        (analytics.aiVsManual.ai.messages +
                          analytics.aiVsManual.manual.messages)) *
                      100
                    )}%</span>
                    <span>Manual: {Math.round(
                      (analytics.aiVsManual.manual.messages /
                        (analytics.aiVsManual.ai.messages +
                          analytics.aiVsManual.manual.messages)) *
                      100
                    )}%</span>
                  </div>
                </div>
              </Card>

              {/* Script Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Script Performance
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {analytics.scriptStats.totalUsed}
                    </p>
                    <p className="text-xs text-gray-400">Scripts Used</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {analytics.scriptStats.conversions}
                    </p>
                    <p className="text-xs text-gray-400">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics.scriptStats.conversionRate}%
                    </p>
                    <p className="text-xs text-gray-400">Conv. Rate</p>
                  </div>
                </div>

                {/* Top Scripts */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">
                    Top Performing Scripts
                  </p>
                  {analytics.topScripts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No script usage data yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.topScripts.slice(0, 5).map((script, i) => (
                        <div
                          key={script.id}
                          className="flex items-center justify-between py-2 border-b border-[--border] last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">
                              #{i + 1}
                            </span>
                            <span className="text-sm text-white truncate max-w-[150px]">
                              {script.name}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px]",
                                getCategoryColor(script.category)
                              )}
                            >
                              {script.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">{script.uses}x</span>
                            <span className="text-emerald-400">
                              ${script.revenue.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load analytics</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Stat card component
function StatCard({
  title,
  value,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  }[color];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "p-2 rounded-lg border",
            colorClasses
          )}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend >= 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mt-3">{value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </Card>
  );
}

function getCategoryColor(category: string) {
  return {
    GREETING: "bg-blue-500/20 text-blue-400",
    PPV_PITCH: "bg-emerald-500/20 text-emerald-400",
    FOLLOW_UP: "bg-yellow-500/20 text-yellow-400",
    CLOSING: "bg-purple-500/20 text-purple-400",
    CUSTOM: "bg-pink-500/20 text-pink-400",
  }[category] || "bg-gray-500/20 text-gray-400";
}
