"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  MapPin,
} from "lucide-react";

type Priority = "high" | "medium" | "low";
type IssueStatus = "open" | "in-progress" | "resolved";
type IssueFilter = "all" | IssueStatus;

interface Issue {
  id: string;
  title: string;
  description: string;
  mandi: string;
  reportedBy: string;
  priority: Priority;
  status: IssueStatus;
  createdAt: string;
  comments: number;
}

const issues: Issue[] = [
  { id: "ISS-001", title: "Slot overbooking at peak hours", description: "08:00 AM slot regularly exceeds capacity by 3-5 farmers. Gate staff unable to manage.", mandi: "Azadpur Mandi, Delhi", reportedBy: "Suresh Patel (Manager)", priority: "high", status: "open", createdAt: "2 hours ago", comments: 4 },
  { id: "ISS-002", title: "QR scanner not working at Gate 2", description: "The QR code scanner at Gate 2 has been malfunctioning since yesterday.", mandi: "Vashi Mandi, Mumbai", reportedBy: "Rajesh Desai (Manager)", priority: "high", status: "in-progress", createdAt: "1 day ago", comments: 6 },
  { id: "ISS-003", title: "Price update delay", description: "Prices from Koyambedu are showing yesterday's rates. Manager reports updating them but they don't reflect.", mandi: "Koyambedu, Chennai", reportedBy: "Senthil Kumar (Manager)", priority: "medium", status: "open", createdAt: "3 hours ago", comments: 2 },
  { id: "ISS-004", title: "Farmer complaint — wrong slot assigned", description: "Farmer Amit Singh says he booked 08:00 AM but system shows 10:00 AM.", mandi: "Ghazipur Mandi, Delhi", reportedBy: "Amit Singh (Farmer)", priority: "medium", status: "in-progress", createdAt: "5 hours ago", comments: 3 },
  { id: "ISS-005", title: "Parking area overflow", description: "Insufficient parking at mandi. Vehicles blocking main road during morning hours.", mandi: "Bowenpally, Hyderabad", reportedBy: "Naresh Reddy (Manager)", priority: "low", status: "open", createdAt: "2 days ago", comments: 1 },
  { id: "ISS-006", title: "Weighbridge calibration needed", description: "Multiple farmer complaints about inaccurate weighing at Narela Mandi.", mandi: "Narela Mandi, Delhi", reportedBy: "System Alert", priority: "high", status: "resolved", createdAt: "3 days ago", comments: 8 },
];

const priorityConfig: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusConfig: Record<IssueStatus, { color: string; icon: typeof Clock }> = {
  open: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  "in-progress": { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  resolved: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
};

export default function AdminIssuesPage() {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = issues.filter((i) => {
    const matchesFilter = filter === "all" || i.status === filter;
    const matchesSearch =
      search === "" ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.mandi.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Issues & Complaints</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {issues.filter((i) => i.status === "open").length} open · {issues.filter((i) => i.status === "in-progress").length} in progress
        </p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["open", "in-progress", "resolved"] as IssueStatus[]).map((s) => {
          const sc = statusConfig[s];
          const Icon = sc.icon;
          const count = issues.filter((i) => i.status === s).length;
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
        {filtered.map((issue, index) => {
          const sc = statusConfig[issue.status];
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
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityConfig[issue.priority]}`}>
                    {issue.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" /> {issue.status}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0 ml-2">{issue.createdAt}</span>
              </div>

              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{issue.title}</h3>
              <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{issue.description}</p>

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.mandi}</span>
                  <span>by {issue.reportedBy}</span>
                </div>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {issue.comments}</span>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-500">No issues found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
