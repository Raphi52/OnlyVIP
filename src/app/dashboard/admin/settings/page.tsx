"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  Globe,
  Loader2,
  Check,
  ImageIcon,
  X,
  Shield,
  CreditCard,
  Bell,
  Lock,
  Palette,
  Camera,
  Percent,
  Wallet,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  accentColor: string;
  stripeEnabled: boolean;
  cryptoEnabled: boolean;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  // Platform commission settings
  platformWalletEth: string | null;
  platformWalletBtc: string | null;
  platformCommission: number;
  firstMonthFreeCommission: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SiteSettings>({
    siteName: "",
    siteDescription: "",
    siteUrl: "",
    logo: null,
    favicon: null,
    primaryColor: "#D4AF37",
    accentColor: "#B8860B",
    stripeEnabled: true,
    cryptoEnabled: false,
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    // Platform commission settings
    platformWalletEth: null,
    platformWalletBtc: null,
    platformCommission: 0.05,
    firstMonthFreeCommission: true,
  });

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchSettings();
  }, [session, status, isAdmin, router]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
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
      formData.append("type", "logo");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setSettings((prev) => ({ ...prev, logo: uploadedFile.url }));
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "favicon");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedFile = data.files?.[0] || data;
        setSettings((prev) => ({ ...prev, favicon: uploadedFile.url }));
      }
    } catch (error) {
      console.error("Error uploading favicon:", error);
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Site Settings
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Configure global settings for the platform
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--gold)]" />
                General Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, siteName: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, siteDescription: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] resize-none"
                    placeholder="Enter site description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, siteUrl: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--gold)]" />
                Branding
              </h2>

              <div className="space-y-6">
                {/* Logo and Favicon */}
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Logo */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                      Logo
                    </p>
                    <div className="relative">
                      <div className="w-full h-24 rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors flex items-center justify-center">
                        {settings.logo ? (
                          <div className="relative w-full h-full group flex items-center justify-center">
                            <img
                              src={settings.logo}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => logoInputRef.current?.click()}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              >
                                <Camera className="w-5 h-5 text-white" />
                              </button>
                              <button
                                onClick={() =>
                                  setSettings((prev) => ({ ...prev, logo: null }))
                                }
                                className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="flex flex-col items-center gap-2 text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                          >
                            {isUploadingLogo ? (
                              <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="w-8 h-8" />
                                <span className="text-sm">Upload Logo</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="w-32">
                    <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                      Favicon
                    </p>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--gold)]/50 transition-colors">
                        {settings.favicon ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={settings.favicon}
                              alt="Favicon"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() =>
                                  setSettings((prev) => ({ ...prev, favicon: null }))
                                }
                                className="p-1 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => faviconInputRef.current?.click()}
                            disabled={isUploadingFavicon}
                            className="w-full h-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                          >
                            {isUploadingFavicon ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <ImageIcon className="w-6 h-6" />
                            )}
                          </button>
                        )}
                      </div>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFaviconUpload}
                      />
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            accentColor: e.target.value,
                          }))
                        }
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            accentColor: e.target.value,
                          }))
                        }
                        className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--gold)]" />
                Payment Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Stripe Payments</p>
                    <p className="text-sm text-[var(--muted)]">Accept credit/debit cards</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        stripeEnabled: !prev.stripeEnabled,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.stripeEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.stripeEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Crypto Payments</p>
                    <p className="text-sm text-[var(--muted)]">Accept cryptocurrency</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        cryptoEnabled: !prev.cryptoEnabled,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.cryptoEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.cryptoEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Commission & Platform Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[var(--gold)]" />
                Commission & Platform Wallet
              </h2>

              <div className="space-y-4">
                {/* Commission Rate */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Platform Commission Rate (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={(settings.platformCommission * 100).toFixed(1)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          platformCommission: parseFloat(e.target.value) / 100,
                        }))
                      }
                      className="w-24 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] text-center"
                    />
                    <span className="text-[var(--muted)]">%</span>
                    <span className="text-sm text-[var(--muted)] ml-2">
                      (Creator receives {((1 - settings.platformCommission) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* First Month Free Commission */}
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">First Month Free</p>
                    <p className="text-sm text-[var(--muted)]">0% commission for creators in their first month</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        firstMonthFreeCommission: !prev.firstMonthFreeCommission,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.firstMonthFreeCommission ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.firstMonthFreeCommission ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Platform Wallet ETH */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Platform Wallet (ETH/USDT)
                  </label>
                  <input
                    type="text"
                    value={settings.platformWalletEth || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        platformWalletEth: e.target.value || null,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                {/* Platform Wallet BTC */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Platform Wallet (BTC)
                  </label>
                  <input
                    type="text"
                    value={settings.platformWalletBtc || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        platformWalletBtc: e.target.value || null,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--gold)] font-mono text-sm"
                    placeholder="bc1... or 1... or 3..."
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-xl">
                  <p className="text-sm text-[var(--foreground)]">
                    <strong>How it works:</strong> When users spend credits on media, tips, or PPV content,
                    the platform takes {(settings.platformCommission * 100).toFixed(1)}% commission
                    {settings.firstMonthFreeCommission && " (0% for creators in their first month)"}.
                    The remaining {((1 - settings.platformCommission) * 100).toFixed(1)}% goes to the creator.
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-2">
                    1000 credits = 10€ | Example: User spends 1000 credits → Creator receives {(10 * (1 - settings.platformCommission)).toFixed(2)}€
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[var(--gold)]" />
                Security & Access
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Maintenance Mode</p>
                    <p className="text-sm text-[var(--muted)]">Only admins can access the site</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        maintenanceMode: !prev.maintenanceMode,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.maintenanceMode ? "bg-red-500" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.maintenanceMode ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">User Registration</p>
                    <p className="text-sm text-[var(--muted)]">Allow new users to register</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        registrationEnabled: !prev.registrationEnabled,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.registrationEnabled ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.registrationEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="luxury" className="p-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--gold)]" />
                Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Email Notifications</p>
                    <p className="text-sm text-[var(--muted)]">Send email notifications to users</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        emailNotifications: !prev.emailNotifications,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.emailNotifications ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.emailNotifications ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Push Notifications</p>
                    <p className="text-sm text-[var(--muted)]">Send browser push notifications</p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        pushNotifications: !prev.pushNotifications,
                      }))
                    }
                    className={`w-14 h-8 rounded-full transition-colors ${
                      settings.pushNotifications ? "bg-[var(--gold)]" : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        settings.pushNotifications ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end"
          >
            <Button
              variant="premium"
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
