"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  variant?: "gold" | "platinum" | "purple";
  showSparkles?: boolean;
  showHolographic?: boolean;
  showRainbowBorder?: boolean;
  className?: string;
  contentClassName?: string;
  rounded?: "xl" | "2xl" | "3xl";
}

// Sparkle particles component
function SparkleParticles({ count = 5 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full z-20 pointer-events-none"
          style={{
            left: `${10 + i * (80 / count)}%`,
            top: `${8 + (i % 3) * 30}%`,
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.8)",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

// Holographic sweeps component
function HolographicSweeps() {
  return (
    <>
      {/* Primary prismatic sweep */}
      <div
        className="absolute inset-0 animate-holographic-sweep pointer-events-none"
        style={{
          background:
            "linear-gradient(125deg, transparent 0%, rgba(255,0,128,0.2) 15%, rgba(0,255,255,0.2) 30%, rgba(255,255,0,0.15) 45%, rgba(128,0,255,0.2) 60%, rgba(0,255,128,0.15) 75%, transparent 100%)",
          backgroundSize: "300% 300%",
        }}
      />

      {/* Secondary reverse sweep */}
      <div
        className="absolute inset-0 animate-holographic-sweep-reverse pointer-events-none"
        style={{
          background:
            "linear-gradient(-45deg, transparent 0%, rgba(0,200,255,0.15) 25%, rgba(255,100,200,0.15) 50%, rgba(100,255,150,0.15) 75%, transparent 100%)",
          backgroundSize: "250% 250%",
        }}
      />
    </>
  );
}

// Shimmer effect component
function ShimmerEffect({ variant }: { variant: "gold" | "platinum" | "purple" }) {
  return (
    <div
      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10"
      style={{
        background:
          "linear-gradient(125deg, transparent 0%, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%, transparent 100%)",
      }}
    />
  );
}

export function PremiumCard({
  children,
  variant = "gold",
  showSparkles = true,
  showHolographic = true,
  showRainbowBorder = true,
  className,
  contentClassName,
  rounded = "2xl",
}: PremiumCardProps) {
  const roundedClass = {
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  }[rounded];

  const innerRoundedClass = {
    xl: "rounded-[10px]",
    "2xl": "rounded-[14px]",
    "3xl": "rounded-[22px]",
  }[rounded];

  const innerBorderGradient = {
    gold: "from-yellow-300 via-amber-400 to-yellow-500",
    platinum: "from-gray-300 via-white to-gray-300",
    purple: "from-purple-400 via-pink-400 to-purple-500",
  }[variant];

  return (
    <div className={cn("relative group", className)}>
      {/* Layer 1: Outer glow pulse */}
      <motion.div
        className={cn("absolute -inset-3 opacity-40 pointer-events-none", roundedClass)}
        style={{
          background:
            variant === "gold"
              ? "radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)"
              : variant === "purple"
              ? "radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Layer 2: Animated rainbow border */}
      {showRainbowBorder && (
        <motion.div
          className={cn("absolute -inset-[2px] pointer-events-none", roundedClass)}
          style={{
            background:
              "linear-gradient(90deg, #ff0080, #ff8c00, #ffef00, #00ff80, #00bfff, #8000ff, #ff0080)",
            backgroundSize: "300% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Layer 3: Inner gold/platinum/purple border */}
      <div
        className={cn(
          "absolute -inset-[1px] bg-gradient-to-br pointer-events-none",
          innerBorderGradient,
          roundedClass
        )}
      />

      {/* Layer 4: Sparkle particles */}
      {showSparkles && <SparkleParticles count={5} />}

      {/* Content container */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-gray-950 via-black to-gray-950 overflow-hidden",
          innerRoundedClass,
          contentClassName
        )}
      >
        {/* Holographic sweeps */}
        {showHolographic && <HolographicSweeps />}

        {/* Shimmer on hover */}
        <ShimmerEffect variant={variant} />

        {/* Actual content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

// Export a simpler version for feature cards (silver glow on hover)
export function FeatureCard({
  children,
  className,
  variant = "gold",
}: {
  children: ReactNode;
  className?: string;
  variant?: "gold" | "purple" | "emerald" | "blue";
}) {
  const glowColor = {
    gold: "from-yellow-400/50 via-amber-400/50 to-yellow-400/50",
    purple: "from-purple-400/50 via-pink-400/50 to-purple-400/50",
    emerald: "from-emerald-400/50 via-teal-400/50 to-emerald-400/50",
    blue: "from-blue-400/50 via-cyan-400/50 to-blue-400/50",
  }[variant];

  const hoverBorder = {
    gold: "group-hover:border-[var(--gold)]/50",
    purple: "group-hover:border-purple-500/50",
    emerald: "group-hover:border-emerald-500/50",
    blue: "group-hover:border-blue-500/50",
  }[variant];

  return (
    <div className="relative group">
      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm bg-gradient-to-r pointer-events-none",
          glowColor
        )}
      />

      {/* Card content */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 transition-all overflow-hidden",
          hoverBorder,
          className
        )}
      >
        {/* Shimmer on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

        {children}
      </div>
    </div>
  );
}

// Export a premium badge component
export function PremiumBadge({
  children,
  variant = "gold",
  pulse = true,
  className,
}: {
  children: ReactNode;
  variant?: "gold" | "purple" | "emerald" | "red";
  pulse?: boolean;
  className?: string;
}) {
  const bgColor = {
    gold: "from-yellow-300 via-yellow-400 to-amber-500",
    purple: "from-purple-400 via-pink-400 to-purple-500",
    emerald: "from-emerald-400 via-teal-400 to-emerald-500",
    red: "from-red-400 via-rose-400 to-red-500",
  }[variant];

  const glowColor = {
    gold: "from-yellow-400 to-amber-500",
    purple: "from-purple-400 to-pink-500",
    emerald: "from-emerald-400 to-teal-500",
    red: "from-red-400 to-rose-500",
  }[variant];

  const textColor = variant === "gold" ? "text-black" : "text-white";

  return (
    <motion.div
      className="relative"
      animate={pulse ? { y: [0, -2, 0] } : undefined}
      transition={pulse ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {/* Badge glow */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r rounded-full blur-md opacity-60 pointer-events-none",
          glowColor
        )}
      />
      <div
        className={cn(
          "relative flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r text-xs font-bold shadow-xl",
          bgColor,
          textColor,
          className
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
