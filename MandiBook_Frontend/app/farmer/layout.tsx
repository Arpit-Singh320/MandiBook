"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  TrendingUp,
  Bell,
  User,
  MapPin,
  LogOut,
  Menu,
  X,
  Wheat,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

const farmerNavItems = [
  { label: "Dashboard", href: "/farmer", icon: LayoutDashboard },
  { label: "Book Slot", href: "/farmer/book-slot", icon: CalendarPlus },
  { label: "My Bookings", href: "/farmer/bookings", icon: ClipboardList },
  { label: "Nearby Mandis", href: "/farmer/nearby-mandis", icon: MapPin },
  { label: "Crop Prices", href: "/farmer/prices", icon: TrendingUp },
  { label: "Notifications", href: "/farmer/notifications", icon: Bell },
  { label: "Profile", href: "/farmer/profile", icon: User },
];

export default function FarmerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/farmer-login");
      return;
    }
    if (user.role !== "farmer") {
      router.replace("/");
      return;
    }
    if (!user.profileComplete && pathname !== "/farmer/complete-profile") {
      router.replace("/farmer/complete-profile");
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "farmer") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-neutral-900 dark:text-white block leading-tight">
                  MandiBook
                </span>
                <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">
                  Farmer Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="min-h-0 flex-1 overflow-y-auto p-3 space-y-0.5">
            {farmerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
                    isActive
                      ? "bg-green-700 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-800 dark:hover:text-green-300"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-green-50 dark:bg-green-950/20">
              <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0) ?? "F"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {user?.name ?? "Farmer"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.phone ?? ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-green-700" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              Farmer Portal
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
