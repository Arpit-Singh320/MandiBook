"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  MapPin,
  LocateFixed,
  Users,
  CalendarCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mandiApi, type MandiData, type MandiStatsResponse } from "@/lib/data-api";

type EnrichedMandi = MandiData & {
  totalFarmers: number;
  todayBookings: number;
  availableSlots: number;
  workingToday: boolean;
};

type MandiFormState = {
  name: string;
  nameHi: string;
  code: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contactPhone: string;
  operatingHoursOpen: string;
  operatingHoursClose: string;
  lat: string;
  lng: string;
};

const numberFormatter = new Intl.NumberFormat("en-IN");

const initialForm: MandiFormState = {
  name: "",
  nameHi: "",
  code: "",
  address: "",
  city: "",
  district: "",
  state: "Madhya Pradesh",
  pincode: "",
  contactPhone: "",
  operatingHoursOpen: "05:00",
  operatingHoursClose: "18:00",
  lat: "",
  lng: "",
};

const buildMandiPayload = (formState: MandiFormState) => {
  const payload: Partial<MandiData> & {
    name: string;
    code: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    operatingHoursOpen: string;
    operatingHoursClose: string;
  } = {
    name: formState.name.trim(),
    code: formState.code.trim().toUpperCase(),
    address: formState.address.trim(),
    city: formState.city.trim(),
    district: formState.district.trim(),
    state: formState.state.trim(),
    pincode: formState.pincode.trim(),
    operatingHoursOpen: formState.operatingHoursOpen,
    operatingHoursClose: formState.operatingHoursClose,
    isActive: true,
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    holidays: [],
    crops: [],
  };

  if (formState.nameHi.trim()) payload.nameHi = formState.nameHi.trim();
  if (formState.contactPhone.trim()) payload.contactPhone = formState.contactPhone.trim();
  if (formState.lat.trim()) payload.lat = Number(formState.lat);
  if (formState.lng.trim()) payload.lng = Number(formState.lng);

  return payload;
};

export function AdminMandisManagement() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mandis, setMandis] = useState<EnrichedMandi[]>([]);
  const [form, setForm] = useState<MandiFormState>(initialForm);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setLoading(true);
        const mandiResponse = await mandiApi.list();
        const statsResponses = await Promise.all(
          mandiResponse.data.map(async (mandi) => {
            try {
              const stats = await mandiApi.stats(mandi.id, token);
              return { mandi, stats: stats.data };
            } catch {
              return {
                mandi,
                stats: {
                  todayBookings: 0,
                  todayCheckedIn: 0,
                  totalFarmers: 0,
                  managerCount: mandi.managerCount || mandi.managers?.length || 0,
                  slotUtilization: 0,
                  availableSlots: 0,
                  workingToday: false,
                  operatingHoursOpen: mandi.operatingHoursOpen,
                  operatingHoursClose: mandi.operatingHoursClose,
                  workingDays: mandi.workingDays || [],
                  crops: mandi.crops || [],
                } as MandiStatsResponse["data"],
              };
            }
          }),
        );

        setMandis(
          statsResponses.map(({ mandi, stats }) => ({
            ...mandi,
            managerCount: stats.managerCount,
            totalFarmers: stats.totalFarmers,
            todayBookings: stats.todayBookings,
            availableSlots: stats.availableSlots,
            workingToday: stats.workingToday,
          })),
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load mandis");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const filtered = useMemo(
    () =>
      mandis.filter((mandi) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query === "" ||
          mandi.name.toLowerCase().includes(query) ||
          mandi.city.toLowerCase().includes(query) ||
          mandi.state.toLowerCase().includes(query) ||
          mandi.code?.toLowerCase().includes(query);
        const matchesActive = showInactive || mandi.isActive;
        return matchesSearch && matchesActive;
      }),
    [mandis, search, showInactive],
  );

  const toggleMandiStatus = async (id: string) => {
    if (!token) return;
    try {
      setError("");
      setSuccess("");
      setTogglingId(id);
      const response = await mandiApi.toggle(token, id);
      setMandis((current) =>
        current.map((mandi) => (mandi.id === id ? { ...mandi, isActive: response.data.isActive } : mandi)),
      );
      setSuccess(response.message || "Mandi status updated");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update mandi status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateMandi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const response = await mandiApi.create(token, buildMandiPayload(form));

      setMandis((current) =>
        [
          {
            ...response.data,
            totalFarmers: 0,
            todayBookings: 0,
            availableSlots: 0,
            workingToday: false,
            managerCount: response.data.managerCount || 0,
            managers: response.data.managers || [],
          },
          ...current,
        ].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm(initialForm);
      setSuccess(response.message || "Mandi created successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create mandi");
    } finally {
      setCreating(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported on this device. Enter latitude and longitude manually or rely on address geocoding.");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setSuccess("Current location captured. You can adjust the coordinates before saving.");
      },
      () => {
        setLocating(false);
        setError("Unable to capture current location. Enter coordinates manually or let the backend geocode the address.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Mandi Management</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Create mandis, monitor operations, and manage active marketplaces from one place.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1.8fr] gap-6">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleCreateMandi}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add new mandi</h2>
              <p className="text-xs text-neutral-500">Create a mandi that admins can immediately manage and assign managers to.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Mandi name" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.nameHi} onChange={(e) => setForm((current) => ({ ...current, nameHi: e.target.value }))} placeholder="Hindi name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))} placeholder="Unique mandi code" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.contactPhone} onChange={(e) => setForm((current) => ({ ...current, contactPhone: e.target.value }))} placeholder="Contact phone" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} placeholder="Address" required className="sm:col-span-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} placeholder="City" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.district} onChange={(e) => setForm((current) => ({ ...current, district: e.target.value }))} placeholder="District" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))} placeholder="State" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.pincode} onChange={(e) => setForm((current) => ({ ...current, pincode: e.target.value }))} placeholder="Pincode" required className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.lat} onChange={(e) => setForm((current) => ({ ...current, lat: e.target.value }))} placeholder="Latitude (optional)" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={form.lng} onChange={(e) => setForm((current) => ({ ...current, lng: e.target.value }))} placeholder="Longitude (optional)" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <button type="button" onClick={handleUseCurrentLocation} disabled={locating} className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              {locating ? "Capturing live location..." : "Use live location for coordinates"}
            </button>
            <p className="sm:col-span-2 text-xs text-neutral-500">Leave latitude and longitude empty to auto-resolve coordinates from the mandi address. If you are at the site, you can capture live location and store exact coordinates for the farmer nearby-mandi map.</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Opening time</label>
              <input type="time" value={form.operatingHoursOpen} onChange={(e) => setForm((current) => ({ ...current, operatingHoursOpen: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Closing time</label>
              <input type="time" value={form.operatingHoursClose} onChange={(e) => setForm((current) => ({ ...current, operatingHoursClose: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
          </div>

          <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {creating ? "Creating mandi..." : "Create mandi"}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Total mandis</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{numberFormatter.format(mandis.length)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Active</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{numberFormatter.format(mandis.filter((entry) => entry.isActive).length)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Managers linked</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{numberFormatter.format(mandis.reduce((sum, entry) => sum + (entry.managerCount || 0), 0))}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, state, or code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowInactive((current) => !current)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${showInactive ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] text-neutral-600 dark:text-neutral-400"}`}
            >
              {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Show inactive
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((mandi) => (
                <div key={mandi.id} className="p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{mandi.name}</h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{mandi.code || "No code"}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${mandi.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                        {mandi.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {mandi.address}, {mandi.city}, {mandi.state}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {mandi.managers?.map((manager) => manager.name).join(", ") || "No managers assigned"}</span>
                      <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {numberFormatter.format(mandi.todayBookings)} today</span>
                      <span>{numberFormatter.format(mandi.totalFarmers)} farmers</span>
                      <span>{numberFormatter.format(mandi.availableSlots)} slots free</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleMandiStatus(mandi.id)}
                    disabled={togglingId === mandi.id}
                    className="w-full lg:w-auto px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {togglingId === mandi.id ? "Updating..." : mandi.isActive ? "Deactivate mandi" : "Activate mandi"}
                  </button>
                </div>
              ))}
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-neutral-500">No mandis match your filters.</div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
