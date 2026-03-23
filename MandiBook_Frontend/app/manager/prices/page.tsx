"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Edit3, Save, X, History } from "lucide-react";

interface CropPrice {
  id: string;
  crop: string;
  unit: string;
  currentPrice: number;
  prevPrice: number;
  lastUpdated: string;
}

const initialPrices: CropPrice[] = [
  { id: "p1", crop: "Wheat", unit: "Quintal", currentPrice: 2480, prevPrice: 2420, lastUpdated: "Today, 08:30 AM" },
  { id: "p2", crop: "Rice (Basmati)", unit: "Quintal", currentPrice: 3850, prevPrice: 3900, lastUpdated: "Today, 08:30 AM" },
  { id: "p3", crop: "Potato", unit: "Quintal", currentPrice: 1250, prevPrice: 1180, lastUpdated: "Today, 07:00 AM" },
  { id: "p4", crop: "Onion", unit: "Quintal", currentPrice: 1890, prevPrice: 2050, lastUpdated: "Today, 07:00 AM" },
  { id: "p5", crop: "Tomato", unit: "Quintal", currentPrice: 2100, prevPrice: 1800, lastUpdated: "Today, 09:00 AM" },
  { id: "p6", crop: "Mustard", unit: "Quintal", currentPrice: 5200, prevPrice: 5150, lastUpdated: "Yesterday" },
  { id: "p7", crop: "Maize", unit: "Quintal", currentPrice: 1980, prevPrice: 1950, lastUpdated: "Yesterday" },
  { id: "p8", crop: "Cauliflower", unit: "Quintal", currentPrice: 1500, prevPrice: 1650, lastUpdated: "Today, 08:00 AM" },
];

export default function PriceManagementPage() {
  const [prices, setPrices] = useState<CropPrice[]>(initialPrices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (price: CropPrice) => {
    setEditingId(price.id);
    setEditValue(price.currentPrice.toString());
  };

  const saveEdit = (id: string) => {
    const newPrice = parseInt(editValue);
    if (isNaN(newPrice) || newPrice <= 0) return;
    setPrices((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, prevPrice: p.currentPrice, currentPrice: newPrice, lastUpdated: "Just now" }
          : p
      )
    );
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          Price Management
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Update and manage crop prices for your mandi
        </p>
      </motion.div>

      {/* Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Price updates are visible to all farmers in real-time. Please verify before saving.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Crop</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Current Price (₹)</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Change</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Last Updated</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {prices.map((price) => {
              const change = price.currentPrice - price.prevPrice;
              const pct = ((change / price.prevPrice) * 100).toFixed(1);
              const isUp = change >= 0;
              const isEditing = editingId === price.id;

              return (
                <tr key={price.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{price.crop}</span>
                    <span className="text-xs text-neutral-400 ml-1">/{price.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(price.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="w-28 px-3 py-1.5 rounded-lg border border-[var(--primary)] bg-white dark:bg-neutral-800 text-sm text-right font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    ) : (
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        ₹{price.currentPrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? "+" : ""}{pct}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      {price.lastUpdated}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(price.id)}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(price)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {prices.map((price, index) => {
          const change = price.currentPrice - price.prevPrice;
          const pct = ((change / price.prevPrice) * 100).toFixed(1);
          const isUp = change >= 0;
          const isEditing = editingId === price.id;

          return (
            <motion.div
              key={price.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-neutral-900 dark:text-white">{price.crop}</span>
                <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isUp ? "+" : ""}{pct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="w-24 px-3 py-1.5 rounded-lg border border-[var(--primary)] text-sm font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none"
                    />
                    <button onClick={() => saveEdit(price.id)} className="p-1.5 rounded-lg bg-green-100 text-green-700">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-neutral-100 text-neutral-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-neutral-500">{price.lastUpdated}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">₹{price.currentPrice.toLocaleString()}</span>
                      <button onClick={() => startEdit(price)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Edit3 className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
