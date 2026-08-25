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
} from "lucide-react";
import { historyAPI } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate, getRiskColor } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_BADGE = {
  VERY_LOW:  { label: "Very Low",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  LOW:       { label: "Low",       bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400"   },
  MEDIUM:    { label: "Medium",    bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-400"  },
  HIGH:      { label: "High",      bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400"  },
  CRITICAL:  { label: "Critical",  bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     },
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
  const color =
    s < 20 ? "#10B981" :
    s < 40 ? "#22C55E" :
    s < 60 ? "#EAB308" :
    s < 80 ? "#F97316" : "#EF4444";
  return (
    <span className="font-bold text-lg" style={{ color }}>
      {s.toFixed(1)}
    </span>
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await historyAPI.getHistory({ limit: 6, page: 1, sort_by: "created_at", order: "desc" });
        const data = res.data?.data;
        setHistory(data?.items || []);
        setPagination(data?.pagination || null);
      } catch {
        setError("Could not load history.");
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
    { label: "Total Analyses", value: totalAnalyses, icon: BarChart2, color: "#198F38" },
    { label: "Avg. BRI Score", value: avgBri, icon: TrendingUp, color: "#F97316" },
    { label: "Latest Risk Level", value: latestRisk, icon: ShieldAlert, color: "#EF4444", isRisk: true },
    { label: "Platforms", value: platforms.length || "—", icon: Package, color: "#6366F1" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Welcome Banner ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #042718 0%, #063b25 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#198F38]/10 translate-x-24 -translate-y-20 pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/60 text-sm mb-1">{greeting}!</p>
          <h2 className="text-white text-2xl sm:text-3xl font-semibold mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
            Welcome back,{" "}
            <span className="text-[#4ade80]">{user?.username || "User"}</span>
          </h2>
          <p className="text-white/60 text-sm max-w-md">
            Ready to analyze your next product? Paste a URL and get your AI-powered Business Risk Index in minutes.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/analyze")}
          className="relative z-10 flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#198F38] text-white font-medium text-sm hover:bg-[#1aac44] transition-colors shrink-0"
        >
          <ScanSearch size={16} />
          Analyze Product
          <ArrowRight size={14} />
        </motion.button>
      </motion.div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(0.05 * i + 0.1)}
            className="bg-white rounded-2xl p-5 border border-[#042718]/06 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.color + "15" }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-[#042718]/50 text-xs font-medium mb-1">{stat.label}</p>
            {stat.isRisk && stat.value !== "—" ? (
              <RiskBadge level={stat.value} />
            ) : (
              <p className="text-[#042718] text-2xl font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>
                {stat.value}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Recent Analyses ── */}
      <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#042718]/06">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#042718]/40" />
            <h3 className="text-[#042718] font-semibold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
              Recent Analyses
            </h3>
          </div>
          <button
            onClick={() => navigate("/history")}
            className="flex items-center gap-1 text-[#198F38] text-sm font-medium hover:underline"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[#042718]/04 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center text-[#042718]/50 text-sm">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#198F38]/08 flex items-center justify-center">
              <ScanSearch size={28} className="text-[#198F38]" />
            </div>
            <p className="text-[#042718] font-medium">No analyses yet</p>
            <p className="text-[#042718]/50 text-sm text-center max-w-xs">
              Start your first product risk analysis to see results here.
            </p>
            <button
              onClick={() => navigate("/analyze")}
              className="mt-2 px-5 py-2.5 rounded-full bg-[#042718] text-white text-sm font-medium hover:bg-[#063b25] transition-colors"
            >
              Analyze Now
            </button>
          </div>
        )}

        {/* Table — desktop */}
        {!loading && !error && history.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F6FDFF]">
                    {["Product", "BRI Score", "Risk Level", "Reviews", "Quality", "Delivery", "Trust", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[#042718]/40 text-xs font-medium uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#042718]/04">
                  {history.map((item, idx) => (
                    <motion.tr
                      key={item.analysisId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-[#F6FDFF] transition-colors"
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[180px] max-w-[220px]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#042718]/08"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#042718]/05 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-[#042718]/30" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[#042718] text-sm font-medium truncate">{item.productTitle}</p>
                            <p className="text-[#042718]/40 text-xs truncate">{item.sellerName || "—"}</p>
                          </div>
                        </div>
                      </td>
                      {/* BRI */}
                      <td className="px-4 py-3"><BriScore score={item.businessRiskIndex} /></td>
                      {/* Risk */}
                      <td className="px-4 py-3"><RiskBadge level={item.businessRiskLevel} /></td>
                      {/* Reviews */}
                      <td className="px-4 py-3 text-[#042718]/70 text-sm">{item.totalReviews}</td>
                      {/* Q/D/T */}
                      <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.qualityRiskScore || 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.deliveryRiskScore || 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-[#042718]/70 text-sm">{parseFloat(item.trustRiskScore || 0).toFixed(1)}</td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[#042718]/40 text-xs whitespace-nowrap">{formatDate(item.createdAt)}</td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/analysis-result/${item.analysisId}`)}
                          className="flex items-center gap-1 text-[#198F38] text-xs font-medium hover:underline whitespace-nowrap"
                        >
                          View <ExternalLink size={12} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col divide-y divide-[#042718]/06">
              {history.map((item) => (
                <div key={item.analysisId} className="flex items-center gap-3 px-4 py-3">
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
                  </div>
                  <button onClick={() => navigate(`/analysis-result/${item.analysisId}`)}>
                    <ExternalLink size={16} className="text-[#198F38]" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
