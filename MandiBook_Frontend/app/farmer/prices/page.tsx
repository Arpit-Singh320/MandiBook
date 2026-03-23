"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, TrendingDown, ArrowUpDown, Loader2 } from "lucide-react";
import { priceApi, type CropPriceData } from "@/lib/data-api";

type SortKey = "crop" | "price" | "change";

export default function FarmerPricesPage() {
  const [prices, setPrices] = useState<CropPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("crop");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    priceApi.list().then((res) => setPrices(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  const filtered = prices
    .filter((p) => search === "" || p.crop.toLowerCase().includes(search.toLowerCase()) || (p.Mandi?.name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "crop") cmp = a.crop.localeCompare(b.crop);
      else if (sortBy === "price") cmp = a.currentPrice - b.currentPrice;
      else cmp = (a.currentPrice - a.prevPrice) - (b.currentPrice - b.prevPrice);
      return sortAsc ? cmp : -cmp;
    });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Crop Prices</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Latest mandi prices updated throughout the day</p>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crop or mandi..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="hidden sm:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-5 py-3">
                <button onClick={() => toggleSort("crop")} className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Crop <ArrowUpDown className="w-3 h-3" /></button>
              </th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Mandi</th>
              <th className="text-right px-5 py-3">
                <button onClick={() => toggleSort("price")} className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white ml-auto">Price (₹) <ArrowUpDown className="w-3 h-3" /></button>
              </th>
              <th className="text-right px-5 py-3">
                <button onClick={() => toggleSort("change")} className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white ml-auto">Change <ArrowUpDown className="w-3 h-3" /></button>
              </th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((price) => {
              const change = price.currentPrice - price.prevPrice;
              const pct = price.prevPrice > 0 ? ((change / price.prevPrice) * 100).toFixed(1) : "0.0";
              const isUp = change >= 0;
              return (
                <tr key={price.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3.5"><span className="text-sm font-semibold text-neutral-900 dark:text-white">{price.crop}</span></td>
                  <td className="px-5 py-3.5 text-sm text-neutral-500">{price.Mandi?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">₹{price.currentPrice.toLocaleString()}</span>
                    <span className="text-[10px] text-neutral-400 ml-1">/{price.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? "+" : ""}{pct}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-neutral-400">{new Date(price.updatedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {filtered.map((price, index) => {
          const change = price.currentPrice - price.prevPrice;
          const pct = price.prevPrice > 0 ? ((change / price.prevPrice) * 100).toFixed(1) : "0.0";
          const isUp = change >= 0;
          return (
            <motion.div key={price.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-semibold text-neutral-900 dark:text-white">{price.crop}</span>
                <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isUp ? "+" : ""}{pct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">{price.Mandi?.name || "—"}</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">₹{price.currentPrice.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12 text-neutral-500">No prices found matching your search.</div>}
    </div>
  );
}
