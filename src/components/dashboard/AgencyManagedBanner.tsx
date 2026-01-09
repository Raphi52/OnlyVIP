"use client";

import { AlertTriangle, Eye, DoorOpen } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AgencyManagedBannerProps {
  agencyName: string | null;
  showLeaveButton?: boolean;
  className?: string;
}

export function AgencyManagedBanner({
  agencyName,
  showLeaveButton = true,
  className = "",
}: AgencyManagedBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                View Only Mode
              </span>
            </div>
            <p className="text-sm text-orange-300/80">
              Your profile is managed by{" "}
              <span className="font-semibold text-orange-200">
                {agencyName || "an agency"}
              </span>
              . You can view your earnings and messages but cannot make changes.
            </p>
          </div>
        </div>
        {showLeaveButton && (
          <Link
            href="/dashboard/creator/breakup"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 hover:text-red-300 transition-all duration-300 text-sm font-medium whitespace-nowrap"
          >
            <DoorOpen className="w-4 h-4" />
            Leave Agency
          </Link>
        )}
      </div>
    </motion.div>
  );
}

interface DisabledOverlayProps {
  message?: string;
  children: React.ReactNode;
}

/**
 * Wraps content with a disabled overlay when in agency-managed mode
 */
export function DisabledOverlay({ message, children }: DisabledOverlayProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 select-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
        <div className="bg-black/80 px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 text-sm font-medium">
          {message || "This feature is disabled in view-only mode"}
        </div>
      </div>
    </div>
  );
}
