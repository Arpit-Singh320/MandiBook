"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  User,
  Phone,
  MapPin,
  Globe,
  Edit3,
  Save,
  Wheat,
  CalendarCheck,
  TrendingUp,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { bookingApi, mandiApi, userApi, type BookingData, type MandiData } from "@/lib/data-api";
import type { Farmer } from "@/lib/types";

type ProfileTab = "profile" | "bookings" | "preferences";

interface ProfileFormState {
  name: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  landHolding: string;
  farmSize: string;
  crops: string[];
  preferredMandis: string[];
  priceAlertCrops: string[];
  language: "en" | "hi";
}

const createFormState = (farmerUser: Farmer | null, fallbackName: string, fallbackLanguage: "en" | "hi"): ProfileFormState => ({
  name: farmerUser?.name || fallbackName,
  village: farmerUser?.village || "",
  district: farmerUser?.district || "",
  state: farmerUser?.state || "",
  pincode: farmerUser?.pincode || "",
  landHolding: typeof farmerUser?.landHolding === "number" ? String(farmerUser.landHolding) : "",
  farmSize: farmerUser?.farmSize || "",
  crops: farmerUser?.crops || [],
  preferredMandis: farmerUser?.preferredMandis || [],
  priceAlertCrops: farmerUser?.priceAlertCrops || [],
  language: farmerUser?.language || fallbackLanguage,
});

export default function ProfilePage() {
  const { user, token, refreshMe } = useAuth();
  const farmerUser = user?.role === "farmer" ? (user as Farmer) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [mandis, setMandis] = useState<MandiData[]>([]);
  const [form, setForm] = useState<ProfileFormState>(() => createFormState(farmerUser, user?.name || "", user?.language || "en"));

  useEffect(() => {
    setForm(createFormState(farmerUser, user?.name || "", user?.language || "en"));
  }, [farmerUser, user]);

  useEffect(() => {
    if (!token) return;

    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingResponse, mandiResponse] = await Promise.all([
          bookingApi.myBookings(token),
          mandiApi.list(),
        ]);
        setBookings(bookingResponse.data);
        setMandis(mandiResponse.data);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [token]);

  const preferredMandiDetails = useMemo(() => {
    return mandis.filter((mandi) => form.preferredMandis.includes(mandi.id));
  }, [form.preferredMandis, mandis]);

  const availableCrops = useMemo(() => {
    const cropSet = new Set<string>();
    mandis.forEach((mandi) => mandi.crops.forEach((crop: string) => cropSet.add(crop)));
    form.crops.forEach((crop: string) => cropSet.add(crop));
    form.priceAlertCrops.forEach((crop: string) => cropSet.add(crop));
    return Array.from(cropSet).sort((left, right) => left.localeCompare(right));
  }, [form.crops, form.priceAlertCrops, mandis]);

  const stats = [
    { label: "Total Bookings", value: String(bookings.length) },
    { label: "Crops Tracked", value: String(form.crops.length) },
  ];

  const handleToggleCrop = (crop: string, field: "crops" | "priceAlertCrops") => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(crop)
        ? prev[field].filter((item: string) => item !== crop)
        : [...prev[field], crop],
    }));
  };

  const handleToggleMandi = (mandiId: string) => {
    setForm((prev) => ({
      ...prev,
      preferredMandis: prev.preferredMandis.includes(mandiId)
        ? prev.preferredMandis.filter((id: string) => id !== mandiId)
        : [...prev.preferredMandis, mandiId],
    }));
  };

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        crops: form.crops,
        preferredMandis: form.preferredMandis,
        priceAlertCrops: form.priceAlertCrops,
        language: form.language,
      };

      if (form.village.trim()) payload.village = form.village.trim();
      if (form.district.trim()) payload.district = form.district.trim();
      if (form.state.trim()) payload.state = form.state.trim();
      if (form.pincode.trim()) payload.pincode = form.pincode.trim();
      if (form.farmSize.trim()) payload.farmSize = form.farmSize.trim();
      if (form.landHolding.trim()) payload.landHolding = Number(form.landHolding);

      await userApi.updateProfile(token, payload);
      await refreshMe();
      setSuccessMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (saveError: unknown) {
      setError(saveError instanceof ApiError ? saveError.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300">
            {successMessage}
          </div>
        ) : null}

        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 p-2">
          {/* Header with Green Gradient */}
          <div className="relative h-32 sm:h-36 rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 dark:from-green-600 dark:via-green-700 dark:to-green-800 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 L1000,0 L0,0 Z" fill="white" fillOpacity="0.3" />
              </svg>
            </div>
            <div className="absolute top-4 right-4">
              <button
                onClick={() => (isEditing ? void handleSave() : setIsEditing(true))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
              >
                {isEditing ? <><Save className="w-3 h-3" /> {saving ? "Saving..." : "Save"}</> : <><Edit3 className="w-3 h-3" /> Edit</>}
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="relative px-4 sm:px-5 pb-5">
            {/* Avatar + Stats Row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-neutral-900 p-1.5 shadow-lg">
                  <div className="w-full h-full rounded-full bg-green-700 flex items-center justify-center text-white text-3xl font-bold">
                    {(form.name || user?.name || "F").charAt(0).toUpperCase()}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-4 sm:gap-6"
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-neutral-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Name & Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  {form.name || user?.name || "Farmer"}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium w-fit">
                  <Wheat className="w-3 h-3" /> Farmer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-500">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user?.phone ? `+91 ${user.phone}` : user?.email || "No contact added"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[form.village, form.district].filter(Boolean).join(", ") || "Location pending"}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> {user?.profileComplete ? "Verified" : "Profile pending"}</span>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="border-b border-neutral-200 dark:border-neutral-800 mb-5 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex items-center gap-6 min-w-max">
                {[
                  { id: "profile" as const, label: "Profile" },
                  { id: "bookings" as const, label: "Booking History" },
                  { id: "preferences" as const, label: "Preferences" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-green-700 text-neutral-900 dark:text-white"
                        : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tab Content */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Personal Info */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-700" /> Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Full Name</label>
                      {isEditing ? (
                        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      ) : (
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{form.name || "Not provided"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Contact</label>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{user?.phone ? `+91 ${user.phone}` : user?.email || "Not available"}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-700" /> Location
                  </h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input value={form.village} onChange={(e) => setForm((prev) => ({ ...prev, village: e.target.value }))} placeholder="Village" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.district} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} placeholder="District" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                        <input value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} placeholder="State" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={form.pincode} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))} placeholder="Pincode" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                        <input value={form.landHolding} onChange={(e) => setForm((prev) => ({ ...prev, landHolding: e.target.value }))} placeholder="Land holding (acres)" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      </div>
                      <input value={form.farmSize} onChange={(e) => setForm((prev) => ({ ...prev, farmSize: e.target.value }))} placeholder="Farm size category" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{[form.village, form.district, form.state, form.pincode].filter(Boolean).join(", ") || "No location information added yet."}</p>
                  )}
                </div>

                {/* Preferred Mandis */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                    Preferred Mandis
                  </h3>
                  <div className="space-y-2">
                    {preferredMandiDetails.map((mandi) => (
                      <div key={mandi.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white dark:bg-neutral-800">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-green-700" /> {mandi.name}, {mandi.city}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {mandi.rating}
                          </span>
                          {isEditing ? <button onClick={() => handleToggleMandi(mandi.id)} className="text-xs text-red-500 hover:underline">Remove</button> : null}
                        </div>
                      </div>
                    ))}
                    {preferredMandiDetails.length === 0 ? <p className="text-sm text-neutral-500">No preferred mandis selected yet.</p> : null}
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {mandis.map((mandi) => (
                          <button
                            key={mandi.id}
                            onClick={() => handleToggleMandi(mandi.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              form.preferredMandis.includes(mandi.id)
                                ? "border-green-600 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-300"
                                : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                            }`}
                          >
                            {mandi.name} · {mandi.city}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Crops */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                    My Crops
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(form.crops.length > 0 ? form.crops : ["No crops selected"]).map((crop) => (
                      <span key={crop} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                        {crop}
                      </span>
                    ))}
                  </div>
                  {isEditing ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableCrops.map((crop) => (
                        <button
                          key={crop}
                          onClick={() => handleToggleCrop(crop, "crops")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            form.crops.includes(crop)
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {bookings.length === 0 ? (
                  <div className="rounded-xl bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-800/50">
                    No booking history yet.
                  </div>
                ) : bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{booking.Mandi?.name || booking.mandi?.name || "Mandi"}</p>
                        <p className="text-xs text-neutral-500">{booking.date} · {booking.cropType} · {booking.estimatedQuantity} Q</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      booking.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : booking.status === "cancelled"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Language */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-700" /> Language
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, language: "en" }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.language === "en"
                          ? "bg-green-700 text-white"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, language: "hi" }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.language === "hi"
                          ? "bg-green-700 text-white"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                {/* Price Alerts */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-700" /> Price Alerts
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">Get notified when crop prices change at your preferred mandis</p>
                  <div className="flex flex-wrap gap-2">
                    {form.priceAlertCrops.map((crop) => (
                      <span key={crop} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {crop}
                      </span>
                    ))}
                    {form.priceAlertCrops.length === 0 ? <span className="text-xs text-neutral-500">No price alerts configured.</span> : null}
                  </div>
                  {isEditing ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableCrops.map((crop) => (
                        <button
                          key={crop}
                          onClick={() => handleToggleCrop(crop, "priceAlertCrops")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            form.priceAlertCrops.includes(crop)
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
