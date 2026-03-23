"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";
import { useState } from "react";

const backgroundCards = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop",
    x: "10%",
    y: "12%",
    rotation: -12,
    scale: 1,
    opacity: 0.15,
    intensity: 0.02,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=400&fit=crop",
    x: "70%",
    y: "10%",
    rotation: 8,
    scale: 0.9,
    opacity: 0.2,
    intensity: 0.03,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=400&fit=crop",
    x: "30%",
    y: "40%",
    rotation: 15,
    scale: 1.1,
    opacity: 0.12,
    intensity: 0.04,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=400&fit=crop",
    x: "75%",
    y: "67%",
    rotation: -8,
    scale: 0.95,
    opacity: 0.18,
    intensity: 0.02,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=400&fit=crop",
    x: "55%",
    y: "37%",
    rotation: -12,
    scale: 1,
    opacity: 0.1,
    intensity: 0.03,
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=400&fit=crop",
    x: "8%",
    y: "67%",
    rotation: -15,
    scale: 0.85,
    opacity: 0.15,
    intensity: 0.04,
  },
];

function BackgroundCard({
  card,
  smoothMouseX,
  smoothMouseY,
  index,
}: {
  card: (typeof backgroundCards)[0];
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  index: number;
}) {
  const parallaxX = useTransform(
    smoothMouseX,
    [-1, 1],
    [-15 * card.intensity * 100, 15 * card.intensity * 100],
  );
  const parallaxY = useTransform(
    smoothMouseY,
    [-1, 1],
    [-10 * card.intensity * 100, 10 * card.intensity * 100],
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: card.x,
        top: card.y,
        x: parallaxX,
        y: parallaxY,
        rotate: card.rotation,
        scale: card.scale,
        opacity: card.opacity,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: card.opacity, scale: card.scale }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <img
          src={card.image}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

export default function CTA1() {
  const [mobileNumber, setMobileNumber] = useState("");
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Mobile number submitted:", mobileNumber);
  };

  return (
    <section
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] lg:min-h-screen flex items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 px-5 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background Cards Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {backgroundCards.map((card, index) => (
          <BackgroundCard
            key={card.id}
            card={card}
            smoothMouseX={smoothMouseX}
            smoothMouseY={smoothMouseY}
            index={index}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-[1.15] mb-3 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-neutral-900 dark:text-white font-medium tracking-tight">
              Ready to skip
            </span>
            <br />
            <span className="text-neutral-900 dark:text-white font-medium tracking-tight">
              the mandi queue?
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 sm:mb-8 md:mb-12 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join thousands of farmers booking mandi slots digitally.
            Start selling smarter today.
          </motion.p>

          {/* Input Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:relative">
              {/* Input Container */}
              <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-lg overflow-visible sm:overflow-hidden flex-1">
                {/* URL Prefix */}
                <div className="hidden sm:flex items-center pl-6 text-neutral-400 dark:text-neutral-500 text-base md:text-lg">
                  +91
                </div>

                {/* Input Field */}
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  className="flex-1 px-4 sm:px-0 py-4 bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-base md:text-lg outline-none"
                  aria-label="Enter your mobile number"
                />
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="cursor-pointer relative rounded-full bg-[var(--primary)] font-medium text-sm sm:text-base hover:opacity-90 transition-all duration-200 whitespace-nowrap px-6 py-3 text-[var(--primary-foreground)] sm:absolute sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2"
              >
                Get Started
              </button>
            </div>
          </motion.form>

          {/* Login Link */}
          <motion.p
            className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Already have an account?{" "}
            <a
              href="/farmer-login"
              className="text-[var(--primary)] font-medium hover:underline transition-all duration-200"
            >
              Sign in
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
