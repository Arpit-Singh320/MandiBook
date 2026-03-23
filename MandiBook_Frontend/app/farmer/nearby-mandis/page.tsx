"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  Phone,
  Star,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { mandiApi, type MandiData } from "@/lib/data-api";

export default function NearbyMandisPage() {
  const [mandis, setMandis] = useState<MandiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandi, setSelectedMandi] = useState<string | null>(null);

  useEffect(() => {
    mandiApi.list()
      .then((res) => setMandis(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Nearby Mandis</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Find APMC mandis and book a slot</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mandis.map((mandi, index) => (
          <motion.div
            key={mandi.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            onClick={() => setSelectedMandi(selectedMandi === mandi.id ? null : mandi.id)}
            className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
              selectedMandi === mandi.id
                ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 ring-1 ring-green-500"
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-green-300 dark:hover:border-green-700"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{mandi.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {mandi.address}, {mandi.city}
                </p>
              </div>
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-semibold">
                {mandi.district}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {mandi.rating}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {mandi.operatingHoursOpen} - {mandi.operatingHoursClose}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {mandi.crops.slice(0, 5).map((crop) => (
                <span key={crop} className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-medium">{crop}</span>
              ))}
              {mandi.crops.length > 5 && (
                <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-[11px]">+{mandi.crops.length - 5}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className={`text-xs font-medium ${mandi.isActive ? "text-green-700 dark:text-green-400" : "text-red-500"}`}>
                {mandi.isActive ? "Open" : "Closed"}
              </span>
              <a href="/farmer/book-slot" onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-xs font-medium transition-colors no-underline">
                Book Slot <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {selectedMandi === mandi.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                {mandi.contactPhone && (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <Phone className="w-3 h-3" /> <span>{mandi.contactPhone}</span>
                  </div>
                )}
                <p className="text-xs text-neutral-500 mt-1">{mandi.state} — {mandi.pincode}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {mandis.length === 0 && <div className="text-center py-12 text-neutral-500">No mandis found.</div>}
    </div>
  );
}
