"use client";

import { motion } from "motion/react";
import {
  CalendarCheck,
  TrendingUp,
  QrCode,
  Bell,
  MapPin,
  BarChart3,
  Smartphone,
  Globe,
} from "lucide-react";

export function Features1() {
  const features = [
    {
      icon: CalendarCheck,
      title: "Slot Booking",
      description: "Book your mandi slot in advance — no more long queues.",
    },
    {
      icon: TrendingUp,
      title: "Live Crop Prices",
      description: "Check real-time prices across mandis for best deals.",
    },
    {
      icon: QrCode,
      title: "QR Confirmation",
      description: "Instant QR code — scan at the gate for quick entry.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Booking reminders, price alerts, and mandi updates.",
    },
    {
      icon: MapPin,
      title: "Nearby Mandis",
      description: "Find and book slots at mandis closest to you.",
    },
    {
      icon: BarChart3,
      title: "Price Trends",
      description: "Track crop price history and make informed decisions.",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Designed for farmers — works great on any phone.",
    },
    {
      icon: Globe,
      title: "Bilingual Support",
      description: "Available in Hindi and English for all users.",
    },
  ];

  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12 lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium tracking-wide uppercase mb-3"
          >
            Digital Mandi Platform
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 dark:text-white mb-4 sm:mb-6 leading-tight"
          >
            Everything you need to sell smarter
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed"
          >
            A complete digital platform for farmers and mandi operations —
            from slot booking to price tracking, all in one place.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-x-8 lg:gap-y-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex flex-col p-3 sm:p-4 lg:p-0 rounded-xl sm:rounded-2xl bg-neutral-50 sm:bg-neutral-50 lg:bg-transparent dark:bg-neutral-900 lg:dark:bg-transparent"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm sm:shadow-lg mb-3">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base tracking-tight font-medium text-neutral-900 dark:text-white mb-1 sm:mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
