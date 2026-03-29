"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  CalendarDays,
  Clock,
  Wheat,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mandiApi, slotApi, bookingApi, type MandiData, type SlotData, type BookingData } from "@/lib/data-api";
import { BookingPassCard } from "@/components/booking-pass-card";

const hasQrCodeImage = (value?: string) => typeof value === "string" && value.startsWith("data:image/") && value.length > 32;

type Step = 1 | 2 | 3 | 4;

export default function BookSlotPage() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [mandis, setMandis] = useState<MandiData[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingMandis, setLoadingMandis] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const requestedMandiId = searchParams.get("mandiId");

  useEffect(() => {
    mandiApi.list().then((res) => setMandis(res.data)).catch(() => setError("Failed to load mandis")).finally(() => setLoadingMandis(false));
  }, []);

  useEffect(() => {
    if (!requestedMandiId || mandis.length === 0 || selectedMandi) return;
    const matchedMandi = mandis.find((mandi) => mandi.id === requestedMandiId);
    if (!matchedMandi) return;
    setSelectedMandi(matchedMandi.id);
    setStep(2);
  }, [mandis, requestedMandiId, selectedMandi]);

  useEffect(() => {
    if (!selectedMandi || !selectedDate) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot(null);
    slotApi.list({ mandiId: selectedMandi, date: selectedDate })
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedMandi, selectedDate]);

  const selectedMandiData = mandis.find((m) => m.id === selectedMandi);
  const selectedSlotData = slots.find((s) => s.id === selectedSlot);
  const crops = selectedMandiData?.crops || ["Wheat", "Rice", "Potato", "Onion", "Tomato", "Vegetables"];

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedMandi;
      case 2: return !!selectedDate && !!selectedSlot;
      case 3: return !!selectedCrop && !!quantity;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!token || !selectedMandi || !selectedSlot) return;
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        mandiId: selectedMandi,
        slotId: selectedSlot,
        date: selectedDate,
        cropType: selectedCrop,
        estimatedQuantity: parseInt(quantity),
        ...(vehicleNumber ? { vehicleNumber } : {}),
      };
      const res = await bookingApi.create(token, payload);
      setCreatedBooking({
        ...res.data,
        ...(selectedMandiData
          ? {
              mandi: selectedMandiData,
              Mandi: selectedMandiData,
            }
          : {}),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, label: "Select Mandi" },
    { num: 2, label: "Date & Slot" },
    { num: 3, label: "Crop Details" },
    { num: 4, label: "Confirm" },
  ];

  if (createdBooking) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">Booking Confirmed!</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">Your slot has been booked successfully.</p>
          <p className="text-xs text-neutral-500 font-mono mb-6">{createdBooking.bookingNumber}</p>

          {hasQrCodeImage(createdBooking.qrCodeData) ? (
            <div className="mb-6 text-left">
              <BookingPassCard booking={createdBooking} language={user?.language || "en"} compact />
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/farmer/bookings" className="px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 no-underline">View My Bookings</a>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg border border-[var(--border)] text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900">Book Another Slot</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Book a Slot</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Reserve your mandi slot in a few simple steps</p>
      </motion.div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {stepLabels.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s.num ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"}`}>
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s.num ? "text-neutral-900 dark:text-white font-medium" : "text-neutral-500"}`}>{s.label}</span>
            {i < stepLabels.length - 1 && <ChevronRight className="w-4 h-4 text-neutral-400" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--primary)]" /> Select a Mandi
            </h2>
            {loadingMandis ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-green-700" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mandis.map((mandi) => (
                  <button key={mandi.id} onClick={() => setSelectedMandi(mandi.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${selectedMandi === mandi.id ? "border-[var(--primary)] bg-[var(--secondary)] ring-2 ring-[var(--ring)]" : "border-[var(--border)] bg-white dark:bg-neutral-900 hover:border-neutral-400"}`}>
                    <p className="font-semibold text-neutral-900 dark:text-white">{mandi.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">{mandi.city}, {mandi.state}</p>
                    <p className="text-xs text-[var(--primary)] font-medium mt-1">{mandi.crops.length} crops traded</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                <CalendarDays className="w-5 h-5 text-[var(--primary)]" /> Select Date
              </h2>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full sm:w-auto px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[var(--primary)]" /> Select Time Slot
              </h2>
              {loadingSlots ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-green-700" /></div>
              ) : slots.length === 0 && selectedDate ? (
                <p className="text-sm text-neutral-500 py-4">No slots available for this date. Try another date.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const full = slot.bookedCount >= slot.capacity;
                    return (
                      <button key={slot.id} onClick={() => !full && setSelectedSlot(slot.id)} disabled={full || !slot.isActive}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          full || !slot.isActive ? "border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                          : selectedSlot === slot.id ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--primary)] ring-2 ring-[var(--ring)]"
                          : "border-[var(--border)] bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400"
                        }`}>
                        <span>{slot.label}</span>
                        <span className="block text-[10px] mt-0.5 text-neutral-400">{slot.capacity - slot.bookedCount} left</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Wheat className="w-5 h-5 text-[var(--primary)]" /> Crop Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">Crop Type</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                <option value="">Select a crop</option>
                {crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">Estimated Quantity (Quintals)</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 50" min={1}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">Vehicle Number (optional)</label>
              <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="e.g. UP32AB1234"
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[var(--primary)]" /> Confirm Booking
            </h2>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {[
                { label: "Mandi", value: selectedMandiData?.name ?? "" },
                { label: "Date", value: selectedDate },
                { label: "Time Slot", value: selectedSlotData?.label ?? "" },
                { label: "Crop", value: selectedCrop },
                { label: "Quantity", value: `${quantity} Quintals` },
                ...(vehicleNumber ? [{ label: "Vehicle", value: vehicleNumber }] : []),
              ].map((item) => (
                <div key={item.label} className="flex justify-between px-5 py-3">
                  <span className="text-sm text-neutral-500">{item.label}</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
        {step > 1 ? (
          <button onClick={() => setStep((s) => (s - 1) as Step)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}
        {step < 4 ? (
          <button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : "Confirm Booking"}
          </button>
        )}
      </div>
    </div>
  );
}
