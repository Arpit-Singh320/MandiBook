"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function FAQ1() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I book a mandi slot?",
      answer:
        "Simply sign in with your mobile number, select a mandi, choose a date and time slot, enter your crop details, and confirm. You'll receive an instant QR code on your phone.",
    },
    {
      question: "Is MandiBook free for farmers?",
      answer:
        "Yes! MandiBook is completely free for farmers. There are no charges for booking slots or checking crop prices. Our goal is to make mandi operations smoother for everyone.",
    },
    {
      question: "What if I need to cancel my booking?",
      answer:
        "You can cancel your booking up to 2 hours before your slot time from the 'My Bookings' section. The slot will be released for other farmers automatically.",
    },
    {
      question: "How are crop prices updated?",
      answer:
        "Crop prices are updated daily by mandi managers based on actual market rates. You can also view price trends over time to make better selling decisions.",
    },
    {
      question: "Can I book slots at multiple mandis?",
      answer:
        "Yes, you can book slots at any registered mandi. However, overlapping time slots at different mandis are not allowed to ensure fair access for all farmers.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full min-h-screen flex items-start py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 xl:gap-20">
          {/* Left Column - Header */}
          <div className="flex flex-col space-y-2 lg:sticky lg:top-24 lg:self-start">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-neutral-900 dark:text-white leading-tight"
            >
              FAQs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[25ch]"
            >
              Everything you need to know about using MandiBook.
            </motion.p>
          </div>

          {/* Right Column - Accordion */}
          <div className="flex flex-col">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                className={`border-b border-neutral-200 dark:border-neutral-800 ${
                  index === 0 ? "border-t" : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-6 sm:py-8 flex items-start justify-between gap-4 text-left group"
                >
                  <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0 mt-1"
                  >
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 dark:text-neutral-400" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.3, ease: "easeInOut" },
                        opacity: { duration: 0.2, ease: "easeInOut" },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 sm:pb-8 pr-8">
                        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
