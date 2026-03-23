"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Wheat, MapPin, Sprout, User as UserIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const STATES = [
  "Andhra Pradesh", "Bihar", "Chhattisgarh", "Gujarat", "Haryana",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const CROPS = [
  "Wheat", "Rice", "Maize", "Bajra", "Jowar", "Sugarcane",
  "Cotton", "Soybean", "Mustard", "Groundnut", "Onion",
  "Potato", "Tomato", "Chilli", "Turmeric", "Banana",
];

const FARM_SIZES = ["Small (< 2 acres)", "Medium (2-10 acres)", "Large (10+ acres)"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, completeProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">(user?.language || "hi");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await completeProfile({
        name: name.trim(),
        village: village || undefined,
        district: district || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        farmSize: farmSize || undefined,
        crops: selectedCrops.length > 0 ? selectedCrops : undefined,
        language,
      });
      router.push("/farmer");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-700/10 dark:bg-green-400/10 flex items-center justify-center">
            <Wheat className="w-6 h-6 text-green-700 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Complete Your Profile</h1>
            <p className="text-sm text-neutral-500">Help us personalize your MandiBook experience</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-1.5">
              <UserIcon className="w-4 h-4 inline mr-1.5" />Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-1.5">
              Preferred Language
            </label>
            <div className="flex gap-3">
              {(["en", "hi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    language === lang
                      ? "bg-green-700 text-white border-green-700"
                      : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  {lang === "en" ? "English" : "हिन्दी"}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1.5" />Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village"
                className="px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
                className="px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">Select State</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 6) setPincode(val);
                }}
                placeholder="Pincode"
                maxLength={6}
                className="px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Farm Size */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-1.5">
              <Sprout className="w-4 h-4 inline mr-1.5" />Farm Size
            </label>
            <div className="flex gap-2">
              {FARM_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFarmSize(size)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    farmSize === size
                      ? "bg-green-700 text-white border-green-700"
                      : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Crops */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-1.5">
              Crops You Grow
            </label>
            <div className="flex flex-wrap gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCrops.includes(crop)
                      ? "bg-green-700 text-white border-green-700"
                      : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/farmer")}
              className="flex-1 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 py-3 rounded-lg bg-green-700 text-white font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "Saving..." : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
