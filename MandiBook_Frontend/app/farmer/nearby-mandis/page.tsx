"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  Phone,
  Star,
  ChevronRight,
  Loader2,
  LocateFixed,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { mandiApi, type MandiData } from "@/lib/data-api";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="h-[420px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-pulse" />,
});

export default function NearbyMandisPage() {
  const [mandis, setMandis] = useState<MandiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandi, setSelectedMandi] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadMandis = useCallback(async (coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setLocationError("");
    try {
      const response = coords ? await mandiApi.nearby({ ...coords, radius: 50 }) : await mandiApi.nearby();
      setMandis(response.data);
      setSelectedMandi((prev) => prev ?? response.data[0]?.id ?? null);
    } catch {
      setLocationError("Failed to load nearby mandis.");
      setMandis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      void loadMandis();
      return;
    }

    setIsLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);
        void loadMandis(coords);
      },
      () => {
        setIsLocating(false);
        setLocationError("We could not access your location, so showing all active mandis instead.");
        void loadMandis();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, [loadMandis]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const selectedMandiData = mandis.find((mandi) => mandi.id === selectedMandi) || null;

  const distanceLabel = (mandi: MandiData) => {
    if (typeof mandi.distance !== "number") return null;
    return `${mandi.distance.toFixed(1)} km away`;
  };

  const slotsLabel = (mandi: MandiData) => {
    if (typeof mandi.slotsToday !== "number") return null;
    return `${mandi.slotsToday} slots available today`;
  };

  const bookSlotHref = (mandiId: string) => `/farmer/book-slot?mandiId=${mandiId}`;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Nearby Mandis</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Find APMC mandis and book a slot</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          {userLocation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
              <Navigation className="w-4 h-4" /> Using your current location
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              <MapPin className="w-4 h-4" /> Showing all active mandis
            </span>
          )}
          {locationError ? <span className="text-amber-600 dark:text-amber-400">{locationError}</span> : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={detectLocation}
            disabled={isLocating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} Use my location
          </button>
          <button
            onClick={() => void loadMandis(userLocation || undefined)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="h-[420px]">
          <MapView
            mandis={mandis.filter((mandi) => typeof mandi.lat === "number" && typeof mandi.lng === "number").map((mandi) => ({
              id: mandi.id,
              name: mandi.name,
              address: `${mandi.address}, ${mandi.city}`,
              lat: mandi.lat,
              lng: mandi.lng,
              distance: distanceLabel(mandi) || "Distance unavailable",
              slotsToday: mandi.slotsToday || 0,
            }))}
            selectedMandi={selectedMandi}
            onSelectMandi={setSelectedMandi}
            userLocation={userLocation}
          />
        </div>
      </div>

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
              {distanceLabel(mandi) ? (
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> {distanceLabel(mandi)}
                </span>
              ) : null}
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
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-medium ${mandi.isActive ? "text-green-700 dark:text-green-400" : "text-red-500"}`}>
                  {mandi.isActive ? "Open" : "Closed"}
                </span>
                {slotsLabel(mandi) ? <span className="text-[11px] text-neutral-500">{slotsLabel(mandi)}</span> : null}
              </div>
              <a href={bookSlotHref(mandi.id)} onClick={(e) => e.stopPropagation()}
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
                {selectedMandiData?.id === mandi.id && slotsLabel(mandi) ? (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">{slotsLabel(mandi)}</p>
                ) : null}
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
