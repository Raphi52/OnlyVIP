"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Pusher from "pusher-js";
import type { Channel } from "pusher-js";

// Global state for unread count (shared across components)
let globalUnreadCount = 0;
let globalPerConversation: Map<string, number> = new Map();
const listeners: Set<(count: number) => void> = new Set();

// Singleton Pusher instance (reuse from usePusher if available)
let pusherClient: Pusher | null = null;
let userChannel: Channel | null = null;
let subscribedUserId: string | null = null;

function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!pusherClient) {
    pusherClient = new Pusher(key, { cluster });
  }

  return pusherClient;
}

function notifyListeners() {
  listeners.forEach(cb => cb(globalUnreadCount));
}

interface UseUnreadCountOptions {
  userId: string | null;
  currentConversationId?: string | null; // Don't increment if viewing this conversation
}

interface UseUnreadCountResult {
  unreadCount: number;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  incrementForConversation: (conversationId: string) => void;
  getConversationUnread: (conversationId: string) => number;
}

export function useUnreadCount({
  userId,
  currentConversationId,
}: UseUnreadCountOptions): UseUnreadCountResult {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const currentConvRef = useRef(currentConversationId);

  // Keep ref updated
  useEffect(() => {
    currentConvRef.current = currentConversationId;
  }, [currentConversationId]);

  // Subscribe to global state changes
  useEffect(() => {
    const handleUpdate = (count: number) => {
      setUnreadCount(count);
    };
    listeners.add(handleUpdate);

    // Sync with current global state
    setUnreadCount(globalUnreadCount);

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // No initial fetch - count starts at 0 and increments via Pusher notifications only
  // This avoids polling and 503 errors

  // Subscribe to Pusher for real-time updates
  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    // Only subscribe once per user
    if (subscribedUserId !== userId) {
      // Unsubscribe from previous user
      if (userChannel && subscribedUserId) {
        pusher.unsubscribe(`user-${subscribedUserId}`);
      }

      const channelName = `user-${userId}`;
      userChannel = pusher.subscribe(channelName);
      subscribedUserId = userId;

      userChannel.bind("new-message-notification", (data: {
        conversationId: string;
        senderId: string;
        preview: string;
      }) => {
        // Don't increment if user is currently viewing this conversation
        if (currentConvRef.current === data.conversationId) {
          return;
        }

        // Increment global count
        globalUnreadCount++;

        // Track per-conversation
        const current = globalPerConversation.get(data.conversationId) || 0;
        globalPerConversation.set(data.conversationId, current + 1);

        notifyListeners();
      });

      // Listen for "messages-read" to decrement when read elsewhere
      userChannel.bind("messages-read", (data: {
        conversationId: string;
        count: number;
      }) => {
        const convUnread = globalPerConversation.get(data.conversationId) || 0;
        if (convUnread > 0) {
          globalUnreadCount = Math.max(0, globalUnreadCount - convUnread);
          globalPerConversation.set(data.conversationId, 0);
          notifyListeners();
        }
      });
    }

    // No cleanup - keep subscription alive for the session
  }, [userId]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    // Optimistic update
    const convUnread = globalPerConversation.get(conversationId) || 0;
    if (convUnread > 0) {
      globalUnreadCount = Math.max(0, globalUnreadCount - convUnread);
      globalPerConversation.set(conversationId, 0);
      notifyListeners();
    }

    // API call to mark as read
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[UnreadCount] Error marking as read:", error);
      // Revert on error
      if (convUnread > 0) {
        globalUnreadCount += convUnread;
        globalPerConversation.set(conversationId, convUnread);
        notifyListeners();
      }
    }
  }, []);

  // Manual increment (for when we know a new message arrived)
  const incrementForConversation = useCallback((conversationId: string) => {
    if (currentConvRef.current === conversationId) return;

    globalUnreadCount++;
    const current = globalPerConversation.get(conversationId) || 0;
    globalPerConversation.set(conversationId, current + 1);
    notifyListeners();
  }, []);

  // Get unread for specific conversation
  const getConversationUnread = useCallback((conversationId: string) => {
    return globalPerConversation.get(conversationId) || 0;
  }, []);

  return {
    unreadCount,
    markConversationAsRead,
    incrementForConversation,
    getConversationUnread,
  };
}

// Simple hook for components that just need the count (no user context needed)
export function useUnreadCountSimple(): number {
  const [count, setCount] = useState(globalUnreadCount);

  useEffect(() => {
    const handleUpdate = (newCount: number) => setCount(newCount);
    listeners.add(handleUpdate);
    setCount(globalUnreadCount);
    return () => { listeners.delete(handleUpdate); };
  }, []);

  return count;
}

// Reset count (for testing/debugging)
export function resetUnreadCount() {
  globalUnreadCount = 0;
  globalPerConversation.clear();
  notifyListeners();
}
