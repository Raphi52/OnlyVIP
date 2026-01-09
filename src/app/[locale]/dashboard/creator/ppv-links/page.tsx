"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Copy,
  Check,
  Plus,
  Trash2,
  BarChart3,
  MousePointer,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Loader2,
  ExternalLink,
  X,
  Smartphone,
  Monitor,
  Globe,
  Filter,
  MoreVertical,
  Eye,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar?: string;
}

interface PPVLink {
  id: string;
  shortCode: string;
  name: string | null;
  source: string | null;
  campaign: string | null;
  mediaId: string;
  totalClicks: number;
  uniqueClicks: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  isActive: boolean;
  createdAt: string;
  media: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    type: string;
    ppvPriceCredits: number | null;
  } | null;
}

interface MediaItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  type: string;
  ppvPriceCredits: number | null;
}

interface Analytics {
  totals: {
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    uniqueClicks: number;
    totalPurchases: number;
    totalRevenue: number;
    avgConversionRate: number;
  };
  topLinks: PPVLink[];
  breakdown: {
    bySource: { source: string | null; _sum: { totalClicks: number | null; totalRevenue: number | null } }[];
    byCampaign: { campaign: string | null; _sum: { totalClicks: number | null; totalRevenue: number | null } }[];
    byDevice: { device: string | null; _count: number }[];
    byCountry: { country: string | null; _count: number }[];
  };
}

const sources = [
  { value: "twitter", label: "Twitter/X", icon: "𝕏" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "telegram", label: "Telegram", icon: "✈️" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "reddit", label: "Reddit", icon: "🔴" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "other", label: "Other", icon: "🔗" },
];

export default function PPVLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [links, setLinks] = useState<PPVLink[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [ppvMedia, setPpvMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkSource, setNewLinkSource] = useState("");
  const [newLinkCampaign, setNewLinkCampaign] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [period, setPeriod] = useState("30d");

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
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setIsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!selectedCreator) return;

    setIsLoading(true);
    try {
      // Fetch links
      const linksRes = await fetch(`/api/ppv/links?creatorSlug=${selectedCreator.slug}`);
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData.links || []);
      }

      // Fetch analytics
      const analyticsRes = await fetch(`/api/ppv/links/analytics?creatorSlug=${selectedCreator.slug}&period=${period}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Fetch PPV media for creating links
      const mediaRes = await fetch(`/api/media?creatorSlug=${selectedCreator.slug}&tagPPV=true`);
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setPpvMedia(mediaData.media || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCreator, period]);

  useEffect(() => {
    if (selectedCreator) {
      fetchData();
    }
  }, [fetchData, selectedCreator]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const copyLink = (link: PPVLink) => {
    const url = `${window.location.origin}/${selectedCreator?.slug}/ppv/${link.shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createLink = async () => {
    if (!selectedCreator || !selectedMedia) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/ppv/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorSlug: selectedCreator.slug,
          mediaId: selectedMedia,
          name: newLinkName || null,
          source: newLinkSource || null,
          campaign: newLinkCampaign || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSelectedMedia(null);
        setNewLinkName("");
        setNewLinkSource("");
        setNewLinkCampaign("");
        await fetchData();
      }
    } catch (error) {
      console.error("Error creating link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm("Delete this link? Stats will be lost.")) return;

    try {
      const res = await fetch(`/api/ppv/links/${linkId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLinks(links.filter((l) => l.id !== linkId));
      }
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  if (status === "loading" || (isLoading && !selectedCreator)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading PPV Links...</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  const stats = [
    {
      label: "Total Clicks",
      value: analytics?.totals.totalClicks || 0,
      icon: MousePointer,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "Unique Visitors",
      value: analytics?.totals.uniqueClicks || 0,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Conversions",
      value: analytics?.totals.totalPurchases || 0,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "Revenue",
      value: `${(analytics?.totals.totalRevenue || 0).toLocaleString()}€`,
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
    },
  ];

  return (
    <div className="p-4 pt-20 pb-24 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">PPV Links</h1>
            </div>
            <p className="text-sm text-gray-400">
              Track clicks and conversions on your PPV content links
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Link</span>
            </motion.button>
          </div>
        </div>

        {/* Creator Selector */}
        {creators.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 scrollbar-hide">
            {creators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => setSelectedCreator(creator)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all flex-shrink-0",
                  selectedCreator?.id === creator.id
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <div className="w-5 h-5 rounded-lg overflow-hidden">
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
        )}

        {/* Period selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {["7d", "30d", "90d", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0",
                period === p
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </h3>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Conversion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Average Conversion Rate</span>
              <span className="text-2xl font-bold text-emerald-400">
                {(analytics?.totals.avgConversionRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                style={{ width: `${Math.min(analytics?.totals.avgConversionRate || 0, 100)}%` }}
              />
            </div>
          </motion.div>

          {/* Breakdown by Source */}
          {analytics?.breakdown.bySource && analytics.breakdown.bySource.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-4">By Source</h3>
              <div className="space-y-3">
                {analytics.breakdown.bySource.filter(s => s.source).map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{sources.find(s => s.value === source.source)?.icon || "🔗"}</span>
                      <span className="text-sm text-white capitalize">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{source._sum.totalClicks || 0} clicks</span>
                      <span className="text-sm text-emerald-400">{(source._sum.totalRevenue || 0).toFixed(0)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Device Breakdown */}
          {analytics?.breakdown.byDevice && analytics.breakdown.byDevice.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-4">By Device</h3>
              <div className="flex gap-4">
                {analytics.breakdown.byDevice.map((device) => {
                  const total = analytics.breakdown.byDevice.reduce((sum, d) => sum + d._count, 0);
                  const percentage = total > 0 ? (device._count / total) * 100 : 0;
                  return (
                    <div key={device.device} className="flex-1 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2">
                        {device.device === "mobile" ? (
                          <Smartphone className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Monitor className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-white capitalize">{device.device || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Links List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-400">All Links ({links.length})</h3>
            </div>

            {links.length === 0 ? (
              <div className="p-8 text-center">
                <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No PPV links created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium"
                >
                  Create Your First Link
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {links.map((link) => (
                  <div key={link.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                        {link.media?.thumbnailUrl ? (
                          <img
                            src={link.media.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {link.media?.type === "VIDEO" ? (
                              <Video className="w-6 h-6 text-gray-600" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {link.name || link.media?.title || "Unnamed Link"}
                          </h4>
                          {link.source && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                              {link.source}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {link.totalClicks}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {link.uniqueClicks}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {link.conversionRate.toFixed(1)}%
                          </span>
                          <span className="text-emerald-400 font-medium">
                            {link.totalRevenue.toFixed(0)}€
                          </span>
                        </div>

                        {/* URL */}
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded truncate max-w-[200px]">
                            /{selectedCreator?.slug}/ppv/{link.shortCode}
                          </code>
                          <button
                            onClick={() => copyLink(link)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Create Link Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Create PPV Link</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {/* Select Media */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select PPV Content *
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {ppvMedia.map((media) => (
                      <button
                        key={media.id}
                        onClick={() => setSelectedMedia(media.id)}
                        className={cn(
                          "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                          selectedMedia === media.id
                            ? "border-purple-500 ring-2 ring-purple-500/30"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        {media.thumbnailUrl ? (
                          <img
                            src={media.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            {media.type === "VIDEO" ? (
                              <Video className="w-6 h-6 text-gray-600" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                        )}
                        {selectedMedia === media.id && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
                          {media.ppvPriceCredits}€
                        </div>
                      </button>
                    ))}
                  </div>
                  {ppvMedia.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No PPV content available. Upload media with PPV tag first.
                    </p>
                  )}
                </div>

                {/* Link Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Link Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="e.g., Twitter promo, Bio link"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Source */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Source (optional)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sources.map((source) => (
                      <button
                        key={source.value}
                        onClick={() => setNewLinkSource(newLinkSource === source.value ? "" : source.value)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all",
                          newLinkSource === source.value
                            ? "bg-purple-500/20 border border-purple-500/50 text-purple-400"
                            : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <span>{source.icon}</span>
                        <span>{source.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campaign */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Campaign (optional)
                  </label>
                  <input
                    type="text"
                    value={newLinkCampaign}
                    onChange={(e) => setNewLinkCampaign(e.target.value)}
                    placeholder="e.g., summer-sale, launch-promo"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={createLink}
                  disabled={!selectedMedia || isCreating}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium text-white transition-all",
                    selectedMedia && !isCreating
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-gray-600 cursor-not-allowed"
                  )}
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Create Link"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
