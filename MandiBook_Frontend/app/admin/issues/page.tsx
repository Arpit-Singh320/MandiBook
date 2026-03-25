"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  MapPin,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { issueApi, type IssueData } from "@/lib/data-api";

type Priority = "high" | "medium" | "low" | "critical";
type IssueStatus = "open" | "in-progress" | "resolved" | "closed";
type IssueFilter = "all" | IssueStatus;

const priorityConfig: Record<Priority, string> = {
  critical: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusConfig: Record<IssueStatus, { color: string; icon: typeof Clock }> = {
  open: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  "in-progress": { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  resolved: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  closed: { color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300", icon: CheckCircle },
};

const formatRelativeTime = (value: string) => {
  const createdAt = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

export default function AdminIssuesPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadIssues = async () => {
      try {
        setLoading(true);
        const params: { status?: string; search?: string; limit?: number } = { limit: 50 };
        if (filter !== "all") params.status = filter;
        if (search) params.search = search;
        const response = await issueApi.list(token, params);
        setIssues(response.data);
        setCounts(response.counts || {});
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load issues");
      } finally {
        setLoading(false);
      }
    };

    void loadIssues();
  }, [filter, search, token]);

  const summaryCounts = useMemo(() => ({
    open: counts.open || 0,
    "in-progress": counts["in-progress"] || 0,
    resolved: counts.resolved || 0,
  }), [counts]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Issues & Complaints</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {summaryCounts.open} open · {summaryCounts["in-progress"]} in progress
        </p>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["open", "in-progress", "resolved"] as const).map((s) => {
          const sc = statusConfig[s];
          const Icon = sc.icon;
          const count = summaryCounts[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`bg-white dark:bg-neutral-900 rounded-xl border p-4 text-center transition-all ${
                filter === s ? "border-[var(--primary)] ring-2 ring-[var(--ring)]" : "border-[var(--border)]"
              }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${sc.color.split(" ")[1]}`} />
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{count}</p>
              <p className="text-xs text-neutral-500 capitalize">{s}</p>
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
          placeholder="Search by title, mandi, or issue ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Issue List */}
      <div className="space-y-3">
        {issues.map((issue, index) => {
          const sc = statusConfig[issue.status as IssueStatus] || statusConfig.closed;
          const StatusIcon = sc.icon;
          return (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-neutral-400">{issue.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityConfig[issue.priority as Priority] || priorityConfig.medium}`}>
                    {issue.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" /> {issue.status}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0 ml-2">{formatRelativeTime(issue.createdAt)}</span>
              </div>

              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{issue.title}</h3>
              <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{issue.description}</p>

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.mandiName || "Platform"}</span>
                  <span>by {issue.reporterName}</span>
                </div>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {issue.comments}</span>
              </div>
            </motion.div>
          );
        })}

        {issues.length === 0 && (
          <div className="text-center py-12 text-neutral-500">No issues found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
