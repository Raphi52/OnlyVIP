"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  X,
  Plus,
  Percent,
  Eye,
  ArrowLeft,
  Users,
  MessageCircle,
  Camera,
  Megaphone,
  MapPin,
  Globe,
  Tag,
  Trash2,
  FileText,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { CREATOR_CATEGORIES } from "@/lib/categories";

interface AgencyListing {
  id: string;
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
  isActive: boolean;
}

interface Agency {
  id: string;
  name: string;
  logo: string | null;
}

const LOOKING_FOR_OPTIONS = [
  { id: "female", label: "Female Creators" },
  { id: "male", label: "Male Creators" },
  { id: "couple", label: "Couples" },
  { id: "trans", label: "Trans Creators" },
  { id: "any", label: "Any Gender" },
];

export default function AgencyMyListingPage() {
  const [listing, setListing] = useState<AgencyListing | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [requirements, setRequirements] = useState("");
  const [minRevenueShare, setMinRevenueShare] = useState(50);
  const [maxRevenueShare, setMaxRevenueShare] = useState(70);
  const [providesContent, setProvidesContent] = useState(false);
  const [providesChatting, setProvidesChatting] = useState(true);
  const [providesMarketing, setProvidesMarketing] = useState(true);
  const [location, setLocation] = useState("");
  const [acceptsRemote, setAcceptsRemote] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchListing();
  }, []);

  async function fetchListing() {
    try {
      const res = await fetch("/api/agency/listing");
      if (res.ok) {
        const data = await res.json();
        setAgency(data.agency);
        if (data.listing) {
          setListing(data.listing);
          setHeadline(data.listing.headline || "");
          setDescription(data.listing.description || "");
          setLookingFor(data.listing.lookingFor || []);
          setContentTypes(data.listing.contentTypes || []);
          setRequirements(data.listing.requirements || "");
          setMinRevenueShare(data.listing.minRevenueShare || 50);
          setMaxRevenueShare(data.listing.maxRevenueShare || 70);
          setProvidesContent(data.listing.providesContent || false);
          setProvidesChatting(data.listing.providesChatting !== false);
          setProvidesMarketing(data.listing.providesMarketing !== false);
          setLocation(data.listing.location || "");
          setAcceptsRemote(data.listing.acceptsRemote !== false);
          setIsActive(data.listing.isActive !== false);
        }
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleLookingFor = (id: string) => {
    if (lookingFor.includes(id)) {
      setLookingFor(lookingFor.filter((l) => l !== id));
    } else {
      setLookingFor([...lookingFor, id]);
    }
  };

  const toggleContentType = (id: string) => {
    if (contentTypes.includes(id)) {
      setContentTypes(contentTypes.filter((c) => c !== id));
    } else {
      setContentTypes([...contentTypes, id]);
    }
  };

  async function handleSave() {
    if (!description.trim()) {
      setMessage({ type: "error", text: "Description is required" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        headline,
        description,
        lookingFor,
        contentTypes,
        requirements,
        minRevenueShare,
        maxRevenueShare,
        providesContent,
        providesChatting,
        providesMarketing,
        location,
        acceptsRemote,
        isActive,
      };

      const method = listing ? "PATCH" : "POST";
      const res = await fetch("/api/agency/listing", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setListing(data.listing);
        setMessage({
          type: "success",
          text: listing ? "Listing updated!" : "Listing created! You are now visible in Find Agency.",
        });
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save" });
      }
    } catch (error) {
      console.error("Error saving listing:", error);
      setMessage({ type: "error", text: "Failed to save listing" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your listing? You will no longer appear in Find Agency.")) return;

    try {
      const res = await fetch("/api/agency/listing", { method: "DELETE" });
      if (res.ok) {
        setListing(null);
        setHeadline("");
        setDescription("");
        setLookingFor([]);
        setContentTypes([]);
        setRequirements("");
        setMinRevenueShare(50);
        setMaxRevenueShare(70);
        setProvidesContent(false);
        setProvidesChatting(true);
        setProvidesMarketing(true);
        setLocation("");
        setAcceptsRemote(true);
        setIsActive(true);
        setMessage({ type: "success", text: "Listing deleted" });
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card variant="luxury" className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Agency Found</h2>
          <p className="text-[var(--muted)]">You need to create an agency first.</p>
          <Link href="/dashboard/become-agency">
            <Button variant="premium" className="mt-4">Create Agency</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/agency"
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--muted)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {listing ? "Edit Listing" : "Create Listing"}
            </h1>
            <p className="text-[var(--muted)] text-sm">
              {listing
                ? "Update your listing to attract the right models"
                : "Create a listing to appear in Find Agency and attract models"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Headline */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--gold)]" />
              Headline
            </h2>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
              placeholder="e.g., Looking for ambitious creators to join our team"
              maxLength={100}
            />
          </Card>

          {/* Description */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Description <span className="text-red-400">*</span>
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 resize-none"
              placeholder="Describe your agency, what you offer to creators, your track record, and why models should work with you..."
            />
          </Card>

          {/* Looking For */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--gold)]" />
              Looking For
            </h2>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleLookingFor(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.includes(option.id)
                      ? "bg-[var(--gold)] text-black"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Content Types */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[var(--gold)]" />
              Content Types We Work With
            </h2>
            <div className="flex flex-wrap gap-2">
              {CREATOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleContentType(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    contentTypes.includes(cat.id)
                      ? "bg-purple-500 text-white"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Requirements */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Requirements</h2>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 resize-none"
              placeholder="What do you require from models? (e.g., minimum follower count, content quality, posting frequency...)"
            />
          </Card>

          {/* Revenue Share Range */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-[var(--gold)]" />
              Revenue Share Offered to Creators
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              What percentage of earnings do creators keep when working with you?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--muted)] mb-2 block">Minimum %</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={minRevenueShare}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMinRevenueShare(val);
                      if (val > maxRevenueShare) setMaxRevenueShare(val);
                    }}
                    className="flex-1 accent-[var(--gold)]"
                  />
                  <span className="min-w-[50px] text-center px-2 py-1 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] font-bold text-sm">
                    {minRevenueShare}%
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--muted)] mb-2 block">Maximum %</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={maxRevenueShare}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMaxRevenueShare(val);
                      if (val < minRevenueShare) setMinRevenueShare(val);
                    }}
                    className="flex-1 accent-[var(--gold)]"
                  />
                  <span className="min-w-[50px] text-center px-2 py-1 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] font-bold text-sm">
                    {maxRevenueShare}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              Creators keep {minRevenueShare}-{maxRevenueShare}% of their earnings
            </p>
          </Card>

          {/* Services Provided */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Services We Provide</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Content Production</h3>
                    <p className="text-sm text-[var(--muted)]">We provide photo/video shoots</p>
                  </div>
                </div>
                <button
                  onClick={() => setProvidesContent(!providesContent)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    providesContent ? "bg-pink-500" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      providesContent ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Chatting Services</h3>
                    <p className="text-sm text-[var(--muted)]">We provide chatters/AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setProvidesChatting(!providesChatting)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    providesChatting ? "bg-purple-500" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      providesChatting ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Marketing</h3>
                    <p className="text-sm text-[var(--muted)]">We handle promotion & growth</p>
                  </div>
                </div>
                <button
                  onClick={() => setProvidesMarketing(!providesMarketing)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    providesMarketing ? "bg-blue-500" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      providesMarketing ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card variant="luxury" className="p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--gold)]" />
              Location
            </h2>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 mb-4"
              placeholder="e.g., Los Angeles, USA"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">Accept Remote Models</h3>
                  <p className="text-sm text-[var(--muted)]">Work with creators worldwide</p>
                </div>
              </div>
              <button
                onClick={() => setAcceptsRemote(!acceptsRemote)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  acceptsRemote ? "bg-emerald-500" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    acceptsRemote ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Active Toggle */}
          {listing && (
            <Card variant="luxury" className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Listing Active</h3>
                    <p className="text-sm text-[var(--muted)]">Visible to models in Find Agency</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isActive ? "bg-green-500" : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isActive ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </Card>
          )}

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-3 rounded-xl ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="premium"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {listing ? "Save Changes" : "Create Listing"}
            </Button>
            {listing && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
