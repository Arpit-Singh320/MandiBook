"use client";

import Image from "next/image";
import { Calendar, MapPin, QrCode, Tractor, Truck } from "lucide-react";
import type { BookingData } from "@/lib/data-api";

const translations = {
  en: {
    title: "Mandi Entry Pass",
    subtitle: "Show this pass at the mandi gate for verification.",
    bookingNumber: "Booking Number",
    mandi: "Mandi",
    date: "Date",
    slot: "Time Slot",
    crop: "Crop",
    quantity: "Estimated Quantity",
    vehicle: "Vehicle Number",
    notProvided: "Not provided",
    quintals: "quintals",
    qrTitle: "Gate Verification QR",
    qrNote: "Scan or present the code at the entry point.",
  },
  hi: {
    title: "मंडी प्रवेश पास",
    subtitle: "सत्यापन के लिए प्रवेश द्वार पर यह पास दिखाएँ।",
    bookingNumber: "बुकिंग नंबर",
    mandi: "मंडी",
    date: "तारीख",
    slot: "समय स्लॉट",
    crop: "फसल",
    quantity: "अनुमानित मात्रा",
    vehicle: "वाहन नंबर",
    notProvided: "उल्लेख नहीं",
    quintals: "क्विंटल",
    qrTitle: "प्रवेश सत्यापन क्यूआर",
    qrNote: "कोड स्कैन करें या प्रवेश बिंदु पर दिखाएँ।",
  },
} as const;

function formatBookingDate(date: string, language: "en" | "hi") {
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function BookingPassCard({
  booking,
  language = "en",
  compact = false,
}: {
  booking: BookingData;
  language?: "en" | "hi";
  compact?: boolean;
}) {
  const copy = translations[language];
  const mandiName = booking.Mandi?.name || booking.mandi?.name || "Mandi";
  const mandiAddress = [booking.mandi?.address, booking.Mandi?.city, booking.mandi?.city].filter(Boolean).join(", ");

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/75">MandiBook</p>
            <h3 className="mt-1 text-lg font-semibold">{copy.title}</h3>
            <p className="mt-1 text-xs text-white/85">{copy.subtitle}</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-white/70">{copy.bookingNumber}</p>
            <p className="text-sm font-semibold">{booking.bookingNumber}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-5 p-5 ${compact ? "lg:grid-cols-1" : "lg:grid-cols-[1.35fr_0.9fr]"}`}>
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--secondary)]/60 px-4 py-3">
            <p className="text-xs font-medium text-neutral-500">{copy.mandi}</p>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">{mandiName}</p>
            {mandiAddress ? (
              <p className="mt-1 text-xs text-neutral-500">{mandiAddress}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                {copy.date}
              </div>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
                {formatBookingDate(booking.date, language)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <MapPin className="h-3.5 w-3.5" />
                {copy.slot}
              </div>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{booking.timeSlot}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <Tractor className="h-3.5 w-3.5" />
                {copy.crop}
              </div>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{booking.cropType}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <Tractor className="h-3.5 w-3.5" />
                {copy.quantity}
              </div>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
                {booking.estimatedQuantity} {copy.quintals}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              <Truck className="h-3.5 w-3.5" />
              {copy.vehicle}
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">
              {booking.vehicleNumber?.trim() ? booking.vehicleNumber : copy.notProvided}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-neutral-50 p-4 text-center dark:bg-neutral-950/40">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <QrCode className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">{copy.qrTitle}</p>
          <p className="mt-1 text-xs text-neutral-500">{copy.qrNote}</p>
          {booking.qrCodeData ? (
            <Image
              src={booking.qrCodeData}
              alt="Booking QR Code"
              width={208}
              height={208}
              unoptimized
              className="mx-auto mt-4 h-52 w-52 rounded-xl bg-white p-3 shadow-sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
