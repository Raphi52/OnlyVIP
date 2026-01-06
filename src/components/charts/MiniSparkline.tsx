"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showGlow?: boolean;
  animate?: boolean;
  className?: string;
}

export function MiniSparkline({
  data,
  color = "#FACC15",
  width = 80,
  height = 32,
  strokeWidth = 2,
  showGlow = true,
  animate = true,
  className,
}: MiniSparklineProps) {
  const path = useMemo(() => {
    if (!data.length) return "";

    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!data.length) return "";

    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
      return `${x},${y}`;
    });

    const startX = padding;
    const endX = padding + effectiveWidth;
    const bottomY = height - padding;

    return `M ${startX},${bottomY} L ${points.join(" L ")} L ${endX},${bottomY} Z`;
  }, [data, width, height]);

  if (!data.length) {
    return (
      <div
        className={className}
        style={{ width, height }}
      >
        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
          No data
        </div>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Area gradient */}
        <linearGradient id={`sparkline-gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>

        {/* Glow filter */}
        {showGlow && (
          <filter id={`sparkline-glow-${color.replace("#", "")}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#sparkline-gradient-${color.replace("#", "")})`}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={showGlow ? `url(#sparkline-glow-${color.replace("#", "")})` : undefined}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* End dot */}
      <motion.circle
        cx={width - 2}
        cy={
          2 +
          (height - 4) -
          ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) *
            (height - 4)
        }
        r={3}
        fill={color}
        initial={animate ? { scale: 0, opacity: 0 } : undefined}
        animate={animate ? { scale: 1, opacity: 1 } : undefined}
        transition={{ delay: 0.8, duration: 0.3 }}
        style={
          showGlow
            ? {
                filter: `drop-shadow(0 0 4px ${color})`,
              }
            : undefined
        }
      />
    </svg>
  );
}
