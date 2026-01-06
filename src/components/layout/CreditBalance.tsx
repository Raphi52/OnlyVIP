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
      <div className={`flex items-center gap-1.5 rounded-full bg-black/50 border border-yellow-500/20 ${
        variant === "compact" ? "px-2.5 py-1.5" : "px-3 py-1.5"
      }`}>
        <Coins className={`text-yellow-400/50 animate-pulse ${variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
        <span className={`text-gray-500 ${variant === "compact" ? "text-xs" : "text-sm"}`}>...</span>
      </div>
    );
  }

  const paidCredits = credits?.paidCredits || 0;
  const bonusCredits = credits?.bonusCredits || 0;

  if (variant === "compact") {
    // Mobile-friendly compact version with holographic effect
    return (
      <Link href="/credits">
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {/* Outer glow pulse */}
          <motion.div
            className="absolute -inset-1 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.25, 0.4, 0.25]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Animated rainbow border */}
          <motion.div
            className="absolute -inset-[2px] rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
              backgroundSize: '300% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner gold border */}
          <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500" />

          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black overflow-hidden">
            {/* Holographic interior */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.15) 15%, rgba(0,255,255,0.15) 30%, rgba(255,255,0,0.1) 45%, rgba(128,0,255,0.15) 60%, rgba(0,255,128,0.1) 75%, transparent 100%)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            <Coins className="relative z-10 w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
            <span className="relative z-10 text-xs font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
              {paidCredits.toLocaleString()}
            </span>
            {bonusCredits > 0 && (
              <span className="relative z-10 text-xs font-medium bg-gradient-to-r from-gray-200 via-slate-300 to-gray-200 bg-clip-text text-transparent">
                +{bonusCredits > 999 ? "999+" : bonusCredits}
              </span>
            )}
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === "full") {
    return (
      <Link href="/credits">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative group"
        >
          {/* Outer glow pulse */}
          <motion.div
            className="absolute -inset-2 rounded-2xl opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.2, 0.35, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Animated rainbow border */}
          <motion.div
            className="absolute -inset-[2px] rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
              backgroundSize: '300% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner gold border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500" />

          <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-black overflow-hidden">
            {/* Holographic interior */}
            <motion.div
              className="absolute inset-0 opacity-35"
              style={{
                background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.15) 15%, rgba(0,255,255,0.15) 30%, rgba(255,255,0,0.1) 45%, rgba(128,0,255,0.15) 60%, rgba(0,255,128,0.1) 75%, transparent 100%)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Shimmer on hover - diagonal to match prismatic bands */}
            <div
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{
                background: 'linear-gradient(125deg, transparent 0%, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%, transparent 100%)',
              }}
            />

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                <div>
                  <p className="text-xs text-gray-400">Credits</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    {paidCredits.toLocaleString()}
                  </p>
                </div>
              </div>
              {bonusCredits > 0 && (
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-slate-300" />
                  <div>
                    <p className="text-xs text-gray-400">Bonus</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-gray-200 via-slate-300 to-gray-200 bg-clip-text text-transparent">
                      {bonusCredits.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Plus className="w-4 h-4 text-black font-bold" />
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default navbar variant - Ultra premium holographic button
  return (
    <Link href="/credits">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group cursor-pointer"
      >
        {/* Outer glow pulse */}
        <motion.div
          className="absolute -inset-2 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated rainbow border */}
        <motion.div
          className="absolute -inset-[2px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)',
            backgroundSize: '300% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner gold border */}
        <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500" />

        {/* Sparkle particles */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${i % 2 === 0 ? '10%' : '80%'}`,
              boxShadow: '0 0 4px 1px rgba(255,255,255,0.8)',
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Inner content */}
        <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-black overflow-hidden">
          {/* Holographic interior effect */}
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.15) 15%, rgba(0,255,255,0.15) 30%, rgba(255,255,0,0.1) 45%, rgba(128,0,255,0.15) 60%, rgba(0,255,128,0.1) 75%, transparent 100%)',
              backgroundSize: '300% 300%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Secondary sweep */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(-45deg, transparent 0%, rgba(0,200,255,0.12) 25%, rgba(255,100,200,0.12) 50%, rgba(100,255,150,0.12) 75%, transparent 100%)',
              backgroundSize: '250% 250%',
            }}
            animate={{
              backgroundPosition: ['100% 0%', '0% 100%', '100% 0%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Shimmer on hover - diagonal to match prismatic bands */}
          <div
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            style={{
              background: 'linear-gradient(125deg, transparent 0%, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%, transparent 100%)',
            }}
          />

          {/* Sparkle icon with glow */}
          <div className="relative z-10">
            <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
          </div>

          {/* Credits amount */}
          <span className="relative z-10 text-sm font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
            {paidCredits.toLocaleString()}
          </span>

          {bonusCredits > 0 && (
            <>
              <div className="relative z-10 w-px h-4 bg-gradient-to-b from-transparent via-slate-400/50 to-transparent" />
              <Gift className="relative z-10 w-4 h-4 text-slate-300" />
              <span className="relative z-10 text-sm font-bold bg-gradient-to-r from-gray-200 via-slate-300 to-gray-200 bg-clip-text text-transparent">
                +{bonusCredits.toLocaleString()}
              </span>
            </>
          )}

          {/* Plus button */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-black font-bold" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
