"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { MiniSparkline } from "./MiniSparkline";
import { TrendIndicator } from "./TrendIndicator";
import { cn } from "@/lib/utils";

interface RevenueKpiCardProps {
  title: string;
  value: number;
  change: number;
  sparklineData: number[];
  icon: LucideIcon;
  color: string;
  formatter?: (value: number) => string;
  delay?: number;
  className?: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string; sparkline: string }> = {
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    sparkline: "#8B5CF6",
  },
  amber: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    sparkline: "#F59E0B",
  },
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    sparkline: "#EC4899",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    sparkline: "#06B6D4",
  },
  emerald: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    sparkline: "#10B981",
  },
  yellow: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    sparkline: "#FACC15",
  },
};

export function RevenueKpiCard({
  title,
  value,
  change,
  sparklineData,
  icon: Icon,
  color,
  formatter = (v) => `€${v.toLocaleString()}`,
  delay = 0,
  className,
}: RevenueKpiCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.yellow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={className}
    >
      <Card className="relative overflow-hidden group hover:border-white/20 transition-colors">
        {/* Subtle gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top right, ${colors.sparkline}10 0%, transparent 70%)`,
          }}
        />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Left side: Icon + Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-2 rounded-lg flex-shrink-0", colors.bg)}>
                  <Icon className={cn("w-4 h-4", colors.text)} />
                </div>
                <span className="text-xs font-medium text-gray-400 truncate">{title}</span>
              </div>

              <motion.p
                key={value}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-bold text-white mb-1"
              >
                {formatter(value)}
              </motion.p>

              <TrendIndicator value={change} size="sm" showLabel={false} />
            </div>

            {/* Right side: Sparkline */}
            <div className="flex-shrink-0 hidden sm:block">
              <MiniSparkline
                data={sparklineData}
                color={colors.sparkline}
                width={70}
                height={40}
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
