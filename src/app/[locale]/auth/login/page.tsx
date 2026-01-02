"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { useTranslations } from "next-intl";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");

  // Only use callbackUrl if it's a simple path, not a full URL with query params
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = rawCallbackUrl && !rawCallbackUrl.includes("?")
    ? rawCallbackUrl
    : "/dashboard";

  const verified = searchParams.get("verified") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setEmailNotVerified(false);
    setResendSuccess(false);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if email is not verified
        if (result.error.includes("EMAIL_NOT_VERIFIED") || result.error === "CredentialsSignin") {
          // Check verification status via API
          const checkRes = await fetch("/api/auth/check-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const checkData = await checkRes.json();

          if (checkData.needsVerification) {
            setEmailNotVerified(true);
            setError("");
            return;
          }
        }
        setError(t("invalidCredentials"));
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError(tErrors("tryAgain"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.sent || data.message) {
        setResendSuccess(true);
      } else {
        setError(data.error || tErrors("verificationFailed"));
      }
    } catch (err) {
      setError(tErrors("verificationFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              {t("loginTitle")}
            </h1>
            <p className="text-[var(--muted)]">
              {t("loginSubtitle")}
            </p>
          </div>

          {verified && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{t("emailVerifiedSuccess")}</span>
            </div>
          )}

          {urlError && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                {urlError === "expired_token" && tErrors("expiredToken")}
                {urlError === "invalid_token" && tErrors("invalidLink")}
                {urlError === "missing_token" && tErrors("missingToken")}
                {urlError === "user_not_found" && tErrors("userNotFound")}
                {urlError === "verification_failed" && tErrors("verificationFailed")}
                {!["expired_token", "invalid_token", "missing_token", "user_not_found", "verification_failed"].includes(urlError) && tErrors("somethingWentWrong")}
              </span>
            </div>
          )}

          {emailNotVerified && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">{t("emailNotVerified")}</p>
                  <p className="text-sm opacity-80 mb-3">
                    {t("verifyEmailPrompt")}
                  </p>
                  {resendSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">{t("verificationSent")}</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      isLoading={resendLoading}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {t("resendVerification")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--gold)] focus:ring-[var(--gold)]"
                />
                <span className="text-sm text-[var(--muted)]">{t("rememberMe")}</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[var(--gold)] hover:text-[var(--gold-light)]"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {t("signIn")}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[var(--surface-card)] text-sm text-[var(--muted)]">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
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

          <p className="text-center mt-8 text-sm text-[var(--muted)]">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="text-[var(--gold)] hover:text-[var(--gold-light)] font-medium"
            >
              {t("signUp")}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
