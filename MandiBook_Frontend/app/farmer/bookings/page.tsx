"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Search,
  Filter,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, type BookingData } from "@/lib/data-api";
import { BookingPassCard } from "@/components/booking-pass-card";

type BookingStatus = "all" | "confirmed" | "completed" | "cancelled" | "pending" | "checked-in";

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  "checked-in": { label: "Checked In", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const isCancelableStatus = (status: BookingData["status"]): status is "confirmed" | "pending" => {
  return status === "confirmed" || status === "pending";
};

export default function FarmerBookingsPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus>("all");
  const [search, setSearch] = useState("");
  const [qrModalBooking, setQrModalBooking] = useState<BookingData | null>(null);
  const [pageError, setPageError] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    bookingApi.myBookings(token)
      .then((res) => setBookings(res.data))
      .catch((error: unknown) => setPageError(error instanceof Error ? error.message : "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    setPageError("");
    setCancelingId(bookingId);
    try {
      const response = await bookingApi.cancel(token, bookingId);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? response.data : booking)));
    } catch (error: unknown) {
      setPageError(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setCancelingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch =
      search === "" ||
      (b.Mandi?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      b.cropType.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">My Bookings</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">View and manage all your mandi slot bookings</p>
      </motion.div>

      {pageError ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{pageError}</span>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mandi, crop, or booking ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          {(["all", "confirmed", "pending", "checked-in", "completed", "cancelled"] as BookingStatus[]).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}>
              {s === "all" ? "All" : s === "checked-in" ? "Checked In" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {qrModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setQrModalBooking(null)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <BookingPassCard booking={qrModalBooking} language={user?.language || "en"} />
            <button onClick={() => setQrModalBooking(null)} className="mt-4 w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 dark:bg-neutral-900 dark:text-white">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((booking, index) => {
          const sc = statusConfig[booking.status] ?? statusConfig.pending;
          if (!sc) {
            return null;
          }
          const StatusIcon = sc.icon;
          return (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400">{booking.bookingNumber}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>
                    <StatusIcon className="w-3 h-3" /> {sc.label}
                  </span>
                </div>
                {booking.qrCodeData && booking.qrCodeData !== "data:image/png;base64,placeholder" && (
                  <button onClick={() => setQrModalBooking(booking)} className="p-2 rounded-lg bg-[var(--secondary)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                    <QrCode className="w-5 h-5 text-[var(--primary)]" />
                  </button>
                )}
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">{booking.Mandi?.name || "Mandi"}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.timeSlot}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.cropType} · {booking.estimatedQuantity}Q</span>
              </div>
              {booking.cancelReason ? (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">Reason: {booking.cancelReason}</p>
              ) : null}

              {isCancelableStatus(booking.status) ? (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => void handleCancelBooking(booking.id)}
                    disabled={cancelingId === booking.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    {cancelingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                  </button>
                </div>
              ) : null}
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-500">No bookings found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
