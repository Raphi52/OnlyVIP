"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, Plus, Gift } from "lucide-react";

interface CreditBalanceProps {
  variant?: "navbar" | "compact" | "full";
}

interface CreditsData {
  balance: number;
  paidCredits: number;
  bonusCredits: number;
}

export function CreditBalance({ variant = "navbar" }: CreditBalanceProps) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/user/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits({
            balance: data.balance || 0,
            paidCredits: data.paidCredits || 0,
            bonusCredits: data.bonusCredits || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [session?.user?.id]);

  if (!session?.user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
        <Coins className="w-4 h-4 text-purple-400 animate-pulse" />
        <span className="text-sm text-gray-400">...</span>
      </div>
    );
  }

  const paidCredits = credits?.paidCredits || 0;
  const bonusCredits = credits?.bonusCredits || 0;

  if (variant === "compact") {
    return (
      <Link href="/credits">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
        >
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-sm font-medium text-white">
              {paidCredits.toLocaleString()}
            </span>
          </div>
          {bonusCredits > 0 && (
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="text-xs">+</span>
              <Gift className="w-3 h-3" />
              <span className="text-sm font-medium">
                {bonusCredits.toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>
      </Link>
    );
  }

  if (variant === "full") {
    return (
      <Link href="/credits">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-500">Credits</p>
                <p className="text-lg font-bold text-white">
                  {paidCredits.toLocaleString()}
                </p>
              </div>
            </div>
            {bonusCredits > 0 && (
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-500">Bonus</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {bonusCredits.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default navbar variant with animated border
  return (
    <Link href="/credits">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        {/* Animated glowing border */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "inset 0 0 0 2px rgba(139, 92, 246, 0.9), 0 0 12px rgba(139, 92, 246, 0.4)",
              "inset 0 0 0 2px rgba(16, 185, 129, 0.9), 0 0 12px rgba(16, 185, 129, 0.4)",
              "inset 0 0 0 2px rgba(139, 92, 246, 0.9), 0 0 12px rgba(139, 92, 246, 0.4)",
            ]
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        {/* Inner content */}
        <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full ${
          bonusCredits > 0
            ? "bg-gradient-to-r from-purple-950 to-emerald-950"
            : "bg-purple-950"
        }`}>
          <Coins className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">
            {paidCredits.toLocaleString()}
          </span>
          {bonusCredits > 0 && (
            <>
              <span className="text-gray-500">|</span>
              <Gift className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {bonusCredits.toLocaleString()}
              </span>
            </>
          )}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
            bonusCredits > 0
              ? "bg-gradient-to-r from-purple-500/30 to-emerald-500/30"
              : "bg-purple-500/30"
          }`}>
            <Plus className="w-3 h-3 text-white" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
