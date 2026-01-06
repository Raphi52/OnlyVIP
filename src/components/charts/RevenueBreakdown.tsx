"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { BreakdownTooltip } from "./ChartTooltip";
import { Card } from "@/components/ui";

interface BreakdownData {
  type: string;
  amount: number;
  percentage: number;
}

interface RevenueBreakdownProps {
  data: BreakdownData[];
  total: number;
  isLoading?: boolean;
  className?: string;
}

const COLORS: Record<string, string> = {
  subscription: "#8B5CF6", // Purple
  subscriptions: "#8B5CF6",
  ppv: "#F59E0B", // Amber
  tip: "#EC4899", // Pink
  tips: "#EC4899",
  media: "#06B6D4", // Cyan
  other: "#6B7280", // Gray
};

const LABELS: Record<string, string> = {
  subscription: "Subscriptions",
  subscriptions: "Subscriptions",
  ppv: "PPV Sales",
  tip: "Tips",
  tips: "Tips",
  media: "Media Unlocks",
  other: "Other",
};

export function RevenueBreakdown({
  data,
  total,
  isLoading = false,
  className,
}: RevenueBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      fill: COLORS[item.type.toLowerCase()] || COLORS.other,
      label: LABELS[item.type.toLowerCase()] || item.type,
    }));
  }, [data]);

  const handleMouseEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className={className}>
      <div className="p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Revenue Breakdown</h3>

        <div className="flex flex-col items-center gap-4">
          {/* Donut Chart - Centered */}
          <div className="relative w-[180px] h-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <defs>
                  {chartData.map((entry, index) => (
                    <filter
                      key={`glow-${index}`}
                      id={`pie-glow-${index}`}
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={activeIndex !== null ? 85 : 80}
                  paddingAngle={3}
                  dataKey="amount"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke="transparent"
                      style={{
                        filter: activeIndex === index ? `url(#pie-glow-${index})` : undefined,
                        opacity: activeIndex !== null && activeIndex !== index ? 0.5 : 1,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<BreakdownTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {activeIndex !== null ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center"
                  >
                    <p className="text-xs text-gray-400">{chartData[activeIndex]?.label}</p>
                    <p className="text-lg font-bold text-white">
                      €{chartData[activeIndex]?.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {chartData[activeIndex]?.percentage.toFixed(1)}%
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center"
                  >
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                      €{total.toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legend - Grid below chart */}
          <div className="w-full grid grid-cols-2 gap-2">
            {chartData.map((entry, index) => (
              <motion.div
                key={entry.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeIndex === index
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: entry.fill,
                    boxShadow: activeIndex === index ? `0 0 8px ${entry.fill}` : undefined,
                  }}
                />
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                  <p className="text-xs text-gray-300 truncate">{entry.label}</p>
                  <p className="text-xs font-semibold text-white whitespace-nowrap">
                    {entry.percentage.toFixed(0)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
