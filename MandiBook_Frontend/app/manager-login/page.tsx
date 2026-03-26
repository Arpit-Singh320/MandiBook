"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Wheat, BarChart3, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useTheme } from "next-themes";
import Flicker from "@/components/react-bits/flicker";

export default function ManagerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, isAuthenticated, isLoading: authLoading, loginAsManager } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user) {
      const dest = user.role === "admin" ? "/admin" : user.role === "manager" ? "/manager" : "/farmer";
      router.replace(dest);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await loginAsManager(email, password);
      window.location.href = "/manager";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:p-14 bg-white dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-700 flex items-center justify-center">
              <Wheat className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              MandiBook
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium">
              Manager
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Manager Login
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              Sign in to manage your mandi operations
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@mandibook.in"
                required
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-1.5 flex justify-end">
                <a href="#" className="text-xs text-amber-700 dark:text-amber-400 hover:underline">Forgot Password?</a>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </motion.form>
        </motion.div>

        {/* Back to Home */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </motion.div>
      </div>

      {/* Right Column - Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white dark:bg-neutral-950">
        <div className="absolute inset-0">
          {theme === "dark" ? (
            <Flicker key="dark" spacing={30} particleSize={2} color="#92400e" glowColor="#fbbf24" alpha={0.8} overlay={0} overlayColor="#0a0a0a" minFrequency={0.2} maxFrequency={1.2} rate={1} />
          ) : (
            <Flicker key="light" spacing={30} particleSize={2} color="#fde68a" glowColor="#f59e0b" alpha={1} overlay={0} overlayColor="#ffffff" minFrequency={0.2} maxFrequency={1.2} rate={0.5} />
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-700/10 dark:bg-amber-400/10 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-amber-700 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              Your Mandi, Your Dashboard
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Manage bookings, update prices, broadcast notifications, and generate reports — all from one place.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: CalendarClock, label: "Slot Mgmt", value: "Real-time" },
                { icon: Users, label: "Farmer Check-in", value: "QR Scan" },
                { icon: BarChart3, label: "Reports", value: "Daily" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-3 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800">
                    <Icon className="w-5 h-5 text-amber-700 dark:text-amber-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-neutral-900 dark:text-white">{item.value}</p>
                    <p className="text-[10px] text-neutral-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
