"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, ScrollText, User, Building2, Shield, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auditLogApi, type AuditLogData } from "@/lib/data-api";

type ActionType = "all" | "login" | "booking" | "price" | "user" | "system" | "mandi";

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

const formatTimestamp = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

export default function AuditLogsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<ActionType>("all");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadLogs = async () => {
      try {
        setLoading(true);
        const params: { type?: string; search?: string; limit?: number } = { limit: 50 };
        if (filter !== "all") params.type = filter;
        if (search) params.search = search;
        const response = await auditLogApi.list(token, params);
        setLogs(response.data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    void loadLogs();
  }, [filter, search, token]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Audit Logs</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Complete activity trail for compliance and monitoring</p>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

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
        {logs.map((log, index) => {
          const actorRole = log.userRole || "system";
          const Icon = roleIcons[actorRole] ?? ScrollText;
          const color = roleColors[actorRole] ?? roleColors.system;
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
                  <strong>{log.userName || "System"}</strong>{" "}
                  <span className="text-neutral-500">{log.action}</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Target: {log.details || log.entity}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatTimestamp(log.createdAt)}</span>
                  <span>IP: {log.ipAddress || "—"}</span>
                  <span className="font-mono">{log.id}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-12 text-neutral-500">No logs found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
