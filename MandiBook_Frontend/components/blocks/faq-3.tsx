"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function FAQ3() {
  const [selectedCategory, setSelectedCategory] = useState("booking");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = [
    { id: "booking", label: "Booking" },
    { id: "prices", label: "Prices" },
    { id: "managers", label: "For Managers" },
    { id: "mandibook", label: "MandiBook" },
  ];

  const faqsByCategory = {
    booking: {
      title: "Booking",
      faqs: [
        {
          question: "How do I book a mandi slot?",
          answer:
            "Open MandiBook, select a nearby mandi, choose a date and time slot, add your crop details (type, quantity), and confirm. You'll receive a QR code instantly that you show at the mandi gate on the day of your visit.",
        },
        {
          question: "Can I cancel or reschedule my booking?",
          answer:
            "Yes! You can cancel or reschedule up to 12 hours before your slot time at no charge. After that, cancellations may affect your booking priority. Visit 'My Bookings' to make changes anytime.",
        },
        {
          question: "What happens if I miss my slot?",
          answer:
            "If you don't check in during your slot window, it's marked as a no-show. Repeated no-shows may temporarily lower your booking priority. We send reminder notifications 1 day and 2 hours before your slot.",
        },
        {
          question: "Can I book a slot for someone else?",
          answer:
            "Currently, each booking is tied to the registered phone number. The person whose number is registered must be present at the mandi gate with their QR code. We're working on a family booking feature for a future update.",
        },
        {
          question: "How far in advance can I book a slot?",
          answer:
            "You can book slots up to 7 days in advance. Slots for the next day become available at 8 PM the evening before. Booking early ensures you get your preferred time — popular morning slots fill up fast!",
        },
      ],
    },
    prices: {
      title: "Prices",
      faqs: [
        {
          question: "How often are crop prices updated?",
          answer:
            "Mandi managers update prices multiple times daily — typically at market opening (6 AM), mid-day, and closing. You'll see the last update timestamp on every price listing so you know how fresh the data is.",
        },
        {
          question: "Can I compare prices across mandis?",
          answer:
            "Absolutely! The Crop Prices page shows rates from all nearby mandis side by side. You can sort by price, change percentage, or distance to find the best deal before loading your truck.",
        },
        {
          question: "Will I get alerts when prices change?",
          answer:
            "Yes. Enable price alerts in your profile for specific crops. You'll receive a push notification whenever the price moves more than 5% up or down at your preferred mandis.",
        },
        {
          question: "Are these prices the same as e-NAM prices?",
          answer:
            "MandiBook prices are updated directly by mandi managers at each APMC market. They reflect real-time local trading rates, which may differ slightly from e-NAM's aggregated data. Both sources complement each other for a fuller picture.",
        },
      ],
    },
    managers: {
      title: "For Managers",
      faqs: [
        {
          question: "How do I manage slot capacity?",
          answer:
            "Go to the Slot Management page in your Manager Portal. You can add, edit, or deactivate time slots, set capacity limits per slot, and monitor real-time occupancy. The system prevents overbooking automatically.",
        },
        {
          question: "How do I verify a farmer at the gate?",
          answer:
            "Use the Check-In feature in Booking Management. Scan the farmer's QR code or search by booking ID. Once verified, mark them as checked-in. The system logs the timestamp for audit purposes.",
        },
        {
          question: "Can I broadcast messages to farmers?",
          answer:
            "Yes! Use the Broadcast feature in Notifications to send messages to all farmers with upcoming bookings at your mandi. Great for communicating schedule changes, weather alerts, or special announcements.",
        },
      ],
    },
    mandibook: {
      title: "MandiBook",
      faqs: [
        {
          question: "Is MandiBook free for farmers?",
          answer:
            "Yes, MandiBook is completely free for farmers. Register with your phone number, book slots, check prices, and manage your visits at no cost. We believe in empowering farmers with digital tools.",
        },
        {
          question: "Which mandis are available on MandiBook?",
          answer:
            "MandiBook is live in 150+ APMC mandis across Delhi, Maharashtra, Tamil Nadu, Karnataka, Telangana, and Uttar Pradesh. We're adding new mandis every week. Check the app for the latest list.",
        },
        {
          question: "Is my data safe on MandiBook?",
          answer:
            "Absolutely. We use bank-grade encryption and never share your personal data with third parties. Your phone number is used only for OTP login and essential notifications. We comply with all data protection regulations.",
        },
        {
          question: "Does MandiBook work without internet?",
          answer:
            "You need internet to book slots and check prices. However, your QR booking pass is saved offline once generated — so even if you lose signal at the mandi, you can still show your pass at the gate.",
        },
        {
          question: "How is MandiBook different from e-NAM?",
          answer:
            "e-NAM focuses on online trading and auction. MandiBook focuses on the physical visit experience — booking your slot, reducing wait time, QR-based check-in, and live local prices. They work great together!",
        },
      ],
    },
  };

  const currentCategory =
    faqsByCategory[selectedCategory as keyof typeof faqsByCategory];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setOpenIndex(null);
  };

  return (
    <section className="w-full min-h-screen flex flex-col bg-green-200 dark:bg-green-900">
      {/* Top Section - Title & Categories */}
      <div className="w-full py-8 sm:py-10 lg:py-12 px-5 sm:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="tracking-tight text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-semibold text-black mb-5 sm:mb-8 leading-tight"
          >
            Questions about MandiBook?
          </motion.h1>

          {/* Category Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <button
                  onClick={() => handleCategoryChange(category.id)}
                  className={`cursor-pointer px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 transition-transform border border-green-900 text-green-900 font-medium tracking-tight text-xs sm:text-sm lg:text-base ${
                    selectedCategory === category.id
                      ? "rounded-full border-2 border-dashed rotate-12 transition-transform"
                      : "rounded-md"
                  }`}
                >
                  {category.label}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Category Title & FAQs */}
      <div className="flex-1 bg-white dark:bg-neutral-950 py-8 sm:py-12 md:py-16 lg:py-24 px-5 sm:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 xl:gap-20">
            {/* Left Column - Category Title */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <motion.h2
                key={selectedCategory}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 dark:text-white"
              >
                {currentCategory.title}
              </motion.h2>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div className="flex flex-col">
              <div key={selectedCategory} className="space-y-0">
                {currentCategory.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-neutral-300 dark:border-neutral-700"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full py-4 sm:py-6 lg:py-8 flex items-start justify-between gap-3 sm:gap-4 text-left group"
                    >
                      <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200 flex-1">
                        {faq.question}
                      </span>
                      <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mt-0.5">
                        {openIndex === index ? (
                          <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                        ) : (
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: {
                              duration: 0.3,
                              ease: [0.4, 0, 0.2, 1],
                            },
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
