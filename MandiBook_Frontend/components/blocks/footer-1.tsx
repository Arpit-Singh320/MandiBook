"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export default function Footer1() {
  const footerCards = [
    {
      title: "Portals",
      links: [
        { text: "Farmer Portal", href: "/farmer-login" },
        { text: "Manager Portal", href: "/manager-login" },
        { text: "Admin Portal", href: "/admin-login" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Crop Prices", href: "#" },
        { text: "How It Works", href: "#how-it-works" },
        { text: "e-NAM Portal", href: "https://enam.gov.in", external: true },
      ],
    },
    {
      title: "Support",
      links: [
        { text: "Contact Us", href: "#" },
        { text: "FAQ", href: "#faq" },
        { text: "Helpline: 1800-XXX-XXXX", href: "#" },
        { text: "Privacy Policy", href: "#" },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <footer className="relative w-full overflow-hidden bg-white dark:bg-neutral-950 py-10 sm:py-14 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6"
        >
          {/* Top Section - 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            {/* First Column - Branding */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col justify-between space-y-6 mb-6 lg:mb-0"
            >
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
                  <span className="text-lg font-bold text-[var(--primary-foreground)]">
                    M
                  </span>
                </div>
                <span className="text-lg font-medium text-neutral-900 dark:text-white">
                  MandiBook
                </span>
              </div>

              {/* Motto */}
              <div>
                <h3 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white sm:text-xl">
                  Book your mandi slot,
                  <br />
                  sell smarter every day
                </h3>
              </div>

              {/* Small Text */}
              <div className="mt-auto">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  India's digital mandi platform
                </p>
              </div>
            </motion.div>

            {/* Cards - Dynamically Rendered with negative margins approach */}
            {footerCards.map((card, index) => {
              let marginClass = "";

              if (index > 0) {
                marginClass = "-mt-px";
              }

              if (index === 0) {
                marginClass += " md:mt-0";
              } else if (index === 1) {
                marginClass += " md:-mt-px md:ml-0";
              } else if (index === 2) {
                marginClass += " md:-mt-px md:-ml-px";
              }

              marginClass += " lg:mt-0";
              if (index > 0) {
                marginClass += " lg:-ml-px";
              }

              return (
                <motion.div
                  key={card.title}
                  variants={itemVariants}
                  className={`group relative min-h-[180px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden border border-neutral-300 p-5 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:p-6 lg:p-8 ${marginClass}`}
                >
                  <h4 className="mb-6 text-sm font-medium tracking-tight text-neutral-900 dark:text-white sm:text-base">
                    {card.title}
                  </h4>
                  <ul className="space-y-3">
                    {card.links.map((link) => (
                      <li key={link.text}>
                        <a
                          href={link.href}
                          className="inline-flex font-light items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white sm:text-base"
                        >
                          {link.text}
                          {link.external && (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Section - Large Background Logo */}
          <motion.div
            variants={itemVariants}
            className="relative flex items-center justify-center overflow-hidden py-8 sm:py-12 md:py-16"
          >
            <div className="w-full px-4" aria-hidden="true">
              <h2 className="text-[8vw] sm:text-[7vw] md:text-[6vw] font-bold tracking-tighter text-neutral-200 dark:text-neutral-900 text-center leading-none select-none">
                MandiBook
              </h2>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
