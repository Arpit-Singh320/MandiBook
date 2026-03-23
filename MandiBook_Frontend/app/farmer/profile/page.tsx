"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, setLanguage } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "bookings" | "preferences">("profile");
  const [name, setName] = useState(user?.name ?? "Ramesh Kumar");
  const [village, setVillage] = useState("Ramnagar");
  const [district, setDistrict] = useState("Varanasi");
  const [state, setState] = useState("Uttar Pradesh");

  const handleSave = () => {
    setIsEditing(false);
  };

  const stats = [
    { label: "Total Bookings", value: "47" },
    { label: "Crops Sold", value: "12" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
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
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
              >
                {isEditing ? <><Save className="w-3 h-3" /> Save</> : <><Edit3 className="w-3 h-3" /> Edit</>}
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
                    {name.charAt(0)}
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
                  {name}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium w-fit">
                  <Wheat className="w-3 h-3" /> Farmer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-500">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 {user?.phone ?? "9876543210"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {village}, {district}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> Verified</span>
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
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      ) : (
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Mobile Number</label>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">+91 {user?.phone ?? "9876543210"}</p>
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
                      <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{village}, {district}, {state}</p>
                  )}
                </div>

                {/* Preferred Mandis */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                    Preferred Mandis
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Azadpur Mandi, Delhi", rating: 4.5 },
                      { name: "Ghazipur Mandi, Delhi", rating: 4.2 },
                    ].map((mandi) => (
                      <div key={mandi.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white dark:bg-neutral-800">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-green-700" /> {mandi.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {mandi.rating}
                          </span>
                          <button className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full mt-1 px-4 py-2.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-sm text-neutral-500 hover:text-green-700 hover:border-green-400 transition-colors">
                      + Add Mandi
                    </button>
                  </div>
                </div>

                {/* Crops */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                    My Crops
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["Wheat", "Rice", "Potato", "Onion", "Mustard"].map((crop) => (
                      <span key={crop} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                        {crop}
                      </span>
                    ))}
                  </div>
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
                {[
                  { date: "18 Mar 2026", mandi: "Azadpur Mandi", crop: "Wheat", qty: "50 Q", status: "Completed" },
                  { date: "15 Mar 2026", mandi: "Ghazipur Mandi", crop: "Potato", qty: "30 Q", status: "Completed" },
                  { date: "10 Mar 2026", mandi: "Azadpur Mandi", crop: "Onion", qty: "25 Q", status: "Cancelled" },
                ].map((booking, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{booking.mandi}</p>
                        <p className="text-xs text-neutral-500">{booking.date} · {booking.crop} · {booking.qty}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      booking.status === "Completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
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
                      onClick={() => setLanguage("en")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        user?.language === "en"
                          ? "bg-green-700 text-white"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage("hi")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        user?.language === "hi"
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
                    {["Wheat", "Rice", "Onion"].map((crop) => (
                      <span key={crop} className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {crop}
                      </span>
                    ))}
                    <button className="px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500 hover:text-green-700 hover:border-green-400 transition-colors">
                      + Add crop
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
