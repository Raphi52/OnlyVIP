"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Crown,
  Coins,
  MessageCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { RecentMessagesWidget } from "@/components/dashboard/RecentMessagesWidget";

interface Creator {
  slug: string;
  displayName: string;
  avatar: string | null;
  userId: string;
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
  paidCredits: number;
  bonusCredits: number;
  userName: string;
  subscriptions: Subscription[];
  recentTransactions: Transaction[];
  unreadMessages: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("dashboard");

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

    if (status === "loading") return;

    if (session?.user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

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
    const labelKeys: Record<string, string> = {
      PURCHASE: "transactions.creditPurchase",
      PURCHASE_BONUS: "transactions.bonusCredits",
      SUBSCRIPTION: "transactions.subscription",
      SUBSCRIPTION_BONUS: "transactions.bonusCredits",
      MEDIA_UNLOCK: "transactions.mediaUnlock",
      TIP: "transactions.tip",
      PPV: "transactions.ppvUnlock",
      ADMIN_GRANT: "transactions.creditPurchase",
      RECURRING_GRANT: "transactions.bonusCredits",
      EXPIRATION: "status.expired",
    };
    const key = labelKeys[type];
    return key ? t(key) : type;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="px-3 pt-20 pb-6 sm:px-6 sm:pt-20 lg:px-8 lg:pt-8 space-y-4 sm:space-y-6 max-w-3xl mx-auto lg:max-w-none overflow-x-hidden">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5">
          {t("user.welcome", { name: data?.userName?.split(" ")[0] || session?.user?.name?.split(" ")[0] || "there" })}
        </h1>
        <p className="text-sm sm:text-base text-gray-400">{t("user.title")}</p>
      </motion.div>

      {/* Credit Balance Card - Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        {/* Animated glow border */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 opacity-60 blur-sm"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ backgroundSize: '200% 100%', animation: 'gradient-flow 3s linear infinite' }}
        />

        <Card className="relative p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-yellow-500/30 overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="flex items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">{t("user.yourBalance")}</p>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Coin icon with glow */}
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                  animate={{ boxShadow: ["0 0 15px rgba(250,204,21,0.3)", "0 0 25px rgba(250,204,21,0.5)", "0 0 15px rgba(250,204,21,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </motion.div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                    {formatCredits(data?.creditBalance || 0)}
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm ml-1.5">{t("billing.credits")}</span>
                </div>
              </div>
              {/* Show breakdown of paid vs bonus credits */}
              <div className="flex items-center gap-2 sm:gap-3 mt-3 text-[10px] sm:text-xs flex-wrap">
                <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-full">
                  <motion.div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-yellow-400 font-medium">{formatCredits(data?.paidCredits || 0)} {t("user.paid")}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-500/10 px-2 py-1 rounded-full border border-slate-400/20">
                  <motion.div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-gray-300 to-slate-400"
                    animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 2px rgba(203,213,225,0.4)", "0 0 6px rgba(226,232,240,0.8)", "0 0 2px rgba(203,213,225,0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <span className="bg-gradient-to-r from-gray-200 via-slate-300 to-gray-200 bg-clip-text text-transparent font-medium">{formatCredits(data?.bonusCredits || 0)} {t("user.bonus")}</span>
                </div>
              </div>
            </div>
            <Link href="/credits" className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Button glow */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 blur-md"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <Button className="relative gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-xs sm:text-sm bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold border-0 shadow-lg shadow-yellow-500/30 whitespace-nowrap">
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{t("billing.buyCredits")}</span>
                  <span className="sm:hidden">Crédits</span>
                </Button>
              </motion.div>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Recent Messages Widget */}
      <RecentMessagesWidget />

      {/* Active Subscriptions - Premium Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{t("user.activeSubscriptions")}</h2>
          <Link href="/dashboard/subscription">
            <motion.div whileHover={{ x: 3 }} className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-yellow-400 transition-colors px-2 sm:px-3">
              {t("user.manage")}
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.div>
          </Link>
        </div>

        {!data?.subscriptions || data.subscriptions.length === 0 ? (
          <motion.div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/30 to-yellow-400/30 opacity-50 blur-sm" />
            <Card className="relative p-4 sm:p-6 text-center bg-gradient-to-br from-gray-900 via-black to-gray-900 border-yellow-500/20 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/3 to-transparent" />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500/50 mx-auto mb-2 sm:mb-3 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]" />
              </motion.div>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">{t("user.noSubscriptions")}</p>
              <Link href="/creators">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block relative">
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 blur-md"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <Button className="relative gap-2 text-sm bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold border-0">
                    <Sparkles className="w-4 h-4" />
                    {t("subscriptions.subscribe")}
                  </Button>
                </motion.div>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {data.subscriptions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                {/* Subtle hover glow */}
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-yellow-400/0 via-amber-500/0 to-yellow-400/0 group-hover:from-yellow-400/30 group-hover:via-amber-500/30 group-hover:to-yellow-400/30 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300" />
                <Card className="relative p-3 sm:p-4 bg-gradient-to-br from-gray-900/80 to-black border-white/5 group-hover:border-yellow-500/30 transition-all overflow-hidden">
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/3 to-transparent" />
                  <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                    {sub.creator?.avatar ? (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative flex-shrink-0"
                      >
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 opacity-50 blur-sm" />
                        <img
                          src={sub.creator.avatar}
                          alt={sub.creator.displayName}
                          className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-yellow-500/50"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/30"
                      >
                        <span className="text-black font-bold text-base sm:text-lg">
                          {sub.creator?.displayName?.[0] || "C"}
                        </span>
                      </motion.div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm sm:text-base truncate">
                          {sub.creator?.displayName || sub.creatorSlug}
                        </p>
                        <Badge
                          className={`text-[9px] sm:text-[10px] px-1.5 ${
                            sub.planId === "VIP"
                              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {sub.planId === "VIP" && <Crown className="w-2.5 h-2.5 mr-0.5 inline" />}
                          {sub.planId}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Renews {formatDate(sub.currentPeriodEnd)}</span>
                      </div>
                    </div>
                    <Link href={sub.creator?.userId ? `/dashboard/messages?user=${sub.creator.userId}` : `/${sub.creatorSlug}`} className="flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 hover:from-yellow-400/30 hover:to-amber-500/30 border border-yellow-500/30 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity - Premium Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{t("user.recentActivity")}</h2>
        </div>

        {!data?.recentTransactions || data.recentTransactions.length === 0 ? (
          <motion.div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-600/20 blur-sm" />
            <Card className="relative p-4 sm:p-6 text-center bg-gradient-to-br from-gray-900 via-black to-gray-900 border-white/5 overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-2 sm:mb-3" />
              </motion.div>
              <p className="text-sm sm:text-base text-gray-400">{t("user.noActivity")}</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div className="relative group">
            {/* Subtle ambient glow */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/10 via-yellow-500/10 to-emerald-500/10 blur-sm opacity-50" />
            <Card className="relative bg-gradient-to-br from-gray-900/90 via-black to-gray-900/90 border-white/5 overflow-hidden divide-y divide-white/5">
              {data.recentTransactions.slice(0, 5).map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 group/item hover:bg-white/[0.02] transition-colors"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.amount > 0
                        ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 shadow-lg shadow-emerald-500/10"
                        : "bg-gradient-to-br from-red-500/20 to-pink-500/20 shadow-lg shadow-red-500/10"
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-white truncate group-hover/item:text-gray-100">
                      {tx.description || getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    className={`text-xs sm:text-sm font-bold flex-shrink-0 ${
                      tx.amount > 0
                        ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                        : "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}{formatCredits(tx.amount)}
                  </motion.span>
                </motion.div>
              ))}
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Become Creator CTA - Premium Style */}
      {!isCreator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          {/* Animated border glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 via-orange-500 to-yellow-400 opacity-60 blur-sm"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ backgroundSize: '200% 100%', animation: 'gradient-flow 3s linear infinite' }}
          />
          <Card className="relative p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-yellow-500/30 overflow-hidden">
            {/* Background sparkle effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-2 left-[10%] w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
              <div className="absolute top-4 left-[30%] w-0.5 h-0.5 bg-amber-400 rounded-full animate-pulse delay-300" />
              <div className="absolute bottom-3 right-[20%] w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-500" />
              <div className="absolute top-3 right-[15%] w-0.5 h-0.5 bg-orange-400 rounded-full animate-pulse delay-700" />
            </div>
            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent" />

            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/40"
                animate={{
                  boxShadow: [
                    "0 0 15px rgba(250,204,21,0.4)",
                    "0 0 25px rgba(250,204,21,0.6)",
                    "0 0 15px rgba(250,204,21,0.4)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent mb-0.5">{t("sidebar.becomeCreator")}</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">
                  {t("creator.addNewContent")}
                </p>
              </div>
              <Link href="/dashboard/become-creator" className="flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 blur-md"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <Button className="relative gap-1 whitespace-nowrap px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold border-0 text-sm">
                    <Crown className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("common.create")}</span>
                    <span className="sm:hidden">{t("common.create")}</span>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
