"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  CalendarCheck,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, type DashboardAdminData } from "@/lib/data-api";

type AnalyticsState = {
  byState: Array<{ state: string; mandis: number; bookings: number }>;
  platformUtilization: number;
};

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardAdminData["data"] | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadAnalytics = async () => {
      try {
        const [dashboardResponse, analyticsResponse] = await Promise.all([
          dashboardApi.admin(token),
          dashboardApi.analytics(token),
        ]);
        setDashboard(dashboardResponse.data);
        setAnalytics(analyticsResponse.data as AnalyticsState);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [token]);

  const monthlyData = dashboard?.monthlyBookings || [];
  const topStates = analytics?.byState || [];
  const maxBookings = Math.max(...monthlyData.map((d) => d.bookings), 1);
  const maxStateBookings = Math.max(...topStates.map((s) => s.bookings), 1);

  const kpiCards = useMemo(() => {
    if (!dashboard || !analytics) return [];
    return [
      { label: "Platform Bookings", value: dashboard.stats.totalBookingsToday.toLocaleString("en-IN"), change: "Today", trend: "up" as const, icon: CalendarCheck },
      { label: "Registered Farmers", value: dashboard.stats.totalFarmers.toLocaleString("en-IN"), change: "Live total", trend: "up" as const, icon: Users },
      { label: "Active Mandis", value: dashboard.stats.activeMandis.toLocaleString("en-IN"), change: `${dashboard.stats.totalMandis} total`, trend: "up" as const, icon: Building2 },
      { label: "Platform Utilization", value: `${analytics.platformUtilization}%`, change: "Live slots", trend: "up" as const, icon: TrendingUp },
    ];
  }, [analytics, dashboard]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Platform Analytics</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Live platform trend and state distribution from the backend</p>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-5 h-5 text-[var(--primary)]" />
              <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Booking Growth</h2>
          <div className="flex items-end gap-4 h-48">
            {monthlyData.map((d) => {
              const height = (d.bookings / maxBookings) * 100;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div className="w-full max-w-[40px] rounded-t-md bg-[var(--primary)]" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">{d.month}</span>
                  <span className="text-[10px] text-neutral-400">{(d.bookings / 1000).toFixed(1)}k</span>
                </div>
              );
            })}
            {monthlyData.length === 0 ? <p className="text-sm text-neutral-500">No monthly booking data available.</p> : null}
          </div>
        </motion.div>

        {/* State Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top States</h2>
          <div className="space-y-4">
            {topStates.map((state) => (
              <div key={state.state}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{state.state}</span>
                  <span className="text-xs text-neutral-500">{state.mandis} mandis · {state.bookings.toLocaleString("en-IN")} bookings</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(state.bookings / maxStateBookings) * 100}%` }} />
                </div>
              </div>
            ))}
            {topStates.length === 0 ? <p className="text-sm text-neutral-500">No state analytics available.</p> : null}
          </div>
        </motion.div>
      </div>

      {/* Monthly Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Month</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Bookings</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Farmers</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Avg Farmers / Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {monthlyData.map((d) => (
                <tr key={d.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">{d.month}</td>
                  <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{d.bookings.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{d.farmers.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-neutral-900 dark:text-white">{d.bookings > 0 ? (d.farmers / d.bookings).toFixed(2) : "0.00"}</td>
                </tr>
              ))}
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-neutral-500">No monthly booking data available.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
