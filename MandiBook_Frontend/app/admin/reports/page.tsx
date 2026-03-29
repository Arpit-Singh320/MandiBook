"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Download,
  FileText,
  CalendarCheck,
  Users,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, type AdminReportData } from "@/lib/data-api";

type DownloadableReport = {
  name: string;
  description: string;
  format: string;
  lastGenerated: string;
  payload: unknown;
  fileName: string;
};

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [report, setReport] = useState<AdminReportData["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadReport = async () => {
      try {
        const response = await dashboardApi.adminReports(token);
        setReport(response.data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [token]);

  const reportCards = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Platform Bookings", value: report.platformSummary.platformBookings.toLocaleString("en-IN"), change: `${report.bookingStatusBreakdown.length} statuses`, icon: CalendarCheck },
      { label: "Total Farmers", value: report.platformSummary.totalFarmers.toLocaleString("en-IN"), change: `${report.platformSummary.openIssues} open issues`, icon: Users },
      { label: "Active Mandis", value: report.platformSummary.activeMandis.toLocaleString("en-IN"), change: `${report.platformSummary.totalManagers} managers`, icon: Building2 },
      { label: "Catalog Crops", value: report.platformSummary.totalCatalogCrops.toLocaleString("en-IN"), change: `${report.cropCoverage.length} mandi rows`, icon: TrendingUp },
    ];
  }, [report]);

  const availableReports = useMemo<DownloadableReport[]>(() => {
    if (!report) return [];
    return [
      {
        name: "Booking Status Breakdown",
        description: report.bookingStatusBreakdown.map((entry) => `${entry.status}: ${entry.count}`).join(" · ") || "No booking status data available",
        format: "Live API",
        lastGenerated: report.recentActivity[0]?.createdAt || new Date().toISOString(),
        payload: report.bookingStatusBreakdown,
        fileName: "booking-status-breakdown.json",
      },
      {
        name: "Manager Distribution by Mandi",
        description: `${report.managerDistribution.length} mandis currently have assigned managers in the report output`,
        format: "Live API",
        lastGenerated: report.recentActivity[0]?.createdAt || new Date().toISOString(),
        payload: report.managerDistribution,
        fileName: "manager-distribution-by-mandi.json",
      },
      {
        name: "Crop Coverage Summary",
        description: `${report.cropCoverage.filter((entry) => entry.priceCount > 0).length} mandis currently have live crop prices configured`,
        format: "Live API",
        lastGenerated: report.recentActivity[0]?.createdAt || new Date().toISOString(),
        payload: report.cropCoverage,
        fileName: "crop-coverage-summary.json",
      },
      {
        name: "Recent Activity Feed",
        description: `${report.recentActivity.length} latest audit events included for admin review`,
        format: "Live API",
        lastGenerated: report.recentActivity[0]?.createdAt || new Date().toISOString(),
        payload: report.recentActivity,
        fileName: "recent-activity-feed.json",
      },
    ];
  }, [report]);

  const handleDownload = (downloadableReport: DownloadableReport) => {
    const blob = new Blob([JSON.stringify(downloadableReport.payload, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = downloadableReport.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  const formatGeneratedAt = (value: string) => new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Generate and download platform reports</p>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

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
                  <p className="text-[10px] text-neutral-400 mt-1">Last generated: {formatGeneratedAt(report.lastGenerated)} · {report.format}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(report)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 self-start sm:self-center"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </motion.div>
          ))}
          {availableReports.length === 0 ? (
            <div className="p-5 text-sm text-neutral-500">No live report data available.</div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
