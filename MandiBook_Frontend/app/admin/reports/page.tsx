"use client";

import { motion } from "motion/react";
import {
  Download,
  FileText,
  CalendarCheck,
  Users,
  TrendingUp,
  Building2,
  ArrowUpRight,
} from "lucide-react";

const reportCards = [
  { label: "Platform Bookings", value: "52,847", change: "+18%", icon: CalendarCheck },
  { label: "Total Farmers", value: "12,847", change: "+32%", icon: Users },
  { label: "Active Mandis", value: "156", change: "+26%", icon: Building2 },
  { label: "GMV (Cumulative)", value: "₹4.2Cr", change: "+45%", icon: TrendingUp },
];

const availableReports = [
  { name: "Monthly Booking Summary", description: "Aggregated booking data across all mandis", format: "PDF / CSV", lastGenerated: "Mar 15, 2026" },
  { name: "Farmer Registration Trends", description: "New farmer sign-ups by state and month", format: "PDF / CSV", lastGenerated: "Mar 14, 2026" },
  { name: "Revenue & GMV Report", description: "Platform revenue, transaction volumes, and GMV", format: "PDF / XLSX", lastGenerated: "Mar 10, 2026" },
  { name: "Mandi Performance Scorecard", description: "Per-mandi metrics: bookings, check-ins, revenue", format: "PDF", lastGenerated: "Mar 12, 2026" },
  { name: "Price Volatility Analysis", description: "Crop price trends, anomalies, and inter-mandi comparison", format: "PDF / CSV", lastGenerated: "Mar 16, 2026" },
  { name: "Issue & Resolution Report", description: "Open/closed issues, resolution times, categories", format: "PDF", lastGenerated: "Mar 13, 2026" },
  { name: "User Activity & Engagement", description: "DAU/MAU, session lengths, feature usage", format: "PDF / CSV", lastGenerated: "Mar 11, 2026" },
];

export default function AdminReportsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Generate and download platform reports</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Available Reports */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Available Reports</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {availableReports.map((report, index) => (
            <motion.div
              key={report.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.03 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{report.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{report.description}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Last generated: {report.lastGenerated} · {report.format}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 self-start sm:self-center">
                <Download className="w-4 h-4" /> Download
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
