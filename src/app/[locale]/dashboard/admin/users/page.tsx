"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  Sparkles,
  User as UserIcon,
  Loader2,
  RefreshCw,
  Check,
  Mail,
  Coins,
  X,
  Trash2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  isCreator: boolean;
  isAgencyOwner: boolean;
  emailVerified: Date | null;
  subscriptions: { creatorId: string }[];
  creditBalance: number;
  paidCredits: number;
  bonusCredits: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [creditsModal, setCreditsModal] = useState<{ userId: string; userName: string; paidCredits: number; bonusCredits: number } | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditType, setCreditType] = useState<"PAID" | "BONUS">("PAID");
  const [isGivingCredits, setIsGivingCredits] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ userId: string; userName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [session, status, isAdmin, router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "USER" | "ADMIN") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleToggleCreator = async (userId: string, isCreator: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCreator: !isCreator }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isCreator: !isCreator } : u))
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleToggleAgencyOwner = async (userId: string, isAgencyOwner: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAgencyOwner: !isAgencyOwner }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAgencyOwner: !isAgencyOwner } : u))
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleResendVerification = async (userId: string, email: string) => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert("Verification email sent successfully!");
      } else {
        alert("Failed to send verification email");
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      alert("Failed to send verification email");
    }
  };

  const handleManualVerify = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified: new Date().toISOString() }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, emailVerified: new Date() } : u
          )
        );
      }
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const handleGiveCredits = async () => {
    if (!creditsModal || !creditsAmount) return;

    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsGivingCredits(true);
    try {
      const res = await fetch(`/api/admin/users/${creditsModal.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditGrant: amount, creditType }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === creditsModal.userId
              ? {
                  ...u,
                  creditBalance: data.newBalance,
                  paidCredits: data.newPaidCredits,
                  bonusCredits: data.newBonusCredits,
                }
              : u
          )
        );
        setCreditsModal(null);
        setCreditsAmount("");
        setCreditType("PAID");
        alert(`Successfully added ${amount} ${creditType.toLowerCase()} credits!`);
      } else {
        alert("Failed to give credits");
      }
    } catch (error) {
      console.error("Error giving credits:", error);
      alert("Failed to give credits");
    } finally {
      setIsGivingCredits(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
        setDeleteModal(null);
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterRole === "all" ||
      (filterRole === "admin" && user.role === "ADMIN") ||
      (filterRole === "creator" && user.isCreator) ||
      (filterRole === "agency" && user.isAgencyOwner) ||
      (filterRole === "user" && user.role === "USER" && !user.isCreator && !user.isAgencyOwner) ||
      (filterRole === "pending" && !user.emailVerified) ||
      (filterRole === "verified" && user.emailVerified);

    return matchesSearch && matchesFilter;
  });

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
            Users
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            Manage all users on the platform
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchUsers}>
          <RefreshCw className="w-5 h-5" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] text-base"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {[
            { key: "all", label: "All", mobileLabel: "All" },
            { key: "admin", label: "Admin", mobileLabel: "Admin" },
            { key: "creator", label: "Creator", mobileLabel: "Creator" },
            { key: "agency", label: "Agency", mobileLabel: "Agency" },
            { key: "user", label: "User", mobileLabel: "User" },
            { key: "pending", label: "Pending Email", mobileLabel: "Pending" },
            { key: "verified", label: "Verified", mobileLabel: "Verified" },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setFilterRole(filter.key)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                filterRole === filter.key
                  ? filter.key === "pending"
                    ? "bg-yellow-500 text-black"
                    : filter.key === "verified"
                    ? "bg-emerald-500 text-black"
                    : filter.key === "agency"
                    ? "bg-purple-500 text-white"
                    : "bg-[var(--gold)] text-[var(--background)]"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="sm:hidden">{filter.mobileLabel}</span>
              <span className="hidden sm:inline">{filter.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-8"
      >
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{users.length}</p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Users</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.role === "ADMIN").length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Admins</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--gold)]/20 flex items-center justify-center mb-1 sm:mb-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.isCreator).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Creators</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.isAgencyOwner).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Agencies</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.emailVerified).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Verified</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center mb-1 sm:mb-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => !u.emailVerified).length}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--muted)]">Pending</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 sm:py-20">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">
            No users found
          </h3>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {users.length === 0
              ? "No users have registered yet"
              : "No users match your search"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} variant="luxury" className="p-3">
                {/* User header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)] flex-shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                        <span className="text-[var(--background)] font-bold text-sm">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm truncate">
                      {user.name || "No name"}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => setDeleteModal({ userId: user.id, userName: user.name || user.email })}
                    className="p-1.5 text-[var(--muted)] hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {user.role === "ADMIN" && (
                    <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      Admin
                    </Badge>
                  )}
                  {user.isCreator && (
                    <Badge className="bg-[var(--gold)]/20 text-[var(--gold)] text-[10px] px-1.5 py-0.5">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      Creator
                    </Badge>
                  )}
                  {user.isAgencyOwner && (
                    <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5">
                      <Building2 className="w-2.5 h-2.5 mr-0.5" />
                      Agency
                    </Badge>
                  )}
                  {user.role === "USER" && !user.isCreator && !user.isAgencyOwner && (
                    <Badge className="bg-gray-500/20 text-gray-400 text-[10px] px-1.5 py-0.5">
                      <UserIcon className="w-2.5 h-2.5 mr-0.5" />
                      User
                    </Badge>
                  )}
                  {user.emailVerified ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5">
                      <Check className="w-2.5 h-2.5 mr-0.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5">
                      <Mail className="w-2.5 h-2.5 mr-0.5" />
                      Pending
                    </Badge>
                  )}
                </div>

                {/* Credits & date row */}
                <div className="flex items-center justify-between text-xs mb-3 px-1">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[var(--gold)]" />
                    <span className="text-[var(--foreground)] font-medium">
                      {(user.creditBalance || 0).toLocaleString()}
                    </span>
                    <span className="text-emerald-400 ml-1">({(user.paidCredits || 0).toLocaleString()}p</span>
                    <span className="text-purple-400">/{(user.bonusCredits || 0).toLocaleString()}b)</span>
                  </div>
                  <span className="text-[var(--muted)]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1.5">
                  {!user.emailVerified && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendVerification(user.id, user.email)}
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-[10px] py-1.5 px-2"
                      >
                        <Mail className="w-3 h-3 mr-0.5" />
                        Resend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualVerify(user.id)}
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 text-[10px] py-1.5 px-2"
                      >
                        <Check className="w-3 h-3 mr-0.5" />
                        Verify
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                    className="text-[10px] py-1.5 px-2"
                  >
                    {user.role === "ADMIN" ? "-Admin" : "+Admin"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleCreator(user.id, user.isCreator)}
                    className="text-[10px] py-1.5 px-2"
                  >
                    {user.isCreator ? "-Creator" : "+Creator"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAgencyOwner(user.id, user.isAgencyOwner)}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 text-[10px] py-1.5 px-2"
                  >
                    {user.isAgencyOwner ? "-Agency" : "+Agency"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreditsModal({
                      userId: user.id,
                      userName: user.name || user.email,
                      paidCredits: user.paidCredits || 0,
                      bonusCredits: user.bonusCredits || 0,
                    })}
                    className="border-[var(--gold)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10 text-[10px] py-1.5 px-2"
                  >
                    <Coins className="w-3 h-3 mr-0.5" />
                    Credits
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <Card variant="luxury" className="overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      User
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Role
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Credits
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Joined
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-[var(--muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)]"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface)]">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
                                <span className="text-[var(--background)] font-bold">
                                  {(user.name || user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {user.name || "No name"}
                            </p>
                            <p className="text-sm text-[var(--muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.role === "ADMIN" && (
                            <Badge className="bg-red-500/20 text-red-400">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.isCreator && (
                            <Badge className="bg-[var(--gold)]/20 text-[var(--gold)]">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Creator
                            </Badge>
                          )}
                          {user.isAgencyOwner && (
                            <Badge className="bg-purple-500/20 text-purple-400">
                              <Building2 className="w-3 h-3 mr-1" />
                              Agency
                            </Badge>
                          )}
                          {user.role === "USER" && !user.isCreator && !user.isAgencyOwner && (
                            <Badge className="bg-gray-500/20 text-gray-400">
                              <UserIcon className="w-3 h-3 mr-1" />
                              User
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {user.emailVerified ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            <Mail className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-[var(--gold)]" />
                            <span className="text-[var(--foreground)] font-medium">
                              {(user.creditBalance || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-400">{(user.paidCredits || 0).toLocaleString()} paid</span>
                            <span className="text-purple-400">{(user.bonusCredits || 0).toLocaleString()} bonus</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[var(--muted)] text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {!user.emailVerified && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendVerification(user.id, user.email)}
                                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManualVerify(user.id)}
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Verify
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateRole(
                                user.id,
                                user.role === "ADMIN" ? "USER" : "ADMIN"
                              )
                            }
                          >
                            {user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleCreator(user.id, user.isCreator)}
                          >
                            {user.isCreator ? "Remove Creator" : "Make Creator"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAgencyOwner(user.id, user.isAgencyOwner)}
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            <Building2 className="w-3 h-3 mr-1" />
                            {user.isAgencyOwner ? "Remove Agency" : "Make Agency"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreditsModal({
                              userId: user.id,
                              userName: user.name || user.email,
                              paidCredits: user.paidCredits || 0,
                              bonusCredits: user.bonusCredits || 0,
                            })}
                            className="border-[var(--gold)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10"
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            Give Credits
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModal({ userId: user.id, userName: user.name || user.email })}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Give Credits Modal */}
      {creditsModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)]">Give Credits</h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] truncate max-w-[150px] sm:max-w-none">{creditsModal.userName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreditsModal(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Current balances */}
                <div className="bg-[var(--background)] rounded-xl p-2.5 sm:p-3 border border-[var(--border)]">
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] mb-1.5 sm:mb-2">Current Balance</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]"></div>
                      <span className="text-xs sm:text-sm text-yellow-400">{creditsModal.paidCredits.toLocaleString()} paid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_6px_rgba(156,163,175,0.6)]"></div>
                      <span className="text-xs sm:text-sm text-gray-300">{creditsModal.bonusCredits.toLocaleString()} bonus</span>
                    </div>
                  </div>
                </div>

                {/* Credit type selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Credit Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCreditType("PAID")}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl border transition-all ${
                        creditType === "PAID"
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:border-yellow-500/50"
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-medium text-sm">Paid</p>
                        <p className="text-[10px] sm:text-xs opacity-70">Everywhere</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setCreditType("BONUS")}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl border transition-all ${
                        creditType === "BONUS"
                          ? "bg-gray-500/20 border-gray-400 text-gray-300 shadow-[0_0_10px_rgba(156,163,175,0.2)]"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted)] hover:border-gray-400/50"
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-medium text-sm">Bonus</p>
                        <p className="text-[10px] sm:text-xs opacity-70">PPV only</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5 sm:mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    min="1"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)] text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-1">
                    100 credits = $1.00
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCreditsAmount(amount.toString())}
                      className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        creditType === "PAID"
                          ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20"
                          : "bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 border border-gray-500/20"
                      }`}
                    >
                      {amount >= 1000 ? `${amount/1000}k` : amount}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-sm"
                    onClick={() => {
                      setCreditsModal(null);
                      setCreditType("PAID");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 text-sm font-bold ${
                      creditType === "PAID"
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                        : "bg-gradient-to-r from-gray-400 to-slate-500 hover:from-gray-500 hover:to-slate-600 text-black shadow-[0_0_15px_rgba(156,163,175,0.3)]"
                    }`}
                    onClick={handleGiveCredits}
                    disabled={isGivingCredits || !creditsAmount}
                  >
                    {isGivingCredits ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-1.5" />
                        Give {creditType === "PAID" ? "Paid" : "Bonus"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-red-500/30 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)]">Delete User</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)]">This cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-red-300">
                  Delete <strong className="text-red-400 break-all">{deleteModal.userName}</strong> and all data:
                </p>
                <ul className="mt-2 text-xs sm:text-sm text-red-300/80 list-disc list-inside space-y-0.5 sm:space-y-1">
                  <li>Messages & conversations</li>
                  <li>Subscriptions & payments</li>
                  <li>Credit transactions</li>
                </ul>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-sm"
                  onClick={() => setDeleteModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
