"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

export default function SocialProof5() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote:
        "MandiBook saved me 3 hours every visit. I just show my QR code at the gate — no waiting, no fighting for a slot. My family can now plan our week better.",
      name: "Ramesh Kumar",
      title: "Wheat Farmer @ Varanasi, UP",
      avatar: "https://images.unsplash.com/photo-1600481453173-55f6a844a4ea?q=80&w=750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      color: "#4ade80",
    },
    {
      quote:
        "As a mandi manager, I can see all bookings for the day, manage slot capacity, and update crop prices in real-time. Overcrowding is now a thing of the past.",
      name: "Suresh Patel",
      title: "Manager @ Azadpur Mandi, Delhi",
      avatar: "https://images.unsplash.com/photo-1530466015235-1d47696ea847?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      color: "#fbbf24",
    },
    {
      quote:
        "I check today's prices on my phone before loading the truck. MandiBook tells me which mandi is paying more for my onions — I earned ₹4,000 extra last month!",
      name: "Priya Devi",
      title: "Vegetable Farmer @ Lucknow, UP",
      avatar: "https://images.unsplash.com/photo-1705408115324-6bd2cbfa4d93?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      color: "#67e8f9",
    },
    {
      quote:
        "The analytics dashboard gives us a clear picture — which mandis are performing well, where farmers are facing issues. Data-driven governance at its best.",
      name: "Dr. Anita Sharma",
      title: "Agri-Commissioner, UP Govt.",
      avatar: "https://images.unsplash.com/photo-1564172556663-2bef9580fc44?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      color: "#c084fc",
    },
  ];

  const companies = [
    { name: "e-NAM" },
    { name: "APMC" },
    { name: "NABARD" },
    { name: "Kisan Portal" },
    { name: "Agri Ministry" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="w-full bg-neutral-50 py-10 dark:bg-neutral-950 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-16">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-2xl font-semibold leading-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl sm:mb-12 lg:mb-20 lg:text-6xl"
        >
          Trusted by farmers
          <br />
          across India
        </motion.h2>

        {/* Testimonial Section */}
        <div className="mb-8 sm:mb-12 grid gap-6 lg:mb-20 lg:grid-cols-2 lg:gap-12">
          {/* Left - Avatars */}
          <div className="flex items-center justify-start gap-3 sm:gap-4 lg:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: activeIndex === index ? 1.1 : 0.9,
                  opacity: activeIndex === index ? 1 : 0.6,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
              >
                {/* Avatar */}
                <div
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full transition-colors duration-500 sm:h-14 sm:w-14 lg:h-20 lg:w-20"
                  style={{
                    backgroundColor:
                      activeIndex === index ? testimonial.color : undefined,
                  }}
                >
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    sizes="(max-width: 640px) 36px, (max-width: 1024px) 40px, 64px"
                    className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10 lg:h-16 lg:w-16 grayscale"
                  />
                </div>

                {/* Circular Progress */}
                {activeIndex === index && (
                  <svg
                    className="absolute -inset-1.5 sm:-inset-2 h-[calc(100%+12px)] w-[calc(100%+12px)] sm:h-[calc(100%+16px)] sm:w-[calc(100%+16px)] -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      opacity="0.2"
                    />
                    <motion.circle
                      key={`progress-${activeIndex}`}
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 10, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>

          {/* Right - Testimonial Content */}
          <div className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <blockquote className="mb-4 sm:mb-6 text-base sm:text-lg lg:text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">
                  &ldquo;{testimonials[activeIndex]?.quote}&rdquo;
                </blockquote>
                <div className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100">
                  {testimonials[activeIndex]?.name},{" "}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {testimonials[activeIndex]?.title}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Company Logos */}
        <div className="flex items-center flex-wrap gap-x-6 gap-y-3 sm:flex-nowrap sm:justify-between sm:gap-6 lg:gap-8">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center"
            >
              <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-400 dark:text-neutral-600 tracking-tight whitespace-nowrap">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
