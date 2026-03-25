"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

const stats = [
  {
    value: "3hrs",
    label: "Average time saved per visit",
  },
  {
    value: "94%",
    label: "Farmer satisfaction rate",
  },
];

export default function Stats3() {
  const marquee1Ref = useRef<HTMLDivElement>(null);
  const marquee2Ref = useRef<HTMLDivElement>(null);

  const squares = Array.from({ length: 30 }, (_, i) => i);

  useEffect(() => {
    const marquee1 = marquee1Ref.current;
    const marquee2 = marquee2Ref.current;

    if (!marquee1 || !marquee2) return;

    let animation: number;
    let scrollPos1 = 0;
    let scrollPos2 = -(marquee2.scrollHeight / 2);

    const animate = () => {
      scrollPos1 += 0.8;
      if (scrollPos1 >= marquee1.scrollHeight / 2) {
        scrollPos1 = 0;
      }
      marquee1.style.transform = `translateY(-${scrollPos1}px)`;

      scrollPos2 += 0.8;
      if (scrollPos2 >= 0) {
        scrollPos2 = -(marquee2.scrollHeight / 2);
      }
      marquee2.style.transform = `translateY(${scrollPos2}px)`;

      animation = requestAnimationFrame(animate);
    };

    animation = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <section className="w-full py-10 sm:py-14 lg:py-20 px-5 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Top Section - Title and Description */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10 lg:mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white leading-tight max-w-xl mb-3 sm:mb-5"
          >
            Empowering India&apos;s agricultural markets with digital infrastructure
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base tracking-tight text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl"
          >
            MandiBook connects farmers directly to mandis, eliminating
            middlemen delays and bringing transparency to every
            transaction.
          </motion.p>
        </div>

        {/* Vertical Line */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-px h-8 sm:h-12 lg:h-16 bg-neutral-300 dark:bg-neutral-900 mx-auto origin-top"
        />

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-black rounded-2xl sm:rounded-3xl overflow-hidden border dark:border-neutral-900"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column - Content */}
            <div className="p-5 sm:p-8 md:p-10 lg:p-16 flex flex-col justify-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4 sm:mb-6 lg:mb-8"
              >
                Transforming mandi visits for 12,000+ farmers
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-sm sm:text-base text-neutral-300 tracking-tight leading-relaxed mb-6 sm:mb-8 lg:mb-12"
              >
                How farmers across Uttar Pradesh reduced wait times by 80%
                and increased their earnings with slot-based selling.
              </motion.p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="flex flex-col gap-1 sm:gap-2"
                  >
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm lg:text-base text-neutral-400">
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column - Masked Image with Marquee */}
            <div className="relative h-[280px] sm:h-[400px] lg:h-auto overflow-hidden bg-black">
              {/* Gradient overlay - fades from top on mobile, from left on desktop */}
              <div className="absolute inset-0 bg-linear-to-b lg:bg-linear-to-r from-black via-black/60 to-transparent via-30% z-20 pointer-events-none" />

              {/* Isolation wrapper for blend modes */}
              <div
                className="absolute inset-0"
                style={{ isolation: "isolate" }}
              >
                {/* White background */}
                <div className="absolute inset-0 bg-white" />

                {/* Image layer */}
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&h=1200&fit=crop&q=80"
                    alt="Indian farmer at mandi"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Black overlay with white squares (cutouts) using multiply blend mode */}
                <div
                  className="absolute inset-0 bg-black"
                  style={{ mixBlendMode: "multiply" }}
                >
                  {/* Rotated Marquee Container */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "rotate(45deg) scale(2.2)",
                      transformOrigin: "center center",
                    }}
                  >
                    <div className="flex gap-2 sm:gap-3 md:gap-4 h-full items-center justify-center">
                      {/* Marquee 1 - Scrolling Down */}
                      <div className="relative overflow-hidden">
                        <div
                          ref={marquee1Ref}
                          className="flex flex-col gap-3 sm:gap-4"
                        >
                          {[...squares, ...squares].map((_, index) => (
                            <div
                              key={`marquee1-${index}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md sm:rounded-lg bg-white shrink-0"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Marquee 2 - Scrolling Up */}
                      <div className="relative overflow-hidden">
                        <div
                          ref={marquee2Ref}
                          className="flex flex-col gap-3 sm:gap-4"
                        >
                          {[...squares, ...squares].map((_, index) => (
                            <div
                              key={`marquee2-${index}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md sm:rounded-lg bg-white shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
