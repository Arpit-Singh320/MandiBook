"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  MapPin,
  Users,
  CalendarCheck,
  MoreVertical,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Mandi {
  id: string;
  name: string;
  city: string;
  state: string;
  manager: string;
  farmers: number;
  bookingsToday: number;
  slots: number;
  active: boolean;
}

const mandis: Mandi[] = [
  { id: "m1", name: "Azadpur Mandi", city: "Delhi", state: "Delhi", manager: "Suresh Patel", farmers: 892, bookingsToday: 47, slots: 6, active: true },
  { id: "m2", name: "Vashi Mandi", city: "Mumbai", state: "Maharashtra", manager: "Rajesh Desai", farmers: 756, bookingsToday: 38, slots: 8, active: true },
  { id: "m3", name: "Koyambedu Market", city: "Chennai", state: "Tamil Nadu", manager: "Senthil Kumar", farmers: 634, bookingsToday: 32, slots: 5, active: true },
  { id: "m4", name: "Bowenpally Mandi", city: "Hyderabad", state: "Telangana", manager: "Naresh Reddy", farmers: 542, bookingsToday: 28, slots: 4, active: true },
  { id: "m5", name: "Yeshwanthpur Mandi", city: "Bangalore", state: "Karnataka", manager: "Mahesh Gowda", farmers: 498, bookingsToday: 25, slots: 5, active: true },
  { id: "m6", name: "Ghazipur Mandi", city: "Delhi", state: "Delhi", manager: "Amit Verma", farmers: 445, bookingsToday: 22, slots: 4, active: true },
  { id: "m7", name: "Siliguri Mandi", city: "Siliguri", state: "West Bengal", manager: "—", farmers: 0, bookingsToday: 0, slots: 0, active: false },
  { id: "m8", name: "Narela Mandi", city: "Delhi", state: "Delhi", manager: "Vikram Singh", farmers: 312, bookingsToday: 18, slots: 3, active: true },
];

export default function AdminMandisPage() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const filtered = mandis.filter((m) => {
    const matchesSearch =
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive || m.active;
    return matchesSearch && matchesActive;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Mandi Management</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{mandis.length} mandis registered on the platform</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Mandi
        </button>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showInactive ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] text-neutral-600 dark:text-neutral-400"
          }`}
        >
          {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          Show Inactive
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Mandi</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Location</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Manager</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Farmers</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Today</th>
              <th className="text-center text-xs font-medium text-neutral-500 px-5 py-3">Status</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((mandi) => (
              <tr key={mandi.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{mandi.name}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {mandi.city}, {mandi.state}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-neutral-600 dark:text-neutral-400">{mandi.manager}</td>
                <td className="px-5 py-3.5 text-sm text-right text-neutral-600 dark:text-neutral-400 flex items-center justify-end gap-1">
                  <Users className="w-3 h-3" /> {mandi.farmers.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-sm text-right text-neutral-600 dark:text-neutral-400 flex items-center justify-end gap-1">
                  <CalendarCheck className="w-3 h-3" /> {mandi.bookingsToday}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    mandi.active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}>
                    {mandi.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><Eye className="w-4 h-4 text-neutral-500" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><Edit3 className="w-4 h-4 text-neutral-500" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><MoreVertical className="w-4 h-4 text-neutral-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((mandi, index) => (
          <motion.div
            key={mandi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-neutral-900 dark:text-white">{mandi.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                mandi.active ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
              }`}>
                {mandi.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" /> {mandi.city}, {mandi.state}
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Manager: {mandi.manager}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {mandi.farmers}</span>
              <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {mandi.bookingsToday}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
