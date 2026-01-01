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
  Plus,
  Settings,
  BarChart3,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    if (!selectedCreator || isRefreshing) return;
    setIsRefreshing(true);
    await fetchStats(selectedCreator.slug);
    setIsRefreshing(false);
  };

  const handleSelectCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    fetchStats(creator.slug);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  if (creators.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Creator Profiles</h2>
          <p className="text-sm text-gray-400">You don't have any creator profiles yet.</p>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    {
      label: "Revenue",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Subscribers",
      value: stats?.activeSubscribers?.toString() || "0",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "Media",
      value: stats?.totalMedia?.toString() || "0",
      icon: Image,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "Messages",
      value: stats?.totalMessages?.toLocaleString() || "0",
      icon: MessageSquare,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
    },
  ];

  const quickActions = [
    { label: "Upload Media", icon: Plus, href: "/dashboard/creator/media", gradient: "from-purple-600 to-pink-600" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/creator/analytics", gradient: "from-blue-600 to-cyan-600" },
    { label: "Earnings", icon: Wallet, href: "/dashboard/creator/earnings", gradient: "from-emerald-600 to-teal-600" },
    { label: "Settings", icon: Settings, href: "/dashboard/creator/settings", gradient: "from-orange-600 to-red-600" },
  ];

  return (
    <div className="p-4 pt-20 pb-24 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      {/* Creator Selector (if multiple) */}
      {creators.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <p className="text-xs text-gray-500 mb-2">Select profile</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {creators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => handleSelectCreator(creator)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all flex-shrink-0",
                  selectedCreator?.id === creator.id
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <div className="w-6 h-6 rounded-lg overflow-hidden">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-500/30 flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-xs">
                        {creator.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{creator.displayName}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Creator Header - Mobile Optimized */}
      {selectedCreator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            {/* Cover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent" />

            <div className="relative p-4 sm:p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-xl shadow-purple-500/10">
                    {selectedCreator.avatar ? (
                      <img
                        src={selectedCreator.avatar}
                        alt={selectedCreator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                        {selectedCreator.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center border-2 border-black">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                      {selectedCreator.displayName}
                    </h1>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">@{selectedCreator.slug}</p>

                  {/* Quick stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {selectedCreator.stats?.photos || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      {selectedCreator.stats?.videos || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {selectedCreator.stats?.subscribers || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  </motion.button>
                  <Link
                    href={`/${selectedCreator.slug}`}
                    target="_blank"
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - 2x2 on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
                {stat.value}
              </h3>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg",
                  action.gradient
                )}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Upload CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative rounded-2xl overflow-hidden">
          {/* Glow effect */}
          <div className="absolute -inset-[1px] rounded-2xl blur-sm bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30" />

          <div className="relative bg-[#0a0a0c]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                  Ready to upload?
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">
                  Add new content for your subscribers
                </p>
              </div>
              <Link href="/dashboard/creator/media" className="flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Upload</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      {recentPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">Recent Payments</h2>
            <Link href="/dashboard/creator/earnings" className="text-xs text-purple-400">
              View all
            </Link>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl divide-y divide-white/5">
            {recentPayments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{payment.type}</p>
                  <p className="text-xs text-gray-500">{payment.provider}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  +${payment.amount}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
