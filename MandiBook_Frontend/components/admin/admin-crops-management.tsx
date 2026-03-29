"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  AlertCircle,
  Loader2,
  Plus,
  Save,
  Sprout,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { priceApi, type CropCatalogData, type PriceOverviewData } from "@/lib/data-api";

type CropFormState = {
  crop: string;
  cropHi: string;
  category: string;
  unit: "kg" | "quintal" | "ton";
  minPrice: string;
  maxPrice: string;
  isActive: boolean;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const initialForm: CropFormState = {
  crop: "",
  cropHi: "",
  category: "general",
  unit: "quintal",
  minPrice: "",
  maxPrice: "",
  isActive: true,
};

const buildCatalogPayload = (formState: CropFormState) => {
  const payload: {
    crop: string;
    minPrice: number;
    unit?: string;
    maxPrice?: number | null;
    cropHi?: string;
    category?: string;
    isActive?: boolean;
  } = {
    crop: formState.crop,
    minPrice: Number(formState.minPrice),
    unit: formState.unit,
    isActive: formState.isActive,
  };

  if (formState.cropHi.trim()) payload.cropHi = formState.cropHi.trim();
  if (formState.category.trim()) payload.category = formState.category.trim();
  if (formState.maxPrice.trim()) payload.maxPrice = Number(formState.maxPrice);

  return payload;
};

export function AdminCropsManagement() {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState<CropCatalogData[]>([]);
  const [overview, setOverview] = useState<PriceOverviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<CropFormState>(initialForm);
  const [drafts, setDrafts] = useState<Record<string, CropFormState>>({});

  const loadCropManagement = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogResponse, overviewResponse] = await Promise.all([
        priceApi.catalog(),
        priceApi.overview(),
      ]);
      setCatalog(catalogResponse.data);
      setOverview(overviewResponse.data);
      setDrafts(
        catalogResponse.data.reduce<Record<string, CropFormState>>((acc, crop) => {
          acc[crop.id] = {
            crop: crop.crop,
            cropHi: crop.cropHi || "",
            category: crop.category || "general",
            unit: (crop.unit as "kg" | "quintal" | "ton") || "quintal",
            minPrice: String(crop.minPrice),
            maxPrice: crop.maxPrice !== null && crop.maxPrice !== undefined ? String(crop.maxPrice) : "",
            isActive: crop.isActive,
          };
          return acc;
        }, {}),
      );
      setError("");
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load crop management data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCropManagement();
  }, [loadCropManagement]);

  const overviewMap = useMemo(
    () => new Map(overview.map((entry) => [entry.crop.toLowerCase(), entry])),
    [overview],
  );

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((entry) => {
      const overviewEntry = overviewMap.get(entry.crop.toLowerCase());
      return (
        entry.crop.toLowerCase().includes(query) ||
        (entry.cropHi || "").toLowerCase().includes(query) ||
        (entry.category || "").toLowerCase().includes(query) ||
        overviewEntry?.prices.some((price) => price.mandi.toLowerCase().includes(query))
      );
    });
  }, [catalog, overviewMap, search]);

  const belowBaselineCount = useMemo(
    () =>
      overview.reduce((count, entry) => {
        if (entry.minPrice === null || entry.minPrice === undefined) return count;
        return count + (entry.prices.some((price) => price.price < entry.minPrice!) ? 1 : 0);
      }, 0),
    [overview],
  );

  const handleCreateCrop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      await priceApi.createCatalog(token, buildCatalogPayload(form));
      await loadCropManagement();
      setForm(initialForm);
      setSuccess("Crop added to admin catalog and managers notified.");
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : "Failed to create crop");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveCrop = async (id: string) => {
    if (!token) return;
    const draft = drafts[id];
    if (!draft) return;

    try {
      setSavingId(id);
      setError("");
      setSuccess("");
      await priceApi.updateCatalog(token, id, buildCatalogPayload(draft));
      await loadCropManagement();
      setSuccess("Crop catalog updated and managers notified.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update crop");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCrop = async (entry: CropCatalogData) => {
    if (!token) return;
    const confirmed = window.confirm(`Delete ${entry.crop} from the admin catalog? This will remove live mandi prices for this crop and notify managers.`);
    if (!confirmed) return;

    try {
      setSavingId(entry.id);
      setError("");
      setSuccess("");
      await priceApi.deleteCatalog(token, entry.id);
      await loadCropManagement();
      setSuccess("Crop removed from admin catalog and managers notified.");
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete crop");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Crop Management</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Add crops, configure baseline pricing, and review how mandi prices compare across the network.</p>
      </motion.div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Catalog crops</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{catalog.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Active crops</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{catalog.filter((entry) => entry.isActive).length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Below baseline alerts</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{belowBaselineCount}</p>
        </div>
      </div>

      <form onSubmit={handleCreateCrop} className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add crop to admin catalog</h2>
            <p className="text-xs text-neutral-500">Managers will receive email and in-app notifications when you add a new crop or update its baseline.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.crop} onChange={(e) => setForm((current) => ({ ...current, crop: e.target.value }))} required placeholder="Crop name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          <input value={form.cropHi} onChange={(e) => setForm((current) => ({ ...current, cropHi: e.target.value }))} placeholder="Hindi crop name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          <input value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} placeholder="Category" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          <select value={form.unit} onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value as CropFormState["unit"] }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
            <option value="kg">kg</option>
            <option value="quintal">quintal</option>
            <option value="ton">ton</option>
          </select>
          <input value={form.minPrice} onChange={(e) => setForm((current) => ({ ...current, minPrice: e.target.value }))} required type="number" min="0" placeholder="Minimum baseline" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          <input value={form.maxPrice} onChange={(e) => setForm((current) => ({ ...current, maxPrice: e.target.value }))} type="number" min="0" placeholder="Maximum baseline (optional)" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          <label className="md:col-span-3 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
            Make this crop immediately active for managers
          </label>
        </div>
        <button type="submit" disabled={creating} className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {creating ? "Adding crop..." : "Add crop"}
        </button>
      </form>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by crop, category, or mandi..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="space-y-4">
        {filteredCatalog.map((entry, index) => {
          const draft = drafts[entry.id] || initialForm;
          const cropOverview = overviewMap.get(entry.crop.toLowerCase());
          return (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{entry.crop}</h3>
                    <span className="text-xs text-neutral-400">/{entry.unit}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${entry.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}>{entry.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">Category: {entry.category || "general"} {entry.cropHi ? `· Hindi: ${entry.cropHi}` : ""}</p>
                  <p className="mt-1 text-sm text-neutral-500">Baselines: {currencyFormatter.format(entry.minPrice)} {entry.maxPrice ? `to ${currencyFormatter.format(entry.maxPrice)}` : "minimum only"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void handleSaveCrop(entry.id)} disabled={savingId === entry.id} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
                    {savingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save crop changes
                  </button>
                  <button type="button" onClick={() => void handleDeleteCrop(entry)} disabled={savingId === entry.id} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50">
                    {savingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete crop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1.4fr] gap-0">
                <div className="p-5 border-b xl:border-b-0 xl:border-r border-[var(--border)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={draft.crop} onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, crop: e.target.value } }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    <input value={draft.cropHi} onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, cropHi: e.target.value } }))} placeholder="Hindi crop name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    <input value={draft.category} onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, category: e.target.value } }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    <select value={draft.unit} onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, unit: e.target.value as CropFormState["unit"] } }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="ton">ton</option>
                    </select>
                    <input value={draft.minPrice} type="number" min="0" onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, minPrice: e.target.value } }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    <input value={draft.maxPrice} type="number" min="0" onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, maxPrice: e.target.value } }))} placeholder="Max baseline" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <input type="checkbox" checked={draft.isActive} onChange={(e) => setDrafts((current) => ({ ...current, [entry.id]: { ...draft, isActive: e.target.checked } }))} />
                    Crop active for mandi managers
                  </label>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Live mandi prices</h4>
                    <span className="text-xs text-neutral-500">{cropOverview?.prices.length || 0} mandis</span>
                  </div>
                  {cropOverview?.prices.length ? (
                    <div className="space-y-2">
                      {cropOverview.prices.map((price) => {
                        const change = price.price - price.prevPrice;
                        const pct = price.prevPrice > 0 ? ((change / price.prevPrice) * 100).toFixed(1) : "0.0";
                        const isBelowBaseline = cropOverview.minPrice !== null && cropOverview.minPrice !== undefined && price.price < cropOverview.minPrice;
                        return (
                          <div key={`${entry.id}-${price.mandiId || price.mandi}`} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {price.mandi}</span>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-sm font-semibold text-neutral-900 dark:text-white">₹{price.price.toLocaleString()}</span>
                                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                                  {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {change >= 0 ? "+" : ""}{pct}%
                                </span>
                              </div>
                              {isBelowBaseline ? <p className="text-[10px] text-red-500">Below baseline</p> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-neutral-500">No mandi prices created for this crop yet.</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filteredCatalog.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-neutral-900 px-6 py-12 text-center text-sm text-neutral-500">
            No crops match your search.
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Notification policy</p>
          <p className="mt-0.5 text-xs">Managers receive email and in-app alerts when you add or update crop baselines. Farmers receive email and in-app alerts whenever mandi managers update live crop prices.</p>
        </div>
      </div>
    </div>
  );
}
