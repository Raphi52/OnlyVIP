"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export function MessagesFAB() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

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
      {/* Pulse animation - outside button to avoid hover conflicts */}
      {unreadCount > 0 && (
        <motion.div
          className="absolute inset-0 w-14 h-14 rounded-full bg-[var(--gold)] pointer-events-none"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <motion.button
        onClick={() => router.push("/dashboard/messages")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-[var(--gold)] via-amber-500 to-amber-600 hover:shadow-[var(--gold)]/40 hover:shadow-xl"
      >
        {/* Icon */}
        <MessageCircle className="w-6 h-6 text-black" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </div>
        )}
      </motion.button>
    </motion.div>
  );
}
