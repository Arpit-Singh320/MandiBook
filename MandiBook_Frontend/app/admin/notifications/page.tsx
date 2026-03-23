"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  Building2,
  Users,
  AlertCircle,
  TrendingUp,
  CheckCheck,
  Circle,
  Send,
} from "lucide-react";

type NotificationType = "mandi" | "user" | "alert" | "price" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: "n1", type: "mandi", title: "New Mandi Registered", message: "Siliguri Mandi, West Bengal has been added to the platform. Pending manager assignment.", time: "2 hours ago", read: false },
  { id: "n2", type: "alert", title: "Overbooking Alert", message: "Azadpur Mandi 08:00 AM slot exceeded capacity by 3 bookings. Manager notified.", time: "3 hours ago", read: false },
  { id: "n3", type: "price", title: "Price Anomaly", message: "Onion prices dropped >7% across 5 mandis in the last 24 hours. Review recommended.", time: "4 hours ago", read: false },
  { id: "n4", type: "user", title: "Manager Application", message: "Vikas Patel applied as manager for Surat Mandi, Gujarat. Background check pending.", time: "5 hours ago", read: true },
  { id: "n5", type: "system", title: "System Update Deployed", message: "v2.4.1 deployed successfully — includes booking cancellation bug fix and price alert improvements.", time: "8 hours ago", read: true },
  { id: "n6", type: "user", title: "User Reported", message: "Farmer Sunita Yadav (ID: u7) reported for repeated no-shows. Auto-suspended.", time: "Yesterday", read: true },
  { id: "n7", type: "mandi", title: "Manager Resigned", message: "Manager Anil Joshi resigned from Narela Mandi. Replacement needed.", time: "2 days ago", read: true },
];

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  mandi: { icon: Building2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  user: { icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  alert: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  price: { icon: TrendingUp, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  system: { icon: Bell, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState(notifications);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "farmers" | "managers">("all");

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

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

      {/* Broadcast Form */}
      {showBroadcast && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5 mb-6"
        >
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Platform Broadcast</h3>
          <div className="flex gap-2 mb-3">
            {(["all", "farmers", "managers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBroadcastTarget(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  broadcastTarget === t
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {t === "all" ? "All Users" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <textarea
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Type your broadcast message..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowBroadcast(false)} className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
            <button
              onClick={() => { setBroadcastMsg(""); setShowBroadcast(false); }}
              disabled={!broadcastMsg.trim()}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Send to {broadcastTarget === "all" ? "All Users" : broadcastTarget}
            </button>
          </div>
        </motion.div>
      )}

      {/* Notification List */}
      <div className="space-y-2">
        {items.map((notification, index) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              onClick={() => toggleRead(notification.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                notification.read
                  ? "border-[var(--border)] bg-white dark:bg-neutral-900"
                  : "border-[var(--primary)]/30 bg-[var(--secondary)]"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${notification.read ? "font-medium text-neutral-700 dark:text-neutral-300" : "font-semibold text-neutral-900 dark:text-white"}`}>
                    {notification.title}
                  </p>
                  {!notification.read && <Circle className="w-2 h-2 fill-[var(--primary)] text-[var(--primary)] shrink-0" />}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{notification.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
