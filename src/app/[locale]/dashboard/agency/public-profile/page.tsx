"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  Loader2,
  X,
  Plus,
  Instagram,
  Twitter,
  Globe,
  Percent,
  Image as ImageIcon,
  Tag,
  Building2,
  Eye,
  MapPin,
  Languages,
  Calendar,
  Briefcase,
  Check,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { CREATOR_CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const AGENCY_SERVICES = [
  { id: "management", label: "Full Management" },
  { id: "chatting", label: "Chatting Services" },
  { id: "marketing", label: "Marketing & Promotion" },
  { id: "content", label: "Content Strategy" },
  { id: "editing", label: "Photo/Video Editing" },
  { id: "coaching", label: "Creator Coaching" },
  { id: "analytics", label: "Analytics & Growth" },
  { id: "legal", label: "Legal & Contracts" },
];

const LANGUAGES = [
  "English", "French", "Spanish", "German", "Italian", "Portuguese",
  "Dutch", "Russian", "Polish", "Romanian", "Arabic", "Chinese", "Japanese", "Korean"
];

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  tagline: string | null;
  services: string[];
  specialties: string[];
  minRevenueShare: number | null;
  maxRevenueShare: number | null;
  socialLinks: { instagram?: string; twitter?: string; tiktok?: string };
  portfolioImages: string[];
  location: string | null;
  languages: string[];
  yearsInBusiness: number | null;
  publicVisible: boolean;
}

export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [logo, setLogo] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [minRevenueShare, setMinRevenueShare] = useState(50);
  const [maxRevenueShare, setMaxRevenueShare] = useState(70);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [yearsInBusiness, setYearsInBusiness] = useState<number | null>(null);
  const [publicVisible, setPublicVisible] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  useEffect(() => {
    if (status === "authenticated" && !isAgencyOwner) {
      router.push("/dashboard");
    }
  }, [status, isAgencyOwner, router]);

  useEffect(() => {
    if (status === "authenticated" && isAgencyOwner) {
      fetchAgency();
    }
  }, [status, isAgencyOwner]);

  const fetchAgency = async () => {
    try {
      const res = await fetch("/api/agency");
      if (res.ok) {
        const data = await res.json();
        if (data.agencies?.[0]) {
          const ag = data.agencies[0];
          setAgency(ag);
          setLogo(ag.logo);
          setDescription(ag.description || "");
          setTagline(ag.tagline || "");
          setWebsite(ag.website || "");
          setServices(ag.services || []);
          setSpecialties(ag.specialties || []);
          setMinRevenueShare(ag.minRevenueShare || 50);
          setMaxRevenueShare(ag.maxRevenueShare || 70);
          setInstagram(ag.socialLinks?.instagram || "");
          setTwitter(ag.socialLinks?.twitter || "");
          setTiktok(ag.socialLinks?.tiktok || "");
          setPortfolioImages(ag.portfolioImages || []);
          setLocation(ag.location || "");
          setLanguages(ag.languages || []);
          setYearsInBusiness(ag.yearsInBusiness);
          setPublicVisible(ag.publicVisible || false);
        }
      }
    } catch (error) {
      console.error("Error fetching agency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogo(data.files?.[0]?.url || null);
      } else {
        setMessage({ type: "error", text: "Failed to upload logo" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload logo" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (portfolioImages.length >= 6) {
      setMessage({ type: "error", text: "Maximum 6 portfolio images" });
      return;
    }

    setIsUploadingPortfolio(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "listing");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.files?.[0]?.url;
        if (url) {
          setPortfolioImages([...portfolioImages, url]);
        }
      } else {
        setMessage({ type: "error", text: "Failed to upload image" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  const toggleService = (serviceId: string) => {
    if (services.includes(serviceId)) {
      setServices(services.filter(s => s !== serviceId));
    } else {
      setServices([...services, serviceId]);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSave = async () => {
    if (!agency) return;

    // Validation
    if (!description.trim()) {
      setMessage({ type: "error", text: "Please add a description" });
      return;
    }

    if (services.length === 0) {
      setMessage({ type: "error", text: "Please select at least one service" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          logo,
          description,
          tagline,
          website,
          services,
          specialties,
          minRevenueShare,
          maxRevenueShare,
          socialLinks: { instagram, twitter, tiktok },
          portfolioImages,
          location,
          languages,
          yearsInBusiness,
          publicVisible,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgency(data.agency);
        setMessage({ type: "success", text: "Profile saved!" });
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
          Public Profile
        </h1>
        <p className="text-[var(--muted)]">
          Fill out your profile to appear in the "Find Agencies" section for creators
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Logo & Basic Info */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Agency Branding
          </h2>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                    {isUploadingLogo ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <span className="text-xs text-[var(--muted)]">Click to upload</span>
            </div>

            {/* Tagline */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Your agency's tagline..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="https://youragency.com"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">About Your Agency</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            placeholder="Describe your agency, your experience, what makes you different, and what you offer to creators..."
          />
        </Card>

        {/* Services */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Services Offered
          </h2>
          <div className="flex flex-wrap gap-2">
            {AGENCY_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  services.includes(service.id)
                    ? "bg-purple-500 text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                )}
              >
                {services.includes(service.id) && <Check className="w-3 h-3 inline mr-1" />}
                {service.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content Specialties */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            Content Specialties
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            What type of creators do you work with?
          </p>
          <div className="flex flex-wrap gap-2">
            {CREATOR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleSpecialty(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  specialties.includes(cat.id)
                    ? "bg-[var(--gold)] text-black"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Revenue Share */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-400" />
            Revenue Share Range
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            What revenue share do you typically offer to creators?
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-2">Minimum (%)</label>
              <input
                type="number"
                value={minRevenueShare}
                onChange={(e) => setMinRevenueShare(parseInt(e.target.value) || 0)}
                min={10}
                max={90}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-2">Maximum (%)</label>
              <input
                type="number"
                value={maxRevenueShare}
                onChange={(e) => setMaxRevenueShare(parseInt(e.target.value) || 0)}
                min={10}
                max={90}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            Creators keep {minRevenueShare}-{maxRevenueShare}% of their earnings
          </p>
        </Card>

        {/* Portfolio Images */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Portfolio (max 6)
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Show off your best work and creator success stories
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {portfolioImages.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePortfolioImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {portfolioImages.length < 6 && (
              <button
                onClick={() => portfolioInputRef.current?.click()}
                disabled={isUploadingPortfolio}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 hover:border-purple-500/50 transition-colors text-[var(--muted)] hover:text-purple-400"
              >
                {isUploadingPortfolio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px]">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={portfolioInputRef}
            type="file"
            accept="image/*"
            onChange={handlePortfolioUpload}
            className="hidden"
          />
        </Card>

        {/* Social Links */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Social Links</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-pink-400" />
              </div>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="@username"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <Twitter className="w-5 h-5 text-sky-400" />
              </div>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="@username"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="@username"
              />
            </div>
          </div>
        </Card>

        {/* Location & Languages */}
        <Card variant="luxury" className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Location & Languages</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="USA, Europe, Worldwide..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <Languages className="w-4 h-4 inline mr-1" />
                Languages Supported
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-colors",
                      languages.includes(lang)
                        ? "bg-purple-500 text-white"
                        : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Years in Business
              </label>
              <input
                type="number"
                value={yearsInBusiness || ""}
                onChange={(e) => setYearsInBusiness(e.target.value ? parseInt(e.target.value) : null)}
                min={0}
                max={50}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="How many years?"
              />
            </div>
          </div>
        </Card>

        {/* Visibility Toggle */}
        <Card variant="luxury" className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Public Visibility</h3>
                <p className="text-sm text-[var(--muted)]">Show your agency in "Find Agencies"</p>
              </div>
            </div>
            <button
              onClick={() => setPublicVisible(!publicVisible)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                publicVisible ? "bg-green-500" : "bg-[var(--border)]"
              )}
            >
              <span className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                publicVisible ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          {!publicVisible && (
            <p className="text-xs text-yellow-400 mt-3">
              Your agency won't appear in search results until you enable visibility
            </p>
          )}
        </Card>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "px-4 py-3 rounded-xl",
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            )}
          >
            {message.text}
          </motion.div>
        )}

        {/* Save Button */}
        <Button
          variant="default"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-700"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
