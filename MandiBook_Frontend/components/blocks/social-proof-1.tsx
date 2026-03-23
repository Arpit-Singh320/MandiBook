"use client";

import { motion } from "motion/react";

export default function SocialProof1() {
  const partners = [
    { name: "Ministry of Agriculture" },
    { name: "e-NAM" },
    { name: "APMC" },
    { name: "NABARD" },
    { name: "Kisan Call Centre" },
    { name: "Digital India" },
  ];

  return (
    <section className="w-full bg-white py-16 dark:bg-neutral-950 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-lg font-medium text-neutral-900 dark:text-neutral-100 sm:text-xl">
          Trusted by mandis and agriculture bodies across India
        </h2>

        <div className="grid grid-cols-1 border border-neutral-200 dark:border-neutral-800 md:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex items-center justify-center border-b border-neutral-200 bg-white px-8 py-8 last:border-b-0 dark:border-neutral-800 dark:bg-neutral-950 md:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-last-child(-n+3)]:border-b-0 lg:[&:nth-child(3n)]:border-r lg:[&:nth-child(6n)]:border-r-0 lg:[&:nth-last-child(-n+6)]:border-b-0"
            >
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 text-center">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
