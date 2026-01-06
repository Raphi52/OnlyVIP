"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number; // Percentage change
  label?: string; // e.g., "vs last 30 days"
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  label,
  size = "md",
  showLabel = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const isNegative = value < 0;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-center gap-1", sizeClasses[size], className)}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
          isPositive && "bg-emerald-500/20 text-emerald-400",
          isNegative && "bg-red-500/20 text-red-400",
          isNeutral && "bg-gray-500/20 text-gray-400"
        )}
      >
        {isPositive && <TrendingUp className={iconSizes[size]} />}
        {isNegative && <TrendingDown className={iconSizes[size]} />}
        {isNeutral && <Minus className={iconSizes[size]} />}
        <span className="font-semibold">
          {isPositive && "+"}
          {value.toFixed(1)}%
        </span>
      </motion.div>
      {showLabel && label && (
        <span className="text-gray-500 hidden sm:inline">{label}</span>
      )}
    </motion.div>
  );
}
