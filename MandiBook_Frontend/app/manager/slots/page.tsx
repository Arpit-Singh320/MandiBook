"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Plus, Edit3, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Slot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  active: boolean;
}

const initialSlots: Slot[] = [
  { id: "s1", time: "06:00 - 08:00 AM", capacity: 15, booked: 12, active: true },
  { id: "s2", time: "08:00 - 10:00 AM", capacity: 20, booked: 18, active: true },
  { id: "s3", time: "10:00 - 12:00 PM", capacity: 20, booked: 15, active: true },
  { id: "s4", time: "12:00 - 02:00 PM", capacity: 10, booked: 10, active: false },
  { id: "s5", time: "02:00 - 04:00 PM", capacity: 15, booked: 8, active: true },
  { id: "s6", time: "04:00 - 06:00 PM", capacity: 15, booked: 5, active: true },
];

export default function SlotManagementPage() {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newCapacity, setNewCapacity] = useState("");

  const toggleSlot = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const addSlot = () => {
    if (!newTime || !newCapacity) return;
    setSlots((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        time: newTime,
        capacity: parseInt(newCapacity),
        booked: 0,
        active: true,
      },
    ]);
    setNewTime("");
    setNewCapacity("");
    setShowAdd(false);
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const totalCapacity = slots.filter((s) => s.active).reduce((sum, s) => sum + s.capacity, 0);
  const totalBooked = slots.filter((s) => s.active).reduce((sum, s) => sum + s.booked, 0);

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
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Slot</span>
          </button>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{slots.filter((s) => s.active).length}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Time Range</label>
              <input
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="e.g. 06:00 - 08:00 PM"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Capacity</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="e.g. 20"
                min={1}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="flex items-end">
              <button
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
          const occupancy = slot.capacity > 0 ? (slot.booked / slot.capacity) * 100 : 0;
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] p-4 sm:p-5 ${
                !slot.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {slot.time}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {slot.booked} / {slot.capacity} booked
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSlot(slot.id)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title={slot.active ? "Deactivate" : "Activate"}
                  >
                    {slot.active ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-neutral-400" />
                    )}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <Edit3 className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => deleteSlot(slot.id)}
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
