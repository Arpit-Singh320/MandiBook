"use client";

import { motion } from "motion/react";
import {
  Building2,
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    label: "Total Mandis",
    value: "156",
    change: "+4",
    trend: "up",
    icon: Building2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    label: "Registered Farmers",
    value: "12,847",
    change: "+342",
    trend: "up",
    icon: Users,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Total Bookings (Month)",
    value: "8,921",
    change: "+15%",
    trend: "up",
    icon: CalendarCheck,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    label: "Avg. Crop Price",
    value: "₹2,350",
    change: "-2%",
    trend: "down",
    icon: TrendingUp,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

const topMandis = [
  { name: "Azadpur Mandi, Delhi", bookings: 1245, farmers: 892, revenue: "₹12.5L" },
  { name: "Vashi Mandi, Mumbai", bookings: 1102, farmers: 756, revenue: "₹10.8L" },
  { name: "Koyambedu, Chennai", bookings: 987, farmers: 634, revenue: "₹9.2L" },
  { name: "Bowenpally, Hyderabad", bookings: 876, farmers: 542, revenue: "₹8.1L" },
  { name: "Yeshwanthpur, Bangalore", bookings: 823, farmers: 498, revenue: "₹7.6L" },
];

const recentActivity = [
  { action: "New mandi registered", detail: "Siliguri Mandi, West Bengal", time: "2 hours ago" },
  { action: "Price alert triggered", detail: "Wheat dropped below ₹2,200/Q", time: "4 hours ago" },
  { action: "Manager approved", detail: "Vikas Patel — Surat Mandi", time: "5 hours ago" },
  { action: "Issue reported", detail: "Slot overbooking at Azadpur", time: "6 hours ago" },
  { action: "System update", detail: "v2.4.1 deployed — bug fixes", time: "8 hours ago" },
];

export default function AdminDashboard() {
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
          Platform overview — March 2026
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
            <a
              href="/admin/mandis"
              className="text-sm text-[var(--primary)] font-medium flex items-center gap-1 no-underline hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </a>
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
                {topMandis.map((mandi) => (
                  <tr
                    key={mandi.name}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {mandi.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {mandi.bookings.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {mandi.farmers.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {mandi.revenue}
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
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-4 sm:p-5">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {activity.detail}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
