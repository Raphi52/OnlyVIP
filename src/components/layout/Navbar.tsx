"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { getCreator, Creator } from "@/lib/creators";
import { CreditBalance } from "@/components/layout/CreditBalance";
import { useLocale, useTranslations } from "next-intl";

interface NavbarProps {
  creatorSlug?: string;
}

export function Navbar({ creatorSlug }: NavbarProps) {
  // Only show creator-specific features when a creatorSlug is provided
  const isCreatorPage = !!creatorSlug;
  const effectiveCreatorSlug = creatorSlug || "miacosta"; // Fallback for avatar/name display only
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tCreator = useTranslations("creator");
  const tDashboard = useTranslations("dashboard");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasVipAccess, setHasVipAccess] = useState(false);
  const [isCheckingVip, setIsCheckingVip] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [creator, setCreator] = useState<Creator | undefined>(getCreator(effectiveCreatorSlug));
  const [userCreatorAvatar, setUserCreatorAvatar] = useState<string | null>(null);
  const [userCreatorName, setUserCreatorName] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isUserCreator = (session?.user as any)?.isCreator === true;

  const basePath = isCreatorPage ? `/${locale}/${creatorSlug}` : `/${locale}`;

  // Fetch creator data from database (only on creator pages)
  useEffect(() => {
    if (!isCreatorPage) return;

    const fetchCreator = async () => {
      try {
        const res = await fetch(`/api/creators/${effectiveCreatorSlug}`);
        if (res.ok) {
          const data = await res.json();
          setCreator(data);
        }
      } catch (error) {
        console.error("Error fetching creator:", error);
      }
    };

    fetchCreator();
  }, [effectiveCreatorSlug, isCreatorPage]);

  // Fetch user's creator avatar if they are a creator/admin
  useEffect(() => {
    const fetchUserCreatorInfo = async () => {
      if (!session?.user?.id || (!isAdmin && !isUserCreator)) return;

      try {
        const res = await fetch("/api/creator/my-profiles");
        if (res.ok) {
          const data = await res.json();
          if (data.creators && data.creators.length > 0) {
            setUserCreatorAvatar(data.creators[0].avatar);
            setUserCreatorName(data.creators[0].displayName);
          }
        }
      } catch (error) {
        console.error("Error fetching user creator info:", error);
      }
    };

    fetchUserCreatorInfo();
  }, [session?.user?.id, isAdmin, isUserCreator]);

  // Check VIP subscription status for this specific creator (only on creator pages)
  useEffect(() => {
    const checkVipAccess = async () => {
      // Skip VIP check if not on a creator page
      if (!isCreatorPage) {
        setIsCheckingVip(false);
        return;
      }

      setIsCheckingVip(true);

      if (!session?.user?.id) {
        setHasVipAccess(false);
        setIsCheckingVip(false);
        return;
      }

      // Admins and Creators can always message
      if (isAdmin || isUserCreator) {
        setHasVipAccess(true);
        setIsCheckingVip(false);
        return;
      }

      try {
        // Check subscription for this specific creator
        const res = await fetch(`/api/user/subscription?creatorSlug=${effectiveCreatorSlug}`);
        if (res.ok) {
          const data = await res.json();
          // Check if subscription exists and has proper access
          // User has access if they have an active subscription for this creator
          const hasAccess = !!(
            data.subscription &&
            (data.subscription.status === "ACTIVE" || data.subscription.status === "TRIALING") &&
            (
              data.subscription.plan?.canMessage === true ||
              ["BASIC", "PREMIUM", "VIP"].includes(data.subscription.plan?.accessTier)
            )
          );
          setHasVipAccess(hasAccess);
        }
      } catch (error) {
        console.error("Error checking VIP access:", error);
      } finally {
        setIsCheckingVip(false);
      }
    };

    checkVipAccess();
  }, [session?.user?.id, isAdmin, isUserCreator, effectiveCreatorSlug, isCreatorPage]);

  // Handle Send Message click
  const handleSendMessage = async () => {
    // This should only be called on creator pages, but double-check
    if (!isCreatorPage) {
      window.location.href = `/${locale}/dashboard/messages`;
      return;
    }

    // Still loading session or checking VIP - wait
    if (status === "loading" || isCheckingVip) {
      return;
    }

    // Not logged in -> login page
    if (!session) {
      window.location.href = `${basePath}/auth/login`;
      return;
    }

    // Not VIP -> membership page
    if (!hasVipAccess) {
      window.location.href = `${basePath}/membership`;
      return;
    }

    // VIP -> start/open conversation with creator
    setIsStartingChat(true);
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSlug: effectiveCreatorSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/${locale}/dashboard/messages?conversation=${data.conversationId}`;
      } else {
        // Fallback to messages page
        window.location.href = `/${locale}/dashboard/messages`;
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      window.location.href = `/${locale}/dashboard/messages`;
    } finally {
      setIsStartingChat(false);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: `${basePath}/gallery`, label: t("gallery"), icon: Crown },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-[var(--gold)]/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="flex items-center justify-between h-20 overflow-hidden">
          {/* Logo with avatar (creator pages) or brand logo (other pages) */}
          <Link href={isCreatorPage ? basePath : session ? `/${locale}/dashboard?menu=open` : basePath} className="min-w-0 flex-shrink overflow-hidden">
            <motion.div
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 -ml-2 sm:-ml-3 rounded-2xl border border-transparent hover:border-[var(--gold)]/30 hover:bg-white/5 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {isCreatorPage ? (
                <>
                  {/* Creator avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 p-[2px] relative overflow-hidden">
                      {creator?.avatar ? (
                        <Image
                          src={creator.avatar}
                          alt={creator?.displayName || "Creator"}
                          fill
                          sizes="44px"
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                  </div>

                  {/* Name with gradient */}
                  <div className="hidden sm:block">
                    <span className="text-xl font-bold gradient-gold-text font-serif tracking-wide">
                      {creator?.displayName || "Creator"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      {t("online")}
                    </div>
                  </div>
                </>
              ) : session ? (
                /* Logged in user on homepage - show avatar like creator page */
                <>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 p-[2px] relative overflow-hidden">
                      {userCreatorAvatar || session.user?.image ? (
                        <Image
                          src={userCreatorAvatar || session.user?.image || ""}
                          alt={userCreatorName || session.user?.name || "User"}
                          fill
                          sizes="44px"
                          className="rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                          <User className="w-5 h-5 text-[var(--gold)]" />
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-black" />
                  </div>
                  <div className="hidden sm:block min-w-0 max-w-[120px] overflow-hidden">
                    <span className="text-lg font-bold gradient-gold-text font-serif tracking-wide block truncate">
                      {userCreatorName || session.user?.name?.split(" ")[0] || "VipOnly"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      {t("online")}
                    </div>
                  </div>
                </>
              ) : (
                /* Brand logo for non-logged in users */
                <div className="flex items-center gap-2">
                  <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--gold)] flex-shrink-0" />
                  <span className="text-lg sm:text-xl font-bold gradient-gold-text font-serif tracking-wide">
                    VipOnly
                  </span>
                </div>
              )}
            </motion.div>
          </Link>

          {/* Desktop Navigation - Centered (only on creator pages) */}
          {isCreatorPage && (
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-gray-300 border border-transparent hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/30 transition-all duration-300"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {/* Send Message Button */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={handleSendMessage}
                  disabled={isStartingChat}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-gray-300 border border-transparent hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/30 transition-all duration-300 disabled:opacity-50"
                >
                  <MessageCircle className={`w-4 h-4 ${isStartingChat ? "animate-pulse" : ""}`} />
                  {tCreator("sendMessage")}
                </button>
              </motion.div>
            </div>
          )}

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            ) : session ? (
              <>
                {/* Credit Balance */}
                <CreditBalance variant="navbar" />

              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-full border border-white/10 hover:border-[var(--gold)]/30 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {userCreatorAvatar || session.user?.image ? (
                    <div className="w-8 h-8 rounded-full border border-[var(--gold)]/50 relative overflow-hidden">
                      <Image
                        src={userCreatorAvatar || session.user?.image || ""}
                        alt={userCreatorName || session.user?.name || "User"}
                        fill
                        sizes="32px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-black" />
                    </div>
                  )}
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">
                    {userCreatorName || session.user?.name?.split(" ")[0] || "User"}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute right-0 mt-3 w-64 bg-black/95 backdrop-blur-xl border border-[var(--gold)]/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        {/* Gold accent */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                        <div className="px-5 py-4 border-b border-white/10">
                          <p className="text-sm font-semibold text-white">
                            {userCreatorName || session.user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <div className="py-2">
                          {[
                            { href: `/${locale}/dashboard`, icon: Crown, label: t("dashboard"), color: "text-[var(--gold)]" },
                            { href: `/${locale}/dashboard/messages`, icon: MessageCircle, label: t("messages"), color: "text-blue-400" },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 px-5 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                              {item.label}
                            </Link>
                          ))}
                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("signOut")}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={`${basePath}/auth/login`}>
                  <motion.button
                    className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t("signIn")}
                  </motion.button>
                </Link>
                <Link href={`${basePath}/auth/register`}>
                  <motion.button
                    className="relative group px-6 py-2.5 rounded-full overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Gradient background */}
                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--gold)] via-yellow-500 to-[var(--gold)] bg-[length:200%_100%] animate-shimmer" />

                    {/* Glow effect */}
                    <span className="absolute inset-0 bg-[var(--gold)] opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />

                    <span className="relative flex items-center gap-2 text-sm font-bold text-black">
                      <Crown className="w-4 h-4" />
                      {t("joinVip")}
                    </span>
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Credits + Send Message + User Menu */}
          <div className="md:hidden flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Credit Balance - Ultra compact */}
            {session && (
              <CreditBalance variant="compact" />
            )}

            {/* Send Message Button - only on creator pages */}
            {isCreatorPage && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-yellow-600 text-black font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
                onClick={handleSendMessage}
                disabled={isStartingChat || status === "loading" || isCheckingVip}
              >
                <MessageCircle className={`w-4 h-4 ${isStartingChat || isCheckingVip ? "animate-pulse" : ""}`} />
              </button>
            )}

            {/* Mobile User Menu Button */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-white/10 bg-white/5 active:scale-95 transition-transform"
                >
                  {userCreatorAvatar || session.user?.image ? (
                    <div className="w-7 h-7 rounded-full border border-[var(--gold)]/50 relative overflow-hidden flex-shrink-0">
                      <Image
                        src={userCreatorAvatar || session.user?.image || ""}
                        alt={userCreatorName || session.user?.name || "User"}
                        fill
                        sizes="28px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={() => setIsUserMenuOpen(false)}
                      />

                      {/* Mobile Dropdown Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-[var(--gold)]/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        {/* Gold accent */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">
                            {userCreatorName || session.user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <div className="py-2">
                          {[
                            { href: `/${locale}/dashboard`, icon: Crown, label: tDashboard("overview"), color: "text-[var(--gold)]" },
                            { href: `/${locale}/dashboard/messages`, icon: MessageCircle, label: t("messages"), color: "text-blue-400" },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                              {item.label}
                            </Link>
                          ))}
                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("signOut")}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Login button for mobile when not logged in */
              <Link href={`${basePath}/auth/login`}>
                <button className="px-3 py-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-yellow-600 text-black font-bold text-sm active:scale-95 transition-transform">
                  <Crown className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

    </motion.nav>
  );
}
