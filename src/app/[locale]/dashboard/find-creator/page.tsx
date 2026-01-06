"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Star,
  Loader2,
  Search,
  MessageSquare,
  Check,
  Clock,
  X,
  Send,
  Filter,
  Percent,
  MessageCircle,
  Instagram,
  Twitter,
  ChevronDown,
  ChevronUp,
  FileText,
  Inbox,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { CREATOR_CATEGORIES } from "@/lib/categories";

interface ModelListing {
  id: string;
  bio: string | null;
  photos: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
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
  applicationStatus: string | null;
}

interface ListingsData {
  listings: ModelListing[];
  filterOptions: {
    tags: string[];
  };
}

export default function FindCreatorPage() {
  const [data, setData] = useState<ListingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState<ModelListing | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ModelListing | null>(null);
  const [pendingReceived, setPendingReceived] = useState(0);

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [minShare, setMinShare] = useState(5);
  const [maxShare, setMaxShare] = useState(95);
  const [chattingOnly, setChattingOnly] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [selectedTags, minRating, minShare, maxShare, chattingOnly]);

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  async function fetchListings() {
    try {
      const params = new URLSearchParams();
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (minRating > 0) params.set("minRating", minRating.toString());
      if (minShare > 0) params.set("minShare", minShare.toString());
      if (maxShare < 100) params.set("maxShare", maxShare.toString());
      if (chattingOnly) params.set("chattingOnly", "true");

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

  async function handleContact(listing: ModelListing) {
    setContactingId(listing.id);
    try {
      const res = await fetch(`/api/find-model/${listing.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contactMessage }),
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
        setShowContactModal(null);
        setContactMessage("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to contact creator");
      }
    } catch (error) {
      console.error("Error contacting creator:", error);
      alert("Failed to contact creator");
    } finally {
      setContactingId(null);
    }
  }

  const filteredListings = data?.listings.filter((listing) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = listing.creator.displayName || listing.creator.name;
    return (
      name.toLowerCase().includes(q) ||
      listing.bio?.toLowerCase().includes(q) ||
      listing.tags.some((tag) => {
        const category = CREATOR_CATEGORIES.find(c => c.id === tag);
        return tag.toLowerCase().includes(q) || category?.label.toLowerCase().includes(q);
      })
    );
  });

  const getStatusBadge = (status: string | null, small = false) => {
    const baseClass = small
      ? "gap-0.5 text-[10px] px-1.5 py-0.5"
      : "gap-1";
    const iconClass = small ? "w-2.5 h-2.5" : "w-3 h-3";

    switch (status) {
      case "PENDING":
        return (
          <Badge className={`bg-yellow-500/20 text-yellow-400 ${baseClass}`}>
            <Clock className={iconClass} />
            {small ? "" : "Pending"}
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className={`bg-emerald-500/20 text-emerald-400 ${baseClass}`}>
            <Check className={iconClass} />
            {small ? "" : "Accepted"}
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className={`bg-red-500/20 text-red-400 ${baseClass}`}>
            <X className={iconClass} />
            {small ? "" : "Rejected"}
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
            Find Creator
          </h1>
          <p className="text-gray-400">
            Discover talented creators looking to collaborate
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
          <Link href="/dashboard/agency/my-listing">
            <Button variant="premium" className="gap-2">
              <FileText className="w-4 h-4" />
              My Listing
            </Button>
          </Link>
        </div>
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
              placeholder="Search creators..."
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
            Filters
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
                {/* Categories */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CREATOR_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => toggleTag(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedTags.includes(cat.id)
                            ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30"
                            : "bg-white/5 text-gray-400 border border-transparent hover:border-white/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  {/* Revenue Share Range */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Revenue Share: {minShare}% - {maxShare}%
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minShare}
                        onChange={(e) => setMinShare(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-white text-center"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={maxShare}
                        onChange={(e) => setMaxShare(parseInt(e.target.value) || 100)}
                        className="w-20 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-white text-center"
                      />
                    </div>
                  </div>

                  {/* Chatting Only */}
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
                      <span className="text-sm text-gray-300">
                        Available for chatting
                      </span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedTags.length > 0 || minRating > 0 || minShare > 5 || maxShare < 95 || chattingOnly) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTags([]);
                      setMinRating(0);
                      setMinShare(50);
                      setMaxShare(95);
                      setChattingOnly(false);
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
          {filteredListings.length} creator{filteredListings.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Listings Grid */}
      {filteredListings && filteredListings.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card
                className="overflow-hidden h-full flex flex-col hover:border-[var(--gold)]/30 transition-colors cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                {/* Photo */}
                <div className="relative aspect-square">
                  {listing.photos[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.creator.displayName || listing.creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : listing.creator.avatar ? (
                    <img
                      src={listing.creator.avatar}
                      alt={listing.creator.displayName || listing.creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  {/* Status Badge */}
                  {listing.applicationStatus && (
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(listing.applicationStatus, true)}
                    </div>
                  )}

                  {/* Chatting Badge */}
                  {listing.chattingEnabled && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-500/80 text-white gap-0.5 text-[10px] px-1.5 py-0.5">
                        <MessageCircle className="w-2.5 h-2.5" />
                        Chat
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-2.5 flex-1 flex flex-col">
                  {/* Name and Rating */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {listing.creator.displayName || listing.creator.name}
                    </h3>
                    {listing.reviewCount > 0 && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-gray-400">
                          {listing.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Revenue Share */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge className="bg-emerald-500/20 text-emerald-400 gap-0.5 text-[10px] px-1.5 py-0.5">
                      <Percent className="w-2.5 h-2.5" />
                      {listing.revenueShare}%
                    </Badge>
                  </div>

                  {/* Tags - show only 2 on small cards */}
                  {listing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {listing.tags.slice(0, 2).map((tag) => {
                        const category = CREATOR_CATEGORIES.find(c => c.id === tag);
                        return (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400"
                          >
                            {category?.label || tag}
                          </span>
                        );
                      })}
                      {listing.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-500">
                          +{listing.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <div
                    className="mt-auto pt-2 border-t border-[var(--border)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!listing.applicationStatus ? (
                      <Button
                        variant="premium"
                        size="sm"
                        className="w-full gap-1 text-xs py-1.5"
                        onClick={() => setShowContactModal(listing)}
                      >
                        <Send className="w-3 h-3" />
                        Contact
                      </Button>
                    ) : listing.applicationStatus === "ACCEPTED" ? (
                      <Link href="/dashboard/messages" className="block">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs py-1.5">
                          <MessageSquare className="w-3 h-3" />
                          Message
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs py-1.5" disabled>
                        {listing.applicationStatus === "PENDING"
                          ? "Pending"
                          : "Rejected"}
                      </Button>
                    )}
                  </div>
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
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No creators found
            </h3>
            <p className="text-gray-400">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your filters"
                : "No creators are currently available"}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {showContactModal.photos[0] || showContactModal.creator.avatar ? (
                  <img
                    src={showContactModal.photos[0] || showContactModal.creator.avatar || ""}
                    alt={showContactModal.creator.displayName || showContactModal.creator.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center text-black font-bold">
                    {(showContactModal.creator.displayName || showContactModal.creator.name)?.[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Contact {showContactModal.creator.displayName || showContactModal.creator.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Send a message introducing your agency
                  </p>
                </div>
              </div>

              <textarea
                placeholder="Tell them about your agency and why you'd like to work together... (optional)"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold)]/50 resize-none mb-4"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowContactModal(null);
                    setContactMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="premium"
                  className="flex-1 gap-2"
                  disabled={contactingId === showContactModal.id}
                  onClick={() => handleContact(showContactModal)}
                >
                  {contactingId === showContactModal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Contact Request
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden">
              {/* Photos */}
              {selectedListing.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1">
                  {selectedListing.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className={`w-full object-cover ${
                        idx === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedListing.creator.displayName || selectedListing.creator.name}
                    </h2>
                    {selectedListing.reviewCount > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(selectedListing.averageRating)}
                        <span className="text-sm text-gray-400">
                          {selectedListing.averageRating.toFixed(1)} ({selectedListing.reviewCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedListing.applicationStatus && getStatusBadge(selectedListing.applicationStatus)}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    {selectedListing.revenueShare}% revenue share
                  </Badge>
                  {selectedListing.chattingEnabled && (
                    <Badge className="bg-blue-500/20 text-blue-400 gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Available for chatting
                    </Badge>
                  )}
                </div>

                {/* Bio */}
                {selectedListing.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                    <p className="text-white whitespace-pre-wrap">{selectedListing.bio}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedListing.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedListing.tags.map((tag) => {
                        const category = CREATOR_CATEGORIES.find(c => c.id === tag);
                        return (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-sm bg-white/5 text-gray-300"
                          >
                            {category?.label || tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(selectedListing.socialLinks.instagram ||
                  selectedListing.socialLinks.twitter ||
                  selectedListing.socialLinks.tiktok) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Social</h3>
                    <div className="flex gap-3">
                      {selectedListing.socialLinks.instagram && (
                        <a
                          href={`https://instagram.com/${selectedListing.socialLinks.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          @{selectedListing.socialLinks.instagram}
                        </a>
                      )}
                      {selectedListing.socialLinks.twitter && (
                        <a
                          href={`https://twitter.com/${selectedListing.socialLinks.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                          @{selectedListing.socialLinks.twitter}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedListing(null)}
                  >
                    Close
                  </Button>
                  {!selectedListing.applicationStatus ? (
                    <Button
                      variant="premium"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSelectedListing(null);
                        setShowContactModal(selectedListing);
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Contact
                    </Button>
                  ) : selectedListing.applicationStatus === "ACCEPTED" ? (
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
    </div>
  );
}
