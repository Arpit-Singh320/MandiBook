"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CalendarCheck,
  AlertCircle,
  Users,
  CheckCheck,
  Circle,
  Send,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { notificationApi, type NotificationData } from "@/lib/data-api";

type NotificationType = "booking" | "alert" | "farmer" | "system";

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarCheck, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  alert: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  farmer: { icon: Users, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  system: { icon: Bell, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const mapNotificationType = (type: string): NotificationType => {
  if (type.startsWith("booking")) return "booking";
  if (type === "announcement") return "farmer";
  if (type === "price-alert") return "alert";
  return "system";
};

const formatRelativeTime = (value: string) => {
  const createdAt = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

export default function ManagerNotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadNotifications = async () => {
      try {
        const response = await notificationApi.list(token, { limit: 50 });
        setItems(response.data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, [token]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markAllRead = async () => {
    if (!token || unreadCount === 0) return;
    await notificationApi.markAllRead(token);
    setItems((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  };

  const markRead = async (notification: NotificationData) => {
    if (!token || notification.isRead) return;
    await notificationApi.markRead(token, notification.id);
    setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
  };

  const handleBroadcast = async () => {
    if (!token || !broadcastTitle.trim() || !broadcastMsg.trim()) return;
    setSendingBroadcast(true);
    setError("");
    try {
      await notificationApi.broadcast(token, {
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        target: "farmers",
      });
      setBroadcastTitle("");
      setBroadcastMsg("");
      setShowBroadcast(false);
    } catch (sendError: unknown) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--primary)] hover:bg-[var(--secondary)] transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button
            onClick={() => setShowBroadcast(!showBroadcast)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Send className="w-3 h-3" /> Broadcast
          </button>
        </div>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* Broadcast Form */}
      {showBroadcast && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5 mb-6"
        >
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
            Broadcast to All Farmers
          </h3>
          <input
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Broadcast title"
            className="mb-3 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] dark:bg-neutral-800 dark:text-white"
          />
          <textarea
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Type your message here... (e.g., 'Mandi will close early today at 4 PM due to maintenance')"
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowBroadcast(false)} className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              Cancel
            </button>
            <button
              onClick={() => void handleBroadcast()}
              disabled={!broadcastTitle.trim() || !broadcastMsg.trim() || sendingBroadcast}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {sendingBroadcast ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Notification List */}
      <div className="space-y-2">
        {items.map((notification, index) => {
          const config = typeConfig[mapNotificationType(notification.type)];
          const Icon = config.icon;
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              onClick={() => void markRead(notification)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                notification.isRead
                  ? "border-[var(--border)] bg-white dark:bg-neutral-900"
                  : "border-[var(--primary)]/30 bg-[var(--secondary)]"
              }`}
            >
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
                <p className="text-[10px] text-neutral-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}

        {items.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">No notifications available.</div>
        ) : null}
      </div>
    </div>
  );
}
