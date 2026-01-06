"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ChartTooltip } from "./ChartTooltip";
import { TrendIndicator } from "./TrendIndicator";
import { PeriodSelector, type Period } from "./PeriodSelector";
import { Card } from "@/components/ui";

interface DailyData {
  date: string;
  revenue: number;
  subscriptions?: number;
  ppv?: number;
  tips?: number;
  media?: number;
}

interface RevenueChartProps {
  data: DailyData[];
  period: Period;
  onPeriodChange: (period: Period) => void;
  total: number;
  change: number;
  avgDaily: number;
  isLoading?: boolean;
  comparison?: DailyData[];
  title?: string;
}

export function RevenueChart({
  data,
  period,
  onPeriodChange,
  total,
  change,
  avgDaily,
  isLoading = false,
  comparison,
  title = "Revenue",
}: RevenueChartProps) {
  // Format axis ticks based on period
  const formatXAxis = useMemo(() => {
    return (dateStr: string) => {
      try {
        const date = parseISO(dateStr);
        if (period === "7d") {
          return format(date, "EEE"); // Mon, Tue, etc.
        } else if (period === "30d") {
          return format(date, "d"); // Day number
        } else if (period === "90d") {
          return format(date, "MMM d"); // Jan 15
        } else {
          return format(date, "MMM"); // Jan, Feb, etc.
        }
      } catch {
        return dateStr;
      }
    };
  }, [period]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}k`;
    }
    return `€${value}`;
  };

  // Calculate domain for Y axis
  const yDomain = useMemo(() => {
    if (!data.length) return [0, 100];
    const values = data.map((d) => d.revenue);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const padding = (max - min) * 0.1 || max * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [data]);

  return (
    <Card className="relative overflow-hidden">
      {/* Premium gradient border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-transparent to-amber-500/10 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-medium text-gray-400">{title}</h3>
              <TrendIndicator value={change} label={`vs previous ${period}`} size="sm" />
            </div>
            <motion.p
              key={total}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent"
            >
              €{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </motion.p>
            <p className="text-xs text-gray-500 mt-1">
              Avg. €{avgDaily.toFixed(0)}/day
            </p>
          </div>
          <PeriodSelector value={period} onChange={onPeriodChange} />
        </div>

        {/* Chart */}
        <div className="h-[250px] sm:h-[300px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#FACC15" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="comparisonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B7280" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6B7280" stopOpacity={0} />
                  </linearGradient>
                  {/* Glow filter */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                {/* Axes */}
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
                  domain={yDomain}
                />

                {/* Tooltip */}
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{
                    stroke: "rgba(250, 204, 21, 0.3)",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                />

                {/* Average line */}
                <ReferenceLine
                  y={avgDaily}
                  stroke="rgba(250, 204, 21, 0.3)"
                  strokeDasharray="5 5"
                  label={{
                    value: "Avg",
                    position: "right",
                    fill: "rgba(250, 204, 21, 0.5)",
                    fontSize: 10,
                  }}
                />

                {/* Comparison area (previous period) */}
                {comparison && comparison.length > 0 && (
                  <Area
                    type="monotone"
                    data={comparison}
                    dataKey="revenue"
                    stroke="#6B7280"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    fill="url(#comparisonGradient)"
                    fillOpacity={0.3}
                    name="Previous"
                  />
                )}

                {/* Main area */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FACC15"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  fillOpacity={1}
                  name="revenue"
                  filter="url(#glow)"
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}
