"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Crown,
  DollarSign,
  Image,
  TrendingUp,
  Loader2,
  Globe,
  MessageSquare,
  Eye,
} from "lucide-react";

interface SiteStats {
  totalUsers: number;
  totalCreators: number;
  totalRevenue: number;
  totalMedia: number;
  totalMessages: number;
  totalPageViews: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchStats();
  }, [session, status, isAdmin, router]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/site-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statsDisplay = [
    {
      label: "Total Users",
      value: stats?.totalUsers?.toString() || "0",
      icon: Users,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-blue-500/5",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Creators",
      value: stats?.totalCreators?.toString() || "0",
      icon: Crown,
      color: "text-[var(--gold)]",
      bgColor: "from-[var(--gold)]/20 to-[var(--gold)]/5",
      borderColor: "border-[var(--gold)]/20",
    },
    {
      label: "Total Revenue",
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Total Media",
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
      color: "text-pink-400",
      bgColor: "from-pink-500/20 to-pink-500/5",
      borderColor: "border-pink-500/20",
    },
    {
      label: "Page Views",
      value: stats?.totalPageViews?.toLocaleString() || "0",
      icon: Eye,
      color: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-cyan-500/5",
      borderColor: "border-cyan-500/20",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Site-wide metrics and configuration</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <a
          href="/dashboard/admin/creators"
          className="p-6 rounded-2xl bg-[#111] border border-white/10 hover:border-[var(--gold)]/30 transition-all group"
        >
          <Crown className="w-8 h-8 text-[var(--gold)] mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Manage Creators</h3>
          <p className="text-gray-500 text-sm">View and manage all creator profiles</p>
        </a>
        <a
          href="/dashboard/admin/users"
          className="p-6 rounded-2xl bg-[#111] border border-white/10 hover:border-blue-500/30 transition-all group"
        >
          <Users className="w-8 h-8 text-blue-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Manage Users</h3>
          <p className="text-gray-500 text-sm">View all registered users</p>
        </a>
        <a
          href="/dashboard/admin/settings"
          className="p-6 rounded-2xl bg-[#111] border border-white/10 hover:border-purple-500/30 transition-all group"
        >
          <Globe className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Site Settings</h3>
          <p className="text-gray-500 text-sm">Configure global settings</p>
        </a>
      </motion.div>
    </div>
  );
}
