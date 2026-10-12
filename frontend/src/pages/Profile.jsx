import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, AtSign, ShieldCheck, Calendar,
  Loader2, AlertCircle, Store, CheckCircle2, Camera, Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import { profileAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/helpers";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

const ROLE_BADGE = {
  seller: { label: "Online Store Seller",  bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900" },
  admin:  { label: "Administrator",        bg: "bg-purple-100",  border: "border-purple-300",  text: "text-purple-900"  },
  buyer:  { label: "Shopper Account",      bg: "bg-blue-100",    border: "border-blue-300",    text: "text-blue-900"    },
};

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await profileAPI.getProfile();
        setProfile(res.data?.data);
      } catch {
        setError("Could not load your profile information. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Merge auth user as fallback
  const data = profile || authUser || {};
  const currentAvatar = authUser?.avatar || data.avatar;

  const initials = (data.fullName || data.username || "U").slice(0, 2).toUpperCase();
  const roleCfg = ROLE_BADGE[String(data.role || "seller").toLowerCase()] || ROLE_BADGE.seller;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (updateUser) {
        updateUser({ avatar: base64 });
      }
      setProfile((prev) => ({ ...(prev || {}), avatar: base64 }));
      toast.success("Profile photo updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (updateUser) {
      updateUser({ avatar: null });
    }
    setProfile((prev) => ({ ...(prev || {}), avatar: null }));
    toast.info("Profile photo removed.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={32} className="text-emerald-700" />
          </motion.div>
          <p className="text-slate-700 font-semibold text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const FIELDS = [
    { icon: User,        label: "Full Name",       value: data.fullName || "Store Owner" },
    { icon: AtSign,      label: "Username / Handle", value: data.username || data.email?.split("@")[0] || "—" },
    { icon: Mail,        label: "Email Address",   value: data.email || "—" },
    { icon: Calendar,    label: "Account Created", value: data.createdAt ? formatDate(data.createdAt) : "Active Member" },
    { icon: Store,       label: "Plan Status",     value: "Standard Riskora AI Protection (Active)" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── Profile Header Card ── */}
      <motion.div
        {...fadeUp(0)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Header banner */}
        <div
          className="h-28 relative"
          style={{ background: "linear-gradient(135deg, #042718 0%, #063b25 60%, #0a5c35 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-32 w-24 h-24 rounded-full bg-emerald-400/20" />
        </div>

        {/* Avatar + basic info: relative z-10 ensures it always renders in front of the banner */}
        <div className="px-6 pb-6 relative z-10">
          {/* Avatar (overlaps banner, positioned in front with z-20) */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative z-20 group">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-24 h-24 rounded-2xl bg-emerald-700 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg overflow-hidden relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={data.fullName || data.username || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800">
                    <User size={34} className="text-white drop-shadow" />
                    <span className="text-[11px] font-bold tracking-wider text-emerald-100 uppercase mt-0.5">
                      {initials}
                    </span>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                  <Camera size={16} />
                </div>
              </motion.div>

              {/* Camera upload badge in front */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 z-30 p-2 rounded-full bg-slate-900 hover:bg-emerald-600 text-white shadow-md border-2 border-white transition-all transform hover:scale-105"
                title="Upload profile photo"
              >
                <Camera size={13} />
              </button>

              {/* Remove photo button if avatar exists */}
              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 z-30 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md border-2 border-white transition-all transform hover:scale-105"
                  title="Remove photo"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            {/* Status + Role */}
            <div className="flex items-center gap-2 mb-1">
              {data.isActive !== false && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  Account Active
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleCfg.bg} ${roleCfg.border} ${roleCfg.text}`}>
                {roleCfg.label}
              </span>
            </div>
          </div>

          <h1 className="text-slate-900 text-2xl font-bold mb-0.5" style={{ fontFamily: "'Onest', sans-serif" }}>
            {data.fullName || data.username || "Store Owner"}
          </h1>
          <p className="text-slate-600 font-medium text-sm">Registered as @{data.username || "user"}</p>
        </div>
      </motion.div>

      {/* ── Account Details ── */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <ShieldCheck size={18} className="text-emerald-700" />
          <h2 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
            Your Store & Account Details
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col divide-y divide-slate-100">
          {FIELDS.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
              className="flex items-center gap-4 py-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <field.icon size={18} className="text-slate-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-0.5">{field.label}</p>
                <p className="text-slate-900 text-sm font-bold truncate">{field.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Info Notice ── */}
      <motion.div
        {...fadeUp(0.2)}
        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200"
      >
        <AlertCircle size={18} className="text-slate-700 mt-0.5 shrink-0" />
        <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
          Click on your profile avatar above to upload or update your custom store photo. Supported formats: JPG, PNG, WebP (up to 2MB).
        </p>
      </motion.div>
    </div>
  );
}
