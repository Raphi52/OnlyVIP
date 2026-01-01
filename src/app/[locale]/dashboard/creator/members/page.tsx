"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Crown,
  Ban,
  Loader2,
  RefreshCw,
  Check,
  X,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAdminCreator } from "@/components/providers/AdminCreatorContext";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isCreatorVip: boolean;
  isBlocked: boolean;
  notes: string | null;
  creatorSlug: string;
  hasSubscription: boolean;
  subscriptionId: string | null;
  planName: string;
  accessTier: string;
  followedAt: string;
  subscribedAt: string | null;
  expiresAt: string | null;
}

export default function CreatorMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedCreator, isLoading: creatorsLoading } = useAdminCreator();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const isCreator = (session?.user as any)?.isCreator;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isCreator) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, isCreator, router]);

  const fetchMembers = useCallback(async () => {
    if (!selectedCreator) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/creator/members?creator=${selectedCreator.slug}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCreator]);

  useEffect(() => {
    if (selectedCreator) {
      fetchMembers();
    }
  }, [selectedCreator, fetchMembers]);

  const handleToggleVip = async (member: Member) => {
    try {
      const res = await fetch("/api/creator/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          creatorSlug: member.creatorSlug,
          isVip: !member.isCreatorVip,
        }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id && m.creatorSlug === member.creatorSlug
              ? { ...m, isCreatorVip: !m.isCreatorVip }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const handleToggleBlock = async (member: Member) => {
    try {
      const res = await fetch("/api/creator/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          creatorSlug: member.creatorSlug,
          isBlocked: !member.isBlocked,
        }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id && m.creatorSlug === member.creatorSlug
              ? { ...m, isBlocked: !m.isBlocked }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "vip" && member.isCreatorVip) ||
      (filterStatus === "blocked" && member.isBlocked) ||
      (filterStatus === "subscriber" && member.hasSubscription) ||
      (filterStatus === "active" && !member.isBlocked);

    return matchesSearch && matchesFilter;
  });

  if (status === "loading" || isLoading || creatorsLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isCreator) {
    return null;
  }

  return (
    <div className="p-3 pt-20 sm:p-4 sm:pt-20 lg:p-8 lg:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5 sm:mb-8 gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-0.5 sm:mb-2">
            Members
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] truncate">
            Manage subscribers and access
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchMembers} className="flex-shrink-0">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4 mb-4 sm:mb-6"
      >
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg sm:rounded-xl text-sm sm:text-base text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {["all", "vip", "subscriber", "blocked", "active"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize whitespace-nowrap ${
                filterStatus === filter
                  ? "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8"
      >
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {members.length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Total</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {members.filter((m) => m.isCreatorVip).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">VIP</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {members.filter((m) => m.isBlocked).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Blocked</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {members.filter((m) => !m.isBlocked).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">Active</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mb-1 sm:mb-2">
            No members found
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            {members.length === 0
              ? "No subscribers yet"
              : "No members match your search"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {filteredMembers.map((member, idx) => (
              <Card
                key={`mobile-${member.id}-${member.creatorSlug}-${idx}`}
                className={`p-3 ${member.isBlocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)] flex-shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                        <span className="text-[var(--background)] font-bold text-sm">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--foreground)] truncate">
                          {member.name || "No name"}
                        </p>
                        <p className="text-xs text-[var(--muted)] truncate">
                          {member.email}
                        </p>
                      </div>
                      <Badge
                        className={`text-[10px] flex-shrink-0 ${
                          member.accessTier === "VIP"
                            ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {member.planName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {member.isBlocked && (
                        <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5">
                          <Ban className="w-2.5 h-2.5 mr-0.5" />
                          Blocked
                        </Badge>
                      )}
                      {member.isCreatorVip && (
                        <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5">
                          <Crown className="w-2.5 h-2.5 mr-0.5" />
                          VIP
                        </Badge>
                      )}
                      <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(member.followedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVip(member)}
                        className={`text-xs px-2 py-1 h-auto ${
                          member.isCreatorVip
                            ? "border-purple-500 text-purple-400"
                            : ""
                        }`}
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {member.isCreatorVip ? "Remove" : "VIP"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleBlock(member)}
                        className={`text-xs px-2 py-1 h-auto ${
                          member.isBlocked
                            ? "border-red-500 text-red-400"
                            : ""
                        }`}
                      >
                        {member.isBlocked ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 mr-1" />
                            Block
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 py-1 h-auto ml-auto"
                        onClick={() =>
                          router.push(`/dashboard/messages?user=${member.id}`)
                        }
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card variant="luxury" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Member
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Plan
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Subscribed
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, idx) => (
                    <tr
                      key={`${member.id}-${member.creatorSlug}-${idx}`}
                      className={`border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)] ${
                        member.isBlocked ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)]">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                                <span className="text-[var(--background)] font-bold">
                                  {(member.name || member.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {member.name || "No name"}
                            </p>
                            <p className="text-sm text-[var(--muted)]">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={
                            member.accessTier === "VIP"
                              ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                              : "bg-blue-500/20 text-blue-400"
                          }
                        >
                          {member.planName}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {member.isBlocked && (
                            <Badge className="bg-red-500/20 text-red-400">
                              <Ban className="w-3 h-3 mr-1" />
                              Blocked
                            </Badge>
                          )}
                          {member.isCreatorVip && (
                            <Badge className="bg-purple-500/20 text-purple-400">
                              <Crown className="w-3 h-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          {!member.isBlocked && !member.isCreatorVip && (
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              <Check className="w-3 h-3 mr-1" />
                              {member.hasSubscription ? "Subscriber" : "Follower"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(member.followedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVip(member)}
                            className={
                              member.isCreatorVip
                                ? "border-purple-500 text-purple-400"
                                : ""
                            }
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            {member.isCreatorVip ? "Remove VIP" : "Give VIP"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(member)}
                            className={
                              member.isBlocked
                                ? "border-red-500 text-red-400"
                                : ""
                            }
                          >
                            {member.isBlocked ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-1" />
                                Block
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/messages?user=${member.id}`)
                            }
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
