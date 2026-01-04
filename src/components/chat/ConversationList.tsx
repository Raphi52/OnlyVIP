"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, CheckCheck, Pin, BellOff, Bell, Trash2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    image?: string;
    isOnline?: boolean;
  };
  lastMessage?: {
    text?: string;
    isPPV?: boolean;
    createdAt: Date;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onPinConversation?: (conversationId: string, isPinned: boolean) => void;
  onMuteConversation?: (conversationId: string, isMuted: boolean) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  onSelectConversation,
  onPinConversation,
  onMuteConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sort conversations: pinned first, then by date
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-[var(--gold)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
          No messages yet
        </h3>
        <p className="text-sm text-[var(--muted)]">
          Subscribe to start chatting with the creator
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {sortedConversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        const isSentByMe = conversation.lastMessage?.senderId === currentUserId;
        const isMenuOpen = menuOpenId === conversation.id;
        const isConfirmDelete = confirmDeleteId === conversation.id;

        return (
          <div key={conversation.id} className="relative group">
            <motion.button
              onClick={() => onSelectConversation(conversation.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 transition-colors text-left",
                isActive
                  ? "bg-[var(--gold)]/5"
                  : "hover:bg-[var(--surface-hover)]"
              )}
              whileHover={{ x: 2 }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conversation.user.image ? (
                  <Image
                    src={conversation.user.image}
                    alt={conversation.user.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)]" />
                )}
                {conversation.user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-[var(--background)]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="font-medium text-[var(--foreground)] truncate">
                      {conversation.user.name}
                    </h4>
                    {conversation.isPinned && (
                      <Pin className="w-3 h-3 text-[var(--gold)] flex-shrink-0" />
                    )}
                    {conversation.isMuted && (
                      <BellOff className="w-3 h-3 text-[var(--muted)] flex-shrink-0" />
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <span className="text-xs text-[var(--muted)] flex-shrink-0">
                      {new Date(
                        conversation.lastMessage.createdAt
                      ).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSentByMe && (
                    <span className="flex-shrink-0">
                      {conversation.lastMessage?.isRead ? (
                        <CheckCheck className="w-4 h-4 text-[var(--gold)]" />
                      ) : (
                        <Check className="w-4 h-4 text-[var(--muted)]" />
                      )}
                    </span>
                  )}
                  <p className="text-sm text-[var(--muted)] truncate flex-1">
                    {conversation.lastMessage?.isPPV
                      ? "Sent exclusive content"
                      : conversation.lastMessage?.text || "No messages"}
                  </p>
                  {conversation.unreadCount > 0 && !conversation.isMuted && (
                    <Badge variant="premium" className="flex-shrink-0 px-2 py-0.5">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                  {conversation.unreadCount > 0 && conversation.isMuted && (
                    <div className="w-2 h-2 rounded-full bg-[var(--muted)] flex-shrink-0" />
                  )}
                </div>
              </div>
            </motion.button>

            {/* Actions Menu Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(isMenuOpen ? null : conversation.id);
                  setConfirmDeleteId(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--muted)] hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Menu Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setMenuOpenId(null);
                      setConfirmDeleteId(null);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-2 top-full mt-1 z-50 min-w-[160px] py-1 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl shadow-black/50"
                  >
                    {isConfirmDelete ? (
                      <div className="p-3">
                        <p className="text-sm text-white mb-3">Delete this conversation?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation?.(conversation.id);
                              setMenuOpenId(null);
                              setConfirmDeleteId(null);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Pin/Unpin */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinConversation?.(conversation.id, !conversation.isPinned);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                          <Pin className={cn("w-4 h-4", conversation.isPinned && "text-[var(--gold)]")} />
                          {conversation.isPinned ? "Unpin" : "Pin conversation"}
                        </button>

                        {/* Mute/Unmute */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMuteConversation?.(conversation.id, !conversation.isMuted);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                          {conversation.isMuted ? (
                            <>
                              <Bell className="w-4 h-4" />
                              Unmute
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4 h-4" />
                              Mute notifications
                            </>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(conversation.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete conversation
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
