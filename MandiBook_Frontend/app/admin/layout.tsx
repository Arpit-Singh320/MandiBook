"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Bell,
  AlertCircle,
  FileText,
  ScrollText,
  LogOut,
  Menu,
  X,
  Wheat,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Mandis", href: "/admin/mandis", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Prices", href: "/admin/prices", icon: TrendingUp },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Issues", href: "/admin/issues", icon: AlertCircle },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/admin-login");
      return;
    }
    if (user.role !== "admin") {
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

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/");
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
              <span className="px-1.5 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-medium">
                Admin
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
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
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
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 text-xs font-semibold">
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {user?.name ?? "Admin"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  System Administrator
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
            Admin Portal
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
