"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Crown,
  Coins,
  MessageCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Plus,
  Image,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Bell,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { RecentMessagesWidget } from "@/components/dashboard/RecentMessagesWidget";

interface Creator {
  slug: string;
  displayName: string;
  avatar: string | null;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  creatorSlug: string;
  creator: Creator | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface DashboardData {
  creditBalance: number;
  userName: string;
  subscriptions: Subscription[];
  recentTransactions: Transaction[];
  unreadMessages: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isCreator = (session?.user as any)?.isCreator === true;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE: "Credit Purchase",
      SUBSCRIPTION: "Subscription",
      SUBSCRIPTION_BONUS: "Bonus Credits",
      MEDIA_UNLOCK: "Media Unlock",
      TIP: "Tip",
      PPV: "PPV Unlock",
      ADMIN_GRANT: "Admin Grant",
      RECURRING_GRANT: "Monthly Credits",
      EXPIRATION: "Expired",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          Welcome, {data?.userName?.split(" ")[0] || session?.user?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-gray-400">Manage your account and subscriptions</p>
      </motion.div>

      {/* Credit Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent border-[var(--gold)]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Your Balance</p>
              <div className="flex items-baseline gap-2">
                <Coins className="w-6 h-6 text-[var(--gold)]" />
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {formatCredits(data?.creditBalance || 0)}
                </span>
                <span className="text-gray-400 text-sm">credits</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                = ${((data?.creditBalance || 0) / 100).toFixed(2)} USD
              </p>
            </div>
            <Link href="/credits">
              <Button variant="premium" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Buy Credits</span>
                <span className="sm:hidden">Buy</span>
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        <Link href="/miacosta/gallery">
          <Card className="p-4 hover:border-[var(--gold)]/50 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-300">Gallery</span>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/messages">
          <Card className="p-4 hover:border-[var(--gold)]/50 transition-colors cursor-pointer h-full relative">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                {(data?.unreadMessages || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {data?.unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-300">Messages</span>
            </div>
          </Card>
        </Link>
        <Link href="/miacosta/membership">
          <Card className="p-4 hover:border-[var(--gold)]/50 transition-colors cursor-pointer h-full">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <span className="text-sm text-gray-300">Subscribe</span>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Recent Messages Widget */}
      <RecentMessagesWidget />

      {/* Active Subscriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Active Subscriptions</h2>
          <Link href="/dashboard/subscription">
            <Button variant="ghost" size="sm" className="gap-1 text-sm text-gray-400">
              Manage
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {!data?.subscriptions || data.subscriptions.length === 0 ? (
          <Card className="p-6 text-center">
            <Crown className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No active subscriptions</p>
            <Link href="/miacosta/membership">
              <Button variant="premium" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Subscribe Now
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.subscriptions.map((sub) => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center gap-4">
                  {sub.creator?.avatar ? (
                    <img
                      src={sub.creator.avatar}
                      alt={sub.creator.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[var(--gold)]/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                      <span className="text-black font-bold text-lg">
                        {sub.creator?.displayName?.[0] || "C"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">
                        {sub.creator?.displayName || sub.creatorSlug}
                      </p>
                      <Badge
                        className={`text-[10px] ${
                          sub.planId === "VIP"
                            ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {sub.planId}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Renews {formatDate(sub.currentPeriodEnd)}</span>
                    </div>
                  </div>
                  <Link href={`/${sub.creatorSlug}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>

        {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
          <Card className="p-6 text-center">
            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No recent activity</p>
          </Card>
        ) : (
          <Card className="divide-y divide-white/5">
            {data.recentTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  {getTransactionIcon(tx.type, tx.amount)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {tx.description || getTransactionLabel(tx.type)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}{formatCredits(tx.amount)}
                </span>
              </div>
            ))}
          </Card>
        )}
      </motion.div>

      {/* Become Creator CTA */}
      {!isCreator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[var(--gold)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-0.5">Become a Creator</h3>
                <p className="text-sm text-gray-400 truncate">
                  Start earning from your content
                </p>
              </div>
              <Link href="/dashboard/become-creator">
                <Button variant="premium" size="sm" className="gap-1 whitespace-nowrap">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
