"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, TrendingDown, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { priceApi, type PriceOverviewData } from "@/lib/data-api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AdminPricesPage() {
  const [prices, setPrices] = useState<PriceOverviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await priceApi.overview();
        setPrices(response.data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load price overview");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => prices.filter((entry) => {
    if (search === "") return true;
    const query = search.toLowerCase();
    return entry.crop.toLowerCase().includes(query)
      || entry.prices.some((price) => price.mandi.toLowerCase().includes(query));
  }), [prices, search]);

  const belowBaselineEntries = useMemo(() => filtered.filter((entry) => {
    const baseline = entry.minPrice;
    if (baseline === null || baseline === undefined) return false;
    return entry.prices.some((price) => price.price < baseline);
  }), [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

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
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {belowBaselineEntries.length > 0 ? "Baseline Compliance Alert" : "Live Price Feed Active"}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            {belowBaselineEntries.length > 0
              ? `${belowBaselineEntries.length} crop groups currently contain mandi prices below the configured minimum baseline.`
              : `Showing ${filtered.length} crop groups from the live backend overview.`}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

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
              <p className="mt-1 text-xs text-neutral-500">
                Minimum baseline: {crop.minPrice !== null && crop.minPrice !== undefined ? currencyFormatter.format(crop.minPrice) : "Not configured"}
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {crop.prices.map((p) => {
                const change = p.price - p.prevPrice;
                const pct = ((change / p.prevPrice) * 100).toFixed(1);
                const isUp = change >= 0;
                const belowBaseline = crop.minPrice !== null && crop.minPrice !== undefined && p.price < crop.minPrice;
                return (
                  <div key={p.mandi} className="flex items-center justify-between px-4 sm:px-5 py-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-neutral-400" /> {p.mandi}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">₹{p.price.toLocaleString()}</span>
                        {belowBaseline ? (
                          <p className="text-[10px] text-red-500">Below baseline</p>
                        ) : null}
                      </div>
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
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-neutral-900 px-6 py-12 text-center text-sm text-neutral-500">
            No crop groups match your search.
          </div>
        ) : null}
      </div>
    </div>
  );
}
