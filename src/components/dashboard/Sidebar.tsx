"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Home,
  Image,
  MessageCircle,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Upload,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Users,
  DollarSign,
  Shield,
  ChevronDown,
  Check,
  Wallet,
  Bot,
  Building2,
  FileText,
  Search,
  Inbox,
  Eye,
  DoorOpen,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCreator, Creator, Agency } from "@/components/providers/AdminCreatorContext";

// Navigation link definitions with translation keys
const userLinksDef = [
  { href: "/dashboard/messages", icon: MessageCircle, labelKey: "nav.messages" },
  { href: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
  { href: "/dashboard/library", icon: Image, labelKey: "nav.myLibrary" },
  { href: "/dashboard/billing", icon: CreditCard, labelKey: "nav.billing" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "nav.accountSettings" },
];

const creatorLinksDef = [
  { href: "/dashboard/creator", icon: Crown, labelKey: "creator.title" },
  { href: "/dashboard/creator/media", icon: Upload, labelKey: "creator.mediaLibrary" },
  { href: "/dashboard/creator/members", icon: Users, labelKey: "creator.members" },
  { href: "/dashboard/creator/earnings", icon: DollarSign, labelKey: "creator.earnings" },
  { href: "/dashboard/creator/analytics", icon: BarChart3, labelKey: "creator.analytics" },
  { href: "/dashboard/creator/scripts", icon: FileText, labelKey: "creator.scripts" },
  { href: "/dashboard/creator/ai", icon: Bot, labelKey: "creator.aiGirlfriend" },
  { href: "/dashboard/find-agency", icon: Search, labelKey: "creator.findAgency" },
  { href: "/dashboard/creator/settings", icon: Settings, labelKey: "creator.creatorSettings" },
];

const restrictedCreatorLinksDef = [
  { href: "/dashboard/creator/earnings", icon: Eye, labelKey: "creator.viewEarnings" },
  { href: "/dashboard/messages", icon: MessageCircle, labelKey: "messages.title" },
];

const adminLinksDef = [
  { href: "/dashboard/admin", icon: Shield, labelKey: "admin.title" },
  { href: "/dashboard/admin/agencies", icon: Building2, labelKey: "admin.allAgencies" },
  { href: "/dashboard/admin/creators", icon: Crown, labelKey: "admin.totalCreators" },
  { href: "/dashboard/admin/creator-applications", icon: Inbox, labelKey: "admin.creatorApplications" },
  { href: "/dashboard/admin/users", icon: Users, labelKey: "admin.totalUsers" },
  { href: "/dashboard/admin/payments", icon: DollarSign, labelKey: "admin.allPayments" },
  { href: "/dashboard/admin/payouts", icon: Wallet, labelKey: "admin.payouts" },
  { href: "/dashboard/admin/analytics", icon: BarChart3, labelKey: "admin.siteAnalytics" },
];

const agencyLinksDef = [
  { href: "/dashboard/agency", icon: Building2, labelKey: "agency.overview" },
  { href: "/dashboard/agency/creators", icon: Crown, labelKey: "agency.myCreators" },
  { href: "/dashboard/agency/chatters", icon: MessageCircle, labelKey: "agency.chatters" },
  { href: "/dashboard/agency/earnings", icon: DollarSign, labelKey: "agency.earningsPayouts" },
  { href: "/dashboard/agency/performance", icon: BarChart3, labelKey: "agency.performance" },
  { href: "/dashboard/find-creator", icon: Search, labelKey: "agency.findCreator" },
  { href: "/dashboard/agency/settings", icon: Settings, labelKey: "agency.agencySettings" },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);
  const [isAgencyManaged, setIsAgencyManaged] = useState(false);
  const [managingAgencyName, setManagingAgencyName] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isCreatorUser = (session?.user as any)?.isCreator === true;
  const isAgencyOwner = (session?.user as any)?.isAgencyOwner === true;

  // Ref for sidebar nav scroll position persistence
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop;
      sessionStorage.setItem("sidebar-scroll", String(navRef.current.scrollTop));
    }
  }, []);

  // Restore scroll position after render
  useEffect(() => {
    const savedPosition = sessionStorage.getItem("sidebar-scroll");
    if (savedPosition && navRef.current) {
      navRef.current.scrollTop = parseInt(savedPosition, 10);
    }
  }, [pathname]); // Re-run when pathname changes

  // Translate navigation links
  const userLinks = userLinksDef.map(link => ({ ...link, label: t(link.labelKey) }));
  const creatorLinks = creatorLinksDef.map(link => ({ ...link, label: t(link.labelKey) }));
  const restrictedCreatorLinks = restrictedCreatorLinksDef.map(link => ({ ...link, label: t(link.labelKey) }));
  const adminLinks = adminLinksDef.map(link => ({ ...link, label: t(link.labelKey) }));
  const agencyLinks = agencyLinksDef.map(link => ({ ...link, label: t(link.labelKey) }));

  // Use creator context for multi-creator support
  const { selectedCreator, setSelectedCreator, creators, isLoading: creatorsLoading, agency, agencyCreators } = useAdminCreator();

  // For agency owners, use agency creators in the dropdown
  const displayCreators = isAgencyOwner && agencyCreators.length > 0 ? agencyCreators : creators;

  // Get avatar and name from selected creator
  const creatorAvatar = selectedCreator?.avatar || null;
  const creatorName = selectedCreator?.displayName || null;

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // Fetch pending payouts count (admin only)
  const fetchPendingPayoutsCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/admin/payout-count");
      if (res.ok) {
        const data = await res.json();
        setPendingPayoutsCount(data.totalPending || 0);
      }
    } catch (error) {
      console.error("Error fetching pending payouts count:", error);
    }
  }, [isAdmin]);

  // Fetch pending creator applications count (admin only)
  const fetchPendingApplicationsCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/admin/creator-applications/count");
      if (res.ok) {
        const data = await res.json();
        setPendingApplicationsCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching pending applications count:", error);
    }
  }, [isAdmin]);

  // Fetch permissions for selected creator (check if agency-managed)
  const fetchCreatorPermissions = useCallback(async () => {
    if (!selectedCreator?.slug || !session?.user?.id) {
      setIsAgencyManaged(false);
      setManagingAgencyName(null);
      return;
    }
    // Agency owners should never see restricted mode - they have full access
    if (isAgencyOwner) {
      setIsAgencyManaged(false);
      setManagingAgencyName(null);
      return;
    }
    try {
      const res = await fetch(`/api/creator/permissions?creator=${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setIsAgencyManaged(data.isAgencyManaged && !data.canEdit);
        setManagingAgencyName(data.agencyName || null);
      }
    } catch (error) {
      console.error("Error fetching creator permissions:", error);
    }
  }, [selectedCreator?.slug, session?.user?.id, isAgencyOwner]);

  useEffect(() => {
    fetchCreatorPermissions();
  }, [fetchCreatorPermissions]);

  useEffect(() => {
    fetchUnreadCount();
    fetchPendingPayoutsCount();
    fetchPendingApplicationsCount();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingPayoutsCount();
      fetchPendingApplicationsCount();
    }, 30000);

    // Listen for custom event when messages are read
    const handleUnreadUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener("unread-count-updated", handleUnreadUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("unread-count-updated", handleUnreadUpdate);
    };
  }, [fetchUnreadCount, fetchPendingPayoutsCount, fetchPendingApplicationsCount]);

  const NavLink = ({
    href,
    icon: Icon,
    label,
    badge,
    index = 0,
  }: {
    href: string;
    icon: any;
    label: string;
    badge?: number;
    index?: number;
  }) => {
    // More precise active detection to avoid conflicts
    const isExactMatch = pathname === href;
    const isChildMatch = pathname.startsWith(href + "/");

    // These routes should only match exactly, not their children
    const exactMatchOnly = href === "/dashboard" || href === "/dashboard/creator" || href === "/dashboard/admin" || href === "/dashboard/agency";
    const isActive = exactMatchOnly ? isExactMatch : (isExactMatch || isChildMatch);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link
          href={href}
          scroll={false}
          onClick={() => {
            saveScrollPosition();
            setIsMobileOpen(false);
          }}
          className={cn(
            "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
            isActive
              ? "bg-gradient-to-r from-[var(--gold)]/15 to-[var(--gold)]/5 text-white border border-[var(--gold)]/30"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          )}
        >
          {/* Active indicator - golden bar */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-[var(--gold)] to-amber-600 shadow-lg shadow-[var(--gold)]/50"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          {/* Icon - always gold color */}
          <Icon className={cn(
            "w-5 h-5 transition-colors",
            isActive ? "text-[var(--gold)]" : "text-[var(--gold)]/70 group-hover:text-[var(--gold)]"
          )} />
          <span className={cn(
            "flex-1 font-medium transition-colors",
            isActive && "text-white"
          )}>{label}</span>
          {badge && badge > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-[var(--gold)] text-black rounded-full">
              {badge}
            </span>
          )}
          {/* Subtle glow effect on active */}
          {isActive && (
            <div className="absolute inset-0 rounded-xl bg-[var(--gold)]/5 pointer-events-none" />
          )}
        </Link>
      </motion.div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black/95 backdrop-blur-xl">
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <span className="text-lg font-bold gradient-gold-text">
              VipOnly
            </span>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              {t("nav.backToSite")}
            </p>
          </div>
        </Link>
      </div>

      {/* User info with Creator Switcher */}
      <div className="p-5 border-b border-white/10">
        {/* User email - above creator card */}
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs text-gray-500 truncate">
            {session?.user?.email}
          </p>
          <div className="flex gap-1">
            {isAdmin && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-md">
                {t("sidebar.admin")}
              </span>
            )}
            {isCreatorUser && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--gold)] text-black rounded-md">
                {t("sidebar.creator")}
              </span>
            )}
          </div>
        </div>

        {/* Agency Card - below email */}
        {isAgencyOwner && agency && (
          <Link
            href="/dashboard/agency"
            className="block mb-3 group"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-3 flex items-center gap-3">
                {/* Agency Logo */}
                {agency.logo ? (
                  <div className="relative">
                    <NextImage
                      src={agency.logo}
                      alt={agency.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <Building2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-purple-500/50">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Agency Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
                    {agency.name}
                  </p>
                  <p className="text-xs text-purple-400">
                    {t("agency.title")}
                  </p>
                </div>

                {/* Arrow indicator */}
                <ChevronDown className="w-4 h-4 text-purple-400 -rotate-90 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* Creator card */}
        <div className="relative">
          <button
            onClick={() => (isAdmin || isCreatorUser || isAgencyOwner) && displayCreators.length > 0 && setIsCreatorDropdownOpen(!isCreatorDropdownOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-all",
              (isAdmin || isCreatorUser || isAgencyOwner) && displayCreators.length > 0 && "hover:border-[var(--gold)]/30 cursor-pointer"
            )}
          >
            {creatorAvatar || session?.user?.image ? (
              <NextImage
                src={creatorAvatar || session?.user?.image || ""}
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border-2 border-[var(--gold)]/50 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-lg">
                  {(creatorName || session?.user?.name)?.[0] || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">
                {creatorName || session?.user?.name || "User"}
              </p>
              {selectedCreator?.slug && (
                <p className="text-xs text-gray-500">
                  @{selectedCreator.slug}
                </p>
              )}
            </div>
            {(isAdmin || isCreatorUser || isAgencyOwner) && displayCreators.length > 0 && (
              <ChevronDown className={cn(
                "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
                isCreatorDropdownOpen && "rotate-180"
              )} />
            )}
          </button>

          {/* Creator Dropdown */}
          <AnimatePresence>
            {isCreatorDropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]"
                  onClick={() => setIsCreatorDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-[var(--gold)]/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[70]"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                  <div className="p-2 max-h-64 overflow-y-auto">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isAgencyOwner && agencyCreators.length > 0 ? t("agency.myCreators") : t("sidebar.switchCreator")}
                    </p>

                    {displayCreators.map((creator) => (
                      <button
                        key={creator.slug}
                        onClick={() => {
                          setSelectedCreator(creator);
                          setIsCreatorDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          selectedCreator?.slug === creator.slug
                            ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {creator.avatar ? (
                          <NextImage
                            src={creator.avatar}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-[var(--gold)]/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
                            <span className="text-black font-bold text-sm">
                              {creator.displayName?.[0] || "C"}
                            </span>
                          </div>
                        )}
                        <span className="flex-1 text-left text-sm font-medium truncate">
                          {creator.displayName}
                        </span>
                        {selectedCreator?.slug === creator.slug && (
                          <Check className="w-4 h-4 text-[var(--gold)]" />
                        )}
                      </button>
                    ))}
                  </div>

                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Admin Section */}
        {isAdmin && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3 h-3" />
              {t("sidebar.admin")}
            </p>
            {adminLinks.map((link, index) => (
              <NavLink
                key={link.href}
                {...link}
                index={index}
                badge={
                  link.href === "/dashboard/admin/payouts" ? pendingPayoutsCount :
                  link.href === "/dashboard/admin/creator-applications" ? pendingApplicationsCount :
                  undefined
                }
              />
            ))}
            <div className="h-4" />
          </>
        )}

        {/* Agency Section */}
        {isAgencyOwner && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              {t("sidebar.agency")}
            </p>
            {agencyLinks.map((link, index) => (
              <NavLink
                key={link.href}
                {...link}
                index={index + (isAdmin ? adminLinks.length : 0)}
              />
            ))}
            <div className="h-4" />
          </>
        )}

        {/* Creator Section - Show for creators AND agency owners (to manage selected creator) */}
        {(isCreatorUser || isAgencyOwner) && (
          <>
            {isAgencyManaged ? (
              /* RESTRICTED MODE - Agency-managed creator */
              <>
                {/* Restricted Mode Banner */}
                <div className="mx-2 mb-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30">
                  <div className="flex items-center gap-2 text-orange-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("sidebar.restrictedMode")}</span>
                  </div>
                  <p className="text-xs text-orange-300/80">
                    {t("sidebar.managedBy")} <span className="font-semibold text-orange-200">{managingAgencyName}</span>
                  </p>
                </div>

                <p className="px-4 py-2 text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  {t("sidebar.viewOnly")}
                </p>
                {restrictedCreatorLinks.map((link, index) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    index={index + (isAdmin ? adminLinks.length : 0) + (isAgencyOwner ? agencyLinks.length : 0)}
                    badge={undefined}
                  />
                ))}

                {/* Leave Agency Button */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-3"
                >
                  <Link
                    href="/dashboard/creator/breakup"
                    scroll={false}
                    onClick={() => {
                      saveScrollPosition();
                      setIsMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border border-red-500/30 hover:border-red-500/50 hover:text-red-300 transition-all duration-300"
                  >
                    <DoorOpen className="w-5 h-5" />
                    <span className="font-medium">{t("sidebar.leaveAgency")}</span>
                  </Link>
                </motion.div>

                <div className="h-4" />
              </>
            ) : (
              /* FULL ACCESS MODE - Normal creator or agency owner managing creator */
              <>
                <p className="px-4 py-2 text-xs font-semibold text-[var(--gold)] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  {t("sidebar.creatorTools")}
                </p>
                {creatorLinks.map((link, index) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    index={index + (isAdmin ? adminLinks.length : 0) + (isAgencyOwner ? agencyLinks.length : 0)}
                    badge={undefined}
                  />
                ))}
                <div className="h-4" />
              </>
            )}
          </>
        )}

        {/* User Section - Always visible */}
        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t("sidebar.myAccount")}
        </p>
        {userLinks.map((link, index) => (
          <NavLink
            key={link.href}
            {...link}
            index={index + (isAdmin ? adminLinks.length : 0) + (isAgencyOwner ? agencyLinks.length : 0) + (isCreatorUser ? creatorLinks.length : 0)}
            badge={link.href === "/dashboard/messages" ? unreadCount : undefined}
          />
        ))}

        {/* Become Creator CTA - Only for non-creators */}
        {!isCreatorUser && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <Link
              href="/dashboard/become-creator"
              scroll={false}
              onClick={() => {
                saveScrollPosition();
                setIsMobileOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--gold)]/20 to-[var(--gold)]/5 text-[var(--gold)] border border-[var(--gold)]/30 hover:border-[var(--gold)]/50 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">{t("sidebar.becomeCreator")}</span>
            </Link>
          </motion.div>
        )}

        {/* Become Agency CTA - Only for creators who are not agency owners */}
        {isCreatorUser && !isAgencyOwner && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4"
          >
            <Link
              href="/dashboard/agency"
              scroll={false}
              onClick={() => {
                saveScrollPosition();
                setIsMobileOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-500/5 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">{t("sidebar.becomeAgency")}</span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Logout */}
        <motion.button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t("nav.signOut")}</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 border-r border-white/10 bg-black z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 border-b border-white/10 bg-black/95 backdrop-blur-xl z-40">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] to-yellow-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-bold gradient-gold-text">
            VipOnly
          </span>
        </Link>
        <motion.button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 rounded-xl bg-[var(--gold)]/20 border-2 border-[var(--gold)]/50 hover:bg-[var(--gold)]/30 active:bg-[var(--gold)]/40 transition-all"
          whileTap={{ scale: 0.95 }}
          aria-label="Open menu"
        >
          {isMobileOpen ? (
            <X className="w-6 h-6 text-[var(--gold)]" />
          ) : (
            <Menu className="w-6 h-6 text-[var(--gold)]" />
          )}
        </motion.button>
      </div>

      {/* Mobile Sidebar - slides from right */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 right-0 w-[280px] border-l border-[var(--gold)]/10 bg-black z-50 shadow-2xl shadow-black/50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for content */}
      <div className="hidden lg:block w-72 flex-shrink-0" />
      <div className="lg:hidden h-16" />
    </>
  );
}
