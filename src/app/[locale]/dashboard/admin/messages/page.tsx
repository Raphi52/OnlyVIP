"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Loader2,
  RefreshCw,
  Bot,
  User,
  Crown,
  DollarSign,
  Eye,
  X,
  Image as ImageIcon,
  Video,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  creator: { slug: string; displayName: string; avatar: string | null };
  fan: { id: string; name: string | null; image: string | null; email: string };
  lastMessage: {
    text: string | null;
    isPPV: boolean;
    ppvPrice: number | null;
    isAiGenerated: boolean;
    createdAt: string;
    senderId: string;
  } | null;
  messageCount: number;
  totalTips: number;
  createdAt: string;
  updatedAt: string;
  aiMode: string;
}

interface Message {
  id: string;
  text: string | null;
  isPPV: boolean;
  ppvPrice: number | null;
  ppvUnlockedBy: string;
  totalTips: number;
  isAiGenerated: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
  receiver: { id: string; name: string | null; image: string | null };
  media: { id: string; type: string; url: string; previewUrl: string | null }[];
  payments: { id: string; type: string; amount: number; status: string; user: { id: string; name: string | null } }[];
}

interface ConversationDetail {
  id: string;
  creator: { slug: string; displayName: string; avatar: string | null };
  participants: { user: { id: string; name: string | null; image: string | null; email: string } }[];
  messages: Message[];
  totalSpent: number;
}

export default function AdminMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchConversations();
  }, [session, status, isAdmin, router, page]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (searchQuery) params.set("search", searchQuery);
      if (filterCreator) params.set("creator", filterCreator);

      const res = await fetch(`/api/admin/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchConversations();
  };

  const openConversation = async (conversationId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getCreatorUserId = (conv: ConversationDetail) => {
    // Find the creator's user ID from participants
    return conv.participants.find(p =>
      p.user.name?.toLowerCase().includes(conv.creator.displayName.toLowerCase()) ||
      p.user.email?.includes(conv.creator.slug)
    )?.user.id;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1 sm:mb-2">
            All Messages
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            View all conversations on the platform
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchConversations}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 mb-4 sm:mb-6"
      >
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by creator or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] text-base"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8"
      >
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{total}</p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Conversations</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {conversations.filter(c => c.aiMode === "auto").length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">AI Auto</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {conversations.filter(c => c.aiMode === "assisted").length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">AI Assisted</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-1 sm:mb-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                €{conversations.reduce((sum, c) => sum + c.totalTips, 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Total Tips</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">
            No conversations found
          </h3>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                variant="luxury"
                className="p-3 cursor-pointer hover:border-[var(--gold)]/50 transition-colors"
                onClick={() => openConversation(conv.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Creator Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)] flex-shrink-0">
                    {conv.creator.avatar ? (
                      <img src={conv.creator.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                        <Crown className="w-5 h-5 text-[var(--background)]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--foreground)] text-sm truncate">
                        {conv.creator.displayName}
                      </span>
                      <span className="text-[var(--muted)]">↔</span>
                      <span className="text-sm text-[var(--muted)] truncate">
                        {conv.fan.name || conv.fan.email}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-[var(--muted)] truncate">
                        {conv.lastMessage.isPPV ? "🔒 PPV Message" : conv.lastMessage.text || "Media"}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Badge className={`${
                        conv.aiMode === "auto" ? "bg-purple-500/20 text-purple-400" :
                        conv.aiMode === "assisted" ? "bg-cyan-500/20 text-cyan-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {conv.aiMode === "auto" ? <Bot className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                        {conv.aiMode}
                      </Badge>
                      <span className="text-[var(--muted)]">{conv.messageCount} msgs</span>
                      {conv.totalTips > 0 && (
                        <span className="text-[var(--gold)]">€{conv.totalTips}</span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-[var(--muted)]" />
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card variant="luxury" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Creator</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Fan</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Last Message</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Mode</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Messages</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Tips</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">Updated</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-[var(--muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conv) => (
                    <tr
                      key={conv.id}
                      className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)] cursor-pointer"
                      onClick={() => openConversation(conv.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)]">
                            {conv.creator.avatar ? (
                              <img src={conv.creator.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                                <Crown className="w-5 h-5 text-[var(--background)]" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-[var(--foreground)]">
                            {conv.creator.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--surface)]">
                            {conv.fan.image ? (
                              <img src={conv.fan.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[var(--foreground)] text-sm">{conv.fan.name || "Anonymous"}</p>
                            <p className="text-[var(--muted)] text-xs">{conv.fan.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {conv.lastMessage ? (
                          <div className="max-w-[200px]">
                            <p className="text-sm text-[var(--foreground)] truncate">
                              {conv.lastMessage.isPPV ? (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Lock className="w-3 h-3" />
                                  PPV €{conv.lastMessage.ppvPrice}
                                </span>
                              ) : (
                                conv.lastMessage.text || "📷 Media"
                              )}
                            </p>
                            {conv.lastMessage.isAiGenerated && (
                              <Badge className="bg-purple-500/20 text-purple-400 text-[10px] mt-1">
                                <Bot className="w-2.5 h-2.5 mr-0.5" />
                                AI
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${
                          conv.aiMode === "auto" ? "bg-purple-500/20 text-purple-400" :
                          conv.aiMode === "assisted" ? "bg-cyan-500/20 text-cyan-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {conv.aiMode === "auto" ? <Bot className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                          {conv.aiMode}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-[var(--foreground)]">
                        {conv.messageCount}
                      </td>
                      <td className="py-4 px-4">
                        {conv.totalTips > 0 ? (
                          <span className="text-[var(--gold)] font-medium">€{conv.totalTips}</span>
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[var(--muted)] text-sm">
                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Conversation Detail Modal */}
      <AnimatePresence>
        {(selectedConversation || isLoadingDetail) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => !isLoadingDetail && setSelectedConversation(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] md:w-[600px] bg-[var(--surface)] border-l border-[var(--border)] z-50 overflow-hidden flex flex-col"
            >
              {isLoadingDetail ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
                </div>
              ) : selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)]">
                        {selectedConversation.creator.avatar ? (
                          <img src={selectedConversation.creator.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                            <Crown className="w-5 h-5 text-[var(--background)]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {selectedConversation.creator.displayName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {selectedConversation.messages.length} messages • €{selectedConversation.totalSpent} spent
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages.map((msg) => {
                      const isCreator = selectedConversation.participants.some(
                        p => p.user.id === msg.sender.id &&
                        (p.user.name?.toLowerCase().includes(selectedConversation.creator.displayName.toLowerCase()) ||
                         p.user.email?.includes(selectedConversation.creator.slug))
                      );

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCreator ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] ${isCreator ? "order-1" : ""}`}>
                            <div
                              className={`rounded-2xl p-3 ${
                                isCreator
                                  ? "bg-gradient-to-r from-[var(--gold)]/20 to-amber-500/20 border border-[var(--gold)]/30"
                                  : "bg-[var(--background)] border border-[var(--border)]"
                              }`}
                            >
                              {/* PPV Badge */}
                              {msg.isPPV && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border)]">
                                  <Badge className="bg-amber-500/20 text-amber-400">
                                    <Lock className="w-3 h-3 mr-1" />
                                    PPV €{msg.ppvPrice}
                                  </Badge>
                                  {msg.payments.filter(p => p.status === "COMPLETED").length > 0 && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400">
                                      {msg.payments.filter(p => p.status === "COMPLETED").length} unlocked
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Text */}
                              {msg.text && (
                                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              )}

                              {/* Media */}
                              {msg.media.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {msg.media.map((m) => (
                                    <div
                                      key={m.id}
                                      className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface)]"
                                    >
                                      {m.type === "VIDEO" ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black/50">
                                          <Video className="w-6 h-6 text-white" />
                                        </div>
                                      ) : (
                                        <img
                                          src={m.previewUrl || m.url}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tips */}
                              {msg.totalTips > 0 && (
                                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                                  <Badge className="bg-pink-500/20 text-pink-400">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    €{msg.totalTips} tips
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Meta */}
                            <div className={`flex items-center gap-2 mt-1 text-xs text-[var(--muted)] ${isCreator ? "justify-end" : ""}`}>
                              {msg.isAiGenerated && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                                  <Bot className="w-2.5 h-2.5 mr-0.5" />
                                  AI
                                </Badge>
                              )}
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
