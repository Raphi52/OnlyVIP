"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Period = "7d" | "30d" | "90d" | "1y";

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
];

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10", className)}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className="relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
        >
          {value === period.value && (
            <motion.div
              layoutId="period-selector-active"
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
              style={{
                boxShadow: "0 0 20px rgba(250, 204, 21, 0.2)",
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span
            className={cn(
              "relative z-10 transition-colors",
              value === period.value
                ? "text-yellow-400"
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            {period.label}
          </span>
        </button>
      ))}
    </div>
  );
}
