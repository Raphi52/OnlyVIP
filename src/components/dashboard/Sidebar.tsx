"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  Globe,
  Shield,
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCreator, Creator } from "@/components/providers/AdminCreatorContext";

// Navigation pour les utilisateurs normaux
const userLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/library", icon: Image, label: "My Library" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

// Navigation pour les créateurs (en plus des liens user)
const creatorLinks = [
  { href: "/dashboard/creator", icon: Crown, label: "Creator Dashboard" },
  { href: "/dashboard/creator/media", icon: Upload, label: "Media Library" },
  { href: "/dashboard/creator/members", icon: Users, label: "Members" },
  { href: "/dashboard/creator/messages", icon: MessageCircle, label: "Fan Messages" },
  { href: "/dashboard/creator/earnings", icon: DollarSign, label: "Earnings" },
  { href: "/dashboard/creator/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/creator/settings", icon: Settings, label: "Creator Settings" },
];

// Navigation pour l'admin (site-wide)
const adminLinks = [
  { href: "/dashboard/admin", icon: Shield, label: "Admin Overview" },
  { href: "/dashboard/admin/creators", icon: Crown, label: "All Creators" },
  { href: "/dashboard/admin/users", icon: Users, label: "All Users" },
  { href: "/dashboard/admin/payments", icon: DollarSign, label: "All Payments" },
  { href: "/dashboard/admin/analytics", icon: BarChart3, label: "Site Analytics" },
  { href: "/dashboard/admin/settings", icon: Globe, label: "Site Settings" },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isCreatorUser = (session?.user as any)?.isCreator === true;

  // Use creator context for multi-creator support
  const { selectedCreator, setSelectedCreator, creators, isLoading: creatorsLoading } = useAdminCreator();

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

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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
    const isActive = pathname === href || pathname.startsWith(href + "/");

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link
          href={href}
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
            isActive
              ? "bg-gradient-to-r from-[var(--gold)]/20 to-[var(--gold)]/5 text-[var(--gold)] border border-[var(--gold)]/30"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          )}
        >
          <Icon className={cn("w-5 h-5", isActive && "text-[var(--gold)]")} />
          <span className="flex-1 font-medium">{label}</span>
          {badge && badge > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-[var(--gold)] text-black rounded-full">
              {badge}
            </span>
          )}
          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"
            />
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
              Back to site
            </p>
          </div>
        </Link>
      </div>

      {/* User info with Creator Switcher */}
      <div className="p-5 border-b border-white/10">
        {/* User email - above creator card */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs text-gray-500 truncate">
            {session?.user?.email}
          </p>
          <div className="flex gap-1">
            {isAdmin && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-md">
                ADMIN
              </span>
            )}
            {isCreatorUser && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--gold)] text-black rounded-md">
                CREATOR
              </span>
            )}
          </div>
        </div>

        {/* Creator card */}
        <div className="relative">
          <button
            onClick={() => (isAdmin || isCreatorUser) && creators.length > 0 && setIsCreatorDropdownOpen(!isCreatorDropdownOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-all",
              (isAdmin || isCreatorUser) && creators.length > 0 && "hover:border-[var(--gold)]/30 cursor-pointer"
            )}
          >
            {creatorAvatar || session?.user?.image ? (
              <img
                src={creatorAvatar || session?.user?.image || ""}
                alt=""
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
            {(isAdmin || isCreatorUser) && creators.length > 0 && (
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
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCreatorDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-[var(--gold)]/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />

                  <div className="p-2 max-h-64 overflow-y-auto">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Switch Creator
                    </p>

                    {creators.map((creator) => (
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
                          <img
                            src={creator.avatar}
                            alt=""
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

                  {/* Actions */}
                  <div className="border-t border-white/10 p-2">
                    <Link
                      href="/dashboard/admin/creators"
                      onClick={() => setIsCreatorDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Manage Creators</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin/creators?new=true"
                        onClick={() => setIsCreatorDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Creator</span>
                      </Link>
                    )}
                    {selectedCreator && (
                      <Link
                        href={`/${selectedCreator.slug}`}
                        target="_blank"
                        onClick={() => setIsCreatorDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View Public Page</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Admin Section */}
        {isAdmin && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Admin
            </p>
            {adminLinks.map((link, index) => (
              <NavLink key={link.href} {...link} index={index} />
            ))}
            <div className="h-4" />
          </>
        )}

        {/* Creator Section */}
        {isCreatorUser && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-[var(--gold)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Creator Tools
            </p>
            {creatorLinks.map((link, index) => (
              <NavLink
                key={link.href}
                {...link}
                index={index + (isAdmin ? adminLinks.length : 0)}
                badge={link.href === "/dashboard/creator/messages" ? unreadCount : undefined}
              />
            ))}
            <div className="h-4" />
          </>
        )}

        {/* User Section - Always visible */}
        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          My Account
        </p>
        {userLinks.map((link, index) => (
          <NavLink
            key={link.href}
            {...link}
            index={index + (isAdmin ? adminLinks.length : 0) + (isCreatorUser ? creatorLinks.length : 0)}
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
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--gold)]/20 to-[var(--gold)]/5 text-[var(--gold)] border border-[var(--gold)]/30 hover:border-[var(--gold)]/50 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Become a Creator</span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <motion.button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
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
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--gold)]/30 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-[var(--gold)]" />
          ) : (
            <Menu className="w-5 h-5 text-gray-300" />
          )}
        </motion.button>
      </div>

      {/* Mobile Sidebar */}
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] border-r border-[var(--gold)]/10 bg-black z-50 shadow-2xl shadow-black/50"
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
