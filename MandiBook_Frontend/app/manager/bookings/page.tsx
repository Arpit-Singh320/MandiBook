"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Filter,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

type Status = "all" | "confirmed" | "checked-in" | "pending" | "cancelled";

const bookings = [
  { id: "BK-101", farmer: "Ramesh Kumar", phone: "98765xxxxx", crop: "Wheat", qty: "50 Q", date: "Mar 19, 2026", slot: "08:00 - 10:00 AM", vehicle: "UP32AB1234", status: "checked-in" as const },
  { id: "BK-102", farmer: "Suresh Patel", phone: "98765xxxxx", crop: "Rice", qty: "30 Q", date: "Mar 19, 2026", slot: "09:00 - 11:00 AM", vehicle: "DL4CAF5678", status: "confirmed" as const },
  { id: "BK-103", farmer: "Amit Singh", phone: "98765xxxxx", crop: "Vegetables", qty: "20 Q", date: "Mar 19, 2026", slot: "10:00 - 12:00 PM", vehicle: "HR26DK9012", status: "confirmed" as const },
  { id: "BK-104", farmer: "Priya Devi", phone: "98765xxxxx", crop: "Mustard", qty: "40 Q", date: "Mar 19, 2026", slot: "10:00 - 12:00 PM", vehicle: "—", status: "pending" as const },
  { id: "BK-105", farmer: "Vikas Sharma", phone: "98765xxxxx", crop: "Potato", qty: "60 Q", date: "Mar 19, 2026", slot: "11:00 AM - 01:00 PM", vehicle: "UP14GH3456", status: "confirmed" as const },
  { id: "BK-106", farmer: "Sunita Yadav", phone: "98765xxxxx", crop: "Onion", qty: "25 Q", date: "Mar 19, 2026", slot: "06:00 - 08:00 AM", vehicle: "DL8SAB7890", status: "checked-in" as const },
  { id: "BK-107", farmer: "Deepak Verma", phone: "98765xxxxx", crop: "Tomato", qty: "15 Q", date: "Mar 18, 2026", slot: "08:00 - 10:00 AM", vehicle: "UP32CD1122", status: "cancelled" as const },
  { id: "BK-108", farmer: "Neha Gupta", phone: "98765xxxxx", crop: "Maize", qty: "45 Q", date: "Mar 18, 2026", slot: "10:00 - 12:00 PM", vehicle: "HR06EF3344", status: "checked-in" as const },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  "checked-in": { label: "Checked In", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function ManagerBookingsPage() {
  const [filter, setFilter] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch =
      search === "" ||
      b.farmer.toLowerCase().includes(search.toLowerCase()) ||
      b.crop.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          Booking Management
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Manage and verify farmer slot bookings
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Today", value: bookings.filter((b) => b.date === "Mar 19, 2026").length, color: "text-neutral-900 dark:text-white" },
          { label: "Checked In", value: bookings.filter((b) => b.status === "checked-in").length, color: "text-green-600" },
          { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-blue-600" },
          { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer, crop, or booking ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          {(["all", "checked-in", "confirmed", "pending", "cancelled"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === s
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {s === "all" ? "All" : s === "checked-in" ? "Checked In" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">ID</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Farmer</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Crop / Qty</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Slot</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Vehicle</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Status</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((b) => {
              const sc = statusConfig[b.status];
              return (
                <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3 text-sm font-mono text-neutral-500">{b.id}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{b.farmer}</p>
                    <p className="text-[10px] text-neutral-400">{b.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{b.crop} · {b.qty}</td>
                  <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{b.slot}</td>
                  <td className="px-5 py-3 text-sm font-mono text-neutral-500">{b.vehicle}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc?.color}`}>
                      {sc?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === "confirmed" && (
                        <button className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1">
                          <QrCode className="w-3 h-3" /> Check In
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(selectedBooking === b.id ? null : b.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((b, index) => {
          const sc = statusConfig[b.status];
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400">{b.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sc?.color}`}>{sc?.label}</span>
                </div>
                {b.status === "confirmed" && (
                  <button className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-medium flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Check In
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{b.farmer}</p>
              <p className="text-xs text-neutral-500 mt-1">{b.crop} · {b.qty} · {b.slot}</p>
              {b.vehicle !== "—" && <p className="text-xs text-neutral-400 font-mono mt-0.5">{b.vehicle}</p>}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500">No bookings found matching your criteria.</div>
      )}
    </div>
  );
}
