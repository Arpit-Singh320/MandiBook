"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  TrendingUp,
  Bell,
  BarChart3,
  LogOut,
  Menu,
  X,
  Wheat,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

const managerNavItems = [
  { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { label: "Bookings", href: "/manager/bookings", icon: CalendarCheck },
  { label: "Slot Management", href: "/manager/slots", icon: Clock },
  { label: "Price Management", href: "/manager/prices", icon: TrendingUp },
  { label: "Notifications", href: "/manager/notifications", icon: Bell },
  { label: "Reports", href: "/manager/reports", icon: BarChart3 },
];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/manager-login");
      return;
    }
    if (user.role !== "manager") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "manager") {
    return null;
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-950 border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <Wheat className="w-5 h-5 text-[var(--primary-foreground)]" />
              </div>
              <span className="text-base font-medium text-neutral-900 dark:text-white">
                MandiBook
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-medium">
                Manager
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {managerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-semibold">
                {user?.name?.charAt(0) ?? "M"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {user?.name ?? "Manager"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  Mandi Manager
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Mobile) */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-white dark:bg-neutral-950 border-b border-[var(--border)] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            Manager Portal
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
