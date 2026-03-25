"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Filter,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, type BookingData } from "@/lib/data-api";

type Status = "all" | BookingData["status"];

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  "checked-in": { label: "Checked In", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function ManagerBookingsPage() {
  const { token, user } = useAuth();
  const [filter, setFilter] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);

  useEffect(() => {
    const mandiId = user?.mandiId;
    if (!token || !mandiId) return;

    const load = async () => {
      try {
        const response = await bookingApi.mandiBookings(token, mandiId);
        setBookings(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, user?.mandiId]);

  const filtered = useMemo(() => bookings.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch =
      search === "" ||
      (b.farmer?.name || b.Farmer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      b.cropType.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [bookings, filter, search]);

  const summaryCards = useMemo(() => {
    const today = todayKey();
    return [
      { label: "Total Today", value: bookings.filter((b) => b.date === today).length, color: "text-neutral-900 dark:text-white" },
      { label: "Checked In", value: bookings.filter((b) => b.status === "checked-in").length, color: "text-green-600" },
      { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-blue-600" },
      { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, color: "text-amber-600" },
    ];
  }, [bookings]);

  const handleCheckIn = async (bookingId: string) => {
    if (!token) return;
    try {
      setActionBookingId(bookingId);
      const response = await bookingApi.checkIn(token, bookingId);
      setBookings((current) => current.map((booking) => booking.id === bookingId ? response.data : booking));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check in booking");
    } finally {
      setActionBookingId(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    if (!token) return;
    try {
      setActionBookingId(bookingId);
      const response = await bookingApi.complete(token, bookingId);
      setBookings((current) => current.map((booking) => booking.id === bookingId ? response.data : booking));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to complete booking");
    } finally {
      setActionBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

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

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((s) => (
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
                <Fragment key={b.id}>
                  <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 text-sm font-mono text-neutral-500">{b.bookingNumber}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{b.farmer?.name || b.Farmer?.name || "Farmer"}</p>
                      <p className="text-[10px] text-neutral-400">{b.farmer?.phone || b.Farmer?.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{b.cropType} · {numberFormatter.format(b.estimatedQuantity)} Q</td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">{formatDisplayDate(b.date)} · {b.timeSlot}</td>
                    <td className="px-5 py-3 text-sm font-mono text-neutral-500">{b.vehicleNumber || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc?.color}`}>
                        {sc?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === "confirmed" ? (
                          <button
                            type="button"
                            disabled={actionBookingId === b.id}
                            onClick={() => void handleCheckIn(b.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <QrCode className="w-3 h-3" /> Check In
                          </button>
                        ) : null}
                        {b.status === "checked-in" ? (
                          <button
                            type="button"
                            disabled={actionBookingId === b.id}
                            onClick={() => void handleComplete(b.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(selectedBooking === b.id ? null : b.id)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selectedBooking === b.id ? (
                    <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                      <td colSpan={7} className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                          <div>
                            <p className="text-xs text-neutral-500">Booking Date</p>
                            <p>{formatDisplayDate(b.date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Slot</p>
                            <p>{b.timeSlot}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Vehicle</p>
                            <p>{b.vehicleNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Status</p>
                            <p>{sc?.label || b.status}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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
                  <span className="text-xs font-mono text-neutral-400">{b.bookingNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sc?.color}`}>{sc?.label}</span>
                </div>
                {b.status === "confirmed" && (
                  <button
                    type="button"
                    disabled={actionBookingId === b.id}
                    onClick={() => void handleCheckIn(b.id)}
                    className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <QrCode className="w-3 h-3" /> Check In
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{b.farmer?.name || b.Farmer?.name || "Farmer"}</p>
              <p className="text-xs text-neutral-500 mt-1">{b.cropType} · {numberFormatter.format(b.estimatedQuantity)} Q · {b.timeSlot}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{formatDisplayDate(b.date)}</p>
              {b.vehicleNumber ? <p className="text-xs text-neutral-400 font-mono mt-0.5">{b.vehicleNumber}</p> : null}
              {b.status === "checked-in" ? (
                <button
                  type="button"
                  disabled={actionBookingId === b.id}
                  onClick={() => void handleComplete(b.id)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium disabled:opacity-50"
                >
                  Complete Booking
                </button>
              ) : null}
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
