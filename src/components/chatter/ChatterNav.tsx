"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Crown, MessageSquare, DollarSign, FileText, LogOut, User, ChevronDown } from "lucide-react";

export function ChatterNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { href: "/chatter/dashboard", label: "Inbox", icon: MessageSquare },
    { href: "/chatter/earnings", label: "Earnings", icon: DollarSign },
    { href: "/chatter/scripts", label: "Scripts", icon: FileText },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--surface-elevated)] border-b border-[var(--border)] z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/chatter/dashboard" className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-purple-500" />
          <span className="text-lg font-semibold">
            <span className="text-white">Vip</span>
            <span className="text-purple-500">Chatter</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">
              {session?.user?.name || "Chatter"}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-[var(--border)]">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
