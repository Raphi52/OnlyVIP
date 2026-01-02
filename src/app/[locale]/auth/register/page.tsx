"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Mail, Lock, User, Eye, EyeOff, Check, Link2, Loader2, Users, Sparkles } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tNav = useTranslations("nav");
  const tHome = useTranslations("home");

  const [accountType, setAccountType] = useState<"fan" | "creator">("fan");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    slug: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugError, setSlugError] = useState("");

  // Auto-generate slug from name
  useEffect(() => {
    if (accountType === "creator" && formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, accountType]);

  // Check slug availability with debounce
  useEffect(() => {
    if (accountType !== "creator" || !formData.slug || formData.slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      setSlugStatus("invalid");
      setSlugError(t("slugValidation"));
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/creator/register?slug=${formData.slug}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus("available");
          setSlugError("");
        } else {
          setSlugStatus("taken");
          setSlugError(data.reason === "reserved" ? t("slugReserved") : t("slugTaken"));
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, accountType]);

  const passwordRequirements = [
    { text: t("passwordRequirements.minLength"), met: formData.password.length >= 8 },
    { text: t("passwordRequirements.hasNumber"), met: /\d/.test(formData.password) },
    { text: t("passwordRequirements.hasUppercase"), met: /[A-Z]/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordMismatch"));
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError(t("agreeTerms"));
      setIsLoading(false);
      return;
    }

    // Creator-specific validation
    if (accountType === "creator") {
      if (!formData.slug || formData.slug.length < 3) {
        setError(t("usernameHelp"));
        setIsLoading(false);
        return;
      }
      if (slugStatus === "taken" || slugStatus === "invalid") {
        setError(t("slugTaken"));
        setIsLoading(false);
        return;
      }
    }

    try {
      // Use different API based on account type
      const endpoint = accountType === "creator"
        ? "/api/auth/creator/register"
        : "/api/auth/register";

      const body = accountType === "creator"
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            slug: formData.slug,
          }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tErrors("tryAgain"));
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/auth/login");
      } else {
        // Redirect creators to their dashboard, fans to main dashboard
        if (accountType === "creator" && data.creatorSlug) {
          router.push("/dashboard/creator");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError(tErrors("tryAgain"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gold)]/5 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Crown className="w-8 h-8 text-[var(--gold)]" />
            <span className="text-2xl font-semibold gradient-gold-text">
              VipOnly
            </span>
          </Link>
        </div>

        <Card variant="luxury" className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              {t("signupTitle")}
            </h1>
            <p className="text-[var(--muted)]">
              {t("signupSubtitle")}
            </p>
          </div>

          {/* Account Type Toggle */}
          <div className="flex gap-2 p-1 bg-[var(--surface)] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAccountType("fan")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                accountType === "fan"
                  ? "bg-[var(--gold)] text-black shadow-lg"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Users className="w-4 h-4" />
              {tNav("joinVip")}
            </button>
            <button
              type="button"
              onClick={() => setAccountType("creator")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                accountType === "creator"
                  ? "bg-[var(--gold)] text-black shadow-lg"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {tNav("becomeCreator")}
            </button>
          </div>

          {/* Creator benefits */}
          {accountType === "creator" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20"
            >
              <p className="text-sm text-[var(--gold)] font-medium mb-2">
                {tHome("forCreators")}:
              </p>
              <ul className="text-xs text-[var(--muted)] space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-[var(--gold)]" />
                  {tHome("unlimitedUploads")}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-[var(--gold)]" />
                  {tHome("zeroFee")} {tHome("firstMonth")}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-[var(--gold)]" />
                  {tHome("customUrl")}
                </li>
              </ul>
            </motion.div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type="text"
                placeholder={t("name")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="pl-12"
                required
              />
            </div>

            {/* Slug field for creators */}
            {accountType === "creator" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <Input
                    type="text"
                    placeholder={t("chooseUsername")}
                    value={formData.slug}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      setFormData({ ...formData, slug: value });
                    }}
                    className={`pl-12 pr-12 ${
                      slugStatus === "available" ? "border-green-500" :
                      slugStatus === "taken" || slugStatus === "invalid" ? "border-red-500" : ""
                    }`}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <Loader2 className="w-4 h-4 text-[var(--muted)] animate-spin" />
                    )}
                    {slugStatus === "available" && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-[var(--muted)]">
                    viponly.fun/<span className="text-[var(--gold)]">{formData.slug || "your-page"}</span>
                  </p>
                  {slugError && (
                    <p className="text-xs text-red-400">{slugError}</p>
                  )}
                </div>
              </motion.div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type="email"
                placeholder={t("email")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {formData.password && (
              <div className="space-y-2">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.text}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check
                      className={`w-4 h-4 ${
                        req.met ? "text-[var(--success)]" : "text-[var(--muted)]"
                      }`}
                    />
                    <span
                      className={
                        req.met
                          ? "text-[var(--success)]"
                          : "text-[var(--muted)]"
                      }
                    >
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="pl-12"
                required
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--gold)] focus:ring-[var(--gold)]"
              />
              <span className="text-sm text-[var(--muted)]">
                {t("termsAgreement")}
              </span>
            </label>

            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {t("createAccount")}
            </Button>
          </form>

          <p className="text-center mt-8 text-sm text-[var(--muted)]">
            {t("hasAccount")}{" "}
            <Link
              href="/auth/login"
              className="text-[var(--gold)] hover:text-[var(--gold-light)] font-medium"
            >
              {t("signIn")}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
