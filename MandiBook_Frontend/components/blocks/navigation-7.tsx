"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Menu, X, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DropdownItem {
  title: string;
  description: string;
  badge?: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: {
    title: string;
    items: DropdownItem[];
  };
}

const HIDDEN_PREFIXES = ["/farmer", "/admin", "/manager", "/farmer-login", "/admin-login", "/manager-login"];

function getDashboardPath(role?: string): string {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/farmer";
}

export function Navigation7() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null);

  const shouldHide = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (shouldHide) return null;

  const dashboardPath = getDashboardPath(user?.role);

  const navItems: NavItem[] = [
    {
      label: "Portals",
      dropdown: {
        title: "LOGIN PORTALS",
        items: [
          {
            title: "Farmer Portal",
            description: "Book mandi slots, check crop prices, and manage your visits via OTP login",
            href: isAuthenticated && user?.role === "farmer" ? "/farmer" : "/farmer-login",
          },
          {
            title: "Mandi Manager Portal",
            description: "Manage bookings, update prices, and generate reports for your mandi",
            href: isAuthenticated && user?.role === "manager" ? "/manager" : "/manager-login",
          },
          {
            title: "Admin Portal",
            description: "Platform-wide analytics, user management, and mandi oversight",
            badge: "ADMIN",
            href: isAuthenticated && user?.role === "admin" ? "/admin" : "/admin-login",
          },
        ],
      },
    },
    {
      label: "Resources",
      dropdown: {
        title: "LEARN MORE",
        items: [
          {
            title: "Crop Prices",
            description: "Live market rates from mandis across India",
            href: "#stats",
          },
          {
            title: "e-NAM Portal",
            description: "National Agriculture Market — Government of India",
            badge: "GOV",
            href: "https://enam.gov.in",
          },
          {
            title: "FAQ",
            description: "Common questions about MandiBook and mandi operations",
            href: "#faq",
          },
          {
            title: "Contact & Support",
            description: "Helpline, feedback, and partnership inquiries",
            href: "#footer",
          },
        ],
      },
    },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <>
      <nav className="w-full py-4 sm:py-6 px-5 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-8">
          {/* Left side: Logo + Nav Items */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 h-10 px-3 bg-neutral-200 dark:bg-neutral-900 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              aria-label="MandiBook Home"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-700">
                <span className="text-xs font-bold text-white">M</span>
              </div>
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white hidden sm:inline">MandiBook</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.href && !item.dropdown ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm tracking-tight font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className="flex items-center gap-1.5 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm tracking-tight font-medium text-neutral-900 dark:text-neutral-100"
                      aria-expanded={activeDropdown === item.label}
                      aria-haspopup="true"
                    >
                      {item.label}
                    </button>
                  )}

                  <AnimatePresence>
                    {activeDropdown === item.label && item.dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute top-full left-0 pt-2 z-50"
                      >
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl py-2 min-w-[500px]">
                          <div className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tracking-wider my-4 px-4">
                            {item.dropdown.title}
                          </div>
                          <div className="grid grid-cols-2 gap-3 px-2">
                            {item.dropdown.items.map((dropdownItem, idx) => (
                              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03, ease: [0.4, 0, 0.2, 1] }}>
                                <Link
                                  href={dropdownItem.href}
                                  className="group block p-3 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                                      {dropdownItem.title}
                                    </h3>
                                    {dropdownItem.badge && (
                                      <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                        {dropdownItem.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    {dropdownItem.description}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-10 w-20 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href={dashboardPath}
                  className="hidden md:flex items-center gap-2 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="hidden md:flex items-center gap-2 relative" onMouseEnter={() => setActiveDropdown("user")} onMouseLeave={() => setActiveDropdown(null)}>
                  <button className="flex items-center gap-2 px-3 h-10 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium tracking-tight transition-colors">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden lg:inline max-w-[120px] truncate">{user.name?.split(" ")[0] || "User"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {activeDropdown === "user" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 pt-2 z-50"
                      >
                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 min-w-[200px]">
                          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.email || user.phone || ""}</p>
                            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                              {user.role}
                            </span>
                          </div>
                          <Link href={dashboardPath} className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          {user.role === "farmer" && (
                            <Link href="/farmer/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                              <User className="w-4 h-4" /> Profile
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/farmer-login" className="hidden md:flex items-center px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors">
                  Login
                </Link>
                <Link href="/farmer-login" className="flex items-center px-4 h-10 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium tracking-tight transition-colors">
                  Book Slot
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors flex items-center gap-2"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 md:hidden"
          >
            <div className="flex items-center justify-between py-4 sm:py-6 px-5">
              <Link href="/" className="flex items-center gap-2 h-10 px-3 bg-neutral-200 dark:bg-neutral-900 rounded-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-700">
                  <span className="text-xs font-bold text-white">M</span>
                </div>
                <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">MandiBook</span>
              </Link>
              <button
                onClick={() => { setIsMobileMenuOpen(false); setMobileExpandedItem(null); }}
                className="flex items-center gap-2 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-240px)] p-4 sm:p-6">
              {isAuthenticated && user && (
                <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email || user.phone || ""}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              <nav className="space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <button
                      onClick={() => setMobileExpandedItem(mobileExpandedItem === item.label ? null : item.label)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-left transition-colors"
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.label}</span>
                      <motion.div animate={{ rotate: mobileExpandedItem === item.label ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {mobileExpandedItem === item.label && item.dropdown && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 space-y-1">
                            {item.dropdown.items.map((dropdownItem, idx) => (
                              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }}>
                                <Link
                                  href={dropdownItem.href}
                                  onClick={() => { setIsMobileMenuOpen(false); setMobileExpandedItem(null); }}
                                  className="block p-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{dropdownItem.title}</h3>
                                    {dropdownItem.badge && (
                                      <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                        {dropdownItem.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{dropdownItem.description}</p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Mobile Action Buttons - Fixed at Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 space-y-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800"
            >
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={dashboardPath}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/farmer-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/farmer-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center w-full px-4 py-3 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Book a Slot
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
