"use client";

import { ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function Hero1() {
  return (
    <section className="w-full min-h-[calc(100vh-80px)] flex items-center py-10 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 xl:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col gap-5 sm:gap-7">
            {/* Announcement Pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 rounded-full border-green-200 dark:border-green-800 border bg-green-50 dark:bg-green-950/30 p-1 w-fit"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-green-700 text-white text-xs font-medium">
                🌾 Digital Mandi
              </span>
              <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mr-2 sm:mr-3">
                India&apos;s smartest mandi platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-[3.5rem] tracking-tight font-bold text-neutral-900 dark:text-white"
            >
              Book Your Mandi Slot,{" "}
              <span className="text-green-700 dark:text-green-400">Sell Smarter</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg"
            >
              No more waiting in long queues. Book your mandi slot from home,
              check live crop prices, and get an instant QR pass — all from your phone.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <motion.a
                href="/farmer-login"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer px-6 py-3.5 sm:py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-sm sm:text-base transition-colors duration-200 text-center no-underline flex items-center justify-center gap-2"
              >
                Book a Slot Now
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="/farmer-login"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer px-6 py-3.5 sm:py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium text-sm sm:text-base hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200 flex items-center justify-center gap-2 no-underline"
              >
                <TrendingUp className="w-4 h-4 text-green-700" />
                Check Crop Prices
              </motion.a>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-3 sm:gap-4 pt-1 sm:pt-4 select-none"
            >
              <div className="flex -space-x-2">
                {["RK", "SP", "AK"].map((initials) => (
                  <div key={initials} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-green-700 border-[2.5px] border-white dark:border-neutral-950 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                    {initials}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white">
                  10,000+ Farmers
                </span>
                <span className="text-[11px] sm:text-sm text-neutral-500 dark:text-neutral-400">
                  booking slots across 150+ mandis
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Visual Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full"
          >
            <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[500px] rounded-2xl sm:rounded-3xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden shadow-lg sm:shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1740&auto=format&fit=crop"
                alt="Indian mandi marketplace with farmers selling fresh produce"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Bottom info card */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center gap-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm sm:text-lg">🌾</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                    100% Free for Farmers
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-500">
                    Register with just your phone number
                  </p>
                </div>
                <a
                  href="/farmer-login"
                  className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-700 hover:bg-green-800 flex items-center justify-center transition-colors no-underline"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
