"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

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

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tErrors("tryAgain"));
        return;
      }

      // Show success message - user needs to verify email before logging in
      setSuccess(true);
    } catch (err) {
      setError(tErrors("tryAgain"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
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
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
                Check your email
              </h2>
              <p className="text-[var(--muted)] mb-6">
                We sent a verification link to <span className="text-[var(--foreground)]">{formData.email}</span>.
                Please click the link to verify your account.
              </p>
              <Link href="/auth/login">
                <Button variant="gold-outline" size="lg">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
          <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              {t("signupTitle")}
            </h1>
            <p className="text-[var(--muted)]">
              {t("signupSubtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In Button - First */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mb-6"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("google")}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[var(--surface-card)] text-sm text-[var(--muted)]">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

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
          </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
