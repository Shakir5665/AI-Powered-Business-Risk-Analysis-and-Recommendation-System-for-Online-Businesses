import React, { useEffect, useState, useMemo } from "react";
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
  Search,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { historyAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return "";
  } catch {
    return "";
  }
}

function formatCheckedOn(isoString) {
  if (!isoString) return { dateStr: "Oct 11, 2026", timeStr: "09:40 AM" };
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { dateStr, timeStr };
}

const RISK_BADGE = {
  SAFE:      { label: "Safe",          bg: "bg-[#D8F8E5] text-[#059669]", dot: "bg-[#00C48C]" },
  VERY_LOW:  { label: "Safe",          bg: "bg-[#D8F8E5] text-[#059669]", dot: "bg-[#00C48C]" },
  LOW:       { label: "Low Risk",      bg: "bg-[#DCFCE7] text-[#16A34A]", dot: "bg-[#00D060]" },
  MEDIUM:    { label: "Moderate Risk", bg: "bg-[#FEF0D4] text-[#B45309]", dot: "bg-[#FFA500]" },
  MODERATE:  { label: "Moderate Risk", bg: "bg-[#FEF0D4] text-[#B45309]", dot: "bg-[#FFA500]" },
  HIGH:      { label: "High Risk",     bg: "bg-[#FFE8DE] text-[#C2410C]", dot: "bg-[#FF7A00]" },
  CRITICAL:  { label: "Critical Risk", bg: "bg-[#FFE4E6] text-[#E11D48]", dot: "bg-[#FF3B30]" },
};

function RiskBadge({ level }) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  const cfg = RISK_BADGE[key] || { label: level || "Unknown", bg: "bg-slate-100 text-slate-800", dot: "bg-slate-500" };
  return (
    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight ${cfg.bg}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

function getRiskColor(score) {
  const s = parseFloat(score || 0);
  if (s <= 20) return "#00C48C";
  if (s <= 40) return "#00D060";
  if (s <= 60) return "#FFA500";
  if (s <= 80) return "#FF7A00";
  return "#FF3B30";
}

function BriScore({ score }) {
  const s = parseFloat(score || 0);
  const color = getRiskColor(s);

  const assessment =
    s <= 20 ? "Safe" :
    s <= 40 ? "Low" :
    s <= 60 ? "Moderate" :
    s <= 80 ? "High" : "Critical";

  return (
    <div className="flex flex-col items-start leading-tight">
      <div className="flex items-baseline gap-0.5">
        <span className="font-extrabold text-lg tracking-tight" style={{ color }}>
          {s.toFixed(1)}
        </span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
      <span className="text-xs font-bold text-slate-700 tracking-tight mt-0.5">
        {assessment}
      </span>
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


  // Recent analyses filtering & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("latest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await historyAPI.getHistory({ limit: 5, page: 1, sort_by: "created_at", order: "desc" });
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

  // ── 5 Latest Analyses (filtered & sorted) ──────────────────────────────────
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        if (riskFilter !== "ALL" && item.businessRiskLevel !== riskFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = (item.productTitle || "").toLowerCase().includes(q);
          const storeMatch = (item.sellerName || "").toLowerCase().includes(q);
          return titleMatch || storeMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "highest") return (b.businessRiskIndex || 0) - (a.businessRiskIndex || 0);
        if (sortOrder === "lowest") return (a.businessRiskIndex || 0) - (b.businessRiskIndex || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, 5);
  }, [history, riskFilter, searchQuery, sortOrder]);

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



      {/* ── Recent Analyses ── */}
      <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Header & Toolbar Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-white border-b border-slate-100">
          {/* Left: Title + Badge + Subtitle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Clock size={18} strokeWidth={2.2} />
              </div>
              <h3 className="text-slate-900 font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                Recent Analyses
              </h3>
              <span className="text-xs bg-[#E6F8EF] text-[#107E44] border border-[#A7E7C5] font-semibold px-2.5 py-0.5 rounded-full">
                Latest {filteredHistory.length}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium pl-10.5">
              Your latest product risk assessments
            </p>
          </div>

          {/* Right: Search + Filter + Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, stores..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <SlidersHorizontal size={14} className="text-slate-500" />
                <span>{riskFilter === "ALL" ? "Filter" : riskFilter.replace("_", " ")}</span>
                <ChevronDown size={14} className="text-slate-400 ml-0.5" />
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-20">
                  {["ALL", "VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => { setRiskFilter(lvl); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${riskFilter === lvl ? "text-emerald-700 font-bold bg-emerald-50/60" : "text-slate-700"}`}
                    >
                      {lvl === "ALL" ? "All Levels" : lvl.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <span>↑↓</span>
                <span>{sortOrder === "latest" ? "Latest first" : sortOrder === "highest" ? "Highest Risk" : "Lowest Risk"}</span>
                <ChevronDown size={14} className="text-slate-400 ml-0.5" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-20">
                  {[
                    { id: "latest", label: "Latest first" },
                    { id: "highest", label: "Highest Risk" },
                    { id: "lowest", label: "Lowest Risk" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSortOrder(s.id); setShowSortDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${sortOrder === s.id ? "text-emerald-700 font-bold bg-emerald-50/60" : "text-slate-700"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="pl-6 pr-4 py-3.5">PRODUCT</th>
                    <th className="px-4 py-3.5">RISK SCORE</th>
                    <th className="px-4 py-3.5">SAFETY STATUS</th>
                    <th className="px-4 py-3.5">REVIEWS</th>
                    <th className="px-4 py-3.5">CHECKED ON</th>
                    <th className="pr-6 pl-4 py-3.5 text-right">REPORT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.map((item, idx) => {
                      const { dateStr, timeStr } = formatCheckedOn(item.createdAt);
                      const relativeTime = formatRelativeTime(item.createdAt);
                      const prodId = item.analysisId ? `#A${item.analysisId.slice(0, 4)}` : `#A${1040 + idx}`;

                      return (
                        <motion.tr
                          key={item.analysisId || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* 1. PRODUCT (Thumbnail + Title + Store + Product ID pill) */}
                          <td className="pl-6 pr-4 py-4.5 align-middle">
                            <div className="flex items-center gap-3.5 min-w-[210px] max-w-[260px]">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/80 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                  <Package size={20} className="text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-slate-900 text-sm font-bold truncate leading-tight group-hover:text-emerald-700 transition-colors" title={item.productTitle}>
                                  {item.productTitle || "Untitled Product"}
                                </p>
                                <p className="text-slate-500 text-xs font-medium truncate mt-0.5">
                                  Store: {item.sellerName || "Marketplace"} · {item.platform || "Daraz"}
                                </p>
                                <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                                  {prodId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. RISK SCORE */}
                          <td className="px-4 py-4.5 align-middle whitespace-nowrap">
                            <BriScore score={item.businessRiskIndex} />
                          </td>

                          {/* 3. SAFETY STATUS */}
                          <td className="px-4 py-4.5 align-middle whitespace-nowrap">
                            <RiskBadge level={item.businessRiskLevel} />
                          </td>

                          {/* 4. REVIEWS */}
                          <td className="px-4 py-4.5 align-middle whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-slate-900 font-extrabold text-sm leading-tight">
                                {item.totalReviews ?? 0}
                              </span>
                              <span className="text-slate-400 text-xs font-medium">
                                reviews scanned
                              </span>
                            </div>
                          </td>

                          {/* 5. CHECKED ON */}
                          <td className="px-4 py-4.5 align-middle whitespace-nowrap text-slate-600 text-xs">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">{dateStr}</span>
                              <span className="text-slate-500 text-[11px] font-medium">{timeStr}</span>
                              {relativeTime && (
                                <span className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                                  <Clock size={11} /> {relativeTime}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 9. REPORT & MORE ACTION */}
                          <td className="pr-6 pl-4 py-4.5 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E6F8EF] hover:bg-[#D1F2E0] text-[#107E44] border border-[#A7E7C5] transition-all text-xs font-bold cursor-pointer shadow-2xs"
                              >
                                <span>View Report</span>
                                <ExternalLink size={12} strokeWidth={2.2} />
                              </button>
                              <button
                                onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Cards */}
            <div className="lg:hidden flex flex-col divide-y divide-slate-100">
              {filteredHistory.map((item, idx) => {
                const { dateStr, timeStr } = formatCheckedOn(item.createdAt);
                const prodId = item.analysisId ? `#A${item.analysisId.slice(0, 4)}` : `#A${1040 + idx}`;

                return (
                  <div key={item.analysisId || idx} className="flex flex-col gap-3.5 p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Package size={22} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-sm font-bold truncate leading-tight">{item.productTitle}</p>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Store: {item.sellerName || "Marketplace"}</p>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          {prodId}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium">Risk Score</span>
                        <BriScore score={item.businessRiskIndex} />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block mb-1">Safety Status</span>
                        <RiskBadge level={item.businessRiskLevel} />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">Reviews</span>
                        <span className="text-slate-900 font-extrabold text-sm">{item.totalReviews ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">Checked On</span>
                        <span className="text-slate-700 text-xs font-semibold">{dateStr} {timeStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E6F8EF] hover:bg-[#D1F2E0] text-[#107E44] border border-[#A7E7C5] text-xs font-bold transition-all"
                      >
                        View Report <ExternalLink size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

