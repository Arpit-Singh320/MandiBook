"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  MapPin,
  Users,
  CalendarCheck,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mandiApi, type MandiData, type MandiStatsResponse } from "@/lib/data-api";

type EnrichedMandi = MandiData & {
  totalFarmers: number;
  todayBookings: number;
  availableSlots: number;
  workingToday: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-IN");

export default function AdminMandisPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mandis, setMandis] = useState<EnrichedMandi[]>([]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const mandiResponse = await mandiApi.list();
        const statsResponses = await Promise.all(
          mandiResponse.data.map(async (mandi) => {
            try {
              const stats = await mandiApi.stats(mandi.id, token);
              return { mandi, stats: stats.data };
            } catch {
              return {
                mandi,
                stats: {
                  todayBookings: 0,
                  todayCheckedIn: 0,
                  totalFarmers: 0,
                  managerCount: mandi.managerCount || mandi.managers?.length || 0,
                  slotUtilization: 0,
                  availableSlots: 0,
                  workingToday: false,
                  operatingHoursOpen: mandi.operatingHoursOpen,
                  operatingHoursClose: mandi.operatingHoursClose,
                  workingDays: mandi.workingDays || [],
                  crops: mandi.crops || [],
                } satisfies MandiStatsResponse["data"],
              };
            }
          })
        );

        setMandis(
          statsResponses.map(({ mandi, stats }) => ({
            ...mandi,
            managerCount: stats.managerCount,
            totalFarmers: stats.totalFarmers,
            todayBookings: stats.todayBookings,
            availableSlots: stats.availableSlots,
            workingToday: stats.workingToday,
          }))
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load mandis");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const filtered = useMemo(() => mandis.filter((m) => {
    const matchesSearch =
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive || m.isActive;
    return matchesSearch && matchesActive;
  }), [mandis, search, showInactive]);

  const toggleMandiStatus = async (id: string) => {
    if (!token) return;
    try {
      setTogglingId(id);
      const response = await mandiApi.toggle(token, id);
      setMandis((current) => current.map((mandi) => (
        mandi.id === id ? { ...mandi, isActive: response.data.isActive } : mandi
      )));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update mandi status");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error && mandis.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Mandi Management</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{mandis.length} mandis registered on the platform</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Mandi
        </button>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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
                <td className="px-5 py-3.5 text-sm text-neutral-600 dark:text-neutral-400">{mandi.managers?.map((manager) => manager.name).join(", ") || "—"}</td>
                <td className="px-5 py-3.5 text-sm text-right text-neutral-600 dark:text-neutral-400 flex items-center justify-end gap-1">
                  <Users className="w-3 h-3" /> {numberFormatter.format(mandi.totalFarmers)}
                </td>
                <td className="px-5 py-3.5 text-sm text-right text-neutral-600 dark:text-neutral-400 flex items-center justify-end gap-1">
                  <CalendarCheck className="w-3 h-3" /> {numberFormatter.format(mandi.todayBookings)}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    mandi.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                  }`}>
                    {mandi.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleMandiStatus(mandi.id)}
                      disabled={togglingId === mandi.id}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {togglingId === mandi.id ? "Updating..." : mandi.isActive ? "Deactivate" : "Activate"}
                    </button>
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
                mandi.isActive ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
              }`}>
                {mandi.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" /> {mandi.city}, {mandi.state}
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Manager: {mandi.managers?.map((manager) => manager.name).join(", ") || "—"}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {numberFormatter.format(mandi.totalFarmers)}</span>
              <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {numberFormatter.format(mandi.todayBookings)}</span>
            </div>
            <button
              type="button"
              onClick={() => void toggleMandiStatus(mandi.id)}
              disabled={togglingId === mandi.id}
              className="mt-3 w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              {togglingId === mandi.id ? "Updating..." : mandi.isActive ? "Deactivate Mandi" : "Activate Mandi"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
