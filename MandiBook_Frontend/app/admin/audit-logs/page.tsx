"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, ScrollText, User, Building2, Shield, Clock } from "lucide-react";

type ActionType = "all" | "login" | "booking" | "price" | "user" | "system" | "mandi";

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorRole: "farmer" | "manager" | "admin" | "system";
  target: string;
  timestamp: string;
  ip: string;
  type: ActionType;
}

const logs: AuditLog[] = [
  { id: "AL-001", action: "Logged in", actor: "Admin User", actorRole: "admin", target: "Admin Portal", timestamp: "Mar 19, 2026 05:30 PM", ip: "10.0.x.x", type: "login" },
  { id: "AL-002", action: "Updated wheat price to ₹2,480", actor: "Suresh Patel", actorRole: "manager", target: "Azadpur Mandi", timestamp: "Mar 19, 2026 08:30 AM", ip: "10.0.x.x", type: "price" },
  { id: "AL-003", action: "Approved manager application", actor: "Admin User", actorRole: "admin", target: "Vikas Patel → Surat Mandi", timestamp: "Mar 19, 2026 01:00 PM", ip: "10.0.x.x", type: "user" },
  { id: "AL-004", action: "Registered new mandi", actor: "Admin User", actorRole: "admin", target: "Siliguri Mandi, WB", timestamp: "Mar 19, 2026 10:00 AM", ip: "10.0.x.x", type: "mandi" },
  { id: "AL-005", action: "Booking created", actor: "Ramesh Kumar", actorRole: "farmer", target: "BK-001 @ Azadpur Mandi", timestamp: "Mar 19, 2026 07:15 AM", ip: "10.0.x.x", type: "booking" },
  { id: "AL-006", action: "Suspended user", actor: "System", actorRole: "system", target: "Sunita Yadav (3 no-shows)", timestamp: "Mar 18, 2026 06:00 PM", ip: "—", type: "user" },
  { id: "AL-007", action: "Deployed v2.4.1", actor: "System", actorRole: "system", target: "Platform", timestamp: "Mar 18, 2026 02:00 AM", ip: "—", type: "system" },
  { id: "AL-008", action: "Checked in farmer", actor: "Suresh Patel", actorRole: "manager", target: "BK-101 Ramesh Kumar", timestamp: "Mar 19, 2026 08:05 AM", ip: "10.0.x.x", type: "booking" },
  { id: "AL-009", action: "Cancelled booking", actor: "Deepak Verma", actorRole: "farmer", target: "BK-107 @ Ghazipur Mandi", timestamp: "Mar 18, 2026 04:30 PM", ip: "10.0.x.x", type: "booking" },
  { id: "AL-010", action: "Deactivated slot", actor: "Suresh Patel", actorRole: "manager", target: "12:00-02:00 PM @ Azadpur", timestamp: "Mar 18, 2026 11:00 AM", ip: "10.0.x.x", type: "mandi" },
];

const roleIcons: Record<string, typeof User> = {
  farmer: User,
  manager: Building2,
  admin: Shield,
  system: ScrollText,
};

const roleColors: Record<string, string> = {
  farmer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  system: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export default function AuditLogsPage() {
  const [filter, setFilter] = useState<ActionType>("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    const matchesFilter = filter === "all" || l.type === filter;
    const matchesSearch =
      search === "" ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Audit Logs</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Complete activity trail for compliance and monitoring</p>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions, actors, or targets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(["all", "login", "booking", "price", "user", "mandi", "system"] as ActionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === t
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {filtered.map((log, index) => {
          const Icon = roleIcons[log.actorRole] ?? ScrollText;
          const color = roleColors[log.actorRole] ?? roleColors.system;
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 dark:text-white">
                  <strong>{log.actor}</strong>{" "}
                  <span className="text-neutral-500">{log.action}</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Target: {log.target}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {log.timestamp}</span>
                  <span>IP: {log.ip}</span>
                  <span className="font-mono">{log.id}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-500">No logs found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
