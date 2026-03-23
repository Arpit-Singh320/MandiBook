"use client";

import { Smartphone, Clock, Check, X } from "lucide-react";
import { motion } from "motion/react";

export default function Comparison3() {
  const comparisons = [
    { feature: "Booking System", mandibook: "Pre-book slot from phone", traditional: "First come, first serve" },
    { feature: "Wait Time", mandibook: "~15 minutes", traditional: "3-5 hours" },
    { feature: "Price Visibility", mandibook: "Live prices on app", traditional: "Ask around at mandi" },
    { feature: "Entry Process", mandibook: "Scan QR — walk in", traditional: "Wait in long queue" },
    { feature: "Notifications", mandibook: "SMS + push alerts", traditional: "None" },
    { feature: "Cost to Farmer", mandibook: "100% Free", traditional: "Lost time & income" },
  ];

  return (
    <section className="relative w-full bg-white px-5 py-12 dark:bg-neutral-950 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column - Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-950 dark:text-white leading-tight">
              MandiBook vs. Traditional Mandi
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              See how digital slot booking compares to the traditional
              first-come-first-serve chaos. Save time, earn more, and
              sell smarter.
            </p>
            <div>
              <a href="/farmer-login" className="cursor-pointer inline-block w-full rounded-xl sm:rounded-full bg-green-700 px-6 sm:px-8 py-3.5 sm:py-4 text-center text-sm sm:text-base font-medium text-white transition-colors hover:bg-green-800 sm:w-auto">
                Try MandiBook Free
              </a>
            </div>
          </motion.div>

          {/* Right Column - Comparison Table (mobile-friendly) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Mobile/Tablet: Card-based comparison */}
            <div className="lg:hidden">
              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-green-700 rounded-2xl p-4 sm:p-5 text-center"
                >
                  <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-3xl sm:text-4xl font-bold text-white">95</div>
                  <div className="text-[10px] sm:text-xs text-white/80 mt-1">MandiBook Score</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-amber-700 rounded-2xl p-4 sm:p-5 text-center"
                >
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-3xl sm:text-4xl font-bold text-white">42</div>
                  <div className="text-[10px] sm:text-xs text-white/80 mt-1">Traditional Score</div>
                </motion.div>
              </div>

              {/* Feature Comparison List */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {comparisons.map((item, index) => (
                  <motion.div
                    key={item.feature}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={`p-3.5 sm:p-4 ${index < comparisons.length - 1 ? "border-b border-neutral-100 dark:border-neutral-800" : ""}`}
                  >
                    <div className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                      {item.feature}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-neutral-900 dark:text-white font-medium">{item.mandibook}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{item.traditional}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Desktop: Bar Chart */}
            <div className="hidden lg:block">
              <div className="relative h-[520px]">
                {/* Horizontal Grid Lines */}
                <div className="absolute left-0 right-0 top-8 bottom-0 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-px w-full bg-neutral-300 dark:bg-neutral-700"
                    />
                  ))}
                </div>

                {/* Bar Chart */}
                <div className="absolute left-0 right-0 top-8 bottom-0 flex items-end justify-center gap-6">
                  {/* Brand 1 - MandiBook */}
                  <div
                    className="relative w-40"
                    style={{ height: "95%", clipPath: "inset(0 0 0 0)" }}
                  >
                    <motion.div
                      initial={{ y: 467 }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 w-40 bg-green-700 dark:bg-green-600"
                      style={{
                        borderTopLeftRadius: "200px",
                        borderTopRightRadius: "200px",
                      }}
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.1 }}
                        className="absolute left-1/2 top-8 -translate-x-1/2"
                      >
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-neutral-100">
                          <Smartphone className="h-12 w-12 text-green-700" />
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
                      >
                        <div className="text-8xl font-bold text-white">95</div>
                        <div className="mt-2 text-xs font-medium text-white/90">
                          Farmer Satisfaction Score
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Brand 2 - Traditional */}
                  <div
                    className="relative w-40"
                    style={{ height: "42%", clipPath: "inset(0 0 0 0)" }}
                  >
                    <motion.div
                      initial={{ y: 205 }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      className="absolute inset-0 w-40 bg-amber-700 dark:bg-amber-600"
                      style={{
                        borderTopLeftRadius: "200px",
                        borderTopRightRadius: "200px",
                      }}
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="absolute left-1/2 top-8 -translate-x-1/2"
                      >
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-neutral-100">
                          <Clock className="h-12 w-12 text-amber-700" />
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
                      >
                        <div className="text-8xl font-bold text-white">42</div>
                        <div className="mt-2 text-xs font-medium text-white/90">
                          Traditional Mandi Score
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Source */}
            <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
              <span className="text-xs sm:text-sm text-green-700 dark:text-green-400">
                Based on farmer surveys across 150+ mandis
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
