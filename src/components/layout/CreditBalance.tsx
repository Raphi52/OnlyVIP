"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, Plus } from "lucide-react";

interface CreditBalanceProps {
  variant?: "navbar" | "compact" | "full";
}

export function CreditBalance({ variant = "navbar" }: CreditBalanceProps) {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
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
          setBalance(data.balance || 0);
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

  if (variant === "compact") {
    return (
      <Link href="/credits">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
        >
          <Coins className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-sm font-medium text-white">
            {(balance || 0).toLocaleString()}
          </span>
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
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-gray-500">Credits</p>
              <p className="text-lg font-bold text-white">
                {(balance || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default navbar variant
  return (
    <Link href="/credits">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
      >
        <Coins className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-white">
          {(balance || 0).toLocaleString()}
        </span>
        <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
          <Plus className="w-3 h-3 text-purple-300" />
        </div>
      </motion.div>
    </Link>
  );
}
