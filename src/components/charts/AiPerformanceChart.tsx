"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, Bot, User, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";

interface AiPerformanceData {
  date: string;
  aiRevenue: number;
  aiMessages: number;
  chatterRevenue: number;
  chatterMessages: number;
}

interface AiSummary {
  totalAiRevenue: number;
  totalChatterRevenue: number;
  aiConversionRate: number;
  chatterConversionRate: number;
}

interface AiPerformanceChartProps {
  data: AiPerformanceData[];
  summary: AiSummary;
  isLoading?: boolean;
}

export function AiPerformanceChart({
  data,
  summary,
  isLoading = false,
}: AiPerformanceChartProps) {
  const [metric, setMetric] = useState<"revenue" | "messages">("revenue");

  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  const formatYAxis = (value: number) => {
    if (metric === "revenue") {
      if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
      return `€${value}`;
    }
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">
          {format(parseISO(label), "MMM d, yyyy")}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-300">{entry.name}:</span>
            <span className="text-xs font-semibold text-white">
              {metric === "revenue" ? `€${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const aiWins = summary.totalAiRevenue > summary.totalChatterRevenue;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">AI vs Human Performance</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-lg font-bold text-white">
                  €{summary.totalAiRevenue.toLocaleString()}
                </span>
              </div>
              <span className="text-gray-600">vs</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-lg font-bold text-white">
                  €{summary.totalChatterRevenue.toLocaleString()}
                </span>
              </div>
              {aiWins && (
                <span className="text-xs text-purple-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  AI leads
                </span>
              )}
            </div>
          </div>

          {/* Metric toggle */}
          <div className="flex bg-[var(--surface)] rounded-lg p-1">
            <button
              onClick={() => setMetric("revenue")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                metric === "revenue"
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric("messages")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                metric === "messages"
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Messages
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-400">AI ({summary.aiConversionRate.toFixed(1)}% conv.)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-gray-400">Chatters ({summary.chatterConversionRate.toFixed(1)}% conv.)</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-sm">No AI performance data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="chatterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tickFormatter={formatYAxis}
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey={metric === "revenue" ? "aiRevenue" : "aiMessages"}
                  name={metric === "revenue" ? "AI Revenue" : "AI Messages"}
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#aiGradient)"
                  animationDuration={1500}
                />

                <Area
                  type="monotone"
                  dataKey={metric === "revenue" ? "chatterRevenue" : "chatterMessages"}
                  name={metric === "revenue" ? "Chatter Revenue" : "Chatter Messages"}
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fill="url(#chatterGradient)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}
