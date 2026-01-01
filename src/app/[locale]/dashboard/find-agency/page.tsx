"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Building2,
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
  MapPin,
  Percent,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MessageCircle,
  Image,
  Megaphone,
  Globe,
  FileText,
  Handshake,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  listingId: string;
  headline: string | null;
  description: string | null;
  lookingFor: string[];
  contentTypes: string[];
  requirements: string | null;
  minRevenueShare: number;
  maxRevenueShare: number;
  providesContent: boolean;
  providesChatting: boolean;
  providesMarketing: boolean;
  location: string | null;
  acceptsRemote: boolean;
  creatorCount: number;
  creators: {
    id: string;
    slug: string;
    name: string;
    displayName: string | null;
    avatar: string | null;
  }[];
  averageRating: number;
  reviewCount: number;
  applicationStatus: string | null;
}

interface AgenciesData {
  agencies: Agency[];
  hasListing: boolean;
}

export default function FindAgencyPage() {
  const [data, setData] = useState<AgenciesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<Agency | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [pendingReceived, setPendingReceived] = useState(0);

  // Filters
  const [serviceFilters, setServiceFilters] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minShare, setMinShare] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchAgencies();
    fetchPendingApplications();
  }, []);

  async function fetchAgencies() {
    try {
      const res = await fetch("/api/find-agency");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPendingApplications() {
    try {
      const res = await fetch("/api/agency-applications");
      if (res.ok) {
        const json = await res.json();
        setPendingReceived(json.pendingReceived || 0);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }

  async function handleApply(agency: Agency) {
    if (!data?.hasListing) return;

    setApplyingTo(agency.id);
    try {
      const res = await fetch(`/api/find-agency/${agency.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage }),
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            agencies: prev.agencies.map((a) =>
              a.id === agency.id ? { ...a, applicationStatus: "PENDING" } : a
            ),
          };
        });
        setShowApplyModal(null);
        setApplyMessage("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to apply");
      }
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to apply");
    } finally {
      setApplyingTo(null);
    }
  }

  // Calculate stats
  const stats = data ? {
    total: data.agencies.length,
    applied: data.agencies.filter(a => a.applicationStatus).length,
    pending: data.agencies.filter(a => a.applicationStatus === "PENDING").length,
    accepted: data.agencies.filter(a => a.applicationStatus === "ACCEPTED").length,
  } : { total: 0, applied: 0, pending: 0, accepted: 0 };

  const filteredAgencies = data?.agencies.filter((agency) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!agency.name.toLowerCase().includes(q) &&
          !agency.description?.toLowerCase().includes(q) &&
          !agency.headline?.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Service filters
    if (serviceFilters.length > 0) {
      const hasService = serviceFilters.some(service => {
        if (service === "chatting") return agency.providesChatting;
        if (service === "marketing") return agency.providesMarketing;
        if (service === "content") return agency.providesContent;
        return false;
      });
      if (!hasService) return false;
    }

    // Remote filter
    if (remoteOnly && !agency.acceptsRemote) return false;

    // Min share filter
    if (minShare > 0 && agency.minRevenueShare < minShare) return false;

    // Status filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "NOT_APPLIED" && agency.applicationStatus) return false;
      if (statusFilter !== "NOT_APPLIED" && agency.applicationStatus !== statusFilter) return false;
    }

    return true;
  });

  const toggleService = (service: string) => {
    setServiceFilters(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
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
            Rejected
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

  const hasActiveFilters = serviceFilters.length > 0 || remoteOnly || minShare > 0 || statusFilter !== "ALL";

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
            Find Agency
          </h1>
          <p className="text-gray-400">
            Browse agencies looking for talent like you
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/applications">
            <Button variant="outline" className="gap-2 relative">
              <Inbox className="w-4 h-4" />
              Applications
              {pendingReceived > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {pendingReceived}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/dashboard/find-agency/my-listing">
            <Button variant="premium" className="gap-2">
              <FileText className="w-4 h-4" />
              My Listing
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* No Listing Warning */}
      {!data?.hasListing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-4 border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-400">
                  Create your listing first
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  You need to create a listing before you can apply to agencies.
                  Your listing shows your photos, bio, and rates.
                </p>
                <Link href="/dashboard/find-agency/my-listing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Create Listing
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

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
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Agencies</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.applied}</p>
              <p className="text-xs text-gray-400">Applied</p>
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
              placeholder="Search agencies..."
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
                {/* Services */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Services Provided
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleService("chatting")}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                        serviceFilters.includes("chatting")
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chatting
                    </button>
                    <button
                      onClick={() => toggleService("marketing")}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                        serviceFilters.includes("marketing")
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      Marketing
                    </button>
                    <button
                      onClick={() => toggleService("content")}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                        serviceFilters.includes("content")
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                      }`}
                    >
                      <Image className="w-3.5 h-3.5" />
                      Content
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Application Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["ALL", "NOT_APPLIED", "PENDING", "ACCEPTED"] as const).map((status) => (
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
                           status === "NOT_APPLIED" ? "Not Applied" :
                           status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Min Revenue Share */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Min Revenue Share: {minShare > 0 ? `${minShare}%+` : "Any"}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="10"
                      value={minShare}
                      onChange={(e) => setMinShare(parseInt(e.target.value))}
                      className="w-full accent-[var(--gold)]"
                    />
                  </div>

                  {/* Remote Only */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Options
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remoteOnly}
                        onChange={(e) => setRemoteOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-500 accent-[var(--gold)]"
                      />
                      <span className="text-sm text-gray-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Remote Only
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
                      setServiceFilters([]);
                      setRemoteOnly(false);
                      setMinShare(0);
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
      {filteredAgencies && (
        <p className="text-sm text-gray-500">
          {filteredAgencies.length} agenc{filteredAgencies.length !== 1 ? "ies" : "y"} found
        </p>
      )}

      {/* Agencies Grid */}
      {filteredAgencies && filteredAgencies.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredAgencies.map((agency, index) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card
                className="p-5 h-full flex flex-col hover:border-[var(--gold)]/30 transition-colors cursor-pointer"
                onClick={() => setSelectedAgency(agency)}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  {agency.logo ? (
                    <img
                      src={agency.logo}
                      alt={agency.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-[var(--border)] flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {agency.name}
                    </h3>
                    {agency.headline && (
                      <p className="text-xs text-[var(--gold)] truncate">{agency.headline}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{agency.creatorCount} creators</span>
                      </div>
                      {agency.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{agency.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {agency.applicationStatus && (
                    <div className="flex-shrink-0">
                      {getStatusBadge(agency.applicationStatus)}
                    </div>
                  )}
                </div>

                {/* Rating & Revenue Share */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {agency.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      {renderStars(agency.averageRating)}
                      <span className="text-xs text-gray-400">({agency.reviewCount})</span>
                    </div>
                  )}
                  <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
                    <Percent className="w-3 h-3" />
                    You keep {agency.minRevenueShare}-{agency.maxRevenueShare}%
                  </Badge>
                </div>

                {/* Services Provided */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agency.providesChatting && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 flex items-center gap-1">
                      <MessageCircle className="w-2.5 h-2.5" />
                      Chatting
                    </span>
                  )}
                  {agency.providesMarketing && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 flex items-center gap-1">
                      <Megaphone className="w-2.5 h-2.5" />
                      Marketing
                    </span>
                  )}
                  {agency.providesContent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/20 text-pink-300 flex items-center gap-1">
                      <Image className="w-2.5 h-2.5" />
                      Content
                    </span>
                  )}
                  {agency.acceptsRemote && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      Remote OK
                    </span>
                  )}
                </div>

                {/* Description */}
                {agency.description && (
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3 flex-1">
                    {agency.description}
                  </p>
                )}

                {/* Creators Preview */}
                {agency.creators.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Creators:</p>
                    <div className="flex -space-x-2">
                      {agency.creators.slice(0, 5).map((creator) => (
                        <div
                          key={creator.id}
                          className="w-8 h-8 rounded-full border-2 border-[var(--surface)] overflow-hidden"
                          title={creator.displayName || creator.name}
                        >
                          {creator.avatar ? (
                            <img
                              src={creator.avatar}
                              alt={creator.displayName || creator.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center text-xs text-black font-bold">
                              {(creator.displayName || creator.name)?.[0]}
                            </div>
                          )}
                        </div>
                      ))}
                      {agency.creatorCount > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--surface)] flex items-center justify-center text-xs text-gray-400">
                          +{agency.creatorCount - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div
                  className="flex gap-2 mt-auto pt-4 border-t border-[var(--border)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!agency.applicationStatus ? (
                    <Button
                      variant="premium"
                      className="flex-1 gap-2"
                      disabled={!data?.hasListing || applyingTo === agency.id}
                      onClick={() => setShowApplyModal(agency)}
                    >
                      {applyingTo === agency.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Apply
                    </Button>
                  ) : agency.applicationStatus === "ACCEPTED" ? (
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
                      {agency.applicationStatus === "PENDING"
                        ? "Application Sent"
                        : "Application Rejected"}
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
              <Building2 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No agencies found
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery || hasActiveFilters
                ? "Try adjusting your filters"
                : "No agencies are currently looking for creators"}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Agency Detail Modal */}
      {selectedAgency && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedAgency(null)}
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
                  {selectedAgency.logo ? (
                    <img
                      src={selectedAgency.logo}
                      alt={selectedAgency.name}
                      className="w-20 h-20 rounded-xl object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-[var(--border)] flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedAgency.name}</h2>
                        {selectedAgency.headline && (
                          <p className="text-sm text-[var(--gold)] mt-1">{selectedAgency.headline}</p>
                        )}
                      </div>
                      {selectedAgency.applicationStatus && getStatusBadge(selectedAgency.applicationStatus)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{selectedAgency.creatorCount} creators</span>
                      </div>
                      {selectedAgency.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedAgency.location}</span>
                        </div>
                      )}
                      {selectedAgency.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          {renderStars(selectedAgency.averageRating)}
                          <span className="text-sm text-gray-400">
                            {selectedAgency.averageRating.toFixed(1)} ({selectedAgency.reviewCount} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Revenue Share */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 gap-1 text-sm py-1.5 px-3">
                    <Percent className="w-4 h-4" />
                    You keep {selectedAgency.minRevenueShare}-{selectedAgency.maxRevenueShare}%
                  </Badge>
                  {selectedAgency.acceptsRemote && (
                    <Badge className="bg-blue-500/20 text-blue-400 gap-1 text-sm py-1.5 px-3">
                      <Globe className="w-4 h-4" />
                      Remote OK
                    </Badge>
                  )}
                </div>

                {/* Services */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Services Provided</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgency.providesChatting && (
                      <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        Chatting
                      </span>
                    )}
                    {selectedAgency.providesMarketing && (
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300 flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4" />
                        Marketing
                      </span>
                    )}
                    {selectedAgency.providesContent && (
                      <span className="px-3 py-1 rounded-full text-sm bg-pink-500/20 text-pink-300 flex items-center gap-1.5">
                        <Image className="w-4 h-4" />
                        Content Creation
                      </span>
                    )}
                    {!selectedAgency.providesChatting && !selectedAgency.providesMarketing && !selectedAgency.providesContent && (
                      <span className="text-sm text-gray-500">No specific services listed</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedAgency.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedAgency.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {selectedAgency.requirements && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Requirements</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedAgency.requirements}</p>
                  </div>
                )}

                {/* Looking For */}
                {selectedAgency.lookingFor.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Looking For</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgency.lookingFor.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm bg-white/5 text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creators */}
                {selectedAgency.creators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Our Creators</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgency.creators.map((creator) => (
                        <Link
                          key={creator.id}
                          href={`/${creator.slug}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {creator.avatar ? (
                            <img
                              src={creator.avatar}
                              alt={creator.displayName || creator.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center text-xs text-black font-bold">
                              {(creator.displayName || creator.name)?.[0]}
                            </div>
                          )}
                          <span className="text-sm text-gray-300">
                            {creator.displayName || creator.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website */}
                {selectedAgency.website && (
                  <div>
                    <a
                      href={selectedAgency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--gold)] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedAgency(null)}
                  >
                    Close
                  </Button>
                  {!selectedAgency.applicationStatus ? (
                    <Button
                      variant="premium"
                      className="flex-1 gap-2"
                      disabled={!data?.hasListing}
                      onClick={() => {
                        setSelectedAgency(null);
                        setShowApplyModal(selectedAgency);
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Apply
                    </Button>
                  ) : selectedAgency.applicationStatus === "ACCEPTED" ? (
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

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {showApplyModal.logo ? (
                  <img
                    src={showApplyModal.logo}
                    alt={showApplyModal.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Apply to {showApplyModal.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Send a message with your application
                  </p>
                </div>
              </div>

              <textarea
                placeholder="Introduce yourself and explain why you'd be a good fit... (optional)"
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
                  Send Application
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
