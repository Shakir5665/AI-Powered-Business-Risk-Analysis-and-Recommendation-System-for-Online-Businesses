import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ExternalLink,
  Clock,
  Package,
  Search,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
  Home,
  Zap,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import { historyAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return "";
  } catch { return ""; }
}

function formatCheckedOn(isoString) {
  if (!isoString) return { dateStr: "—", timeStr: "—" };
  const d = new Date(isoString);
  return {
    dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    timeStr: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

const RISK_BADGE = {
  SAFE:     { label: "Safe",          bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  VERY_LOW: { label: "Safe",          bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  LOW:      { label: "Low Risk",      bg: "bg-green-50   text-green-700   border-green-200",   dot: "bg-green-400"   },
  MEDIUM:   { label: "Moderate Risk", bg: "bg-amber-50   text-amber-700   border-amber-200",   dot: "bg-amber-400"   },
  MODERATE: { label: "Moderate Risk", bg: "bg-amber-50   text-amber-700   border-amber-200",   dot: "bg-amber-400"   },
  HIGH:     { label: "High Risk",     bg: "bg-orange-50  text-orange-700  border-orange-200",  dot: "bg-orange-400"  },
  CRITICAL: { label: "Critical",      bg: "bg-red-50     text-red-700     border-red-200",     dot: "bg-red-500"     },
};

function RiskBadge({ level }) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  const cfg = RISK_BADGE[key] || { label: level || "Unknown", bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function getRiskColor(score) {
  const s = parseFloat(score || 0);
  if (s <= 20) return "#059669";
  if (s <= 40) return "#16a34a";
  if (s <= 60) return "#d97706";
  if (s <= 80) return "#ea580c";
  return "#dc2626";
}

function BriScore({ score }) {
  const s = parseFloat(score || 0);
  const color = getRiskColor(s);
  const label = s <= 20 ? "Safe" : s <= 40 ? "Low" : s <= 60 ? "Moderate" : s <= 80 ? "High" : "Critical";
  return (
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline gap-0.5">
        <span className="font-black text-xl tracking-tight" style={{ color }}>{s.toFixed(1)}</span>
        <span className="text-xs text-slate-400 font-semibold">/100</span>
      </div>
      <span className="text-xs font-bold text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

// ── Premium Stat Card ─────────────────────────────────────────────────────────

function StatCard({ stat, index }) {
  return (
    <motion.div
      {...fadeUp(0.05 * index + 0.1)}
      className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
    >
      {/* Accent gradient top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${stat.color}80, ${stat.color})` }}
      />
      {/* Soft background glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl"
        style={{ background: stat.color + "20", transform: "translate(30%, -30%)" }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: `linear-gradient(135deg, ${stat.color}18, ${stat.color}08)`, border: `1px solid ${stat.color}20` }}
        >
          <stat.icon size={22} style={{ color: stat.color }} />
        </div>
        {stat.trend && (
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
            {stat.trend}
          </span>
        )}
      </div>

      <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-0.5">{stat.label}</p>
      <p className="text-slate-400 text-[11px] mb-2">{stat.subtitle}</p>

      {stat.isRisk && stat.value !== "—" ? (
        <div className="mt-1"><RiskBadge level={stat.value} /></div>
      ) : (
        <p
          className="text-slate-900 text-2xl font-black tracking-tight"
          style={{ fontFamily: "'Onest', sans-serif", color: stat.value !== "—" ? "#0f172a" : "#cbd5e1" }}
        >
          {stat.value}
        </p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        if (riskFilter !== "ALL" && item.businessRiskLevel !== riskFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (item.productTitle || "").toLowerCase().includes(q) ||
            (item.sellerName || "").toLowerCase().includes(q);
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

  const totalAnalyses = pagination?.totalItems ?? history.length;
  const avgBri = history.length
    ? (history.reduce((sum, h) => sum + (h.businessRiskIndex || 0), 0) / history.length).toFixed(1)
    : "—";
  const latestRisk = history[0]?.businessRiskLevel || "—";
  const platforms = [...new Set(history.map((h) => h.platform || "Daraz"))];

  const STATS = [
    { label: "Total Scans",    subtitle: "Products analyzed",        value: totalAnalyses,                         icon: BarChart3,   color: "#16a34a", trend: "All time" },
    { label: "Avg. Risk Score",subtitle: "Lower score = safer (0–100)", value: avgBri !== "—" ? `${avgBri}` : "—", icon: TrendingUp,  color: "#ea580c", trend: "0–100 scale" },
    { label: "Latest Status",  subtitle: "Most recent product check", value: latestRisk,                           icon: ShieldCheck, color: "#dc2626", isRisk: true },
    { label: "Marketplaces",   subtitle: "Platforms covered",         value: platforms.length ? `${platforms.length}` : "—", icon: Activity, color: "#7c3aed", trend: platforms[0] || "—" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6 max-w-[1240px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Welcome Banner ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg"
        style={{ background: "linear-gradient(130deg, #042718 0%, #064d2a 55%, #0a6638 100%)" }}
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#198F38]/15 translate-x-24 -translate-y-24 pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 right-40 w-40 h-40 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none" />

        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#198F38]/25 border border-[#4ade80]/20 text-emerald-300 text-xs font-semibold">
              <Zap size={11} className="fill-emerald-400 text-emerald-400" />
              AI-Powered Risk Analysis
            </span>
          </div>
          <p className="text-emerald-300/80 font-medium text-sm mb-1">{greeting} 👋</p>
          <h2 className="text-white text-2xl sm:text-3xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
            Welcome back,{" "}
            <span className="text-[#4ade80]">{user?.username || "Business Owner"}</span>
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-xl leading-relaxed">
            Paste any product link to instantly detect quality issues, shipping risks, and seller trust signals.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
          {/* Home button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/15 hover:text-white transition-all cursor-pointer"
          >
            <Home size={15} />
            Home
          </motion.button>
          {/* Analyze CTA */}
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 8px 25px #198F3845" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/analyze")}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#198F38] text-white font-bold text-sm hover:bg-[#1aac44] shadow-lg shadow-[#198F38]/30 transition-all cursor-pointer"
          >
            <Zap size={16} className="fill-white" />
            Analyze Product
            <ArrowRight size={15} />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
      </div>

      {/* ── Recent Analyses ── */}
      <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#042718] to-[#198F38] flex items-center justify-center shadow-sm">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-base tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                Recent Analyses
              </h3>
              <p className="text-slate-500 text-xs font-medium">Your latest product risk reports</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full ml-1">
              {filteredHistory.length} shown
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#198F38]/20 focus:border-[#198F38] transition-all"
              />
            </div>
            {/* Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={13} className="text-slate-500" />
                {riskFilter === "ALL" ? "Filter" : riskFilter.replace("_", " ")}
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-20">
                  {["ALL", "VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((lvl) => (
                    <button key={lvl} type="button"
                      onClick={() => { setRiskFilter(lvl); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${riskFilter === lvl ? "text-[#198F38] bg-emerald-50/60" : "text-slate-700"}`}
                    >
                      {lvl === "ALL" ? "All Levels" : lvl.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Sort */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {sortOrder === "latest" ? "Latest" : sortOrder === "highest" ? "Highest Risk" : "Lowest Risk"}
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-20">
                  {[{ id: "latest", label: "Latest first" }, { id: "highest", label: "Highest Risk" }, { id: "lowest", label: "Lowest Risk" }].map((s) => (
                    <button key={s.id} type="button"
                      onClick={() => { setSortOrder(s.id); setShowSortDropdown(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${sortOrder === s.id ? "text-[#198F38] bg-emerald-50/60" : "text-slate-700"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/history")}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-[#198F38] text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-2 p-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center text-red-600 font-semibold text-sm bg-red-50/50">{error}</div>
        )}

        {/* Empty State */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200 shadow-sm">
              <BarChart3 size={32} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-slate-900 text-lg font-black mb-1">No Products Checked Yet</p>
              <p className="text-slate-500 text-sm max-w-sm">
                Paste your first product link to see risk ratings, customer complaints, and actionable advice.
              </p>
            </div>
            <button
              onClick={() => navigate("/analyze")}
              className="mt-1 px-6 py-3 rounded-full bg-[#042718] text-white text-sm font-bold hover:bg-[#063b25] transition-colors shadow-sm cursor-pointer"
            >
              Analyze Your First Product
            </button>
          </div>
        )}

        {/* Table — Desktop */}
        {!loading && !error && history.length > 0 && (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {["Product", "Risk Score", "Safety Status", "Reviews", "Checked On", "Report"].map((h, i) => (
                      <th key={h} className={`py-3.5 ${i === 0 ? "pl-6 pr-4" : i === 5 ? "pr-6 pl-4 text-right" : "px-4"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {filteredHistory.map((item, idx) => {
                    const { dateStr, timeStr } = formatCheckedOn(item.createdAt);
                    const relTime = formatRelativeTime(item.createdAt);
                    const prodId = item.analysisId ? `#${item.analysisId.slice(0, 6).toUpperCase()}` : `#A${1040 + idx}`;
                    return (
                      <motion.tr
                        key={item.analysisId || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                      >
                        {/* Product */}
                        <td className="pl-6 pr-4 py-4 align-middle">
                          <div className="flex items-center gap-3.5 min-w-[200px] max-w-[260px]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100 shadow-xs" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                <Package size={18} className="text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-slate-900 text-sm font-bold truncate leading-tight group-hover:text-[#198F38] transition-colors"
                                title={item.productTitle}>
                                {item.productTitle || "Untitled Product"}
                              </p>
                              <p className="text-slate-400 text-xs font-medium truncate mt-0.5">
                                {item.sellerName || "Marketplace"} · {item.platform || "Daraz"}
                              </p>
                              <span className="inline-block mt-1 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                                {prodId}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Risk Score */}
                        <td className="px-4 py-4 align-middle"><BriScore score={item.businessRiskIndex} /></td>
                        {/* Safety Status */}
                        <td className="px-4 py-4 align-middle"><RiskBadge level={item.businessRiskLevel} /></td>
                        {/* Reviews */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-black text-sm">{item.totalReviews ?? 0}</span>
                            <span className="text-slate-400 text-xs">analyzed</span>
                          </div>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-col text-xs">
                            <span className="text-slate-700 font-semibold">{dateStr}</span>
                            <span className="text-slate-400">{timeStr}</span>
                            {relTime && <span className="text-slate-400 text-[10px]">{relTime}</span>}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="pr-6 pl-4 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E6F8EF] hover:bg-[#D1F2E0] text-[#107E44] border border-[#A7E7C5] text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            View Report <ExternalLink size={11} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden flex flex-col divide-y divide-slate-100">
              {filteredHistory.map((item, idx) => {
                const { dateStr, timeStr } = formatCheckedOn(item.createdAt);
                return (
                  <div key={item.analysisId || idx}
                    className="flex flex-col gap-3.5 p-5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => navigate(`/analysis-result/${item.analysisId}`)}>
                    <div className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Package size={22} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-sm font-bold truncate">{item.productTitle}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{item.sellerName || "Marketplace"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div><p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Risk</p><BriScore score={item.businessRiskIndex} /></div>
                      <div><p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Status</p><RiskBadge level={item.businessRiskLevel} /></div>
                      <div><p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Reviews</p><span className="font-black text-slate-900 text-sm">{item.totalReviews ?? 0}</span></div>
                    </div>
                    <div className="flex justify-end pt-1 border-t border-slate-100">
                      <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6F8EF] text-[#107E44] border border-[#A7E7C5] text-xs font-bold">
                        View Report <ExternalLink size={11} />
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
