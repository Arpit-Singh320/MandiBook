"use client";

import { useState } from "react";
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
} from "lucide-react";

type RoleFilter = "all" | "farmer" | "manager" | "admin";

interface AppUser {
  id: string;
  name: string;
  role: "farmer" | "manager" | "admin";
  email?: string;
  phone: string;
  location: string;
  status: "active" | "suspended";
  joinedAt: string;
}

const users: AppUser[] = [
  { id: "u1", name: "Ramesh Kumar", role: "farmer", phone: "98765xxxxx", location: "Varanasi, UP", status: "active", joinedAt: "Dec 2024" },
  { id: "u2", name: "Suresh Patel", role: "manager", email: "suresh@mandibook.in", phone: "98765xxxxx", location: "Delhi", status: "active", joinedAt: "Nov 2024" },
  { id: "u3", name: "Priya Devi", role: "farmer", phone: "98765xxxxx", location: "Lucknow, UP", status: "active", joinedAt: "Jan 2025" },
  { id: "u4", name: "Amit Singh", role: "farmer", phone: "98765xxxxx", location: "Meerut, UP", status: "active", joinedAt: "Feb 2025" },
  { id: "u5", name: "Rajesh Desai", role: "manager", email: "rajesh@mandibook.in", phone: "98765xxxxx", location: "Mumbai", status: "active", joinedAt: "Oct 2024" },
  { id: "u6", name: "Admin User", role: "admin", email: "admin@mandibook.in", phone: "98765xxxxx", location: "Delhi", status: "active", joinedAt: "Oct 2024" },
  { id: "u7", name: "Sunita Yadav", role: "farmer", phone: "98765xxxxx", location: "Agra, UP", status: "suspended", joinedAt: "Mar 2025" },
  { id: "u8", name: "Vikas Sharma", role: "farmer", phone: "98765xxxxx", location: "Jaipur, RJ", status: "active", joinedAt: "Jan 2025" },
  { id: "u9", name: "Senthil Kumar", role: "manager", email: "senthil@mandibook.in", phone: "98765xxxxx", location: "Chennai", status: "active", joinedAt: "Nov 2024" },
  { id: "u10", name: "Deepak Verma", role: "farmer", phone: "98765xxxxx", location: "Kanpur, UP", status: "active", joinedAt: "Feb 2025" },
];

const roleConfig: Record<string, { icon: typeof Users; color: string; label: string }> = {
  farmer: { icon: Wheat, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Farmer" },
  manager: { icon: Building2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Manager" },
  admin: { icon: Shield, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Admin" },
};

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const matchesFilter = filter === "all" || u.role === filter;
    const matchesSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.location.toLowerCase().includes(search.toLowerCase()) ||
      (u.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: users.length,
    farmer: users.filter((u) => u.role === "farmer").length,
    manager: users.filter((u) => u.role === "manager").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">{users.length} users across all roles</p>
      </motion.div>

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
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{counts[role]}</p>
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
            {filtered.map((user) => {
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
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{user.email ?? user.phone}</td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{user.location}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{user.joinedAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><Eye className="w-4 h-4 text-neutral-500" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Ban className="w-4 h-4 text-red-500" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><MoreVertical className="w-4 h-4 text-neutral-500" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((user, index) => {
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
              <p className="text-xs text-neutral-500">{user.location} · Joined {user.joinedAt}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
