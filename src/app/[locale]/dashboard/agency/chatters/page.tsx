"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  X,
  Loader2,
  DollarSign,
  MessageCircle,
  TrendingUp,
  Mail,
  User,
  Key,
  Settings,
  Trash2,
  Check,
  Clock,
  Search,
  Trophy,
  Activity,
  LayoutGrid,
  ChevronDown,
  Copy,
  CheckCircle,
  Wallet,
  ShoppingCart,
  AlertTriangle,
  Eye,
  RefreshCw,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TimeSlot {
  start: string;
  end: string;
}

interface Schedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const DEFAULT_SCHEDULE: Schedule = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

interface Chatter {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  commissionEnabled: boolean;
  commissionRate: number;
  assignedCreators: { creatorSlug: string }[];
  schedule: Schedule | null;
  stats: {
    revenue30d: number;
    commission30d: number;
    sales30d: number;
    messages30d: number;
    conversations30d: number;
    conversionRate: number;
    messagesOutsideShift: number;
    outsideShiftPercent: number;
  };
  createdAt: string;
}

interface Agency {
  id: string;
  name: string;
  creators: { slug: string; displayName: string }[];
}

type TabId = "all" | "leaderboard" | "activity" | "coverage" | "monitoring";

// Monitoring types
interface Fan {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
}

interface LastMessage {
  id: string;
  text: string | null;
  isFromCreator: boolean;
  chatterName: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  creatorSlug: string;
  creator: { slug: string; displayName: string; avatar: string | null } | null;
  fan: Fan | null;
  lastMessage: LastMessage | null;
  messageCount: number;
  participatingChatters: { id: string; name: string; messageCount?: number }[];
  updatedAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  isFromCreator: boolean;
  isPPV: boolean;
  ppvPrice: number | null;
  isUnlocked: boolean;
  media: Array<{ id: string; type: string; url: string; previewUrl: string | null }>;
  sender: { id: string; name: string | null; image: string | null } | null;
  chatter: { id: string; name: string } | null;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  creatorSlug: string;
  creator: { slug: string; displayName: string; avatar: string | null } | null;
  fan: Fan | null;
  participatingChatters: { id: string; name: string; messageCount?: number }[];
  createdAt: string;
  updatedAt: string;
}
type SortBy = "revenue" | "messages" | "conversion" | "recent";
type FilterStatus = "all" | "active" | "inactive";

// Check if chatter is currently online based on schedule
function isChatterOnline(schedule: Schedule | null): boolean {
  if (!schedule) return false;
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[now.getDay()];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const todaySlots = schedule[dayName as keyof Schedule] || [];
  return todaySlots.some(slot => currentTime >= slot.start && currentTime <= slot.end);
}

// Get rank badge for leaderboard
function getRankBadge(rank: number) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-sm text-[var(--muted)] font-medium">{rank}</span>;
}

export default function ChattersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabId | null;

  // Data
  const [agency, setAgency] = useState<Agency | null>(null);
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State - initialize from URL param if present
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl && ["all", "leaderboard", "activity", "coverage", "monitoring"].includes(tabFromUrl) ? tabFromUrl : "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("revenue");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Chatter | null>(null);
  const [editingChatter, setEditingChatter] = useState<Chatter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formCommissionEnabled, setFormCommissionEnabled] = useState(false);
  const [formCommissionRate, setFormCommissionRate] = useState(10);
  const [formAssignedCreators, setFormAssignedCreators] = useState<string[]>([]);
  const [formSchedule, setFormSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  // Monitoring state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [monitoringSearch, setMonitoringSearch] = useState("");
  const [monitoringCreatorFilter, setMonitoringCreatorFilter] = useState<string | null>(null);
  const [monitoringChatterFilter, setMonitoringChatterFilter] = useState<string | null>(null);
  const [showMonitoringCreatorDropdown, setShowMonitoringCreatorDropdown] = useState(false);
  const [showMonitoringChatterDropdown, setShowMonitoringChatterDropdown] = useState(false);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  // Computed stats
  const aggregateStats = useMemo(() => ({
    totalChatters: chatters.length,
    activeChatters: chatters.filter(c => c.isActive).length,
    totalRevenue: chatters.reduce((sum, c) => sum + c.stats.revenue30d, 0),
    totalMessages: chatters.reduce((sum, c) => sum + c.stats.messages30d, 0),
    totalSales: chatters.reduce((sum, c) => sum + c.stats.sales30d, 0),
    avgConversion: chatters.length > 0
      ? chatters.reduce((sum, c) => sum + c.stats.conversionRate, 0) / chatters.length
      : 0,
    totalCommission: chatters.reduce((sum, c) => sum + c.stats.commission30d, 0),
  }), [chatters]);

  // Sorted and filtered chatters
  const sortedChatters = useMemo(() => {
    let filtered = [...chatters];

    if (filterStatus !== "all") {
      filtered = filtered.filter(c => filterStatus === "active" ? c.isActive : !c.isActive);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "revenue": return b.stats.revenue30d - a.stats.revenue30d;
        case "messages": return b.stats.messages30d - a.stats.messages30d;
        case "conversion": return b.stats.conversionRate - a.stats.conversionRate;
        case "recent": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });

    return filtered;
  }, [chatters, filterStatus, searchQuery, sortBy]);

  // Leaderboard (sorted by revenue)
  const leaderboard = useMemo(() => {
    return [...chatters].sort((a, b) => b.stats.revenue30d - a.stats.revenue30d);
  }, [chatters]);

  // Max stats for progress bars
  const maxStats = useMemo(() => ({
    revenue: Math.max(...chatters.map(c => c.stats.revenue30d), 1),
    messages: Math.max(...chatters.map(c => c.stats.messages30d), 1),
    sales: Math.max(...chatters.map(c => c.stats.sales30d), 1),
    conversion: Math.max(...chatters.map(c => c.stats.conversionRate), 1),
  }), [chatters]);

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const agencyRes = await fetch("/api/agency");
        if (agencyRes.ok) {
          const agencyData = await agencyRes.json();
          if (agencyData.agencies?.[0]) {
            const ag = agencyData.agencies[0];
            setAgency(ag);

            const chattersRes = await fetch(`/api/agency/chatters?agencyId=${ag.id}`);
            if (chattersRes.ok) {
              const chattersData = await chattersRes.json();
              setChatters(chattersData.chatters || []);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isAgencyOwner) {
      fetchData();
    }
  }, [status, isAgencyOwner]);

  const openCreateModal = () => {
    setEditingChatter(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormCommissionEnabled(false);
    setFormCommissionRate(10);
    setFormAssignedCreators([]);
    setFormSchedule(DEFAULT_SCHEDULE);
    setLastCreatedCredentials(null);
    setShowModal(true);
  };

  const openEditModal = (chatter: Chatter) => {
    setEditingChatter(chatter);
    setFormName(chatter.name);
    setFormEmail(chatter.email);
    setFormPassword("");
    setFormCommissionEnabled(chatter.commissionEnabled);
    setFormCommissionRate(chatter.commissionRate * 100);
    setFormAssignedCreators(chatter.assignedCreators.map(c => c.creatorSlug));
    setFormSchedule(chatter.schedule || DEFAULT_SCHEDULE);
    setLastCreatedCredentials(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency) return;

    setIsSaving(true);
    try {
      if (editingChatter) {
        const res = await fetch("/api/agency/chatters", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingChatter.id,
            name: formName,
            email: formEmail,
            password: formPassword || undefined,
            commissionEnabled: formCommissionEnabled,
            commissionRate: formCommissionRate / 100,
            assignedCreators: formAssignedCreators,
            schedule: formSchedule,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setChatters(prev => prev.map(c =>
            c.id === editingChatter.id
              ? { ...c, ...data.chatter, assignedCreators: formAssignedCreators.map(s => ({ creatorSlug: s })) }
              : c
          ));
          setShowModal(false);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to update chatter");
        }
      } else {
        const res = await fetch("/api/agency/chatters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyId: agency.id,
            name: formName,
            email: formEmail,
            password: formPassword,
            commissionEnabled: formCommissionEnabled,
            commissionRate: formCommissionRate / 100,
            assignedCreators: formAssignedCreators,
            schedule: formSchedule,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setChatters(prev => [...prev, { ...data.chatter, stats: { revenue30d: 0, commission30d: 0, sales30d: 0, messages30d: 0, conversations30d: 0, conversionRate: 0, messagesOutsideShift: 0, outsideShiftPercent: 0 } }]);
          setLastCreatedCredentials({ email: formEmail, password: formPassword });
        } else {
          const error = await res.json();
          alert(error.error || "Failed to create chatter");
        }
      }
    } catch (error) {
      console.error("Error saving chatter:", error);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (chatter: Chatter) => {
    try {
      const res = await fetch("/api/agency/chatters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chatter.id,
          isActive: !chatter.isActive,
        }),
      });

      if (res.ok) {
        setChatters(prev => prev.map(c =>
          c.id === chatter.id ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (error) {
      console.error("Error toggling chatter:", error);
    }
  };

  const deleteChatter = async (chatter: Chatter) => {
    if (!confirm(`Are you sure you want to delete ${chatter.name}?`)) return;

    try {
      const res = await fetch(`/api/agency/chatters?id=${chatter.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChatters(prev => prev.filter(c => c.id !== chatter.id));
        if (showDetailModal?.id === chatter.id) {
          setShowDetailModal(null);
        }
      }
    } catch (error) {
      console.error("Error deleting chatter:", error);
    }
  };

  const copyCredentials = () => {
    if (lastCreatedCredentials) {
      navigator.clipboard.writeText(`Email: ${lastCreatedCredentials.email}\nPassword: ${lastCreatedCredentials.password}`);
      setCopiedCredentials(true);
      setTimeout(() => setCopiedCredentials(false), 2000);
    }
  };

  const formatCredits = (amount: number) => {
    return `${Math.round(amount).toLocaleString()} credits`;
  };

  // Monitoring functions
  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const params = new URLSearchParams();
      if (monitoringCreatorFilter) params.set("creatorSlug", monitoringCreatorFilter);
      if (monitoringChatterFilter) params.set("chatterId", monitoringChatterFilter);
      if (monitoringSearch) params.set("search", monitoringSearch);

      const res = await fetch(`/api/agency/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/agency/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load conversations when monitoring tab is active
  useEffect(() => {
    if (activeTab === "monitoring" && conversations.length === 0 && !isLoadingConversations) {
      fetchConversations();
    }
  }, [activeTab]);

  const clearMonitoringFilters = () => {
    setMonitoringCreatorFilter(null);
    setMonitoringChatterFilter(null);
    setMonitoringSearch("");
  };

  const hasMonitoringFilters = monitoringCreatorFilter || monitoringChatterFilter || monitoringSearch;

  const tabs = [
    { id: "all" as TabId, label: "All Chatters", icon: Users, count: chatters.length },
    { id: "leaderboard" as TabId, label: "Leaderboard", icon: Trophy },
    { id: "activity" as TabId, label: "Activity", icon: Activity },
    { id: "coverage" as TabId, label: "Coverage", icon: LayoutGrid },
    { id: "monitoring" as TabId, label: "Monitoring", icon: Eye, count: conversations.length },
  ];

  const stats = [
    {
      label: "Chatters",
      value: `${aggregateStats.activeChatters}/${aggregateStats.totalChatters}`,
      subtext: "active",
      icon: Users,
      gradient: "from-purple-500/20 to-purple-700/20",
      color: "text-purple-400",
    },
    {
      label: "Revenue (30d)",
      value: formatCredits(aggregateStats.totalRevenue),
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-emerald-700/20",
      color: "text-emerald-400",
    },
    {
      label: "Messages (30d)",
      value: aggregateStats.totalMessages.toLocaleString(),
      icon: MessageCircle,
      gradient: "from-blue-500/20 to-blue-700/20",
      color: "text-blue-400",
    },
    {
      label: "Avg Conversion",
      value: `${aggregateStats.avgConversion.toFixed(1)}%`,
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-amber-700/20",
      color: "text-amber-400",
    },
    {
      label: "Commission",
      value: formatCredits(aggregateStats.totalCommission),
      subtext: "this month",
      icon: Wallet,
      gradient: "from-pink-500/20 to-pink-700/20",
      color: "text-pink-400",
    },
  ];

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 space-y-4 overflow-hidden max-w-[100vw] pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 min-w-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Chatters</h1>
            <p className="text-xs text-gray-400">{aggregateStats.activeChatters}/{aggregateStats.totalChatters} actifs</p>
          </div>
        </div>
        <Button
          variant="premium"
          onClick={openCreateModal}
          className="gap-1.5 text-sm px-4 py-2.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </motion.div>

      {/* Stats Cards - 2x2 grid on mobile with glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3"
      >
        {stats.slice(0, 4).map((stat, index) => (
          <div key={index} className="relative group">
            <div className={cn(
              "absolute -inset-[0.5px] rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br",
              stat.gradient.replace('/20', '/40')
            )} />
            <div className="relative p-3 sm:p-4 rounded-xl bg-[#0a0a0c]/90 border border-white/5 backdrop-blur-sm">
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                stat.gradient
              )}>
                <stat.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", stat.color)} />
              </div>
              <p className="text-sm sm:text-lg font-bold text-white truncate">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
        {/* 5th stat spans full width on mobile */}
        <div className="relative group col-span-2 lg:col-span-1">
          <div className="absolute -inset-[0.5px] rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br from-pink-500/40 to-pink-700/40" />
          <div className="relative p-3 sm:p-4 rounded-xl bg-[#0a0a0c]/90 border border-white/5 backdrop-blur-sm flex items-center gap-3 lg:block">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-700/20 flex items-center justify-center lg:mb-2">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-sm sm:text-lg font-bold text-white">{formatCredits(aggregateStats.totalCommission)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Commission (30d)</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs - Horizontal scroll pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95",
              activeTab === tab.id
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 active:bg-white/10"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.id === "all" ? "All" : tab.id === "leaderboard" ? "Top" : tab.id === "monitoring" ? "Chat" : tab.label.split(' ')[0]}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] text-center",
                activeTab === tab.id ? "bg-white/20" : "bg-white/10"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <div className="overflow-hidden min-w-0">
      <AnimatePresence mode="wait">
        {activeTab === "all" && (
          <motion.div
            key="all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Filters - Mobile optimized */}
            <div className="flex gap-2">
              {/* Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {(["all", "active", "inactive"] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap touch-manipulation",
                      filterStatus === status
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-white/5 text-gray-400 active:bg-white/10"
                    )}
                  >
                    {status === "all" ? "All" : status === "active" ? "Active" : "Off"}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative ml-auto flex-shrink-0">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 touch-manipulation"
                >
                  <TrendingUp className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                    {(["revenue", "messages", "conversion", "recent"] as SortBy[]).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => { setSortBy(sort); setShowSortDropdown(false); }}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-xs active:bg-white/10",
                          sortBy === sort ? "text-purple-400 bg-purple-500/10" : "text-gray-300"
                        )}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chatters List */}
            {sortedChatters.length === 0 ? (
              <Card className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
                  {chatters.length === 0 ? "No chatters yet" : "No results found"}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
                  {chatters.length === 0
                    ? "Add chatters to help manage messages"
                    : "Try adjusting your search or filters"}
                </p>
                {chatters.length === 0 && (
                  <Button variant="premium" onClick={openCreateModal} className="gap-1.5 sm:gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Add Chatter
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {sortedChatters.map((chatter, index) => {
                  const online = isChatterOnline(chatter.schedule);
                  const rank = leaderboard.findIndex(c => c.id === chatter.id) + 1;

                  return (
                    <motion.div
                      key={chatter.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className="p-3 sm:p-4 hover:border-purple-500/30 transition-colors cursor-pointer"
                        onClick={() => setShowDetailModal(chatter)}
                      >
                        <div className="flex flex-col gap-3 sm:gap-4">
                          {/* Top row */}
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            {/* Avatar with online indicator */}
                            <div className="relative">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">
                                  {chatter.name[0].toUpperCase()}
                                </span>
                              </div>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-[var(--background)]",
                                online && chatter.isActive ? "bg-emerald-500" : "bg-gray-500"
                              )} />
                              {rank <= 3 && (
                                <span className="absolute -top-1 -left-1 text-sm sm:text-xl">
                                  {getRankBadge(rank)}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                <h3 className="text-sm sm:text-base font-semibold text-white">{chatter.name}</h3>
                                <span className={cn(
                                  "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                                  chatter.isActive
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                )}>
                                  {chatter.isActive ? "Active" : "Inactive"}
                                </span>
                                {chatter.commissionEnabled && (
                                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[var(--gold)]/20 text-[var(--gold)]">
                                    {(chatter.commissionRate * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-400 truncate">{chatter.email}</p>

                              {/* Assigned Creators */}
                              {chatter.assignedCreators.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                                  {chatter.assignedCreators.slice(0, 2).map(c => (
                                    <span key={c.creatorSlug} className="px-1.5 sm:px-2 py-0.5 rounded-md bg-white/5 text-[10px] sm:text-xs text-gray-400">
                                      @{c.creatorSlug}
                                    </span>
                                  ))}
                                  {chatter.assignedCreators.length > 2 && (
                                    <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-white/5 text-[10px] sm:text-xs text-gray-500">
                                      +{chatter.assignedCreators.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Schedule */}
                              {chatter.schedule && (
                                <div className="hidden sm:flex items-center gap-1 mt-2">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <div className="flex gap-0.5">
                                    {DAYS.map((day) => {
                                      const hasSlot = (chatter.schedule?.[day]?.length || 0) > 0;
                                      return (
                                        <span
                                          key={day}
                                          className={cn(
                                            "w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded text-[9px] sm:text-[10px] font-medium",
                                            hasSlot
                                              ? "bg-purple-500/20 text-purple-400"
                                              : "bg-white/5 text-gray-600"
                                          )}
                                        >
                                          {DAY_LABELS[day][0]}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 sm:gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleActive(chatter)}
                                className={cn(
                                  "relative w-9 h-5 sm:w-11 sm:h-6 rounded-full transition-colors flex-shrink-0",
                                  chatter.isActive ? "bg-emerald-500" : "bg-gray-600"
                                )}
                              >
                                <span className={cn(
                                  "absolute top-0.5 sm:top-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white transition-transform",
                                  chatter.isActive ? "left-5 sm:left-6" : "left-0.5 sm:left-1"
                                )} />
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(chatter)}
                                className="w-8 h-8 sm:w-9 sm:h-9"
                              >
                                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteChatter(chatter)}
                                className="w-8 h-8 sm:w-9 sm:h-9 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Stats row with progress bars */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2.5 sm:pt-3 border-t border-[var(--border)]">
                            <div>
                              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                <span className="text-[9px] sm:text-[10px] text-gray-500">Revenue</span>
                                <span className="text-[10px] sm:text-xs font-bold text-emerald-400 truncate ml-1">
                                  {formatCredits(chatter.stats.revenue30d)}
                                </span>
                              </div>
                              <div className="h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${(chatter.stats.revenue30d / maxStats.revenue) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Messages</span>
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  {chatter.stats.messages30d}
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${(chatter.stats.messages30d / maxStats.messages) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Sales</span>
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  {chatter.stats.sales30d}
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full transition-all"
                                  style={{ width: `${(chatter.stats.sales30d / maxStats.sales) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Conv.</span>
                                <span className="text-xs sm:text-sm font-bold text-purple-400">
                                  {chatter.stats.conversionRate}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full transition-all"
                                  style={{ width: `${(chatter.stats.conversionRate / maxStats.conversion) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  Off-shift
                                  {chatter.stats.outsideShiftPercent > 20 && (
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  )}
                                </span>
                                <span className={cn(
                                  "text-xs sm:text-sm font-bold",
                                  chatter.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-400"
                                )}>
                                  {chatter.stats.outsideShiftPercent}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    chatter.stats.outsideShiftPercent > 20 ? "bg-amber-500" : "bg-gray-500"
                                  )}
                                  style={{ width: `${Math.min(chatter.stats.outsideShiftPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {leaderboard.map((chatter, index) => {
                const rank = index + 1;
                const online = isChatterOnline(chatter.schedule);

                return (
                  <Card
                    key={chatter.id}
                    className={cn(
                      "p-4 cursor-pointer",
                      rank <= 3 && "border-l-4",
                      rank === 1 && "border-l-yellow-500",
                      rank === 2 && "border-l-gray-400",
                      rank === 3 && "border-l-amber-700"
                    )}
                    onClick={() => setShowDetailModal(chatter)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8">
                        {getRankBadge(rank)}
                      </div>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {chatter.name[0].toUpperCase()}
                          </span>
                        </div>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--background)]",
                          online && chatter.isActive ? "bg-emerald-500" : "bg-gray-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{chatter.name}</p>
                        <p className="text-xs text-gray-500 truncate">{chatter.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400 text-sm">
                          {formatCredits(chatter.stats.revenue30d)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Msgs</p>
                        <p className="text-sm font-medium text-white">{chatter.stats.messages30d}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Sales</p>
                        <p className="text-sm font-medium text-white">{chatter.stats.sales30d}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Conv</p>
                        <p className="text-sm font-medium text-purple-400">{chatter.stats.conversionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Off</p>
                        <p className={cn(
                          "text-sm font-medium",
                          chatter.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-400"
                        )}>{chatter.stats.outsideShiftPercent}%</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {leaderboard.length === 0 && (
                <Card className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No chatters yet. Add your first chatter to see the leaderboard!</p>
                </Card>
              )}
            </div>

            {/* Desktop Table View */}
            <Card className="overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Chatter</th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Conv %</th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Off-shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((chatter, index) => {
                      const rank = index + 1;
                      const online = isChatterOnline(chatter.schedule);

                      return (
                        <tr
                          key={chatter.id}
                          onClick={() => setShowDetailModal(chatter)}
                          className={cn(
                            "border-b border-[var(--border)] hover:bg-white/5 cursor-pointer transition-colors",
                            rank <= 3 && "bg-gradient-to-r",
                            rank === 1 && "from-yellow-500/5 to-transparent",
                            rank === 2 && "from-gray-400/5 to-transparent",
                            rank === 3 && "from-amber-700/5 to-transparent"
                          )}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center w-8">
                              {getRankBadge(rank)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                                  <span className="text-white font-bold">
                                    {chatter.name[0].toUpperCase()}
                                  </span>
                                </div>
                                <span className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--background)]",
                                  online && chatter.isActive ? "bg-emerald-500" : "bg-gray-500"
                                )} />
                              </div>
                              <div>
                                <p className="font-medium text-white">{chatter.name}</p>
                                <p className="text-xs text-gray-500">{chatter.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-emerald-400">
                              {formatCredits(chatter.stats.revenue30d)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-white">{chatter.stats.messages30d.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-white">{chatter.stats.sales30d}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-medium text-purple-400">{chatter.stats.conversionRate}%</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={cn(
                              "font-medium flex items-center justify-end gap-1",
                              chatter.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-400"
                            )}>
                              {chatter.stats.outsideShiftPercent}%
                              {chatter.stats.outsideShiftPercent > 20 && (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {leaderboard.length === 0 && (
                <div className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No chatters yet. Add your first chatter to see the leaderboard!</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Card className="p-4">
              <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {chatters.map((chatter) => {
                  const online = isChatterOnline(chatter.schedule);
                  const todaySlot = chatter.schedule?.[
                    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] as keyof Schedule
                  ]?.[0];

                  return (
                    <div key={chatter.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                        online && chatter.isActive ? "bg-emerald-500/20" : "bg-gray-500/20"
                      )}>
                        {online && chatter.isActive ? "🟢" : "🔴"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white">
                          <span className="font-medium">{chatter.name}</span>
                          {" "}
                          {online && chatter.isActive ? (
                            <>is currently <span className="text-emerald-400">online</span></>
                          ) : (
                            <>is <span className="text-gray-400">offline</span></>
                          )}
                        </p>
                        {todaySlot && chatter.isActive && (
                          <p className="text-xs text-gray-500">
                            Schedule: {todaySlot.start} - {todaySlot.end}
                          </p>
                        )}
                        {chatter.stats.revenue30d > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Generated {formatCredits(chatter.stats.revenue30d)} revenue this month
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chatters.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No activity to show. Add chatters to see their activity here.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "coverage" && (
          <motion.div
            key="coverage"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {agency?.creators.map((creator) => {
                const assignedChatters = chatters.filter(c =>
                  c.assignedCreators.some(ac => ac.creatorSlug === creator.slug)
                );

                return (
                  <Card key={creator.slug} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">@{creator.slug}</p>
                        <p className="text-xs text-gray-500">{creator.displayName}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        assignedChatters.length > 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}>
                        {assignedChatters.length} chatter{assignedChatters.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {assignedChatters.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedChatters.map((chatter) => (
                          <div key={chatter.id} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {chatter.name[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-300">{chatter.name.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No chatters assigned</p>
                    )}
                  </Card>
                );
              })}
              {(agency?.creators.length === 0 || chatters.length === 0) && (
                <Card className="p-8 text-center">
                  <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {chatters.length === 0
                      ? "Add chatters to see the coverage matrix"
                      : "Add creators to your agency to see the coverage matrix"}
                  </p>
                </Card>
              )}
            </div>

            {/* Desktop Table View */}
            <Card className="overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                      {chatters.map((chatter) => (
                        <th key={chatter.id} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {chatter.name[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 truncate max-w-[60px]">{chatter.name.split(" ")[0]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agency?.creators.map((creator) => (
                      <tr key={creator.slug} className="border-b border-[var(--border)] hover:bg-white/5">
                        <td className="py-4 px-4">
                          <span className="text-white font-medium">@{creator.slug}</span>
                          <p className="text-xs text-gray-500">{creator.displayName}</p>
                        </td>
                        {chatters.map((chatter) => {
                          const isAssigned = chatter.assignedCreators.some(c => c.creatorSlug === creator.slug);
                          return (
                            <td key={chatter.id} className="py-4 px-4 text-center">
                              {isAssigned ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20">
                                  <Check className="w-4 h-4 text-emerald-400" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                                  <span className="w-2 h-2 rounded-full bg-gray-600" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(agency?.creators.length === 0 || chatters.length === 0) && (
                <div className="p-8 text-center">
                  <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {chatters.length === 0
                      ? "Add chatters to see the coverage matrix"
                      : "Add creators to your agency to see the coverage matrix"}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "monitoring" && (
          <motion.div
            key="monitoring"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-20rem)]"
          >
            {selectedConversation ? (
              // Conversation Detail View
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <button
                    onClick={() => { setSelectedConversation(null); setMessages([]); }}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                      {selectedConversation.fan?.name || "Fan"}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">via @{selectedConversation.creatorSlug}</p>
                  </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden">
                  {/* Conversation Header */}
                  <div className="p-2.5 sm:p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {selectedConversation.fan?.avatar ? (
                            <img src={selectedConversation.fan.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-white truncate">{selectedConversation.fan?.name || "Fan"}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 truncate">{selectedConversation.fan?.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-purple-500/10">
                          {selectedConversation.creator?.avatar && (
                            <img src={selectedConversation.creator.avatar} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                          )}
                          <span className="text-[10px] sm:text-xs text-purple-400">@{selectedConversation.creatorSlug}</span>
                        </div>
                        {selectedConversation.participatingChatters.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedConversation.participatingChatters.slice(0, 2).map((c) => (
                              <span key={c.id} className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/5 text-[10px] sm:text-xs text-gray-300">
                                {c.name}
                              </span>
                            ))}
                            {selectedConversation.participatingChatters.length > 2 && (
                              <span className="text-[10px] sm:text-xs text-gray-500">+{selectedConversation.participatingChatters.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">No messages</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.isFromCreator ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[90%] sm:max-w-[70%] rounded-xl sm:rounded-2xl p-2 sm:p-3",
                            msg.isFromCreator
                              ? "bg-purple-500/20 border border-purple-500/30"
                              : "bg-white/5 border border-white/10"
                          )}>
                            {msg.isPPV && (
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-400 mb-1.5 sm:mb-2">
                                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                PPV {msg.ppvPrice}
                                {msg.isUnlocked && <span className="text-emerald-400 ml-1">• Unlocked</span>}
                              </div>
                            )}
                            {msg.media.length > 0 && (
                              <div className="mb-1.5 sm:mb-2 grid gap-1.5 sm:gap-2">
                                {msg.media.map((m) => (
                                  <div key={m.id} className="rounded-lg overflow-hidden bg-black/20">
                                    {m.type === "IMAGE" || m.type === "image" ? (
                                      <img src={m.url} alt="" className="max-h-40 sm:max-h-64 object-contain" />
                                    ) : (
                                      <video src={m.url} controls className="max-h-40 sm:max-h-64" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.text && <p className="text-white text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span>{format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                              {msg.chatter && (
                                <span className="px-1 sm:px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">{msg.chatter.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 sm:p-3 border-t border-[var(--border)] bg-white/5">
                    <p className="text-center text-[10px] sm:text-xs text-gray-500">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                      Read-only
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              // Conversations List View
              <div className="flex-1 flex flex-col">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
                  <div className="relative flex-1 min-w-0 sm:min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search fans..."
                      value={monitoringSearch}
                      onChange={(e) => setMonitoringSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchConversations()}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* Creator Filter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMonitoringCreatorDropdown(!showMonitoringCreatorDropdown);
                        setShowMonitoringChatterDropdown(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                        monitoringCreatorFilter
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          : "bg-[var(--surface)] border-[var(--border)] text-gray-300"
                      )}
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {monitoringCreatorFilter
                          ? agency?.creators.find((c) => c.slug === monitoringCreatorFilter)?.displayName
                          : "All Creators"}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showMonitoringCreatorDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                        <button
                          onClick={() => { setMonitoringCreatorFilter(null); setShowMonitoringCreatorDropdown(false); fetchConversations(); }}
                          className={cn("w-full px-4 py-2.5 text-left text-sm hover:bg-white/5", !monitoringCreatorFilter ? "text-purple-400 bg-purple-500/10" : "text-gray-300")}
                        >
                          All Creators
                        </button>
                        {agency?.creators.map((creator) => (
                          <button
                            key={creator.slug}
                            onClick={() => { setMonitoringCreatorFilter(creator.slug); setShowMonitoringCreatorDropdown(false); fetchConversations(); }}
                            className={cn("w-full px-4 py-2.5 text-left text-sm hover:bg-white/5", monitoringCreatorFilter === creator.slug ? "text-purple-400 bg-purple-500/10" : "text-gray-300")}
                          >
                            {creator.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chatter Filter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMonitoringChatterDropdown(!showMonitoringChatterDropdown);
                        setShowMonitoringCreatorDropdown(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                        monitoringChatterFilter
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-[var(--surface)] border-[var(--border)] text-gray-300"
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {monitoringChatterFilter
                          ? chatters.find((c) => c.id === monitoringChatterFilter)?.name
                          : "All Chatters"}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showMonitoringChatterDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                        <button
                          onClick={() => { setMonitoringChatterFilter(null); setShowMonitoringChatterDropdown(false); fetchConversations(); }}
                          className={cn("w-full px-4 py-2.5 text-left text-sm hover:bg-white/5", !monitoringChatterFilter ? "text-emerald-400 bg-emerald-500/10" : "text-gray-300")}
                        >
                          All Chatters
                        </button>
                        {chatters.map((chatter) => (
                          <button
                            key={chatter.id}
                            onClick={() => { setMonitoringChatterFilter(chatter.id); setShowMonitoringChatterDropdown(false); fetchConversations(); }}
                            className={cn("w-full px-4 py-2.5 text-left text-sm hover:bg-white/5", monitoringChatterFilter === chatter.id ? "text-emerald-400 bg-emerald-500/10" : "text-gray-300")}
                          >
                            {chatter.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchConversations}
                    disabled={isLoadingConversations}
                    className="gap-1"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoadingConversations && "animate-spin")} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>

                  {hasMonitoringFilters && (
                    <button onClick={clearMonitoringFilters} className="flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-white">
                      <X className="w-4 h-4" /> Clear
                    </button>
                  )}
                </div>

                {/* Conversations List */}
                <Card className="flex-1 overflow-hidden">
                  <div className="overflow-y-auto h-full">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center h-full py-8 sm:py-12">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-500" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12 text-gray-500">
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50" />
                        <p className="text-base sm:text-lg font-medium text-white mb-1.5 sm:mb-2">No conversations</p>
                        <p className="text-xs sm:text-sm text-center px-4">
                          {hasMonitoringFilters ? "Try adjusting filters" : "Conversations appear when fans message"}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => fetchMessages(conv.id)}
                            className="p-2.5 sm:p-4 hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {conv.fan?.avatar ? (
                                  <img src={conv.fan.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                    <span className="text-sm sm:text-base font-semibold text-white truncate">{conv.fan?.name || "Fan"}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">via @{conv.creatorSlug}</span>
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0">
                                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                  </span>
                                </div>
                                {conv.lastMessage && (
                                  <p className="text-xs sm:text-sm text-gray-400 truncate mb-0.5 sm:mb-1">
                                    {conv.lastMessage.isFromCreator && (
                                      <span className="text-purple-400">{conv.lastMessage.chatterName || "Creator"}: </span>
                                    )}
                                    {conv.lastMessage.text || "[Media]"}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                  <span className="text-gray-500">
                                    <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                                    {conv.messageCount}
                                  </span>
                                  <span className="text-purple-400 sm:hidden text-[10px]">@{conv.creatorSlug}</span>
                                  {conv.participatingChatters.length > 0 && (
                                    <div className="flex gap-1 hidden sm:flex">
                                      {conv.participatingChatters.slice(0, 2).map((c) => (
                                        <span key={c.id} className="px-1 sm:px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{c.name}</span>
                                      ))}
                                      {conv.participatingChatters.length > 2 && (
                                        <span className="text-gray-500">+{conv.participatingChatters.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 -rotate-90 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Detail Modal - Bottom sheet on mobile */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            >
              <div className="bg-[#0a0a0c] border border-white/10 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6">
                {/* Drag indicator for mobile */}
                <div className="sm:hidden flex justify-center mb-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header - More compact on mobile */}
                <div className="flex items-start gap-3 mb-4 sm:mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {showDetailModal.name[0].toUpperCase()}
                      </span>
                    </div>
                    <span className={cn(
                      "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0a0a0c]",
                      isChatterOnline(showDetailModal.schedule) && showDetailModal.isActive
                        ? "bg-emerald-500"
                        : "bg-gray-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">{showDetailModal.name}</h2>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{showDetailModal.email}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                        showDetailModal.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {showDetailModal.isActive ? "Active" : "Inactive"}
                      </span>
                      {showDetailModal.commissionEnabled && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[var(--gold)]/20 text-[var(--gold)]">
                          {(showDetailModal.commissionRate * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Stats - 2x3 grid on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 sm:mb-6">
                  <div className="p-2.5 bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-bold text-emerald-400 truncate">
                      {formatCredits(showDetailModal.stats.revenue30d)}
                    </p>
                    <p className="text-[10px] text-gray-500">Revenue</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-bold text-white">
                      {showDetailModal.stats.messages30d}
                    </p>
                    <p className="text-[10px] text-gray-500">Messages</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-bold text-white">
                      {showDetailModal.stats.sales30d}
                    </p>
                    <p className="text-[10px] text-gray-500">Sales</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl text-center">
                    <p className="text-sm font-bold text-purple-400">
                      {showDetailModal.stats.conversionRate}%
                    </p>
                    <p className="text-[10px] text-gray-500">Conversion</p>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl text-center col-span-2 sm:col-span-1",
                    showDetailModal.stats.outsideShiftPercent > 20 ? "bg-amber-500/10" : "bg-white/5"
                  )}>
                    <p className={cn(
                      "text-sm font-bold flex items-center justify-center gap-1",
                      showDetailModal.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-400"
                    )}>
                      {showDetailModal.stats.outsideShiftPercent}%
                      {showDetailModal.stats.outsideShiftPercent > 20 && (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500">Off-shift</p>
                  </div>
                </div>

                {/* Out-of-shift detail if significant */}
                {showDetailModal.stats.messagesOutsideShift > 0 && (
                  <div className={cn(
                    "p-2.5 rounded-xl mb-4 flex items-start gap-2",
                    showDetailModal.stats.outsideShiftPercent > 20 ? "bg-amber-500/10" : "bg-white/5"
                  )}>
                    <AlertTriangle className={cn(
                      "w-4 h-4 flex-shrink-0 mt-0.5",
                      showDetailModal.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-500"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium",
                        showDetailModal.stats.outsideShiftPercent > 20 ? "text-amber-400" : "text-gray-400"
                      )}>
                        {showDetailModal.stats.messagesOutsideShift} messages outside shifts
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {showDetailModal.stats.outsideShiftPercent}% of total activity
                      </p>
                    </div>
                  </div>
                )}

                {/* Assigned Creators - horizontal scroll on mobile */}
                {showDetailModal.assignedCreators.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-gray-400 mb-2">Assigned Creators</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {showDetailModal.assignedCreators.map((c) => {
                        const creator = agency?.creators.find(cr => cr.slug === c.creatorSlug);
                        return (
                          <div key={c.creatorSlug} className="px-2.5 py-1.5 bg-white/5 rounded-lg">
                            <p className="text-xs font-medium text-white">@{c.creatorSlug}</p>
                            {creator && <p className="text-[10px] text-gray-500">{creator.displayName}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schedule - compact on mobile */}
                {showDetailModal.schedule && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-gray-400 mb-2">Schedule</h3>
                    <div className="flex gap-1">
                      {DAYS.map((day) => {
                        const slots = showDetailModal.schedule?.[day] || [];
                        const hasSlot = slots.length > 0;
                        return (
                          <div key={day} className="flex-1 text-center">
                            <div className={cn(
                              "py-1.5 rounded-lg text-[10px] font-medium",
                              hasSlot
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-white/5 text-gray-600"
                            )}>
                              {DAY_LABELS[day][0]}
                            </div>
                            {hasSlot && (
                              <p className="text-[8px] text-gray-500 mt-0.5 hidden sm:block">
                                {slots[0].start.slice(0,5)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 text-sm"
                    onClick={() => {
                      setShowDetailModal(null);
                      openEditModal(showDetailModal);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 text-sm text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => deleteChatter(showDetailModal)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4"
            onClick={() => !lastCreatedCredentials && setShowModal(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
            >
              <Card className="p-6">
                {lastCreatedCredentials ? (
                  // Success state after creation
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Chatter Created!</h2>
                    <p className="text-gray-400 mb-6">Share these credentials with your new team member</p>

                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Email</span>
                        <span className="text-white font-mono">{lastCreatedCredentials.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Password</span>
                        <span className="text-white font-mono">{lastCreatedCredentials.password}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowModal(false)}
                      >
                        Close
                      </Button>
                      <Button
                        variant="premium"
                        className="flex-1 gap-2"
                        onClick={copyCredentials}
                      >
                        {copiedCredentials ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Credentials
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Form state
                  <>
                    <div className="md:hidden flex justify-center mb-2">
                      <div className="w-12 h-1 bg-[var(--border)] rounded-full" />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">
                        {editingChatter ? "Edit Chatter" : "Add Chatter"}
                      </h2>
                      <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Name
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="chatter@agency.com"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Key className="w-4 h-4 inline mr-1" />
                          Password {editingChatter && <span className="text-xs text-gray-500">(leave empty to keep)</span>}
                        </label>
                        <input
                          type="password"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder={editingChatter ? "••••••••" : "Create password"}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Commission */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-white">Enable Commission</p>
                            <p className="text-xs text-gray-500">Pay chatter a % of sales</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormCommissionEnabled(!formCommissionEnabled)}
                            className={cn(
                              "relative w-11 h-6 rounded-full transition-colors",
                              formCommissionEnabled ? "bg-[var(--gold)]" : "bg-gray-600"
                            )}
                          >
                            <span className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                              formCommissionEnabled ? "left-6" : "left-1"
                            )} />
                          </button>
                        </div>
                        {formCommissionEnabled && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Commission Rate (%)
                            </label>
                            <input
                              type="number"
                              value={formCommissionRate}
                              onChange={(e) => setFormCommissionRate(parseFloat(e.target.value) || 10)}
                              min="1"
                              max="50"
                              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Assigned Creators */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Assigned Creators
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {agency?.creators.map((creator) => (
                            <label
                              key={creator.slug}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10"
                            >
                              <input
                                type="checkbox"
                                checked={formAssignedCreators.includes(creator.slug)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormAssignedCreators([...formAssignedCreators, creator.slug]);
                                  } else {
                                    setFormAssignedCreators(formAssignedCreators.filter(s => s !== creator.slug));
                                  }
                                }}
                                className="w-5 h-5 rounded border-gray-500 text-purple-500 focus:ring-purple-500"
                              />
                              <span className="text-white">{creator.displayName}</span>
                              <span className="text-gray-500 text-sm">@{creator.slug}</span>
                            </label>
                          ))}
                          {agency?.creators.length === 0 && (
                            <p className="text-gray-500 text-sm p-3">No creators in agency</p>
                          )}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Work Schedule
                        </label>
                        <div className="space-y-2 bg-white/5 rounded-xl p-3">
                          {DAYS.map((day) => {
                            const slots = formSchedule[day];
                            const isActive = slots.length > 0;
                            return (
                              <div key={day} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isActive) {
                                      setFormSchedule({ ...formSchedule, [day]: [] });
                                    } else {
                                      setFormSchedule({ ...formSchedule, [day]: [{ start: "09:00", end: "17:00" }] });
                                    }
                                  }}
                                  className={cn(
                                    "w-12 text-xs font-medium py-1.5 rounded-lg transition-colors",
                                    isActive
                                      ? "bg-purple-500 text-white"
                                      : "bg-white/10 text-gray-500"
                                  )}
                                >
                                  {DAY_LABELS[day]}
                                </button>
                                {isActive ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <input
                                      type="time"
                                      value={slots[0]?.start || "09:00"}
                                      onChange={(e) => {
                                        const newSlots = [...slots];
                                        newSlots[0] = { ...newSlots[0], start: e.target.value };
                                        setFormSchedule({ ...formSchedule, [day]: newSlots });
                                      }}
                                      className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] text-white"
                                    />
                                    <span className="text-gray-500 text-xs">to</span>
                                    <input
                                      type="time"
                                      value={slots[0]?.end || "17:00"}
                                      onChange={(e) => {
                                        const newSlots = [...slots];
                                        newSlots[0] = { ...newSlots[0], end: e.target.value };
                                        setFormSchedule({ ...formSchedule, [day]: newSlots });
                                      }}
                                      className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] text-white"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-600">Off</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        variant="premium"
                        onClick={handleSave}
                        disabled={isSaving || !formName || !formEmail || (!editingChatter && !formPassword)}
                        className="flex-1 gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingChatter ? "Update" : "Create")}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
