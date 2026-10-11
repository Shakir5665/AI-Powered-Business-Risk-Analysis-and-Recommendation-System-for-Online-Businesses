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
  VERY_LOW: { label: "Very Low",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  LOW:      { label: "Low",       bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
  MEDIUM:   { label: "Medium",    bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-400"  },
  HIGH:     { label: "High",      bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400"  },
  CRITICAL: { label: "Critical",  bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     },
};

function RiskBadge({ level }) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  const cfg = RISK_BADGE[key] || { label: level || "N/A", bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function BriScore({ score }) {
  const s = parseFloat(score || 0);
  const color = s < 20 ? "#10B981" : s < 40 ? "#22C55E" : s < 60 ? "#EAB308" : s < 80 ? "#F97316" : "#EF4444";
  return <span className="font-bold" style={{ color }}>{s.toFixed(1)}</span>;
}

const RISK_LEVELS = ["ALL", "VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SORT_OPTIONS = [
  { value: "created_at",         label: "Date" },
  { value: "business_risk_index",label: "BRI Score" },
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
            placeholder="Search by product title..."
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
                  {lvl === "ALL" ? "All Risk Levels" : lvl.replace("_", " ")}
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
              <option key={s.value} value={s.value}>Sort by {s.label}</option>
            ))}
          </select>

          {/* Order toggle */}
          <button
            onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
            className="px-3 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm hover:bg-[#042718]/04 transition-colors"
          >
            {order === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </motion.div>

      {/* ── Count ── */}
      {pagination && (
        <p className="text-[#042718]/50 text-sm px-1">
          {pagination.totalItems} {pagination.totalItems === 1 ? "analysis" : "analyses"} found
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
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F6FDFF] border-b border-[#042718]/06">
                    {["Product", "BRI", "Risk Level", "Reviews", "Quality", "Delivery", "Trust", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[#042718]/40 text-xs font-medium uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#042718]/04">
                  <AnimatePresence>
                    {items.map((item, idx) => (
                      <motion.tr
                        key={item.analysisId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-[#F6FDFF] transition-colors cursor-pointer"
                        onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#042718]/08" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[#042718]/05 flex items-center justify-center shrink-0">
                                <Package size={14} className="text-[#042718]/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[#042718] text-sm font-medium truncate">{item.productTitle}</p>
                              <p className="text-[#042718]/40 text-xs truncate">{item.sellerName || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><BriScore score={item.businessRiskIndex} /></td>
                        <td className="px-4 py-3"><RiskBadge level={item.businessRiskLevel} /></td>
                        <td className="px-4 py-3 text-[#042718]/70 text-sm">{item.totalReviews}</td>
                        <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.qualityRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.deliveryRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.trustRiskScore || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-[#042718]/40 text-xs whitespace-nowrap">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                              className="text-[#198F38] hover:text-[#063b25] transition-colors">
                              <ExternalLink size={14} />
                            </button>
                            <button onClick={(e) => handleDelete(item.analysisId, e)}
                              className="text-[#042718]/20 hover:text-red-500 transition-colors">
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
