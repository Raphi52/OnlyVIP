"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Star,
  Loader2,
  Check,
  X,
  Clock,
  MessageSquare,
  ChevronRight,
  Inbox,
  Send,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  UserPlus,
  XCircle,
  Handshake,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "IGNORED";
type Perspective = "MODEL" | "AGENCY";

interface Application {
  id: string;
  initiatedBy: "MODEL" | "AGENCY";
  status: ApplicationStatus;
  message: string | null;
  conversationId: string | null;
  perspective: Perspective;
  createdAt: string;
  updatedAt: string;
  otherParty: {
    id: string;
    name?: string;
    slug?: string;
    logo?: string;
    averageRating?: number;
    reviewCount?: number;
    creator?: {
      id: string;
      slug: string;
      name: string;
      displayName: string | null;
      avatar: string | null;
    };
    photos?: string[];
    revenueShare?: number;
    chattingEnabled?: boolean;
  } | null;
}

interface ApplicationsData {
  applications: Application[];
  pendingReceived: number;
  hasListing: boolean;
  hasAgency: boolean;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [data, setData] = useState<ApplicationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent" | "all">("received");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/agency-applications");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(applicationId: string, status: ApplicationStatus) {
    setProcessingId(applicationId);
    try {
      const res = await fetch("/api/agency-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            applications: prev.applications.map((app) =>
              app.id === applicationId ? { ...app, status } : app
            ),
            pendingReceived: status !== "PENDING" ? prev.pendingReceived - 1 : prev.pendingReceived,
          };
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleStartConversation(applicationId: string) {
    setProcessingId(applicationId);
    try {
      const res = await fetch(`/api/agency-applications/${applicationId}/conversation`, {
        method: "POST",
      });

      if (res.ok) {
        const { conversationId } = await res.json();
        router.push(`/dashboard/messages?conversation=${conversationId}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start conversation");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation");
    } finally {
      setProcessingId(null);
    }
  }

  // Calculate stats
  const stats = data ? {
    total: data.applications.length,
    pending: data.applications.filter(a => a.status === "PENDING").length,
    accepted: data.applications.filter(a => a.status === "ACCEPTED").length,
    rejected: data.applications.filter(a => a.status === "REJECTED").length,
    pendingReceived: data.pendingReceived,
  } : { total: 0, pending: 0, accepted: 0, rejected: 0, pendingReceived: 0 };

  const filterApplications = (apps: Application[]) => {
    let filtered = apps;

    // Filter by received/sent/all
    if (activeTab !== "all") {
      filtered = filtered.filter((app) => {
        const isReceived =
          (app.perspective === "MODEL" && app.initiatedBy === "AGENCY") ||
          (app.perspective === "AGENCY" && app.initiatedBy === "MODEL");
        return activeTab === "received" ? isReceived : !isReceived;
      });
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(app => {
        const isAgencyCard = app.perspective === "MODEL";
        const name = isAgencyCard
          ? app.otherParty?.name
          : app.otherParty?.creator?.displayName || app.otherParty?.creator?.name;
        return name?.toLowerCase().includes(q) || app.message?.toLowerCase().includes(q);
      });
    }

    return filtered;
  };

  const filteredApplications = data ? filterApplications(data.applications) : [];

  const getStatusBadge = (status: ApplicationStatus) => {
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
      case "IGNORED":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 gap-1">
            <Eye className="w-3 h-3" />
            Ignored
          </Badge>
        );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
            Applications
          </h1>
          <p className="text-gray-400">
            Manage your agency and model applications
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.hasListing && (
            <Link href="/dashboard/find-agency">
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="w-4 h-4" />
                Find Agencies
              </Button>
            </Link>
          )}
          {data?.hasAgency && (
            <Link href="/dashboard/find-creator">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Find Creators
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total</p>
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
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              <p className="text-xs text-gray-400">Rejected</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search applications..."
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
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["ALL", "PENDING", "ACCEPTED", "REJECTED", "IGNORED"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            statusFilter === status
                              ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
                              : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                          }`}
                        >
                          {status === "ALL" ? "All Statuses" : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {(statusFilter !== "ALL" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="text-gray-400 mt-4"
                  >
                    Clear All Filters
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] w-fit"
      >
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "received"
              ? "bg-[var(--gold)] text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Received
          {data && stats.pendingReceived > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === "received"
                ? "bg-black/20 text-black"
                : "bg-red-500/20 text-red-400"
            }`}>
              {stats.pendingReceived}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "sent"
              ? "bg-[var(--gold)] text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          Sent
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-[var(--gold)] text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All
        </button>
      </motion.div>

      {/* Results Count */}
      {filteredApplications.length > 0 && (
        <p className="text-sm text-gray-500">
          {filteredApplications.length} application{filteredApplications.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredApplications.map((app, index) => {
              const isReceived =
                (app.perspective === "MODEL" && app.initiatedBy === "AGENCY") ||
                (app.perspective === "AGENCY" && app.initiatedBy === "MODEL");

              const isAgencyCard = app.perspective === "MODEL";
              const name = isAgencyCard
                ? app.otherParty?.name
                : app.otherParty?.creator?.displayName || app.otherParty?.creator?.name;
              const image = isAgencyCard
                ? app.otherParty?.logo
                : app.otherParty?.photos?.[0] || app.otherParty?.creator?.avatar;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4 hover:border-[var(--gold)]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {image ? (
                        <img
                          src={image}
                          alt={name || ""}
                          className="w-14 h-14 rounded-xl object-cover border border-[var(--border)] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                          {isAgencyCard ? (
                            <Building2 className="w-6 h-6 text-purple-400" />
                          ) : (
                            <Users className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-white truncate">
                                {name || "Unknown"}
                              </h3>
                              {getStatusBadge(app.status)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs ${isReceived ? 'text-blue-400' : 'text-purple-400'}`}>
                                {isReceived ? "Received" : "Sent"}
                              </span>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(app.createdAt)}
                              </span>
                              {app.otherParty?.reviewCount && app.otherParty.reviewCount > 0 && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <div className="flex items-center gap-1">
                                    {renderStars(app.otherParty.averageRating || 0)}
                                    <span className="text-xs text-gray-500">
                                      ({app.otherParty.reviewCount})
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Perspective Badge */}
                          <Badge className={`flex-shrink-0 hidden sm:flex ${
                            app.perspective === "MODEL"
                              ? "bg-pink-500/20 text-pink-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}>
                            {app.perspective === "MODEL" ? "As Creator" : "As Agency"}
                          </Badge>
                        </div>

                        {/* Message */}
                        {app.message && (
                          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                            &ldquo;{app.message}&rdquo;
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {app.status === "PENDING" && isReceived && (
                            <>
                              <Button
                                variant="premium"
                                size="sm"
                                className="gap-1"
                                disabled={processingId === app.id}
                                onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                              >
                                {processingId === app.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                                disabled={processingId === app.id}
                                onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-gray-400"
                                disabled={processingId === app.id}
                                onClick={() => handleUpdateStatus(app.id, "IGNORED")}
                              >
                                <Eye className="w-3 h-3" />
                                Ignore
                              </Button>
                            </>
                          )}

                          {app.status === "ACCEPTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={processingId === app.id}
                              onClick={() => handleStartConversation(app.id)}
                            >
                              {processingId === app.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <MessageSquare className="w-3 h-3" />
                              )}
                              {app.conversationId ? "Open Chat" : "Start Chat"}
                            </Button>
                          )}

                          {/* View Profile Links */}
                          {isAgencyCard && app.otherParty?.slug && (
                            <Link href={`/agency/${app.otherParty.slug}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                View Agency
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                          {!isAgencyCard && app.otherParty?.creator?.slug && (
                            <Link href={`/${app.otherParty.creator.slug}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                View Profile
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 text-center">
            {activeTab === "received" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No received applications
                </h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto">
                  {data?.hasListing
                    ? "Agencies will be able to find and contact you through your listing"
                    : "Create a listing to receive applications from agencies"}
                </p>
                {!data?.hasListing && (
                  <Link href="/dashboard/find-agency/my-listing">
                    <Button variant="premium" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Listing
                    </Button>
                  </Link>
                )}
              </>
            ) : activeTab === "sent" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No sent applications
                </h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto">
                  Browse agencies or creators to send your first application
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  {data?.hasListing && (
                    <Link href="/dashboard/find-agency">
                      <Button variant="outline" className="gap-2">
                        <Building2 className="w-4 h-4" />
                        Find Agencies
                      </Button>
                    </Link>
                  )}
                  {data?.hasAgency && (
                    <Link href="/dashboard/find-creator">
                      <Button variant="outline" className="gap-2">
                        <Users className="w-4 h-4" />
                        Find Creators
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Your applications will appear here
                </p>
              </>
            )}
          </Card>
        </motion.div>
      )}

      {/* Info Cards */}
      {(!data?.hasListing || !data?.hasAgency) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {!data?.hasListing && (
            <Card className="p-4 border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/10 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Looking for agencies?
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Create a listing to showcase yourself to agencies
                  </p>
                  <Link href="/dashboard/find-agency/my-listing">
                    <Button variant="premium" size="sm" className="gap-1">
                      Create Listing
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {!data?.hasAgency && (
            <Card className="p-4 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Looking for creators?
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Create an agency to browse and contact creators
                  </p>
                  <Link href="/dashboard/become-agency">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      Create Agency
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
