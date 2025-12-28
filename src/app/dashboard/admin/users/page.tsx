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
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  isCreator: boolean;
  emailVerified: Date | null;
  subscriptions: { creatorId: string }[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterRole === "all" ||
      (filterRole === "admin" && user.role === "ADMIN") ||
      (filterRole === "creator" && user.isCreator) ||
      (filterRole === "user" && user.role === "USER" && !user.isCreator) ||
      (filterRole === "pending" && !user.emailVerified) ||
      (filterRole === "verified" && user.emailVerified);

    return matchesSearch && matchesFilter;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Users
          </h1>
          <p className="text-[var(--muted)]">
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
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "admin", "creator", "user", "pending", "verified"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterRole(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filterRole === filter
                  ? filter === "pending"
                    ? "bg-yellow-500 text-black"
                    : filter === "verified"
                    ? "bg-emerald-500 text-black"
                    : "bg-[var(--gold)] text-[var(--background)]"
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
        className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
      >
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{users.length}</p>
              <p className="text-sm text-[var(--muted)]">Total Users</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.role === "ADMIN").length}
              </p>
              <p className="text-sm text-[var(--muted)]">Admins</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.isCreator).length}
              </p>
              <p className="text-sm text-[var(--muted)]">Creators</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => u.emailVerified).length}
              </p>
              <p className="text-sm text-[var(--muted)]">Verified</p>
            </div>
          </div>
        </Card>
        <Card variant="luxury" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {users.filter((u) => !u.emailVerified).length}
              </p>
              <p className="text-sm text-[var(--muted)]">Pending</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No users found
          </h3>
          <p className="text-[var(--muted)]">
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
          <Card variant="luxury" className="overflow-hidden">
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
                      Subscriptions
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
                          {user.role === "USER" && !user.isCreator && (
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
                      <td className="py-4 px-4 text-[var(--foreground)]">
                        {user.subscriptions?.length || 0}
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
