"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Bot,
  MessageCircle,
  DollarSign,
  TrendingUp,
  FileText,
  Loader2,
  Plus,
  Crown,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
  slug: string;
  aiEnabled: boolean;
  creators: {
    slug: string;
    name: string;
    displayName: string;
    avatar: string | null;
  }[];
  stats: {
    totalRevenue: number;
    revenue30d: number;
    chatterRevenue30d: number;
    aiRevenue30d: number;
    creatorsCount: number;
    chattersCount: number;
    aiPersonalitiesCount: number;
    scriptsCount: number;
  };
}

export default function AgencyDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard/become-agency");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const res = await fetch("/api/agency");
        if (res.ok) {
          const data = await res.json();
          setAgencies(data.agencies || []);
          if (data.agencies?.length > 0) {
            setSelectedAgency(data.agencies[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching agencies:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchAgencies();
    }
  }, [status, isAgencyOwner]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!selectedAgency) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-12 h-12 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
            No agency found
          </h2>
          <p className="text-[var(--muted)] mb-8">
            Something went wrong. Please try again.
          </p>
          <Button variant="default" onClick={() => router.push("/dashboard/become-agency")}>
            Create Agency
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Revenue (30d)",
      value: formatCurrency(selectedAgency.stats.revenue30d),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "from-emerald-500/20 to-emerald-700/20",
    },
    {
      label: "Chatter Revenue",
      value: formatCurrency(selectedAgency.stats.chatterRevenue30d),
      icon: MessageCircle,
      color: "text-blue-400",
      bg: "from-blue-500/20 to-blue-700/20",
    },
    {
      label: "AI Revenue",
      value: formatCurrency(selectedAgency.stats.aiRevenue30d),
      icon: Bot,
      color: "text-purple-400",
      bg: "from-purple-500/20 to-purple-700/20",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(selectedAgency.stats.totalRevenue),
      icon: TrendingUp,
      color: "text-[var(--gold)]",
      bg: "from-[var(--gold)]/20 to-yellow-700/20",
    },
  ];

  const quickLinks = [
    {
      href: "/dashboard/agency/chatters",
      icon: Users,
      label: "Chatters",
      count: selectedAgency.stats.chattersCount,
      color: "text-blue-400",
    },
    {
      href: "/dashboard/agency/ai-personas",
      icon: Bot,
      label: "AI Personalities",
      count: selectedAgency.stats.aiPersonalitiesCount,
      color: "text-purple-400",
      disabled: !selectedAgency.aiEnabled,
    },
    {
      href: "/dashboard/agency/scripts",
      icon: FileText,
      label: "Scripts",
      count: selectedAgency.stats.scriptsCount,
      color: "text-emerald-400",
    },
    {
      href: "/dashboard/agency/performance",
      icon: BarChart3,
      label: "Performance",
      count: null,
      color: "text-[var(--gold)]",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              {selectedAgency.name}
            </h1>
            <p className="text-[var(--muted)]">
              Agency Dashboard
            </p>
          </div>
        </div>
        {!selectedAgency.aiEnabled && (
          <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            AI features disabled - Contact admin
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, index) => (
          <Card key={index} variant="default" className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.disabled ? "#" : link.href}
            className={cn(
              link.disabled && "pointer-events-none opacity-50"
            )}
          >
            <Card variant="default" className="p-5 hover:border-purple-500/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <link.icon className={cn("w-6 h-6", link.color)} />
                <ArrowUpRight className="w-4 h-4 text-[var(--muted)] group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="font-semibold text-[var(--foreground)]">{link.label}</p>
              {link.count !== null && (
                <p className="text-sm text-[var(--muted)]">{link.count}</p>
              )}
              {link.disabled && (
                <p className="text-xs text-yellow-400 mt-1">Requires AI access</p>
              )}
            </Card>
          </Link>
        ))}
      </motion.div>

      {/* Creators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="default" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--gold)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Creators ({selectedAgency.stats.creatorsCount})
              </h2>
            </div>
            <Link href="/dashboard/admin/creators">
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Creator
              </Button>
            </Link>
          </div>

          {selectedAgency.creators.length === 0 ? (
            <div className="text-center py-10">
              <Crown className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-[var(--muted)]">No creators in this agency yet</p>
              <p className="text-sm text-[var(--muted)]">
                Add creators from the admin panel
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedAgency.creators.map((creator) => (
                <Link
                  key={creator.slug}
                  href={`/${creator.slug}`}
                  target="_blank"
                  className="group"
                >
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[var(--gold)]/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                          <span className="text-black font-bold">
                            {creator.displayName?.[0] || "C"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          @{creator.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
