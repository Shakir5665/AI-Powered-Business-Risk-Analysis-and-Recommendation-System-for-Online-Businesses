import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, AtSign, ShieldCheck, Calendar, Loader2, AlertCircle } from "lucide-react";
import { profileAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/helpers";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

const ROLE_BADGE = {
  seller: { label: "Seller",  bg: "bg-[#198F38]/10", text: "text-[#198F38]" },
  admin:  { label: "Admin",   bg: "bg-purple-50",    text: "text-purple-700" },
  buyer:  { label: "Buyer",   bg: "bg-blue-50",      text: "text-blue-700"   },
};

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await profileAPI.getProfile();
        setProfile(res.data?.data);
      } catch {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Merge auth user as fallback
  const data = profile || authUser || {};

  const initials = (data.username || data.fullName || "U").slice(0, 2).toUpperCase();
  const roleCfg = ROLE_BADGE[String(data.role || "seller").toLowerCase()] || ROLE_BADGE.seller;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={32} className="text-[#198F38]" />
          </motion.div>
          <p className="text-[#042718]/50 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const FIELDS = [
    { icon: User,        label: "Full Name",     value: data.fullName || "—" },
    { icon: AtSign,      label: "Username",       value: data.username || data.email?.split("@")[0] || "—" },
    { icon: Mail,        label: "Email Address",  value: data.email || "—" },
    { icon: Calendar,    label: "Member Since",   value: data.createdAt ? formatDate(data.createdAt) : "—" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Profile Card ── */}
      <motion.div
        {...fadeUp(0)}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm overflow-hidden"
      >
        {/* Header banner */}
        <div
          className="h-28 relative"
          style={{ background: "linear-gradient(135deg, #042718 0%, #063b25 60%, #0a5c35 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/05 translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-32 w-24 h-24 rounded-full bg-[#198F38]/15" />
        </div>

        {/* Avatar + basic info */}
        <div className="px-6 pb-6">
          {/* Avatar (overlaps banner) */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-20 h-20 rounded-2xl bg-[#198F38] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              {initials}
            </motion.div>

            {/* Status + Role */}
            <div className="flex items-center gap-2 mb-1">
              {data.isActive !== false && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleCfg.bg} ${roleCfg.text}`}>
                {roleCfg.label}
              </span>
            </div>
          </div>

          <h2 className="text-[#042718] text-2xl font-semibold mb-0.5" style={{ fontFamily: "'Onest', sans-serif" }}>
            {data.fullName || data.username || "User"}
          </h2>
          <p className="text-[#042718]/50 text-sm">@{data.username || "user"}</p>
        </div>
      </motion.div>

      {/* ── Info Fields ── */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={16} className="text-[#198F38]" />
          <h3 className="text-[#042718] font-semibold" style={{ fontFamily: "'Onest', sans-serif" }}>
            Account Information
          </h3>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-0 divide-y divide-[#042718]/05">
          {FIELDS.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
              className="flex items-center gap-4 py-4"
            >
              <div className="w-9 h-9 rounded-xl bg-[#042718]/04 flex items-center justify-center shrink-0">
                <field.icon size={16} className="text-[#042718]/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#042718]/40 text-xs font-medium mb-0.5">{field.label}</p>
                <p className="text-[#042718] text-sm font-medium truncate">{field.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Note ── */}
      <motion.div
        {...fadeUp(0.25)}
        className="flex items-start gap-3 p-4 rounded-2xl bg-[#042718]/03 border border-[#042718]/06"
      >
        <AlertCircle size={16} className="text-[#042718]/40 mt-0.5 shrink-0" />
        <p className="text-[#042718]/50 text-sm">
          Profile editing is coming soon. Contact your administrator to update account details.
        </p>
      </motion.div>
    </div>
  );
}
