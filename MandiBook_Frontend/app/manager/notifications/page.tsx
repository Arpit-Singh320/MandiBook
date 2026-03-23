"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CalendarCheck,
  AlertCircle,
  Users,
  CheckCheck,
  Circle,
  Send,
} from "lucide-react";

type NotificationType = "booking" | "alert" | "farmer" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: "n1", type: "booking", title: "New Booking", message: "Ramesh Kumar booked slot 08:00-10:00 AM for Mar 21 (Wheat, 50Q)", time: "5 min ago", read: false },
  { id: "n2", type: "alert", title: "Slot Almost Full", message: "08:00-10:00 AM slot is at 90% capacity (18/20). Consider opening overflow.", time: "30 min ago", read: false },
  { id: "n3", type: "farmer", title: "Check-in Alert", message: "3 farmers haven't checked in for the 08:00 AM slot. Consider sending reminders.", time: "1 hour ago", read: false },
  { id: "n4", type: "system", title: "Price Update Reminder", message: "Wheat and Rice prices haven't been updated today. Please update market rates.", time: "2 hours ago", read: true },
  { id: "n5", type: "booking", title: "Booking Cancelled", message: "Deepak Verma cancelled booking BK-107 for tomorrow's 08:00 AM slot.", time: "3 hours ago", read: true },
  { id: "n6", type: "system", title: "Daily Summary", message: "Yesterday: 42 bookings, 38 check-ins, ₹12.4L total transaction value.", time: "Yesterday", read: true },
];

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarCheck, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  alert: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  farmer: { icon: Users, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  system: { icon: Bell, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

export default function ManagerNotificationsPage() {
  const [items, setItems] = useState(notifications);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

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
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
            Broadcast to All Farmers
          </h3>
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
              onClick={() => { setBroadcastMsg(""); setShowBroadcast(false); }}
              disabled={!broadcastMsg.trim()}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Send Broadcast
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
