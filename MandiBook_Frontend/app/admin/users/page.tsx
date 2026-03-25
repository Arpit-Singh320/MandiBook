"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Users,
  Wheat,
  Building2,
  Shield,
  MoreVertical,
  Eye,
  Ban,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { userApi, type UserData } from "@/lib/data-api";

type RoleFilter = "all" | "farmer" | "manager" | "admin";

const roleConfig: Record<string, { icon: typeof Users; color: string; label: string }> = {
  farmer: { icon: Wheat, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Farmer" },
  manager: { icon: Building2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Manager" },
  admin: { icon: Shield, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Admin" },
};

const formatJoinedDate = (value: string) => new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
}).format(new Date(value));

const buildUserLocation = (user: UserData) => {
  const pieces = [user.village, user.district, user.state].filter(Boolean);
  if (pieces.length > 0) return pieces.join(", ");
  if (user.designation) return user.designation;
  if (user.department) return user.department;
  return "Location unavailable";
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const params: { role?: string; search?: string; limit?: number } = { limit: 100 };
        if (filter !== "all") params.role = filter;
        if (search) params.search = search;
        const response = await userApi.list(token, params);
        setUsers(response.data);
        setCounts(response.counts || {});
        setTotal(response.total || response.data.length);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [filter, search, token]);

  const summaryCounts = useMemo(() => ({
    all: total,
    farmer: counts.farmer || 0,
    manager: counts.manager || 0,
    admin: counts.admin || 0,
  }), [counts, total]);

  const toggleStatus = async (user: UserData) => {
    if (!token) return;
    const nextStatus = user.status === "active" ? "suspended" : "active";
    setActionUserId(user.id);
    setError("");
    try {
      const response = await userApi.updateStatus(token, user.id, nextStatus);
      setUsers((prev) => prev.map((entry) => (entry.id === user.id ? response.data : entry)));
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update user status");
    } finally {
      setActionUserId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">{summaryCounts.all} users across all roles</p>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["all", "farmer", "manager", "admin"] as RoleFilter[]).map((role) => {
          const config = role === "all" ? { icon: Users, color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300", label: "All Users" } : roleConfig[role]!;
          const Icon = config.icon;
          return (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`bg-white dark:bg-neutral-900 rounded-xl border p-4 text-left transition-all ${
                filter === role ? "border-[var(--primary)] ring-2 ring-[var(--ring)]" : "border-[var(--border)]"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color} mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{summaryCounts[role]}</p>
              <p className="text-xs text-neutral-500">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or location..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">User</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Role</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Contact</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Location</th>
              <th className="text-center text-xs font-medium text-neutral-500 px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Joined</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((user) => {
              const rc = roleConfig[user.role]!;
              return (
                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${rc.color}`}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rc.color}`}>{rc.label}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{user.email ?? user.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{buildUserLocation(user)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{formatJoinedDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><Eye className="w-4 h-4 text-neutral-500" /></button>
                      <button
                        type="button"
                        onClick={() => void toggleStatus(user)}
                        disabled={actionUserId === user.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><MoreVertical className="w-4 h-4 text-neutral-500" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-neutral-500">No users found matching your criteria.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {users.map((user, index) => {
          const rc = roleConfig[user.role]!;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${rc.color}`}>
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rc.color}`}>{rc.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{user.status}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-500">{buildUserLocation(user)} · Joined {formatJoinedDate(user.createdAt)}</p>
            </motion.div>
          );
        })}
        {users.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">No users found matching your criteria.</div>
        ) : null}
      </div>
    </div>
  );
}
