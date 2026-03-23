"use client";

import { motion } from "motion/react";
import {
  CalendarCheck,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  ArrowUpRight,
} from "lucide-react";

const weeklyData = [
  { day: "Mon", bookings: 38, checkins: 35, revenue: 8.2 },
  { day: "Tue", bookings: 42, checkins: 40, revenue: 9.5 },
  { day: "Wed", bookings: 35, checkins: 33, revenue: 7.8 },
  { day: "Thu", bookings: 47, checkins: 44, revenue: 10.2 },
  { day: "Fri", bookings: 51, checkins: 48, revenue: 11.5 },
  { day: "Sat", bookings: 55, checkins: 52, revenue: 12.8 },
  { day: "Sun", bookings: 30, checkins: 28, revenue: 6.4 },
];

const topCrops = [
  { crop: "Wheat", volume: "450 Q", share: 28 },
  { crop: "Rice", volume: "380 Q", share: 24 },
  { crop: "Potato", volume: "250 Q", share: 16 },
  { crop: "Onion", volume: "200 Q", share: 12 },
  { crop: "Tomato", volume: "180 Q", share: 11 },
  { crop: "Others", volume: "140 Q", share: 9 },
];

const summaryStats = [
  { label: "Total Bookings (Week)", value: "298", change: "+12%", icon: CalendarCheck },
  { label: "Unique Farmers", value: "187", change: "+8%", icon: Users },
  { label: "Check-in Rate", value: "94.3%", change: "+1.2%", icon: TrendingUp },
  { label: "Weekly Revenue", value: "₹66.4L", change: "+15%", icon: BarChart3 },
];

export default function ManagerReportsPage() {
  const maxBookings = Math.max(...weeklyData.map((d) => d.bookings));

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Weekly performance overview — Azadpur Mandi</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
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
            {weeklyData.map((day) => {
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
                        style={{ height: `${(checkinHeight / height) * 100}%` }}
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
            {topCrops.map((crop) => (
              <div key={crop.crop}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{crop.crop}</span>
                  <span className="text-xs text-neutral-500">{crop.volume} ({crop.share}%)</span>
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
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Bookings</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Check-ins</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Rate</th>
                <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {weeklyData.map((day) => {
                const rate = ((day.checkins / day.bookings) * 100).toFixed(1);
                return (
                  <tr key={day.day} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">{day.day}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{day.bookings}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{day.checkins}</td>
                    <td className="px-5 py-3 text-sm text-right text-neutral-600 dark:text-neutral-400">{rate}%</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-neutral-900 dark:text-white">₹{day.revenue}L</td>
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
