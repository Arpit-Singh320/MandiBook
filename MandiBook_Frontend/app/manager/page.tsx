"use client";

import { motion } from "motion/react";
import {
  CalendarCheck,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    label: "Today's Bookings",
    value: "47",
    change: "+12%",
    icon: CalendarCheck,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    label: "Active Farmers",
    value: "1,234",
    change: "+8%",
    icon: Users,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Avg. Price (Wheat)",
    value: "₹2,480",
    change: "+3%",
    icon: TrendingUp,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    label: "Available Slots",
    value: "28",
    change: "-5",
    icon: Clock,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

const recentBookings = [
  { id: "BK-101", farmer: "Ramesh Kumar", crop: "Wheat", qty: "50 Q", time: "08:00 AM", status: "checked-in" },
  { id: "BK-102", farmer: "Suresh Patel", crop: "Rice", qty: "30 Q", time: "09:00 AM", status: "confirmed" },
  { id: "BK-103", farmer: "Amit Singh", crop: "Vegetables", qty: "20 Q", time: "10:00 AM", status: "confirmed" },
  { id: "BK-104", farmer: "Priya Devi", crop: "Mustard", qty: "40 Q", time: "10:00 AM", status: "pending" },
  { id: "BK-105", farmer: "Vikas Sharma", crop: "Potato", qty: "60 Q", time: "11:00 AM", status: "confirmed" },
];

const alerts = [
  { message: "3 farmers haven't checked in for their 8 AM slot", type: "warning" },
  { message: "Wheat prices updated — ₹2,480/Q", type: "info" },
  { message: "Tomorrow has 15 unconfirmed bookings", type: "warning" },
];

export default function ManagerDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          Azadpur Mandi Dashboard
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Today&apos;s overview — March 19, 2026
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
                <span className="text-xs font-medium text-green-600">
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
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-5 py-3 text-sm font-mono text-neutral-500">
                      {b.id}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {b.farmer}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {b.crop}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {b.qty}
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {b.time}
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
            {recentBookings.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {b.farmer}
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
                  {b.crop} · {b.qty} · {b.time}
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
            {alerts.map((alert, index) => (
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
