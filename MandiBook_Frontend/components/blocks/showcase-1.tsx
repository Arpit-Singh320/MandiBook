"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ShowcaseItem {
  id: number;
  title: string;
  subtitle: string;
  year?: string;
  image: string;
  status?: string;
}

export function Showcase1() {
  const [activeId, setActiveId] = useState(1);

  const items: ShowcaseItem[] = [
    {
      id: 1,
      title: "Register via OTP",
      subtitle: "Enter your phone number, verify with OTP, and you're in.",
      year: "Step 1",
      image:
        "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=800&fit=crop",
    },
    {
      id: 2,
      title: "Book Your Slot",
      subtitle: "Choose a mandi, pick a date & time, add crop details.",
      year: "Step 2",
      image:
        "https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&h=800&fit=crop",
    },
    {
      id: 3,
      title: "Visit the Mandi",
      subtitle: "Show your QR code at the gate — no queues, no hassle.",
      year: "Step 3",
      image:
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=800&fit=crop",
    },
    {
      id: 4,
      title: "Sell & Get Paid",
      subtitle: "Weigh your produce, get the best price, and collect payment.",
      year: "Step 4",
      image:
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=800&fit=crop",
    },
  ];

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <section className="w-full py-12 sm:py-16 lg:py-0 lg:min-h-screen flex items-start lg:items-center px-5 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Mobile/Tablet Section Header */}
        <div className="lg:hidden mb-6">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium tracking-wide uppercase mb-2">
            How It Works
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white leading-tight">
            4 simple steps to sell at any mandi
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-6 lg:gap-16 xl:gap-20">
          {/* Left Column - Items List */}
          <div className="flex flex-col relative">
            {/* Desktop: Interactive steps */}
            <div className="hidden lg:flex flex-col">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative w-full text-left py-8"
                >
                  {activeId === item.id && (
                    <motion.div
                      layoutId="active-background"
                      className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={`relative px-6 flex items-center justify-between gap-4 ${
                      activeId === item.id
                        ? ""
                        : "transition-opacity duration-300 hover:opacity-60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h2
                        className={`text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight mb-2 truncate ${
                          activeId === item.id
                            ? "text-white dark:text-neutral-900"
                            : "text-neutral-900 dark:text-white"
                        }`}
                      >
                        {item.title}
                      </h2>
                      {item.subtitle && (
                        <p
                          className={`text-sm ${
                            activeId === item.id
                              ? "text-neutral-300 dark:text-neutral-600"
                              : "text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {activeId === item.id && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-neutral-900"
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Mobile/Tablet: Card-based steps */}
            <div className="flex flex-col gap-3 lg:hidden">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    activeId === item.id
                      ? "bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white"
                      : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Step Number */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      activeId === item.id
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base font-semibold mb-0.5 ${
                        activeId === item.id
                          ? "text-white dark:text-neutral-900"
                          : "text-neutral-900 dark:text-white"
                      }`}>
                        {item.title}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${
                        activeId === item.id
                          ? "text-neutral-400 dark:text-neutral-500"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-auto lg:h-full overflow-hidden rounded-2xl sm:rounded-3xl order-first lg:order-0">
            <AnimatePresence initial={false}>
              {activeItem && (
                <motion.img
                  key={activeItem.id}
                  src={activeItem.image}
                  alt={activeItem.title}
                  initial={{ y: "60%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
