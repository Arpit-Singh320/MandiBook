"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Edit3, Save, X, History, Plus, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { priceApi, type CropCatalogData, type CropPriceData } from "@/lib/data-api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function PriceManagementPage() {
  const { token, user } = useAuth();
  const [prices, setPrices] = useState<CropPriceData[]>([]);
  const [catalog, setCatalog] = useState<CropCatalogData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadPrices = useCallback(async () => {
    const mandiId = user?.mandiId;
    if (!mandiId) return;

    try {
      setLoading(true);
      const [priceResponse, catalogResponse] = await Promise.all([
        priceApi.list({ mandiId }),
        priceApi.catalog({ active: true }),
      ]);
      setPrices(priceResponse.data);
      setCatalog(catalogResponse.data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }, [user?.mandiId]);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const catalogMap = useMemo(
    () => new Map(catalog.map((entry) => [entry.crop.toLowerCase(), entry])),
    [catalog]
  );

  const missingCatalogCrops = useMemo(
    () => catalog.filter((entry) => !prices.some((price) => price.crop.toLowerCase() === entry.crop.toLowerCase())),
    [catalog, prices]
  );

  const startEdit = (price: CropPriceData) => {
    setEditingId(price.id);
    setEditValue(price.currentPrice.toString());
  };

  const saveEdit = async (id: string) => {
    if (!token) return;
    const value = parseInt(editValue, 10);
    if (isNaN(value) || value <= 0) return;

    try {
      setSavingId(id);
      setError("");
      const response = await priceApi.update(token, id, { currentPrice: value });
      setPrices((prev) => prev.map((p) => (p.id === id ? response.data : p)));
      setEditingId(null);
      setEditValue("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setSavingId(null);
    }
  };

  const deleteCropPrice = async (price: CropPriceData) => {
    if (!token) return;
    const confirmed = window.confirm(`Delete the live mandi price for ${price.crop}? This will notify impacted farmers${user?.role === "admin" ? " and managers" : ""}.`);
    if (!confirmed) return;

    try {
      setSavingId(price.id);
      setError("");
      await priceApi.delete(token, price.id);
      setPrices((prev) => prev.filter((entry) => entry.id !== price.id));
      if (editingId === price.id) {
        setEditingId(null);
        setEditValue("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete price");
    } finally {
      setSavingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const addCropPrice = async () => {
    const mandiId = user?.mandiId;
    if (!token || !mandiId || !selectedCrop) return;
    const value = parseInt(newPrice, 10);
    if (isNaN(value) || value <= 0) return;

    try {
      setSavingId("new");
      setError("");
      const response = await priceApi.create(token, {
        crop: selectedCrop,
        mandiId,
        currentPrice: value,
      });
      setPrices((prev) => [...prev, response.data].sort((a, b) => a.crop.localeCompare(b.crop)));
      setSelectedCrop("");
      setNewPrice("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add crop price");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

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

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Price updates are visible to all farmers in real-time. Please verify before saving.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5 mb-6 space-y-3">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Add mandi crop price</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="">Select crop from catalog</option>
            {missingCatalogCrops.map((entry) => (
              <option key={entry.id} value={entry.crop}>
                {entry.crop} (min {currencyFormatter.format(entry.minPrice)})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Enter mandi price"
            className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="button"
            onClick={() => void addCropPrice()}
            disabled={savingId === "new" || !selectedCrop || !newPrice}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Crop
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Crop</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Current Price (₹)</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Minimum Baseline</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Change</th>
              <th className="text-left text-xs font-medium text-neutral-500 px-5 py-3">Last Updated</th>
              <th className="text-right text-xs font-medium text-neutral-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {prices.map((price) => {
              const change = price.currentPrice - price.prevPrice;
              const pct = price.prevPrice > 0 ? ((change / price.prevPrice) * 100).toFixed(1) : "0.0";
              const isUp = change >= 0;
              const isEditing = editingId === price.id;
              const catalogEntry = catalogMap.get(price.crop.toLowerCase());

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
                        {currencyFormatter.format(price.currentPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-neutral-600 dark:text-neutral-400">
                    {catalogEntry ? currencyFormatter.format(catalogEntry.minPrice) : "—"}
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
                      {formatRelativeDate(price.updatedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void saveEdit(price.id)}
                          disabled={savingId === price.id}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(price)}
                          disabled={savingId === price.id}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          <Edit3 className="w-4 h-4 text-neutral-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCropPrice(price)}
                          disabled={savingId === price.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                        >
                          {savingId === price.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                        </button>
                      </div>
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
          const pct = price.prevPrice > 0 ? ((change / price.prevPrice) * 100).toFixed(1) : "0.0";
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
                    <button type="button" onClick={() => void saveEdit(price.id)} className="p-1.5 rounded-lg bg-green-100 text-green-700">
                      <Save className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={cancelEdit} className="p-1.5 rounded-lg bg-neutral-100 text-neutral-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-neutral-500">{formatRelativeDate(price.updatedAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">{currencyFormatter.format(price.currentPrice)}</span>
                      <button type="button" onClick={() => startEdit(price)} disabled={savingId === price.id} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
                        <Edit3 className="w-4 h-4 text-neutral-500" />
                      </button>
                      <button type="button" onClick={() => void deleteCropPrice(price)} disabled={savingId === price.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50">
                        {savingId === price.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Minimum baseline: {catalogMap.get(price.crop.toLowerCase()) ? `${currencyFormatter.format(catalogMap.get(price.crop.toLowerCase())!.minPrice)}` : "—"}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
