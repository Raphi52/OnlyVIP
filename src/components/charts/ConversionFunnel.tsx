"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, Crown, DollarSign, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";

interface FunnelData {
  visitors: number;
  signups: number;
  subscribers: number;
  spenders: number;
}

interface ConversionFunnelProps {
  data: FunnelData;
  isLoading?: boolean;
}

const stages = [
  { key: "visitors", label: "Visitors", icon: Users, color: "#6B7280" },
  { key: "signups", label: "Signups", icon: UserPlus, color: "#3B82F6" },
  { key: "subscribers", label: "Subscribers", icon: Crown, color: "#F59E0B" },
  { key: "spenders", label: "Spenders", icon: DollarSign, color: "#10B981" },
] as const;

export function ConversionFunnel({ data, isLoading = false }: ConversionFunnelProps) {
  const maxValue = Math.max(data.visitors, 1);

  const getConversionRate = (fromKey: string, toKey: string) => {
    const from = data[fromKey as keyof FunnelData] || 0;
    const to = data[toKey as keyof FunnelData] || 0;
    if (from === 0) return 0;
    return ((to / from) * 100).toFixed(1);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Conversion Funnel</h3>
          <p className="text-xs text-gray-500">
            Overall: {data.visitors > 0 ? ((data.spenders / data.visitors) * 100).toFixed(2) : 0}% visitors become spenders
          </p>
        </div>

        {/* Funnel stages */}
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const value = data[stage.key];
            const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const Icon = stage.icon;
            const nextStage = stages[index + 1];

            return (
              <div key={stage.key}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Stage bar */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stage.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: stage.color }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{stage.label}</span>
                        <span className="text-sm font-bold text-white">
                          {value.toLocaleString()}
                        </span>
                      </div>

                      <div className="h-6 bg-[var(--background)] rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(width, 2)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full relative"
                          style={{
                            background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})`,
                          }}
                        >
                          {/* Glow effect */}
                          <div
                            className="absolute right-0 top-0 bottom-0 w-8 blur-sm"
                            style={{ backgroundColor: stage.color }}
                          />
                        </motion.div>

                        {/* Percentage label */}
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/80">
                          {width.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Conversion arrow */}
                {nextStage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-center gap-2 ml-11 my-1"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-500">
                      {getConversionRate(stage.key, nextStage.key)}% convert to {nextStage.label.toLowerCase()}
                    </span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
