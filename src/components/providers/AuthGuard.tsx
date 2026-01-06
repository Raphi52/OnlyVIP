"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard shows a loading screen while the session is being determined.
 * This prevents the flash of unauthenticated content on page refresh.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useSession();

  // Show loading screen while session is being fetched
  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-[var(--gold)] to-yellow-500 bg-clip-text text-transparent">
            VIPOnly
          </div>
          {/* Spinner */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--gold)] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
