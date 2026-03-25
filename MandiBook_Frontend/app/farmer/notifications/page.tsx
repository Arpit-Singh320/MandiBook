"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  CheckCheck,
  Circle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { notificationApi, type NotificationData } from "@/lib/data-api";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarCheck, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  price: { icon: TrendingUp, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  alert: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  system: { icon: Bell, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

type NotificationConfig = { icon: typeof Bell; color: string };

const getNotificationConfig = (type: string): NotificationConfig => {
  return typeConfig[type] ?? typeConfig.system!;
};

const formatTimestamp = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

export default function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    notificationApi.list(token)
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    if (!token) return;
    try {
      await notificationApi.markAllRead(token);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const toggleRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationApi.markRead(token, id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--primary)] hover:bg-[var(--secondary)] transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </motion.div>

      <div className="space-y-2">
        {items.length === 0 && <div className="text-center py-12 text-neutral-500 text-sm">No notifications yet.</div>}
        {items.map((notification, index) => {
          const config = getNotificationConfig(notification.type);
          const Icon = config.icon;
          return (
            <motion.div key={notification.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              onClick={() => !notification.isRead && toggleRead(notification.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                notification.isRead ? "border-[var(--border)] bg-white dark:bg-neutral-900" : "border-[var(--primary)]/30 bg-[var(--secondary)]"
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${notification.isRead ? "font-medium text-neutral-700 dark:text-neutral-300" : "font-semibold text-neutral-900 dark:text-white"}`}>
                    {notification.title}
                  </p>
                  {!notification.isRead && <Circle className="w-2 h-2 fill-[var(--primary)] text-[var(--primary)] shrink-0" />}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{formatTimestamp(notification.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
