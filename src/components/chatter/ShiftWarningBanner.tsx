"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShiftStatus {
  isOnShift: boolean;
  currentDay: string;
  currentTime: string;
  todayShiftsFormatted: string;
  nextShift: { day: string; slot: { start: string; end: string } } | null;
  hasSchedule: boolean;
}

export function ShiftWarningBanner() {
  const [status, setStatus] = useState<ShiftStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/chatter/shift-status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch shift status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't show anything while loading or if on shift or no schedule
  if (loading || !status || status.isOnShift || !status.hasSchedule || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-amber-500/10 border-b border-amber-500/30"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-400">
                  You&apos;re working outside your scheduled shift
                </p>
                <p className="text-xs text-amber-400/70">
                  {status.todayShiftsFormatted === "No shifts" ? (
                    <>No shifts scheduled for {status.currentDay}</>
                  ) : (
                    <>Today&apos;s shifts: {status.todayShiftsFormatted}</>
                  )}
                  {status.nextShift && (
                    <> • Next: {status.nextShift.day} at {status.nextShift.slot.start}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
                <Clock className="w-3.5 h-3.5" />
                {status.currentTime}
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-amber-400/70" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
