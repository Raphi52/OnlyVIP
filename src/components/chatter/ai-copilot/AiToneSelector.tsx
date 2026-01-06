"use client";

import { cn } from "@/lib/utils";
import { Heart, Sparkles, Flame, Coffee, Star } from "lucide-react";

export type AiTone = "flirty" | "romantic" | "playful" | "explicit" | "casual";

const TONES: Array<{
  value: AiTone;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = [
  {
    value: "flirty",
    label: "Flirty",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-pink-400 bg-pink-500/20 border-pink-500/30",
    description: "Teasing and playful",
  },
  {
    value: "romantic",
    label: "Romantic",
    icon: <Heart className="w-4 h-4" />,
    color: "text-red-400 bg-red-500/20 border-red-500/30",
    description: "Sweet and affectionate",
  },
  {
    value: "playful",
    label: "Playful",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    description: "Fun and energetic",
  },
  {
    value: "explicit",
    label: "Explicit",
    icon: <Flame className="w-4 h-4" />,
    color: "text-orange-400 bg-orange-500/20 border-orange-500/30",
    description: "Direct and bold",
  },
  {
    value: "casual",
    label: "Casual",
    icon: <Coffee className="w-4 h-4" />,
    color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    description: "Relaxed and friendly",
  },
];

interface AiToneSelectorProps {
  value: AiTone;
  onChange: (tone: AiTone) => void;
  disabled?: boolean;
  variant?: "buttons" | "dropdown";
  className?: string;
}

export default function AiToneSelector({
  value,
  onChange,
  disabled = false,
  variant = "buttons",
  className,
}: AiToneSelectorProps) {
  if (variant === "dropdown") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AiTone)}
        disabled={disabled}
        className={cn(
          "px-3 py-2 rounded-lg bg-[--surface-elevated] border border-[--border]",
          "text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {TONES.map((tone) => (
          <option key={tone.value} value={tone.value}>
            {tone.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {TONES.map((tone) => {
        const isSelected = value === tone.value;
        return (
          <button
            key={tone.value}
            onClick={() => onChange(tone.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
              "text-xs font-medium",
              isSelected
                ? tone.color
                : "text-gray-400 bg-[--surface-elevated] border-[--border] hover:border-gray-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={tone.description}
          >
            {tone.icon}
            {tone.label}
          </button>
        );
      })}
    </div>
  );
}

// Compact version for tight spaces
export function AiTonePill({
  value,
  onClick,
  className,
}: {
  value: AiTone;
  onClick?: () => void;
  className?: string;
}) {
  const tone = TONES.find((t) => t.value === value) || TONES[0];

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
        tone.color,
        className
      )}
    >
      {tone.icon}
      {tone.label}
    </button>
  );
}
