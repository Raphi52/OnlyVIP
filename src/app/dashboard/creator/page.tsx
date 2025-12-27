"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  DollarSign,
  Users,
  Image,
  MessageSquare,
  TrendingUp,
  Loader2,
  RefreshCw,
  Camera,
  Film,
  ExternalLink,
  Sparkles,
  CreditCard,
  Bitcoin,
  Plus,
} from "lucide-react";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar?: string;
  coverImage?: string;
  stats?: {
    photos: number;
    videos: number;
    subscribers: number;
  };
}

interface Stats {
  totalRevenue: number;
  activeSubscribers: number;
  totalMedia: number;
  totalMessages: number;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  provider: string;
  createdAt: string;
}

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCreator = (session?.user as any)?.isCreator === true;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isCreator) {
      router.push("/dashboard");
      return;
    }
    fetchCreators();
  }, [session, status, isCreator, router]);

  const fetchCreators = async () => {
    try {
      const res = await fetch("/api/creator/my-profiles");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        if (data.creators?.length > 0) {
          setSelectedCreator(data.creators[0]);
          fetchStats(data.creators[0].slug);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setIsLoading(false);
    }
  };

  const fetchStats = async (creatorSlug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?creator=${creatorSlug}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentPayments(data.recentPayments || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    fetchStats(creator.slug);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[var(--gold)] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading creator dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  if (creators.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Crown className="w-16 h-16 text-[var(--gold)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Creator Profiles</h2>
          <p className="text-gray-400 mb-6">You don't have any creator profiles yet.</p>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    {
      label: "Total Revenue",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Active Subscribers",
      value: stats?.activeSubscribers?.toString() || "0",
      icon: Users,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-blue-500/5",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Media Items",
      value: stats?.totalMedia?.toString() || "0",
      icon: Image,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-purple-500/5",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Messages",
      value: stats?.totalMessages?.toLocaleString() || "0",
      icon: MessageSquare,
      color: "text-[var(--gold)]",
      bgColor: "from-[var(--gold)]/20 to-[var(--gold)]/5",
      borderColor: "border-[var(--gold)]/20",
    },
  ];

  return (
    <div className="p-8">
      {/* Creator Selector (if multiple) */}
      {creators.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-sm text-gray-400 mb-2">Select a profile:</p>
          <div className="flex gap-3 flex-wrap">
            {creators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => handleSelectCreator(creator)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
                  selectedCreator?.id === creator.id
                    ? "bg-[var(--gold)]/20 border-[var(--gold)]/50 text-[var(--gold)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--gold)]/20 flex items-center justify-center">
                      <span className="text-[var(--gold)] font-bold text-sm">
                        {creator.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-medium">{creator.displayName}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Creator Header */}
      {selectedCreator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10">
            <div className="absolute inset-0">
              {selectedCreator.coverImage && (
                <img
                  src={selectedCreator.coverImage}
                  alt=""
                  className="w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            <div className="relative p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--gold)]/30 shadow-xl">
                {selectedCreator.avatar ? (
                  <img
                    src={selectedCreator.avatar}
                    alt={selectedCreator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-black text-2xl font-bold">
                    {selectedCreator.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">
                    {selectedCreator.displayName}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] text-xs font-semibold">
                    Creator
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">@{selectedCreator.slug}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Camera className="w-4 h-4" />
                    <span>{selectedCreator.stats?.photos || 0} photos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Film className="w-4 h-4" />
                    <span>{selectedCreator.stats?.videos || 0} videos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{selectedCreator.stats?.subscribers || 0} subscribers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/${selectedCreator.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Page
                </Link>
                <button
                  onClick={() => fetchStats(selectedCreator.slug)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`relative p-5 rounded-2xl bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} overflow-hidden`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-black/30">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative rounded-2xl overflow-hidden border border-[var(--gold)]/20 bg-gradient-to-r from-[var(--gold)]/10 to-transparent p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gold)]/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center shadow-lg shadow-[var(--gold)]/20">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                Ready to upload new content?
              </h3>
              <p className="text-gray-400">
                Add photos, videos, or exclusive packs for your subscribers.
              </p>
            </div>
            <Link
              href="/dashboard/creator/media"
              className="px-6 py-3 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Upload Media
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
