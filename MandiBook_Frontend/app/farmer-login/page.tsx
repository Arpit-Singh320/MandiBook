"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Phone, Mail, ShieldCheck, Wheat, QrCode, CalendarCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useTheme } from "next-themes";
import Flicker from "@/components/react-bits/flicker";

type Step = "input" | "otp";
type AuthMethod = "phone" | "email";

export default function FarmerLoginPage() {
  const [step, setStep] = useState<Step>("input");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtpRequestId, setEmailOtpRequestId] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { requestFarmerOtp, requestFarmerEmailOtp, loginAsFarmer, loginAsFarmerEmail } = useAuth();
  const { theme } = useTheme();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (method === "phone") {
        if (phone.length !== 10) return;
        await requestFarmerOtp(phone);
      } else {
        if (!email) return;
        const response = await requestFarmerEmailOtp(email);
        if (!response.otpRequestId) {
          throw new ApiError("OTP request initialization failed", 500, response);
        }
        setEmailOtpRequestId(response.otpRequestId);
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return;
    setIsLoading(true);
    setError("");
    try {
      if (method === "phone") {
        await loginAsFarmer(phone, otpValue);
      } else {
        if (!emailOtpRequestId) {
          throw new ApiError("OTP request not found. Please request a new OTP.", 400, null);
        }
        await loginAsFarmerEmail(email, otpValue, emailOtpRequestId);
      }
      window.location.href = "/farmer";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      if (method === "phone") {
        await requestFarmerOtp(phone);
      } else {
        const response = await requestFarmerEmailOtp(email);
        if (!response.otpRequestId) {
          throw new ApiError("OTP resend failed", 500, response);
        }
        setEmailOtpRequestId(response.otpRequestId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resend OTP");
    }
  };

  const inputValid = method === "phone" ? phone.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const sentTo = method === "phone" ? `+91 ${phone}` : email;

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
            <div className="w-10 h-10 rounded-lg bg-green-700 flex items-center justify-center">
              <Wheat className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">
              MandiBook
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
              {step === "input" ? "Farmer Login" : "Verify OTP"}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              {step === "input"
                ? "Sign in with your mobile number or email"
                : `OTP sent to ${sentTo}`}
            </p>
          </motion.div>

          {step === "input" ? (
            <motion.form
              onSubmit={handleSendOtp}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Phone / Email Tabs */}
              <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setMethod("phone"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    method === "phone"
                      ? "bg-green-700 text-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Phone className="w-4 h-4" /> Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("email"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    method === "email"
                      ? "bg-green-700 text-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              </div>

              {method === "phone" ? (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-neutral-500">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">+91</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setPhone(val);
                      }}
                      placeholder="Enter 10-digit number"
                      required
                      maxLength={10}
                      className="w-full pl-20 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all duration-200 text-lg tracking-wider"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    We&apos;ll send a 6-digit OTP via SMS
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    We&apos;ll send a 6-digit OTP to your email
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!inputValid || isLoading}
                className="w-full px-6 py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                New to MandiBook? Just verify your number or email to get started.
              </p>
            </motion.form>
          ) : (
            <motion.form
              onSubmit={handleVerifyOtp}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-3">
                  Enter 6-digit OTP
                </label>
                <div className="flex gap-3 justify-between">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 transition-all duration-200"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Enter the OTP sent to your mobile number
                </p>
              </div>

              <button
                type="submit"
                disabled={otp.join("").length !== 6 || isLoading}
                className="w-full px-6 py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("input"); setOtp(["", "", "", "", "", ""]); setEmailOtpRequestId(null); setError(""); }}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change {method === "phone" ? "Number" : "Email"}
                </button>
                <button type="button" onClick={handleResend} className="text-green-700 dark:text-green-400 font-medium hover:underline">
                  Resend OTP
                </button>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            </motion.form>
          )}
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
            <Flicker key="dark" spacing={30} particleSize={2} color="#166534" glowColor="#4ade80" alpha={0.8} overlay={0} overlayColor="#0a0a0a" minFrequency={0.2} maxFrequency={1.2} rate={1} />
          ) : (
            <Flicker key="light" spacing={30} particleSize={2} color="#86efac" glowColor="#22c55e" alpha={1} overlay={0} overlayColor="#ffffff" minFrequency={0.2} maxFrequency={1.2} rate={0.5} />
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-green-700/10 dark:bg-green-400/10 flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-green-700 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              Book. Show QR. Sell.
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Book your mandi slot in 30 seconds, skip the queue, and get the best price for your crops.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: CalendarCheck, label: "Book Slot", value: "30 sec" },
                { icon: QrCode, label: "QR Entry", value: "No queue" },
                { icon: TrendingUp, label: "Live Prices", value: "150+ mandis" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-3 rounded-xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800">
                    <Icon className="w-5 h-5 text-green-700 dark:text-green-400 mx-auto mb-1" />
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
