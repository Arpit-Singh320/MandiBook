"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarCheck,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  ArrowUpRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, type ManagerReportData } from "@/lib/data-api";

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ManagerReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ManagerReportData["data"] | null>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const response = await dashboardApi.managerReports(token);
        setReport(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load manager reports");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const maxBookings = useMemo(() => {
    if (!report || report.weeklyData.length === 0) return 1;
    return Math.max(...report.weeklyData.map((d) => d.bookings), 1);
  }, [report]);

  const summaryStats = useMemo(() => {
    if (!report) return [];

    return [
      { label: "Total Bookings (Week)", value: numberFormatter.format(report.summary.totalBookings), change: `${report.slotSummary.totalSlots} slots`, icon: CalendarCheck },
      { label: "Unique Farmers", value: numberFormatter.format(report.summary.uniqueFarmers), change: `${report.summary.openIssues} open issues`, icon: Users },
      { label: "Check-in Rate", value: `${report.summary.checkinRate}%`, change: `${report.slotSummary.utilization}% utilized`, icon: TrendingUp },
      { label: "Avg. Crop Price", value: currencyFormatter.format(report.priceSummary.avgPrice), change: `${report.priceSummary.totalCrops} crops`, icon: BarChart3 },
    ];
  }, [report]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error || "Failed to load manager reports"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Weekly performance overview — {report.mandiInfo.name}</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((stat, index) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Weekly Bookings
          </h2>
          <div className="flex items-end gap-3 h-48">
            {report.weeklyData.map((day) => {
              const height = (day.bookings / maxBookings) * 100;
              const checkinHeight = (day.checkins / maxBookings) * 100;
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-40 relative">
                    <div
                      className="w-full max-w-[32px] rounded-t-md bg-[var(--primary)]/20 relative"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md bg-[var(--primary)]"
                        style={{ height: `${height === 0 ? 0 : (checkinHeight / height) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">{day.day}</span>
                  <span className="text-[10px] text-neutral-400">{day.bookings}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--primary)]/20" /> Bookings
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--primary)]" /> Check-ins
            </span>
          </div>
        </motion.div>

        {/* Top Crops */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Top Crops by Volume
          </h2>
          <div className="space-y-4">
            {report.topCrops.length === 0 ? (
              <p className="text-sm text-neutral-500">No crop volume data available for this week.</p>
            ) : report.topCrops.map((crop) => (
              <div key={crop.crop}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{crop.crop}</span>
                  <span className="text-xs text-neutral-500">{numberFormatter.format(crop.totalQty)} Q ({crop.share}%)</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${crop.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Day</th>
                <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Bookings</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Check-ins</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Rate</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Avg Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {report.weeklyData.map((day) => {
                const rate = day.bookings > 0 ? ((day.checkins / day.bookings) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={day.day} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">{day.day}</td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{day.date}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{numberFormatter.format(day.bookings)}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{numberFormatter.format(day.checkins)}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{rate}%</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-neutral-900 dark:text-white">{currencyFormatter.format(report.priceSummary.avgPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
