import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Shield, Sliders, CheckCircle2,
  Store, Mail, Smartphone, Save
} from "lucide-react";
import { toast } from "react-toastify";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [autoFlagCritical, setAutoFlagCritical] = useState(true);
  const [sensitivity, setSensitivity] = useState("balanced");
  const [defaultMarketplace, setDefaultMarketplace] = useState("all");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    toast.success("Preferences saved successfully!");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-slate-900 text-2xl font-bold mb-1" style={{ fontFamily: "'Onest', sans-serif" }}>
          Store & Risk Settings
        </h1>
        <p className="text-slate-600 text-sm font-medium">
          Customize how Riskora AI scans your products and when you receive risk alerts.
        </p>
      </motion.div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* ── Section 1: Alert Notifications ── */}
        <motion.div
          {...fadeUp(0.08)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Bell size={18} className="text-emerald-700" />
            <div>
              <h2 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
                Risk Alerts & Notifications
              </h2>
              <p className="text-slate-600 text-xs font-medium">Choose how you want to be notified of dangerous product issues</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Email on High Risk */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-slate-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-900 text-sm font-bold">Email alerts for High Risk products</p>
                  <p className="text-slate-600 text-xs font-medium mt-0.5">
                    Receive an immediate email if a product score rises into Caution or High Risk (60+).
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Weekly Summary */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3">
                <Smartphone size={18} className="text-slate-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-900 text-sm font-bold">Weekly Store Safety Summary</p>
                  <p className="text-slate-600 text-xs font-medium mt-0.5">
                    A weekly digest summarizing customer feedback trends and score changes across all your products.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>
        </motion.div>

        {/* ── Section 2: AI Risk Sensitivity ── */}
        <motion.div
          {...fadeUp(0.14)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Sliders size={18} className="text-emerald-700" />
            <div>
              <h2 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
                AI Risk Tolerance Mode
              </h2>
              <p className="text-slate-600 text-xs font-medium">Adjust how strictly customer reviews are evaluated for risks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "lenient",
                name: "Relaxed",
                desc: "Flags only major repeated complaints and direct defect issues.",
              },
              {
                id: "balanced",
                name: "Balanced (Recommended)",
                desc: "Standard protection. Detects delivery, quality, and seller issues early.",
              },
              {
                id: "strict",
                name: "Strict / Zero-Tolerance",
                desc: "Highlights minor negative hints so you can keep a pristine 5-star rating.",
              },
            ].map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSensitivity(opt.id)}
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  sensitivity === opt.id
                    ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-bold ${sensitivity === opt.id ? "text-emerald-950" : "text-slate-900"}`}>
                    {opt.name}
                  </span>
                  <input
                    type="radio"
                    name="sensitivity"
                    value={opt.id}
                    checked={sensitivity === opt.id}
                    onChange={() => setSensitivity(opt.id)}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">{opt.desc}</p>
              </label>
            ))}
          </div>
        </motion.div>

        {/* ── Section 3: Marketplace Defaults ── */}
        <motion.div
          {...fadeUp(0.2)}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Store size={18} className="text-emerald-700" />
            <div>
              <h2 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
                Primary Marketplace Platform
              </h2>
              <p className="text-slate-600 text-xs font-medium">Select your primary sales channel to optimize link parsing</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "all", label: "All Platforms" },
              { id: "amazon", label: "Amazon" },
              { id: "flipkart", label: "Flipkart" },
              { id: "shopify", label: "Shopify / Web" },
            ].map((mp) => (
              <button
                type="button"
                key={mp.id}
                onClick={() => setDefaultMarketplace(mp.id)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  defaultMarketplace === mp.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {mp.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Save Button ── */}
        <motion.div {...fadeUp(0.25)} className="flex items-center justify-between pt-2">
          <p className="text-slate-500 text-xs font-medium">
            Changes take effect immediately on your next product scan.
          </p>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? "Saved!" : "Save Preferences"}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
