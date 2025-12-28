"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui";

interface FollowButtonProps {
  creatorSlug: string;
  variant?: "default" | "compact";
  className?: string;
}

export function FollowButton({ creatorSlug, variant = "default", className = "" }: FollowButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setIsLoading(false);
      return;
    }

    // Check follow status
    fetch(`/api/creators/${creatorSlug}/follow`)
      .then((res) => res.json())
      .then((data) => {
        setIsFollowing(data.following);
        setIsVip(data.isVip);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [session, status, creatorSlug]);

  const handleFollow = async () => {
    if (!session) {
      router.push(`/${creatorSlug}/auth/login?redirect=/${creatorSlug}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/creators/${creatorSlug}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <motion.button
        onClick={handleFollow}
        disabled={isSubmitting || isVip}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          isFollowing
            ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
            : "bg-white/10 text-white border border-white/20 hover:border-[var(--gold)]/50"
        } ${className}`}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <Check className="w-4 h-4" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isVip ? "VIP" : isFollowing ? "Following" : "Follow"}
        </span>
      </motion.button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "gold-outline" : "outline"}
      onClick={handleFollow}
      disabled={isSubmitting || isVip}
      className={`gap-2 ${className}`}
    >
      {isSubmitting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <Check className="w-4 h-4" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      {isVip ? "VIP Member" : isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
