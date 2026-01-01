"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  Send,
  Copy,
  Check,
  Search,
  Filter,
  ChevronRight,
  User,
  Image as ImageIcon,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

// Types
interface ChatterData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  agency: { id: string; name: string; logo: string | null };
  commissionRate: number;
  assignedCreators: Array<{
    slug: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  stats: {
    totalEarnings: number;
    pendingBalance: number;
    totalPaid: number;
    messages30d: number;
    sales30d: number;
    earnings30d: number;
    conversionRate: number;
    unreadConversations: number;
  };
}

interface Conversation {
  id: string;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  participant: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  lastMessage: {
    text: string;
    createdAt: string;
    isRead: boolean;
    isFromChatter: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Script {
  id: string;
  name: string;
  content: string;
  category: string;
  creatorSlug: string | null;
  usageCount: number;
  salesGenerated: number;
  conversionRate: number;
}

interface Earning {
  id: string;
  type: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  creatorSlug: string;
  creatorName: string;
  creatorAvatar: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  delayedAttribution: boolean;
}

// Tab types
type TabType = "inbox" | "earnings" | "scripts";

export default function ChatterDashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [chatterData, setChatterData] = useState<ChatterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chatter data
  const fetchChatterData = useCallback(async () => {
    try {
      const res = await fetch("/api/chatter");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChatterData(data);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatterData();
  }, [fetchChatterData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !chatterData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-red-400">{error || "Something went wrong"}</p>
        <Button onClick={fetchChatterData}>Retry</Button>
      </div>
    );
  }

  const stats = [
    {
      label: "Earnings (30d)",
      value: `${chatterData.stats.earnings30d.toFixed(0)} credits`,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Messages (30d)",
      value: chatterData.stats.messages30d.toLocaleString(),
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Sales (30d)",
      value: chatterData.stats.sales30d.toLocaleString(),
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Conversion",
      value: `${chatterData.stats.conversionRate}%`,
      icon: ArrowUpRight,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const tabs = [
    {
      id: "inbox" as TabType,
      label: "Inbox",
      icon: MessageSquare,
      badge: chatterData.stats.unreadConversations,
    },
    { id: "earnings" as TabType, label: "Earnings", icon: DollarSign },
    { id: "scripts" as TabType, label: "Scripts", icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {chatterData.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-400">
            {chatterData.agency.name} • {chatterData.assignedCreators.length}{" "}
            creator{chatterData.assignedCreators.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="luxury" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="text-lg font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-purple-500 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "inbox" && (
            <InboxTab assignedCreators={chatterData.assignedCreators} />
          )}
          {activeTab === "earnings" && (
            <EarningsTab commissionRate={chatterData.commissionRate} />
          )}
          {activeTab === "scripts" && <ScriptsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Inbox Tab Component
function InboxTab({
  assignedCreators,
}: {
  assignedCreators: ChatterData["assignedCreators"];
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCreator) params.set("creatorSlug", selectedCreator);
        if (onlyUnread) params.set("unread", "true");

        const res = await fetch(`/api/chatter/conversations?${params}`);
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [selectedCreator, onlyUnread]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCreator(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !selectedCreator
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
          {assignedCreators.map((creator) => (
            <button
              key={creator.slug}
              onClick={() => setSelectedCreator(creator.slug)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCreator === creator.slug
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {creator.avatarUrl && (
                <img
                  src={creator.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              {creator.displayName}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="rounded border-gray-600 bg-white/10 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-400">Unread only</span>
        </label>
      </div>

      {/* Conversation List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : conversations.length === 0 ? (
        <Card variant="luxury" className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No conversations yet</p>
          <p className="text-sm text-gray-500 mt-1">
            New messages from fans will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              variant="luxury"
              className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                conv.unreadCount > 0 ? "border-l-2 border-l-purple-500" : ""
              }`}
              onClick={() => router.push(`/chatter/conversation/${conv.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {conv.participant?.avatar ? (
                      <img
                        src={conv.participant.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">
                      {conv.participant?.name || "Fan"}
                    </span>
                    <span className="text-xs text-gray-500">
                      via @{conv.creatorSlug}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {conv.lastMessage.isFromChatter && (
                        <span className="text-purple-400">You: </span>
                      )}
                      {conv.lastMessage.text}
                    </p>
                  )}
                </div>

                {/* Time & Arrow */}
                <div className="flex items-center gap-3">
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Earnings Tab Component
function EarningsTab({ commissionRate }: { commissionRate: number }) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    paid: 0,
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chatter/earnings?period=${period}`);
        const data = await res.json();
        setEarnings(data.earnings || []);
        setSummary(data.summary || { total: 0, pending: 0, paid: 0 });
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period]);

  const typeLabels: Record<string, string> = {
    PPV: "PPV Unlock",
    TIP: "Tip",
    MEDIA_UNLOCK: "Media Unlock",
  };

  const typeColors: Record<string, string> = {
    PPV: "text-purple-400 bg-purple-500/10",
    TIP: "text-pink-400 bg-pink-500/10",
    MEDIA_UNLOCK: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="luxury" className="p-5">
          <p className="text-sm text-gray-400 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-white">
            {summary.total.toFixed(0)} <span className="text-sm text-gray-400">credits</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(commissionRate * 100).toFixed(0)}% commission rate
          </p>
        </Card>
        <Card variant="luxury" className="p-5 border-l-2 border-l-amber-500">
          <p className="text-sm text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">
            {summary.pending.toFixed(0)} <span className="text-sm text-amber-400/70">credits</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting payout</p>
        </Card>
        <Card variant="luxury" className="p-5 border-l-2 border-l-emerald-500">
          <p className="text-sm text-gray-400 mb-1">Paid Out</p>
          <p className="text-2xl font-bold text-emerald-400">
            {summary.paid.toFixed(0)} <span className="text-sm text-emerald-400/70">credits</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Total received</p>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {["7d", "30d", "90d", "all"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              period === p
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {p === "all" ? "All time" : `Last ${p.replace("d", " days")}`}
          </button>
        ))}
      </div>

      {/* Earnings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : earnings.length === 0 ? (
        <Card variant="luxury" className="p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No earnings yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start chatting to earn commissions
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {earnings.map((earning) => (
            <Card
              key={earning.id}
              variant="luxury"
              className="p-4 flex items-center gap-4"
            >
              <div
                className={`p-2.5 rounded-xl ${typeColors[earning.type] || "bg-gray-500/10"}`}
              >
                <DollarSign className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {typeLabels[earning.type] || earning.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    via @{earning.creatorSlug}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(earning.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-emerald-400">
                  +{earning.commissionAmount.toFixed(0)} credits
                </p>
                <p className="text-xs text-gray-500">
                  from {earning.grossAmount.toFixed(0)} credits
                </p>
              </div>

              <span
                className={`px-2 py-1 rounded text-xs ${
                  earning.status === "PAID"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {earning.status}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Scripts Tab Component
function ScriptsTab() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ value: string; label: string; count: number }>
  >([]);

  useEffect(() => {
    const fetchScripts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "ALL") params.set("category", category);
        if (search) params.set("search", search);

        const res = await fetch(`/api/chatter/scripts?${params}`);
        const data = await res.json();
        setScripts(data.scripts || []);
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to fetch scripts:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchScripts, 300);
    return () => clearTimeout(debounce);
  }, [category, search]);

  const handleCopy = async (script: Script) => {
    await navigator.clipboard.writeText(script.content);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Track usage
    fetch("/api/chatter/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId: script.id }),
    }).catch(console.error);
  };

  const categoryColors: Record<string, string> = {
    GREETING: "bg-blue-500/20 text-blue-400",
    PPV_PITCH: "bg-purple-500/20 text-purple-400",
    FOLLOW_UP: "bg-amber-500/20 text-amber-400",
    CLOSING: "bg-emerald-500/20 text-emerald-400",
    CUSTOM: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search scripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory("ALL")}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              category === "ALL"
                ? "bg-purple-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                category === cat.value
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Scripts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : scripts.length === 0 ? (
        <Card variant="luxury" className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No scripts found</p>
          <p className="text-sm text-gray-500 mt-1">
            {search ? "Try a different search term" : "Your agency hasn't added scripts yet"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scripts.map((script) => (
            <Card key={script.id} variant="luxury" className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{script.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${categoryColors[script.category] || categoryColors.CUSTOM}`}
                    >
                      {script.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used {script.usageCount} times • {script.salesGenerated} sales
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={copiedId === script.id ? "premium" : "outline"}
                  onClick={() => handleCopy(script)}
                  className="shrink-0"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {script.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
