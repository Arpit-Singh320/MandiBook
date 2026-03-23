"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  CalendarCheck,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const monthlyData = [
  { month: "Oct", bookings: 5200, farmers: 8400, revenue: 42 },
  { month: "Nov", bookings: 5800, farmers: 9200, revenue: 48 },
  { month: "Dec", bookings: 6400, farmers: 10100, revenue: 55 },
  { month: "Jan", bookings: 7200, farmers: 11000, revenue: 61 },
  { month: "Feb", bookings: 8100, farmers: 11800, revenue: 68 },
  { month: "Mar", bookings: 8921, farmers: 12847, revenue: 74 },
];

const topStates = [
  { state: "Uttar Pradesh", mandis: 32, farmers: 3200, share: 25 },
  { state: "Maharashtra", mandis: 28, farmers: 2800, share: 22 },
  { state: "Tamil Nadu", mandis: 18, farmers: 1600, share: 12 },
  { state: "Karnataka", mandis: 16, farmers: 1400, share: 11 },
  { state: "Delhi", mandis: 12, farmers: 1800, share: 14 },
  { state: "Others", mandis: 50, farmers: 2047, share: 16 },
];

const kpiCards = [
  { label: "Platform Bookings", value: "8,921", change: "+10.1%", trend: "up" as const, icon: CalendarCheck },
  { label: "Registered Farmers", value: "12,847", change: "+8.9%", trend: "up" as const, icon: Users },
  { label: "Active Mandis", value: "156", change: "+4", trend: "up" as const, icon: Building2 },
  { label: "Platform GMV", value: "₹74L", change: "+8.8%", trend: "up" as const, icon: TrendingUp },
];

export default function AdminAnalyticsPage() {
  const maxBookings = Math.max(...monthlyData.map((d) => d.bookings));

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Platform Analytics</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">6-month trend — October 2025 to March 2026</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
                <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                  {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
            </motion.div>
          );
        })}
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
                  <span className="text-xs text-neutral-500">{state.mandis} mandis · {state.share}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${state.share}%` }} />
                </div>
              </div>
            ))}
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
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">GMV (₹L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {monthlyData.map((d) => (
                <tr key={d.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">{d.month} 2026</td>
                  <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{d.bookings.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{d.farmers.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-neutral-900 dark:text-white">₹{d.revenue}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
