"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("passwordRequirements.minLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(data.error || tErrors("tryAgain"));
      }
    } catch (err) {
      setError(tErrors("tryAgain"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card variant="luxury" className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[var(--error)]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
            {tErrors("invalidLink")}
          </h1>
          <p className="text-[var(--muted)] mb-6">
            {tErrors("expiredToken")}
          </p>
          <Link href="/auth/forgot-password">
            <Button variant="premium" className="w-full">
              {t("sendResetLink")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--gold)]/5 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Crown className="w-8 h-8 text-[var(--gold)]" />
            <span className="text-2xl font-semibold gradient-gold-text">
              VipOnly
            </span>
          </Link>
        </div>

        <Card variant="luxury" className="p-8">
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
                {t("passwordUpdated")}
              </h1>
              <p className="text-[var(--muted)]">
                {t("backToLogin")}...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
                  {t("setNewPassword")}
                </h1>
                <p className="text-[var(--muted)]">
                  {t("setNewPasswordSubtitle")}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("newPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12"
                    required
                    minLength={8}
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

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("confirmPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  {t("resetPassword")}
                </Button>
              </form>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
