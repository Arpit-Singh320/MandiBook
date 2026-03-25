"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { slotApi, type SlotData } from "@/lib/data-api";

function todayKey() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function buildLabel(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}

export default function SlotManagementPage() {
  const { token, user } = useAuth();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("08:00");
  const [newCapacity, setNewCapacity] = useState("12");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSlotId, setActionSlotId] = useState<string | null>(null);

  useEffect(() => {
    const mandiId = user?.mandiId;
    if (!mandiId) return;

    const load = async () => {
      try {
        setLoading(true);
        const response = await slotApi.list({ mandiId, date: selectedDate });
        setSlots(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load slots");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedDate, user?.mandiId]);

  const totalCapacity = useMemo(() => slots.filter((s) => s.isActive).reduce((sum, s) => sum + s.capacity, 0), [slots]);
  const totalBooked = useMemo(() => slots.filter((s) => s.isActive).reduce((sum, s) => sum + s.bookedCount, 0), [slots]);

  const toggleSlot = async (id: string) => {
    if (!token) return;
    try {
      setActionSlotId(id);
      const response = await slotApi.toggle(token, id);
      setSlots((prev) => prev.map((slot) => slot.id === id ? response.data : slot));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update slot status");
    } finally {
      setActionSlotId(null);
    }
  };

  const addSlot = async () => {
    const mandiId = user?.mandiId;
    if (!token || !mandiId) return;
    try {
      setError("");
      const response = await slotApi.create(token, {
        mandiId,
        date: selectedDate,
        startTime,
        endTime,
        label: buildLabel(startTime, endTime),
        capacity: parseInt(newCapacity, 10),
      });
      setSlots((prev) => [...prev, response.data].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setStartTime("06:00");
      setEndTime("08:00");
      setNewCapacity("12");
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create slot");
    }
  };

  const deleteSlot = async (id: string) => {
    if (!token) return;
    try {
      setActionSlotId(id);
      await slotApi.delete(token, id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete slot");
    } finally {
      setActionSlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (error && slots.length === 0) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Slot Management
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Configure time slots and capacity for your mandi
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Slot</span>
          </button>
        </div>
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6">
        <label className="block text-xs text-neutral-500 mb-1">Slot Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{slots.filter((s) => s.isActive).length}</p>
          <p className="text-xs text-neutral-500">Active Slots</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">{totalCapacity}</p>
          <p className="text-xs text-neutral-500">Total Capacity</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalBooked}</p>
          <p className="text-xs text-neutral-500">Booked</p>
        </div>
      </div>

      {/* Add Slot Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-5 mb-6"
        >
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">
            Add New Slot
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Capacity</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="e.g. 12"
                min={1}
                max={12}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addSlot}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Slot List */}
      <div className="space-y-3">
        {slots.map((slot, index) => {
          const occupancy = slot.capacity > 0 ? (slot.bookedCount / slot.capacity) * 100 : 0;
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5 ${
                !slot.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {slot.label}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {slot.bookedCount} / {slot.capacity} booked
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleSlot(slot.id)}
                    disabled={actionSlotId === slot.id}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title={slot.isActive ? "Deactivate" : "Activate"}
                  >
                    {slot.isActive ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-neutral-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSlot(slot.id)}
                    disabled={actionSlotId === slot.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    occupancy >= 90
                      ? "bg-red-500"
                      : occupancy >= 70
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 text-right">
                {occupancy.toFixed(0)}% occupied
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
