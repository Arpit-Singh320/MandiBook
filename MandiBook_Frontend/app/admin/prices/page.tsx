"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, TrendingDown, MapPin, AlertCircle } from "lucide-react";

interface PriceEntry {
  crop: string;
  unit: string;
  prices: { mandi: string; price: number; prevPrice: number }[];
}

const priceData: PriceEntry[] = [
  {
    crop: "Wheat",
    unit: "Quintal",
    prices: [
      { mandi: "Azadpur, Delhi", price: 2480, prevPrice: 2420 },
      { mandi: "Vashi, Mumbai", price: 2520, prevPrice: 2500 },
      { mandi: "Koyambedu, Chennai", price: 2450, prevPrice: 2400 },
      { mandi: "Bowenpally, Hyd", price: 2470, prevPrice: 2430 },
    ],
  },
  {
    crop: "Rice (Basmati)",
    unit: "Quintal",
    prices: [
      { mandi: "Azadpur, Delhi", price: 3850, prevPrice: 3900 },
      { mandi: "Vashi, Mumbai", price: 3900, prevPrice: 3950 },
      { mandi: "Koyambedu, Chennai", price: 3780, prevPrice: 3800 },
    ],
  },
  {
    crop: "Potato",
    unit: "Quintal",
    prices: [
      { mandi: "Azadpur, Delhi", price: 1250, prevPrice: 1180 },
      { mandi: "Ghazipur, Delhi", price: 1230, prevPrice: 1200 },
      { mandi: "Bowenpally, Hyd", price: 1280, prevPrice: 1220 },
    ],
  },
  {
    crop: "Onion",
    unit: "Quintal",
    prices: [
      { mandi: "Azadpur, Delhi", price: 1890, prevPrice: 2050 },
      { mandi: "Vashi, Mumbai", price: 1850, prevPrice: 2000 },
      { mandi: "Yeshwanthpur, Blr", price: 1920, prevPrice: 2080 },
    ],
  },
  {
    crop: "Tomato",
    unit: "Quintal",
    prices: [
      { mandi: "Koyambedu, Chennai", price: 2100, prevPrice: 1800 },
      { mandi: "Vashi, Mumbai", price: 2150, prevPrice: 1900 },
      { mandi: "Azadpur, Delhi", price: 2050, prevPrice: 1780 },
    ],
  },
];

export default function AdminPricesPage() {
  const [search, setSearch] = useState("");

  const filtered = priceData.filter(
    (p) => search === "" || p.crop.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Price Overview</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Compare crop prices across mandis nationwide</p>
      </motion.div>

      {/* Alerts */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Price Anomaly Detected</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Onion prices dropped &gt;7% across multiple mandis. Tomato prices surged &gt;15% in 3 mandis.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crop..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Crop Price Cards */}
      <div className="space-y-4">
        {filtered.map((crop, index) => (
          <motion.div
            key={crop.crop}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {crop.crop} <span className="text-xs text-neutral-400 font-normal">per {crop.unit}</span>
              </h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {crop.prices.map((p) => {
                const change = p.price - p.prevPrice;
                const pct = ((change / p.prevPrice) * 100).toFixed(1);
                const isUp = change >= 0;
                return (
                  <div key={p.mandi} className="flex items-center justify-between px-4 sm:px-5 py-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-neutral-400" /> {p.mandi}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">₹{p.price.toLocaleString()}</span>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? "+" : ""}{pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
