"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User,
  Star,
  Users,
  Loader2,
  Search,
  MessageSquare,
  Check,
  Clock,
  X,
  AlertCircle,
  Send,
  ChevronRight,
  Inbox,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MessageCircle,
  Image,
  DollarSign,
  Percent,
  Globe,
  FileText,
  Handshake,
  ExternalLink,
  ShieldCheck,
  Flame,
  Target,
  Heart,
  Zap,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface VerifiedStats {
  revenueLast30d: number | null;
  revenueAvg3m: number | null;
  revenueTrend: number | null;
  activeSubscribers: number | null;
  subscriberRetention: number | null;
  subscriberGrowth30d: number | null;
  activityRate: number | null;
  avgResponseMinutes: number | null;
  messageToSaleRate: number;
  ppvUnlockRate: number;
  totalPosts: number;
  avgPostsPerWeek: number;
  avgRating: number;
  totalReviews: number;
  badges: {
    id: string;
    label: string;
    icon: string;
    emoji: string;
  }[];
  visibility: {
    showRevenue: boolean;
    showSubscribers: boolean;
    showActivity: boolean;
  };
  calculatedAt: string;
}

interface ModelListing {
  id: string;
  bio: string | null;
  photos: string[];
  socialLinks: Record<string, string>;
  tags: string[];
  revenueShare: number;
  chattingEnabled: boolean;
  averageRating: number;
  reviewCount: number;
  creator: {
    id: string;
    slug: string;
    name: string;
    displayName: string | null;
    avatar: string | null;
    categories: string[];
  };
  reviews: any[];
  applicationStatus: string | null;
  createdAt: string;
  verifiedStats: VerifiedStats | null;
}

interface ListingsData {
  listings: ModelListing[];
  filterOptions: {
    tags: string[];
  };
}

export default function FindModelPage() {
  const [data, setData] = useState<ListingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<ModelListing | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelListing | null>(null);

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chattingOnly, setChattingOnly] = useState(false);
  const [minShare, setMinShare] = useState(0);
  const [maxShare, setMaxShare] = useState(100);
  const [minRating, setMinRating] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      const params = new URLSearchParams();
      if (minRating > 0) params.append("minRating", minRating.toString());
      if (minShare > 0) params.append("minShare", minShare.toString());
      if (maxShare < 100) params.append("maxShare", maxShare.toString());
      if (chattingOnly) params.append("chattingOnly", "true");
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));

      const res = await fetch(`/api/find-model?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApply(listing: ModelListing) {
    setApplyingTo(listing.id);
    try {
      const res = await fetch(`/api/find-model/${listing.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage }),
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            listings: prev.listings.map((l) =>
              l.id === listing.id ? { ...l, applicationStatus: "PENDING" } : l
            ),
          };
        });
        setShowApplyModal(null);
        setApplyMessage("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send offer");
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      alert("Failed to send offer");
    } finally {
      setApplyingTo(null);
    }
  }

  // Calculate stats
  const stats = data ? {
    total: data.listings.length,
    contacted: data.listings.filter(l => l.applicationStatus).length,
    pending: data.listings.filter(l => l.applicationStatus === "PENDING").length,
    accepted: data.listings.filter(l => l.applicationStatus === "ACCEPTED").length,
  } : { total: 0, contacted: 0, pending: 0, accepted: 0 };

  const filteredListings = data?.listings.filter((listing) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!listing.creator.name.toLowerCase().includes(q) &&
          !listing.creator.displayName?.toLowerCase().includes(q) &&
          !listing.bio?.toLowerCase().includes(q) &&
          !listing.tags.some(t => t.toLowerCase().includes(q))) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "NOT_CONTACTED" && listing.applicationStatus) return false;
      if (statusFilter !== "NOT_CONTACTED" && listing.applicationStatus !== statusFilter) return false;
    }

    return true;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
            <Check className="w-3 h-3" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500/20 text-red-400 gap-1">
            <X className="w-3 h-3" />
            Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const hasActiveFilters = selectedTags.length > 0 || chattingOnly || minShare > 0 || maxShare < 100 || minRating > 0 || statusFilter !== "ALL";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Find Models
          </h1>
          <p className="text-gray-400">
            Discover creators looking for agency representation
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/applications">
            <Button variant="outline" className="gap-2">
              <Inbox className="w-4 h-4" />
              My Offers
            </Button>
          </Link>
          <Link href="/dashboard/agency/my-listing">
            <Button variant="premium" className="gap-2">
              <FileText className="w-4 h-4" />
              My Agency Listing
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Models</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.contacted}</p>
              <p className="text-xs text-gray-400">Contacted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.accepted}</p>
              <p className="text-xs text-gray-400">Accepted</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]/50 transition-colors"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4 space-y-4">
                {/* Tags */}
                {data?.filterOptions.tags && data.filterOptions.tags.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {data.filterOptions.tags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
                              : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["ALL", "NOT_CONTACTED", "PENDING", "ACCEPTED"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            statusFilter === status
                              ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
                              : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                          }`}
                        >
                          {status === "ALL" ? "All" :
                           status === "NOT_CONTACTED" ? "New" :
                           status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Min Rating */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Min Rating: {minRating > 0 ? `${minRating}+` : "Any"}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={minRating}
                      onChange={(e) => setMinRating(parseInt(e.target.value))}
                      className="w-full accent-[var(--gold)]"
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Options
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chattingOnly}
                        onChange={(e) => setChattingOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-500 accent-[var(--gold)]"
                      />
                      <span className="text-sm text-gray-300 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chatting Enabled
                      </span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTags([]);
                      setChattingOnly(false);
                      setMinShare(0);
                      setMaxShare(100);
                      setMinRating(0);
                      setStatusFilter("ALL");
                    }}
                    className="text-gray-400"
                  >
                    Clear All Filters
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Count */}
      {filteredListings && (
        <p className="text-sm text-gray-500">
          {filteredListings.length} model{filteredListings.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Models Grid */}
      {filteredListings && filteredListings.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card
                className="p-5 h-full flex flex-col hover:border-[var(--gold)]/30 transition-colors cursor-pointer"
                onClick={() => setSelectedModel(listing)}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  {listing.creator.avatar ? (
                    <img
                      src={listing.creator.avatar}
                      alt={listing.creator.displayName || listing.creator.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center">
                      <User className="w-6 h-6 text-pink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {listing.creator.displayName || listing.creator.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">@{listing.creator.slug}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {listing.reviewCount > 0 && (
                        <div className="flex items-center gap-1">
                          {renderStars(listing.averageRating)}
                          <span className="text-xs text-gray-400">({listing.reviewCount})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {listing.applicationStatus && (
                    <div className="flex-shrink-0">
                      {getStatusBadge(listing.applicationStatus)}
                    </div>
                  )}
                </div>

                {/* Revenue Share & Features */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
                    <Percent className="w-3 h-3" />
                    Wants {listing.revenueShare}%
                  </Badge>
                  {listing.chattingEnabled && (
                    <Badge className="bg-purple-500/20 text-purple-400 gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Chatting OK
                    </Badge>
                  )}
                </div>

                {/* Verified Stats */}
                {listing.verifiedStats && (
                  <div className="mb-3 p-2.5 rounded-lg bg-[var(--gold)]/5 border border-[var(--gold)]/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold)]" />
                      <span className="text-[10px] font-medium text-[var(--gold)]">VERIFIED STATS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Revenue (if visible) */}
                      {listing.verifiedStats.visibility.showRevenue && listing.verifiedStats.revenueLast30d !== null ? (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-gray-400">
                            ${(listing.verifiedStats.revenueLast30d / 1000).toFixed(1)}k/mo
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500">Revenue hidden</span>
                        </div>
                      )}

                      {/* Subscribers (if visible) */}
                      {listing.verifiedStats.visibility.showSubscribers && listing.verifiedStats.activeSubscribers !== null ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] text-gray-400">
                            {listing.verifiedStats.activeSubscribers} subs
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500">Subs hidden</span>
                        </div>
                      )}

                      {/* Conversion (always visible) */}
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-orange-400" />
                        <span className="text-[10px] text-gray-400">
                          {listing.verifiedStats.messageToSaleRate.toFixed(1)}% conv.
                        </span>
                      </div>

                      {/* Content frequency */}
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-pink-400" />
                        <span className="text-[10px] text-gray-400">
                          {listing.verifiedStats.avgPostsPerWeek.toFixed(0)} posts/wk
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    {listing.verifiedStats.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[var(--gold)]/10">
                        {listing.verifiedStats.badges.slice(0, 3).map((badge) => (
                          <span
                            key={badge.id}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--gold)]/10 text-[var(--gold)] flex items-center gap-1"
                            title={badge.label}
                          >
                            {badge.emoji} {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {listing.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {listing.tags.length > 4 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400">
                        +{listing.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Bio */}
                {listing.bio && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3 flex-1">
                    {listing.bio}
                  </p>
                )}

                {/* Actions */}
                <div
                  className="flex gap-2 mt-auto pt-4 border-t border-[var(--border)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!listing.applicationStatus ? (
                    <Button
                      variant="premium"
                      className="flex-1 gap-2"
                      disabled={applyingTo === listing.id}
                      onClick={() => setShowApplyModal(listing)}
                    >
                      {applyingTo === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send Offer
                    </Button>
                  ) : listing.applicationStatus === "ACCEPTED" ? (
                    <Link href="/dashboard/messages" className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled
                    >
                      {listing.applicationStatus === "PENDING"
                        ? "Offer Sent"
                        : "Offer Declined"}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No models found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery || hasActiveFilters
                ? "Try adjusting your filters"
                : "No models are currently looking for agency representation"}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedModel(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-start gap-4">
                  {selectedModel.creator.avatar ? (
                    <img
                      src={selectedModel.creator.avatar}
                      alt={selectedModel.creator.displayName || selectedModel.creator.name}
                      className="w-20 h-20 rounded-xl object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center">
                      <User className="w-10 h-10 text-pink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {selectedModel.creator.displayName || selectedModel.creator.name}
                        </h2>
                        <p className="text-sm text-gray-400">@{selectedModel.creator.slug}</p>
                      </div>
                      {selectedModel.applicationStatus && getStatusBadge(selectedModel.applicationStatus)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {selectedModel.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          {renderStars(selectedModel.averageRating)}
                          <span className="text-sm text-gray-400">
                            {selectedModel.averageRating.toFixed(1)} ({selectedModel.reviewCount} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Revenue Share & Features */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 gap-1 text-sm py-1.5 px-3">
                    <Percent className="w-4 h-4" />
                    Wants {selectedModel.revenueShare}% revenue share
                  </Badge>
                  {selectedModel.chattingEnabled && (
                    <Badge className="bg-purple-500/20 text-purple-400 gap-1 text-sm py-1.5 px-3">
                      <MessageCircle className="w-4 h-4" />
                      Open to Chatting
                    </Badge>
                  )}
                </div>

                {/* Verified Stats Section */}
                {selectedModel.verifiedStats && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--gold)]/10 to-[var(--gold)]/5 border border-[var(--gold)]/20">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-[var(--gold)]" />
                      <span className="font-medium text-[var(--gold)]">Verified Platform Statistics</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        Updated {new Date(selectedModel.verifiedStats.calculatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Revenue */}
                      <div className="text-center">
                        {selectedModel.verifiedStats.visibility.showRevenue && selectedModel.verifiedStats.revenueLast30d !== null ? (
                          <>
                            <div className="text-2xl font-bold text-white">
                              ${(selectedModel.verifiedStats.revenueLast30d / 1000).toFixed(1)}k
                            </div>
                            <div className="text-xs text-gray-400">Monthly Revenue</div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-gray-600">
                              <EyeOff className="w-6 h-6 mx-auto" />
                            </div>
                            <div className="text-xs text-gray-500">Revenue Hidden</div>
                          </>
                        )}
                      </div>

                      {/* Subscribers */}
                      <div className="text-center">
                        {selectedModel.verifiedStats.visibility.showSubscribers && selectedModel.verifiedStats.activeSubscribers !== null ? (
                          <>
                            <div className="text-2xl font-bold text-white">
                              {selectedModel.verifiedStats.activeSubscribers}
                            </div>
                            <div className="text-xs text-gray-400">Active Subscribers</div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-gray-600">
                              <EyeOff className="w-6 h-6 mx-auto" />
                            </div>
                            <div className="text-xs text-gray-500">Subs Hidden</div>
                          </>
                        )}
                      </div>

                      {/* Conversion (always visible) */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {selectedModel.verifiedStats.messageToSaleRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Conversion Rate</div>
                      </div>

                      {/* PPV Unlock */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400">
                          {selectedModel.verifiedStats.ppvUnlockRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-400">PPV Unlock Rate</div>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--gold)]/20">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">
                          {selectedModel.verifiedStats.totalPosts}
                        </div>
                        <div className="text-xs text-gray-400">Total Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">
                          {selectedModel.verifiedStats.avgPostsPerWeek.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">Posts/Week</div>
                      </div>
                      <div className="text-center">
                        {selectedModel.verifiedStats.visibility.showActivity && selectedModel.verifiedStats.activityRate !== null ? (
                          <>
                            <div className="text-lg font-semibold text-white">
                              {selectedModel.verifiedStats.activityRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-400">Activity Rate</div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-semibold text-gray-600">-</div>
                            <div className="text-xs text-gray-500">Activity Hidden</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    {selectedModel.verifiedStats.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--gold)]/20">
                        {selectedModel.verifiedStats.badges.map((badge) => (
                          <span
                            key={badge.id}
                            className="px-3 py-1.5 rounded-full text-sm bg-[var(--gold)]/10 text-[var(--gold)] flex items-center gap-1.5"
                          >
                            {badge.emoji} {badge.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      These stats are calculated from verified platform data and cannot be modified
                    </p>
                  </div>
                )}

                {/* Bio */}
                {selectedModel.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedModel.bio}</p>
                  </div>
                )}

                {/* Categories */}
                {selectedModel.creator.categories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.creator.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm bg-white/5 text-gray-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedModel.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {selectedModel.photos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Portfolio</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedModel.photos.slice(0, 6).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {Object.keys(selectedModel.socialLinks).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Social Links</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedModel.socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {platform}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedModel(null)}
                  >
                    Close
                  </Button>
                  {!selectedModel.applicationStatus ? (
                    <Button
                      variant="premium"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSelectedModel(null);
                        setShowApplyModal(selectedModel);
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Send Offer
                    </Button>
                  ) : selectedModel.applicationStatus === "ACCEPTED" ? (
                    <Link href="/dashboard/messages" className="flex-1">
                      <Button variant="premium" className="w-full gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Send Offer Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {showApplyModal.creator.avatar ? (
                  <img
                    src={showApplyModal.creator.avatar}
                    alt={showApplyModal.creator.displayName || showApplyModal.creator.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-pink-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Send offer to {showApplyModal.creator.displayName || showApplyModal.creator.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Introduce your agency and terms
                  </p>
                </div>
              </div>

              <textarea
                placeholder="Hi! We're interested in working with you. Here's what we offer..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]/50 resize-none mb-4"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowApplyModal(null);
                    setApplyMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="premium"
                  className="flex-1 gap-2"
                  disabled={applyingTo === showApplyModal.id}
                  onClick={() => handleApply(showApplyModal)}
                >
                  {applyingTo === showApplyModal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Offer
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
