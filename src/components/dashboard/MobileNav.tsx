"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Image, MessageCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/library", icon: Image, label: "Library" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />

      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded-xl transition-colors",
                  isActive
                    ? "text-[var(--gold)]"
                    : "text-gray-500 active:text-gray-300"
                )}
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--gold)]"
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "text-[var(--gold)]" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
