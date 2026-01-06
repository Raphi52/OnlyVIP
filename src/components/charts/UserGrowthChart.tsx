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
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, Users, Crown } from "lucide-react";
import { Card } from "@/components/ui";

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
  newCreators: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
  isLoading?: boolean;
}

export function UserGrowthChart({ data, isLoading = false }: UserGrowthChartProps) {
  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  const totals = useMemo(() => {
    if (!data.length) return { totalUsers: 0, totalCreators: 0, newUsers: 0 };
    const lastDay = data[data.length - 1];
    return {
      totalUsers: lastDay.totalUsers,
      newUsers: data.reduce((sum, d) => sum + d.newUsers, 0),
      newCreators: data.reduce((sum, d) => sum + d.newCreators, 0),
    };
  }, [data]);

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
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-yellow-500/5 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">User Growth</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xl font-bold text-white">
                  {totals.totalUsers.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">total</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[var(--gold)]" />
                <span className="text-sm font-medium text-gray-400">
                  +{totals.newCreators} creators
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400">Total Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--gold)]" />
              <span className="text-gray-400">New Creators</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="creatorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity={0} />
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
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalUsers"
                  name="Total Users"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#userGradient)"
                  animationDuration={1500}
                />

                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="newCreators"
                  name="New Creators"
                  stroke="#FACC15"
                  strokeWidth={2}
                  fill="url(#creatorGradient)"
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
