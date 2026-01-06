"use client";

import { useState, useEffect } from "react";
import { Key, Coins, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditIndicatorProps {
  usingCustomKey: boolean;
  balance: number;
  costPerSuggestion?: number;
  className?: string;
  variant?: "compact" | "full";
}

export default function CreditIndicator({
  usingCustomKey,
  balance,
  costPerSuggestion = 1,
  className,
  variant = "compact",
}: CreditIndicatorProps) {
  const canGenerate = usingCustomKey || balance >= costPerSuggestion;

  if (usingCustomKey) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full",
          variant === "compact"
            ? "px-3 py-1.5 bg-emerald-500/20 text-emerald-400"
            : "px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
          className
        )}
      >
        <Key className="w-4 h-4" />
        <span className={cn("font-medium", variant === "compact" ? "text-xs" : "text-sm")}>
          {variant === "compact" ? "API Key" : "Using agency API key"}
        </span>
        {variant === "full" && (
          <span className="text-emerald-300/70 text-xs ml-1">(FREE)</span>
        )}
      </div>
    );
  }

  if (!canGenerate) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full",
          variant === "compact"
            ? "px-3 py-1.5 bg-red-500/20 text-red-400"
            : "px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400",
          className
        )}
      >
        <AlertCircle className="w-4 h-4" />
        <span className={cn("font-medium", variant === "compact" ? "text-xs" : "text-sm")}>
          {variant === "compact" ? "No credits" : "Insufficient credits"}
        </span>
        {variant === "full" && (
          <span className="text-red-300/70 text-xs ml-1">
            ({balance} / {costPerSuggestion} needed)
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full",
        variant === "compact"
          ? "px-3 py-1.5 bg-amber-500/20 text-amber-400"
          : "px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400",
        className
      )}
    >
      <Coins className="w-4 h-4" />
      <span className={cn("font-medium", variant === "compact" ? "text-xs" : "text-sm")}>
        {balance} credits
      </span>
      {variant === "full" && (
        <span className="text-amber-300/70 text-xs ml-1">
          ({costPerSuggestion} per suggestion)
        </span>
      )}
    </div>
  );
}

// Small inline badge version
export function CreditBadge({
  usingCustomKey,
  balance,
}: {
  usingCustomKey: boolean;
  balance: number;
}) {
  if (usingCustomKey) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
        <Key className="w-3 h-3" />
        FREE
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
        balance > 0
          ? "bg-amber-500/20 text-amber-400"
          : "bg-red-500/20 text-red-400"
      )}
    >
      <Coins className="w-3 h-3" />
      {balance}
    </span>
  );
}

// Hook to fetch billing status
export function useBillingStatus(creatorSlug: string | null) {
  const [billing, setBilling] = useState<{
    usingCustomKey: boolean;
    balance: number;
    costPerSuggestion: number;
    canGenerateSuggestions: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorSlug) {
      setLoading(false);
      return;
    }

    const fetchBilling = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/chatter/billing/status?creatorSlug=${encodeURIComponent(creatorSlug)}`
        );
        if (!res.ok) throw new Error("Failed to fetch billing status");
        const data = await res.json();
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [creatorSlug]);

  return { billing, loading, error, refresh: () => setBilling(null) };
}
