"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CalendarCheck,
  TrendingUp,
  Clock,
  QrCode,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, mandiApi, type BookingData, type MandiData } from "@/lib/data-api";

export default function FarmerDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ active: 0, completed: 0, total: 0, cancelled: 0 });
  const [upcoming, setUpcoming] = useState<BookingData[]>([]);
  const [mandis, setMandis] = useState<MandiData[]>([]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [dash, mandiRes] = await Promise.all([
          dashboardApi.farmer(token),
          mandiApi.list(),
        ]);
        setStats({
          active: dash.data.activeBookings,
          completed: dash.data.completedBookings,
          total: dash.data.totalBookings,
          cancelled: dash.data.cancelledBookings,
        });
        setUpcoming(dash.data.upcomingBookings || dash.data.recentBookings || []);
        setMandis(mandiRes.data.slice(0, 3));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: "Active Bookings", value: stats.active, icon: CalendarCheck, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Completed Visits", value: stats.completed, icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Total Bookings", value: stats.total, icon: TrendingUp, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "Cancelled", value: stats.cancelled, icon: QrCode, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          Welcome back, {user?.name?.split(" ")[0] || "Farmer"} 👋
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Here&apos;s what&apos;s happening with your mandi bookings
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-neutral-500 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Bookings</h2>
            <Link href="/farmer/bookings" className="text-sm text-[var(--primary)] font-medium flex items-center gap-1 no-underline hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">No bookings yet. Book your first slot!</div>
            ) : (
              upcoming.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {booking.Mandi?.name || "Mandi"}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : booking.status === "checked-in" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : booking.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {booking.date} · {booking.timeSlot} · {booking.cropType}
                    </p>
                  </div>
                  {booking.qrCodeData && booking.qrCodeData !== "data:image/png;base64,placeholder" && (
                    <div className="shrink-0 ml-4 p-2 rounded-lg bg-[var(--secondary)]">
                      <QrCode className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)]"
        >
          <div className="p-4 sm:p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Available Mandis</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {mandis.map((mandi) => (
              <div key={mandi.id} className="p-4 sm:p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{mandi.name}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {mandi.city}, {mandi.state}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded">
                    {mandi.crops.length} crops
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4">
            <Link href="/farmer/book-slot" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all no-underline">
              <CalendarCheck className="w-4 h-4" /> Book a New Slot
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
