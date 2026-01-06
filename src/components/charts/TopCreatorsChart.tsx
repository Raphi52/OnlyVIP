"use client";

import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui";

interface TopCreator {
  slug: string;
  name: string;
  avatar: string | null;
  revenue: number;
  subscribers: number;
}

interface TopCreatorsChartProps {
  data: TopCreator[];
  isLoading?: boolean;
}

export function TopCreatorsChart({ data, isLoading = false }: TopCreatorsChartProps) {
  const maxRevenue = Math.max(...data.map((c) => c.revenue), 1);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">Top Creators</h3>
            <p className="text-xs text-gray-500">By revenue this period</p>
          </div>
          <Crown className="w-5 h-5 text-[var(--gold)]" />
        </div>

        {/* Creator list */}
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No data available</p>
          ) : (
            data.map((creator, index) => {
              const width = (creator.revenue / maxRevenue) * 100;

              return (
                <motion.div
                  key={creator.slug}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-[var(--gold)] text-black"
                          : index === 1
                          ? "bg-gray-300 text-black"
                          : index === 2
                          ? "bg-amber-700 text-white"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-white/10">
                      {creator.avatar ? (
                        <Image
                          src={creator.avatar}
                          alt={creator.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
                          {creator.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {creator.name}
                        </span>
                        <span className="text-sm font-bold text-[var(--gold)]">
                          €{creator.revenue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Progress bar */}
                        <div className="flex-1 h-2 bg-[var(--background)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              background: "linear-gradient(90deg, #FACC15, #F59E0B)",
                            }}
                          />
                        </div>

                        {/* Subscribers */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{creator.subscribers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
