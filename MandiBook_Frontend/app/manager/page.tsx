"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarCheck,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, type DashboardManagerData } from "@/lib/data-api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatToday() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function ManagerDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardManagerData["data"] | null>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const response = await dashboardApi.manager(token);
        setDashboard(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load manager dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const stats = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        label: "Today's Bookings",
        value: numberFormatter.format(dashboard.stats.todayBookings),
        change: `${dashboard.todayBreakdown.confirmed} confirmed`,
        icon: CalendarCheck,
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        label: "Active Farmers",
        value: numberFormatter.format(dashboard.stats.activeFarmers),
        change: `${dashboard.stats.managerCount} managers`,
        icon: Users,
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        label: "Avg. Price (Wheat)",
        value: currencyFormatter.format(dashboard.stats.avgWheatPrice),
        change: `${dashboard.priceSummary.totalCrops} crops priced`,
        icon: TrendingUp,
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      },
      {
        label: "Available Slots",
        value: numberFormatter.format(dashboard.slotSummary.availableSlots),
        change: `${dashboard.slotSummary.utilization}% utilized`,
        icon: Clock,
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
        <p className="text-red-600">{error || "Failed to load manager dashboard"}</p>
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
          {dashboard.mandiInfo.name} Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today&apos;s overview — {formatToday()}
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
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
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
        {/* Recent Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Today&apos;s Bookings
            </h2>
            <a
              href="/manager/bookings"
              className="text-sm text-[var(--primary)] font-medium flex items-center gap-1 no-underline hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    ID
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Farmer
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Crop
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Qty
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Time
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {dashboard.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-neutral-500">
                      No bookings found for today.
                    </td>
                  </tr>
                ) : dashboard.recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-5 py-3 text-sm font-mono text-neutral-500">
                      {b.bookingNumber}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {b.farmer?.name || b.Farmer?.name || "Farmer"}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {b.cropType}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {numberFormatter.format(b.estimatedQuantity)} Q
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {b.timeSlot}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          b.status === "checked-in"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : b.status === "confirmed"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-[var(--border)]">
            {dashboard.recentBookings.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500">No bookings found for today.</div>
            ) : dashboard.recentBookings.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {b.farmer?.name || b.Farmer?.name || "Farmer"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      b.status === "checked-in"
                        ? "bg-green-100 text-green-700"
                        : b.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {b.cropType} · {numberFormatter.format(b.estimatedQuantity)} Q · {b.timeSlot}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Alerts
            </h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {dashboard.alerts.length === 0 ? (
              <div className="p-4 sm:p-5 text-sm text-neutral-500">
                No operational alerts right now.
              </div>
            ) : dashboard.alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 sm:p-5"
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    alert.type === "warning"
                      ? "text-amber-500"
                      : "text-blue-500"
                  }`}
                />
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
