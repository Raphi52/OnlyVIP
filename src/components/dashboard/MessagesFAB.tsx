"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessagesFAB() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Don't show FAB on messages page
  const isMessagesPage = pathname?.includes("/messages");

  // Fetch unread count
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
    const interval = setInterval(fetchUnreadCount, 30000);

    // Listen for unread count updates
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener("unread-count-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("unread-count-updated", handleUpdate);
    };
  }, [fetchUnreadCount]);

  if (isMessagesPage) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <motion.button
        onClick={() => router.push("/dashboard/messages")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          "bg-gradient-to-br from-[var(--gold)] via-amber-500 to-amber-600",
          "hover:shadow-[var(--gold)]/40 hover:shadow-xl",
          isHovered ? "w-auto px-5 py-4" : "w-14 h-14"
        )}
      >
        {/* Icon */}
        <MessageCircle className="w-6 h-6 text-black" />

        {/* Expanded text */}
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              className="text-black font-semibold whitespace-nowrap overflow-hidden"
            >
              Messages
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse animation when there are unreads */}
        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-[var(--gold)]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}
