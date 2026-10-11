import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  ExternalLink, Package, Loader2, AlertCircle, ScanSearch,
  Trash2,
} from "lucide-react";
import { historyAPI } from "../api/endpoints";
import { formatDate } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_BADGE = {
  VERY_LOW: { label: "Very Low Risk", bg: "bg-emerald-100 border border-emerald-300", text: "text-emerald-900 font-bold", dot: "bg-emerald-600" },
  LOW:      { label: "Low Risk",      bg: "bg-green-100 border border-green-300",     text: "text-green-900 font-bold",   dot: "bg-green-600"   },
  MEDIUM:   { label: "Moderate Risk", bg: "bg-amber-100 border border-amber-300",     text: "text-amber-950 font-bold",   dot: "bg-amber-600"   },
  HIGH:     { label: "High Risk",     bg: "bg-orange-100 border border-orange-300",   text: "text-orange-950 font-bold",  dot: "bg-orange-600"  },
  CRITICAL: { label: "Critical Risk", bg: "bg-red-100 border border-red-300",         text: "text-red-950 font-bold",     dot: "bg-red-600"     },
};

function RiskBadge({ level }) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  const cfg = RISK_BADGE[key] || { label: level || "Unknown", bg: "bg-slate-100 border border-slate-300", text: "text-slate-800 font-bold", dot: "bg-slate-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow-xs ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function BriScore({ score }) {
  const s = parseFloat(score || 0);
  const color = s < 20 ? "#059669" : s < 40 ? "#16a34a" : s < 60 ? "#d97706" : s < 80 ? "#ea580c" : "#dc2626";
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-extrabold text-sm" style={{ color }}>{s.toFixed(1)}</span>
      <span className="text-[11px] text-slate-500 font-medium">/ 100</span>
    </div>
  );
}

const RISK_LEVELS = ["ALL", "VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SORT_OPTIONS = [
  { value: "created_at",         label: "Date" },
  { value: "business_risk_index",label: "Risk Score" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, riskFilter, sortBy, order]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 10,
        sort_by: sortBy,
        order,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(riskFilter !== "ALL" ? { risk_level: riskFilter } : {}),
      };
      const res = await historyAPI.getHistory(params);
      const data = res.data?.data;
      setItems(data?.items || []);
      setPagination(data?.pagination || null);
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, riskFilter, sortBy, order]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this analysis record?")) return;
    try {
      await historyAPI.deleteAnalysis(analysisId);
      load();
    } catch {
      // ignore
    }
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="flex flex-col gap-5 max-w-[1200px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-4 flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#042718]/30" />
          <input
            id="historySearch"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#042718]/10 bg-[#F6FDFF] text-[#042718] text-sm placeholder:text-[#042718]/30 outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Risk level filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-[#042718]/40" />
            <select
              id="riskFilter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm outline-none focus:border-[#198F38] cursor-pointer"
            >
              {RISK_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === "ALL" ? "All Risks" : lvl.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm outline-none focus:border-[#198F38] cursor-pointer"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>

          {/* Order toggle */}
          <button
            onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
            className="px-3 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm hover:bg-[#042718]/04 transition-colors font-medium cursor-pointer"
          >
            {order === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </motion.div>

      {/* ── Count ── */}
      {pagination && (
        <p className="text-[#042718]/50 text-sm px-1">
          {pagination.totalItems} {pagination.totalItems === 1 ? "result" : "results"}
        </p>
      )}

      {/* ── Table/Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm overflow-hidden"
      >
        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-[#042718]/04 animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center gap-2 p-10 text-[#042718]/50">
            <AlertCircle size={18} /> <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#198F38]/08 flex items-center justify-center">
              <ScanSearch size={28} className="text-[#198F38]" />
            </div>
            <p className="text-[#042718] font-medium">No analyses found</p>
            <p className="text-[#042718]/50 text-sm">Try adjusting your filters or start a new analysis.</p>
            <button onClick={() => navigate("/analyze")}
              className="px-5 py-2.5 rounded-full bg-[#042718] text-white text-sm font-medium hover:bg-[#063b25] transition-colors mt-2">
              Analyze Product
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200">
                    {["Product Name", "Risk Score", "Safety Status", "Reviews", "Quality Risk", "Delivery Risk", "Seller Trust", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-slate-800 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <AnimatePresence>
                    {items.map((item, idx) => (
                      <motion.tr
                        key={item.analysisId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-[190px] max-w-[240px]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                <Package size={16} className="text-slate-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-slate-900 text-sm font-semibold truncate hover:text-emerald-700 transition-colors">{item.productTitle}</p>
                              <p className="text-slate-600 text-xs font-medium truncate mt-0.5">{item.sellerName || "Marketplace"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><BriScore score={item.businessRiskIndex} /></td>
                        <td className="px-4 py-3.5"><RiskBadge level={item.businessRiskLevel} /></td>
                        <td className="px-4 py-3.5 text-slate-900 font-bold text-sm">{item.totalReviews}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium text-sm">{parseFloat(item.qualityRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium text-sm">{parseFloat(item.deliveryRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium text-sm">{parseFloat(item.trustRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all"
                              title="View Full Report"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.analysisId, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Delete Analysis"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col divide-y divide-[#042718]/06">
              {items.map((item) => (
                <div
                  key={item.analysisId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F6FDFF] transition-colors cursor-pointer"
                  onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#042718]/08" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#042718]/05 flex items-center justify-center shrink-0">
                      <Package size={18} className="text-[#042718]/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#042718] text-sm font-medium truncate">{item.productTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <BriScore score={item.businessRiskIndex} />
                      <RiskBadge level={item.businessRiskLevel} />
                    </div>
                    <p className="text-[#042718]/40 text-xs mt-0.5">{formatDate(item.createdAt)}</p>
                  </div>
                  <ExternalLink size={14} className="text-[#198F38] shrink-0" />
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-[#042718]/10 text-[#042718]/60 hover:bg-[#042718]/04 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  pageNum === page
                    ? "bg-[#042718] text-white"
                    : "border border-[#042718]/10 text-[#042718]/60 hover:bg-[#042718]/04"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-[#042718]/10 text-[#042718]/60 hover:bg-[#042718]/04 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
