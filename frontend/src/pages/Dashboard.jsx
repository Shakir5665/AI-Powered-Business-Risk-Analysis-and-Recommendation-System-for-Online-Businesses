import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  ScanSearch,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Clock,
  Package,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { historyAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_BADGE = {
  VERY_LOW:  { label: "Very Low Risk", bg: "bg-emerald-100 border border-emerald-300", text: "text-emerald-900 font-bold", dot: "bg-emerald-600" },
  LOW:       { label: "Low Risk",      bg: "bg-green-100 border border-green-300",     text: "text-green-900 font-bold",   dot: "bg-green-600"   },
  MEDIUM:    { label: "Moderate Risk", bg: "bg-amber-100 border border-amber-300",     text: "text-amber-950 font-bold",   dot: "bg-amber-600"   },
  HIGH:      { label: "High Risk",     bg: "bg-orange-100 border border-orange-300",   text: "text-orange-950 font-bold",  dot: "bg-orange-600"  },
  CRITICAL:  { label: "Critical Risk", bg: "bg-red-100 border border-red-300",         text: "text-red-950 font-bold",     dot: "bg-red-600"     },
};

function RiskBadge({ level }) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  const cfg = RISK_BADGE[key] || { label: level || "Unknown", bg: "bg-slate-100 border border-slate-300", text: "text-slate-800 font-bold", dot: "bg-slate-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow-xs ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

function BriScore({ score }) {
  const s = parseFloat(score || 0);
  const color =
    s < 20 ? "#059669" :
    s < 40 ? "#16a34a" :
    s < 60 ? "#d97706" :
    s < 80 ? "#ea580c" : "#dc2626";

  const assessment =
    s < 20 ? "Safe" :
    s < 40 ? "Low Risk" :
    s < 60 ? "Moderate" :
    s < 80 ? "High Risk" : "Critical";

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-baseline gap-1">
        <span className="font-extrabold text-base sm:text-lg" style={{ color }}>
          {s.toFixed(1)}
        </span>
        <span className="text-xs text-slate-500 font-medium">/ 100</span>
      </div>
      <span className="text-[11px] font-semibold text-slate-600">
        {assessment}
      </span>
    </div>
  );
}

function MetricPill({ score }) {
  const num = parseFloat(score || 0);
  // Scale is 0 to 10 where higher is more risk
  const isGood = num < 3.5;
  const isMed = num >= 3.5 && num < 6.5;

  const bg = isGood ? "bg-emerald-50 text-emerald-800 border-emerald-200" : isMed ? "bg-amber-50 text-amber-900 border-amber-200" : "bg-red-50 text-red-900 border-red-200";
  const label = isGood ? "Healthy" : isMed ? "Moderate" : "High Risk";

  return (
    <div className="inline-flex flex-col">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-slate-800">{num.toFixed(1)}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${bg}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Card fade-in animation ────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await historyAPI.getHistory({ limit: 6, page: 1, sort_by: "created_at", order: "desc" });
        const data = res.data?.data;
        setHistory(data?.items || []);
        setPagination(data?.pagination || null);
      } catch {
        setError("Could not load previous analyses. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalAnalyses = pagination?.totalItems ?? history.length;
  const avgBri = history.length
    ? (history.reduce((sum, h) => sum + (h.businessRiskIndex || 0), 0) / history.length).toFixed(1)
    : "—";
  const latestRisk = history[0]?.businessRiskLevel || "—";
  const platforms = [...new Set(history.map((h) => h.platform || "Daraz"))];

  const STATS = [
    {
      label: "Total Analyses",
      subtitle: "Products scanned",
      value: totalAnalyses,
      icon: BarChart2,
      color: "#16a34a",
    },
    {
      label: "Average Risk",
      subtitle: "Lower is safer (0–100)",
      value: avgBri !== "—" ? `${avgBri} / 100` : "—",
      icon: TrendingUp,
      color: "#ea580c",
    },
    {
      label: "Latest Status",
      subtitle: "Most recent analysis",
      value: latestRisk,
      icon: ShieldAlert,
      color: "#dc2626",
      isRisk: true,
    },
    {
      label: "Marketplaces",
      subtitle: "Platforms analyzed",
      value: platforms.length ? `${platforms.length} Platforms` : "—",
      icon: Package,
      color: "#4f46e5",
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6 max-w-[1240px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Welcome Banner ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md"
        style={{ background: "linear-gradient(135deg, #042718 0%, #063b25 100%)" }}
      >
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#198F38]/20 translate-x-20 -translate-y-20 pointer-events-none blur-2xl" />
        <div className="absolute bottom-0 right-32 w-36 h-36 rounded-full bg-white/10 pointer-events-none blur-xl" />

        <div className="relative z-10">
          <p className="text-emerald-300 font-semibold text-sm mb-1 uppercase tracking-wider">
            {greeting}
          </p>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
            Welcome back,{" "}
            <span className="text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4">
              {user?.username || "Business Owner"}
            </span>
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
            Analyze any product link to detect customer complaints, quality issues, and seller risks.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/analyze")}
          className="relative z-10 flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#198F38] text-white font-semibold text-sm hover:bg-[#1aac44] shadow-lg shadow-[#198F38]/30 transition-all shrink-0 cursor-pointer"
        >
          <ScanSearch size={18} />
          Analyze Product
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(0.05 * i + 0.1)}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: stat.color + "18" }}
              >
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-0.5">
              {stat.label}
            </p>
            <p className="text-slate-500 text-[11px] mb-2 font-medium">
              {stat.subtitle}
            </p>
            {stat.isRisk && stat.value !== "—" ? (
              <div className="mt-1">
                <RiskBadge level={stat.value} />
              </div>
            ) : (
              <p className="text-slate-900 text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                {stat.value}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Plain-English Guide Banner for Non-Technical Users ── */}
      {showGuide && (
        <motion.div
          {...fadeUp(0.2)}
          className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <Info size={20} />
            </div>
            <div>
              <h4 className="text-emerald-950 font-bold text-sm sm:text-base">
                Risk Score Guide
              </h4>
              <p className="text-emerald-900/85 text-xs sm:text-sm mt-1 leading-relaxed">
                Scores range from <strong>0 (Safe)</strong> to <strong>100 (Critical Risk)</strong>:
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2.5 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> 0–40: Low Risk
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> 41–60: Moderate Risk
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-950 border border-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> 61–100: High Risk
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="text-emerald-800 hover:text-emerald-950 text-xs font-semibold underline shrink-0 self-end md:self-center cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ── Recent Analyses ── */}
      <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-emerald-700" />
            <h3 className="text-slate-900 font-bold text-base sm:text-lg" style={{ fontFamily: "'Onest', sans-serif" }}>
              Recent Analyses
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full ml-1">
              Latest {history.length}
            </span>
          </div>
          <button
            onClick={() => navigate("/history")}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 text-sm font-bold transition-colors cursor-pointer"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center text-red-700 font-medium text-sm bg-red-50/50">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <ScanSearch size={28} className="text-emerald-700" />
            </div>
            <p className="text-slate-900 text-lg font-bold">No Products Checked Yet</p>
            <p className="text-slate-600 text-sm text-center max-w-sm">
              Paste your first product link to see detailed risk ratings, customer complaint areas, and actionable advice here.
            </p>
            <button
              onClick={() => navigate("/analyze")}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#042718] text-white text-sm font-semibold hover:bg-[#063b25] transition-colors cursor-pointer shadow-sm"
            >
              Analyze Your First Product
            </button>
          </div>
        )}

        {/* Table — desktop */}
        {!loading && !error && history.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200">
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Safety Status
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Reviews Scanned
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Quality Risk
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Delivery Risk
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Seller Trust
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider">
                      Checked On
                    </th>
                    <th className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider text-right">
                      Report
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {history.map((item, idx) => (
                    <motion.tr
                      key={item.analysisId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-[190px] max-w-[240px]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              <Package size={18} className="text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-slate-900 text-sm font-semibold truncate hover:text-emerald-700 transition-colors" title={item.productTitle}>
                              {item.productTitle || "Untitled Product"}
                            </p>
                            <p className="text-slate-600 text-xs font-medium truncate mt-0.5">
                              Store: {item.sellerName || "Marketplace"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* BRI */}
                      <td className="px-4 py-3.5">
                        <BriScore score={item.businessRiskIndex} />
                      </td>

                      {/* Risk */}
                      <td className="px-4 py-3.5">
                        <RiskBadge level={item.businessRiskLevel} />
                      </td>

                      {/* Reviews */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-900 font-bold text-sm">
                          {item.totalReviews ?? 0}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">reviews</span>
                      </td>

                      {/* Quality Risk */}
                      <td className="px-4 py-3.5">
                        <MetricPill score={item.qualityRiskScore} />
                      </td>

                      {/* Delivery Risk */}
                      <td className="px-4 py-3.5">
                        <MetricPill score={item.deliveryRiskScore} />
                      </td>

                      {/* Seller Trust Risk */}
                      <td className="px-4 py-3.5">
                        <MetricPill score={item.trustRiskScore} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          View Details <ExternalLink size={12} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col divide-y divide-slate-200">
              {history.map((item) => (
                <div key={item.analysisId} className="flex flex-col gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <Package size={20} className="text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-bold truncate">{item.productTitle}</p>
                      <p className="text-slate-600 text-xs font-medium">{item.sellerName || "Marketplace"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <BriScore score={item.businessRiskIndex} />
                      <RiskBadge level={item.businessRiskLevel} />
                    </div>
                    <button
                      onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold hover:bg-emerald-200 transition-colors inline-flex items-center gap-1"
                    >
                      View Report <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
