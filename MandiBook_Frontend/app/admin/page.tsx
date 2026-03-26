"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, type DashboardAdminData } from "@/lib/data-api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatMonthLabel(monthKey?: string) {
  if (!monthKey) return "Current period";
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${monthKey}-01T00:00:00`));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardAdminData["data"] | null>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const response = await dashboardApi.admin(token);
        setDashboard(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const stats = useMemo(() => {
    if (!dashboard) return [];

    const latestMonth = dashboard.monthlyBookings.at(-1);

    return [
      {
        label: "Total Mandis",
        value: numberFormatter.format(dashboard.stats.totalMandis),
        change: `${dashboard.stats.activeMandis} active`,
        trend: dashboard.stats.activeMandis > 0 ? "up" : "down",
        icon: Building2,
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        label: "Registered Farmers",
        value: numberFormatter.format(dashboard.stats.totalFarmers),
        change: `${dashboard.stats.totalManagers} managers`,
        trend: dashboard.stats.totalManagers > 0 ? "up" : "down",
        icon: Users,
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        label: `Bookings (${formatMonthLabel(latestMonth?.month)})`,
        value: numberFormatter.format(latestMonth?.bookings || dashboard.stats.totalBookingsToday),
        change: `${numberFormatter.format(dashboard.stats.totalBookingsToday)} today`,
        trend: (latestMonth?.bookings || 0) >= dashboard.stats.totalBookingsToday ? "up" : "down",
        icon: CalendarCheck,
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        label: "Avg. Crop Price",
        value: currencyFormatter.format(dashboard.stats.avgCropPrice),
        change: `${dashboard.stats.totalCatalogCrops} catalog crops`,
        trend: dashboard.stats.avgCropPrice > 0 ? "up" : "down",
        icon: TrendingUp,
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error || "Failed to load admin dashboard"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Platform overview — {formatMonthLabel(dashboard.monthlyBookings.at(-1)?.month)}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-medium flex items-center gap-0.5 ${stat.trend === "up" ? "text-green-600" : "text-red-500"}`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Mandis Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Top Mandis
            </h2>
            <Link
              href="/admin/mandis"
              className="text-sm text-[var(--primary)] font-medium flex items-center gap-1 no-underline hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Mandi
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Bookings
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Farmers
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {dashboard.topMandis.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-neutral-500">
                      No mandi performance data available yet.
                    </td>
                  </tr>
                ) : dashboard.topMandis.map((mandi) => (
                  <tr
                    key={`${mandi.name}-${mandi.city}`}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {[mandi.name, mandi.city, mandi.state].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {mandi.bookings.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {mandi.farmers.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {currencyFormatter.format(dashboard.stats.avgCropPrice * mandi.bookings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-[var(--border)] space-y-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Compliance snapshot</p>
              <p className="text-xs text-neutral-500">Mandis without managers: {dashboard.compliance.mandisWithoutManagers}</p>
              <p className="text-xs text-neutral-500">Mandis at manager limit: {dashboard.compliance.mandisAtManagerLimit}</p>
              <p className="text-xs text-neutral-500">Mandis missing prices: {dashboard.compliance.mandisMissingPrices}</p>
              <p className="text-xs text-neutral-500">Mandis with prices below baseline: {dashboard.compliance.mandisWithOutOfRangePrices}</p>
            </div>
            {dashboard.recentActivity.length === 0 ? (
              <div className="p-4 sm:p-5 text-sm text-neutral-500">No recent platform activity available.</div>
            ) : dashboard.recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 sm:p-5">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {activity.details || activity.entity}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {formatRelativeDate(activity.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
