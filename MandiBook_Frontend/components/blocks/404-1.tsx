"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const cards = [
  {
    title: "Farmer Portal",
    count: "Book Slots",
    icon: "circles",
    href: "/farmer-login",
  },
  {
    title: "Crop Prices",
    count: "Live Rates",
    icon: "starburst",
    href: "/#features",
  },
  {
    title: "Contact",
    count: "Support",
    icon: "slider",
    href: "/#faq",
  },
];

const CirclesIcon = () => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    className="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Concentric circles */}
    <circle
      cx="120"
      cy="120"
      r="80"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <circle
      cx="120"
      cy="120"
      r="60"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <circle cx="120" cy="120" r="40" stroke="#15803d" strokeWidth="2" />
    <circle cx="120" cy="120" r="20" fill="#15803d" />
  </svg>
);

const StarburstIcon = () => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    className="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Wavy lines */}
    <path
      d="M 40 60 Q 80 40, 120 60 T 200 60"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <path
      d="M 40 100 Q 80 80, 120 100 T 200 100"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <path
      d="M 40 140 Q 80 120, 120 140 T 200 140"
      stroke="#15803d"
      strokeWidth="2.5"
    />
    <path
      d="M 40 180 Q 80 160, 120 180 T 200 180"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
  </svg>
);

const SliderIcon = () => (
  <svg
    viewBox="0 0 240 240"
    fill="none"
    className="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Diagonal steps */}
    <rect
      x="40"
      y="140"
      width="40"
      height="40"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <rect
      x="90"
      y="100"
      width="40"
      height="40"
      stroke="#d4d4d4"
      strokeWidth="1.5"
      className="dark:stroke-neutral-700"
    />
    <rect x="140" y="60" width="40" height="40" fill="#15803d" />
    <circle cx="200" cy="35" r="20" stroke="#15803d" strokeWidth="2" />
  </svg>
);

export default function NotFound1() {
  return (
    <section className="w-full min-h-screen flex items-start py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Top Section - 404 and Content */}
        <div className="grid grid-cols-1 md:grid-cols-[15%_85%] gap-8 mb-16 sm:mb-20 lg:mb-24 items-start">
          {/* Left Column - 404 Label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 pt-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              404
            </span>
          </motion.div>

          {/* Right Column - Main Content */}
          <div className="flex flex-col gap-2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-neutral-400 dark:text-neutral-600"
            >
              Oops!
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white mb-4"
            >
              Looks like you wandered off the farm.
            </motion.h2>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="px-8 py-3.5 rounded-full bg-green-700 text-white font-medium text-base hover:bg-green-800 transition-colors duration-200 w-fit"
            >
              Back to MandiBook
            </motion.button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="group relative rounded-2xl sm:rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-6 sm:p-8 flex flex-col justify-between hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors duration-300"
            >
              {/* Icon */}
              <div className="w-full h-48 sm:h-64 flex items-center justify-center">
                {card.icon === "circles" && <CirclesIcon />}
                {card.icon === "starburst" && <StarburstIcon />}
                {card.icon === "slider" && <SliderIcon />}
              </div>

              {/* Bottom Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-medium text-neutral-900 dark:text-white">
                    {card.title}
                  </span>
                  <span className="text-xs text-green-700 dark:text-green-500">
                    {card.count}
                  </span>
                </div>

                <button className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-700 text-white hover:scale-110 transition-transform duration-200">
                  <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
