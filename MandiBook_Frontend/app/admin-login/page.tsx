"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Wheat, Shield, Globe, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useTheme } from "next-themes";
import Flicker from "@/components/react-bits/flicker";

type Step = "credentials" | "2fa";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code2fa, setCode2fa] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { beginAdminLogin, loginAsAdmin } = useAuth();
  const { theme } = useTheme();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      setError("");
      try {
        await beginAdminLogin(email, password);
        setStep("2fa");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Credential verification failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code2fa.length === 6) {
      setIsLoading(true);
      setError("");
      try {
        await loginAsAdmin(code2fa);
        window.location.href = "/admin";
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "2FA verification failed");
      } finally {
        setIsLoading(false);
      }
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
            <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
              <Wheat className="w-6 h-6 text-white dark:text-neutral-900" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              MandiBook
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium">
              Admin
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              {step === "credentials" ? "Admin Login" : "Two-Factor Auth"}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              {step === "credentials"
                ? "Sign in to the admin control panel"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </motion.div>

          {step === "credentials" ? (
            <motion.form
              onSubmit={handleCredentials}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mandibook.in"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all duration-200"
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
              </div>

              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <strong>Test:</strong> Use your real admin account. After credentials, enter the Brevo OTP sent to your email.
                </p>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200"
              >
                {isLoading ? "Checking..." : "Continue"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              onSubmit={handleVerify2fa}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label htmlFor="code-2fa" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Authenticator Code
                </label>
                <input
                  id="code-2fa"
                  type="text"
                  inputMode="numeric"
                  value={code2fa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) setCode2fa(val);
                  }}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all duration-200 text-2xl tracking-[0.5em] text-center font-mono"
                />
                <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={code2fa.length !== 6 || isLoading}
                className="w-full px-6 py-3 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setCode2fa(""); setError(""); }}
                className="w-full text-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to credentials
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* Back to Home */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full max-w-md mx-auto">
          <a href="/" className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </a>
        </motion.div>
      </div>

      {/* Right Column - Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white dark:bg-neutral-950">
        <div className="absolute inset-0">
          {theme === "dark" ? (
            <Flicker key="dark" spacing={30} particleSize={2} color="#404040" glowColor="#737373" alpha={0.8} overlay={0} overlayColor="#0a0a0a" minFrequency={0.2} maxFrequency={1.2} rate={1} />
          ) : (
            <Flicker key="light" spacing={30} particleSize={2} color="#d4d4d4" glowColor="#a3a3a3" alpha={1} overlay={0} overlayColor="#ffffff" minFrequency={0.2} maxFrequency={1.2} rate={0.5} />
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-neutral-900/10 dark:bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-neutral-900 dark:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              Platform Command Center
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Full visibility into every mandi, every user, and every transaction. Govern with data, act with confidence.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Globe, label: "All Mandis", value: "150+" },
                { icon: Activity, label: "Live Analytics", value: "Real-time" },
                { icon: Shield, label: "2FA Security", value: "Bank-grade" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-3 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800">
                    <Icon className="w-5 h-5 text-neutral-900 dark:text-white mx-auto mb-1" />
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
