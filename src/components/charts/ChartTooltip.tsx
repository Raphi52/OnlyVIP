"use client";

import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => `€${v.toLocaleString()}`,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedDate = label
    ? format(new Date(label), "MMM d, yyyy")
    : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="relative"
      >
        {/* Glassmorphism container */}
        <div className="px-4 py-3 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.15) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* Date */}
            <p className="text-xs text-gray-400 mb-2">{formattedDate}</p>

            {/* Values */}
            <div className="space-y-1.5">
              {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: entry.color,
                      boxShadow: `0 0 8px ${entry.color}`,
                    }}
                  />
                  <span className="text-xs text-gray-400 capitalize">
                    {entry.name === "revenue" ? "Revenue" : entry.name}:
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatter(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-black/80" />
      </motion.div>
    </AnimatePresence>
  );
}

// Custom tooltip for breakdown/donut chart
export function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      type: string;
      amount: number;
      percentage: number;
      fill: string;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 py-3 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: data.fill,
            boxShadow: `0 0 8px ${data.fill}`,
          }}
        />
        <span className="text-sm font-medium text-white capitalize">{data.type}</span>
      </div>
      <p className="text-lg font-bold text-white">€{data.amount.toLocaleString()}</p>
      <p className="text-xs text-gray-400">{data.percentage.toFixed(1)}% of total</p>
    </motion.div>
  );
}
