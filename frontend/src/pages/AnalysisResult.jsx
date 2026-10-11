import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Package, ExternalLink,
  ShieldAlert, ThumbsUp, ThumbsDown, Minus,
  CheckCircle, TrendingUp, Loader2, AlertCircle, Info, HelpCircle
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { analysisAPI } from "../api/endpoints";
import { parseError, formatDate } from "../utils/helpers";

// ── Plain-English Risk Definitions ──────────────────────────────────────────

// ── Plain-English Risk Definitions ──────────────────────────────────────────

const RISK_CONFIG = {
  VERY_LOW: { label: "Very Low Risk", color: "#059669", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  LOW:      { label: "Low Risk",      color: "#16a34a", bg: "bg-green-50",   text: "text-green-800",   border: "border-green-200" },
  MEDIUM:   { label: "Moderate Risk", color: "#d97706", bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200" },
  HIGH:     { label: "High Risk",     color: "#ea580c", bg: "bg-orange-50",  text: "text-orange-800",  border: "border-orange-200" },
  CRITICAL: { label: "Critical Risk", color: "#dc2626", bg: "bg-red-50",     text: "text-red-800",     border: "border-red-200" },
};

function getRiskCfg(level) {
  const key = String(level || "").toUpperCase().replace(/\s+/g, "_");
  return RISK_CONFIG[key] || { label: level || "Unknown", color: "#475569", bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
}

function RiskBadge({ level }) {
  const cfg = getRiskCfg(level);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score, color }) {
  const numScore = parseFloat(score || 0);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, numScore)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-slate-900 text-sm font-bold w-12 text-right">
        {numScore.toFixed(0)} <span className="text-slate-500 font-normal text-xs">/100</span>
      </span>
    </div>
  );
}

const SENTIMENT_COLORS = ["#16a34a", "#dc2626", "#d97706"];

function SentimentIcon({ sentiment }) {
  const s = String(sentiment || "").toUpperCase();
  if (s.includes("POS")) return <ThumbsUp size={14} className="text-emerald-600" />;
  if (s.includes("NEG")) return <ThumbsDown size={14} className="text-rose-600" />;
  return <Minus size={14} className="text-amber-600" />;
}

// Convert technical aspect names into friendly, non-technical titles
function formatAspectTitle(aspectKey) {
  const map = {
    product_quality: "Product Quality",
    delivery_experience: "Shipping & Delivery",
    merchant_trust: "Seller Reliability",
    customer_service: "Customer Support",
    value_for_money: "Value for Money",
    packaging: "Packaging",
    authenticity: "Product Authenticity",
  };
  return map[aspectKey] || aspectKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisAPI.getResult(id);
        setResult(res.data?.data);
      } catch (err) {
        setError(parseError(err) || "Could not load the analysis report for this product.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={36} className="text-emerald-700" />
        </motion.div>
        <p className="text-slate-700 text-sm font-medium">Preparing your AI Risk Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center max-w-md mx-auto">
        <AlertCircle size={44} className="text-red-500" />
        <h3 className="text-slate-900 font-bold text-lg">Unable to Load Report</h3>
        <p className="text-slate-600 font-medium text-sm">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!result) return null;

  const { product, risks, statistics, recommendation, reviews } = result;

  const bri = parseFloat(risks?.businessRiskIndex || 0);
  const overallLevel = risks?.overallRiskLevel || "MEDIUM";
  const briCfg = getRiskCfg(overallLevel);

  const stats = statistics?.sentimentStatistics || statistics?.reviewStatistics || {};
  const positiveCount = stats.positive_reviews ?? stats.positive ?? 0;
  const negativeCount = stats.negative_reviews ?? stats.negative ?? 0;
  const neutralCount = stats.neutral_reviews ?? stats.neutral ?? 0;

  const sentimentData = [
    { name: "Positive", value: positiveCount },
    { name: "Negative", value: negativeCount },
    { name: "Neutral",  value: neutralCount },
  ].filter((d) => d.value > 0);

  const RISK_CARDS = [
    {
      label: "Product Quality",
      explanation: "Material defects, durability issues, and descriptions",
      score: risks?.qualityRisk?.score,
      level: risks?.qualityRisk?.level,
      icon: "📦",
    },
    {
      label: "Shipping & Delivery",
      explanation: "Transit delays, package damage, and delivery fees",
      score: risks?.deliveryRisk?.score,
      level: risks?.deliveryRisk?.level,
      icon: "🚚",
    },
    {
      label: "Seller Reliability",
      explanation: "Customer support, return processing, and trust",
      score: risks?.trustRisk?.score,
      level: risks?.trustRisk?.level,
      icon: "🤝",
    },
  ];

  const report = recommendation?.report;
  const reviewSamples = reviews || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Back button */}
      <motion.button
        {...fadeUp(0)}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold text-sm transition-colors w-fit"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </motion.button>

      {/* ── Product Info Bar ── */}
      <motion.div
        {...fadeUp(0.05)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        {(product?.imageUrl || product?.image_url) ? (
          <img
            src={product.imageUrl || product.image_url}
            alt={product.title || "Product"}
            className="w-18 h-18 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1 shrink-0"
          />
        ) : (
          <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Package size={28} className="text-slate-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {product?.platform && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase tracking-wider">
                {product.platform}
              </span>
            )}
            {product?.category && (
              <span className="text-slate-600 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {product.category}
              </span>
            )}
          </div>
          <h1 className="text-slate-900 font-bold text-base sm:text-xl leading-snug mb-1.5" style={{ fontFamily: "'Onest', sans-serif" }}>
            {product?.title || product?.productTitle || "Analyzed Product"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-700 font-medium">
            {(product?.seller || product?.sellerName) && (
              <span className="flex items-center gap-1">
                <span className="text-slate-500">Seller:</span>
                <span className="text-slate-900 font-bold">{product.seller || product.sellerName}</span>
              </span>
            )}
            {(product?.rating || product?.overallRating) > 0 && (
              <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-900 font-bold">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                {product.rating || product.overallRating}
              </span>
            )}
            <span className="text-slate-700">
              <strong className="text-slate-900 font-bold">{product?.reviewCount || product?.totalReviews || reviewSamples.length || 0}</strong> reviews analyzed
            </span>
          </div>
        </div>

        {(product?.url || product?.productUrl) && (
          <a
            href={product.url || product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xs font-semibold transition-colors shrink-0 shadow-sm"
          >
            Open Store Page <ExternalLink size={12} />
          </a>
        )}
      </motion.div>

      {/* ── Overall Product Risk Score Hero ── */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
      >
        {/* Score gauge */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-sm"
            style={{ borderColor: briCfg.color + "35", background: briCfg.color + "10" }}
          >
            <div className="flex flex-col items-center text-center">
              <span className="font-extrabold text-3xl" style={{ color: briCfg.color, fontFamily: "'Onest', sans-serif" }}>
                {bri.toFixed(0)}
              </span>
              <span className="text-slate-600 text-xs font-semibold">out of 100</span>
            </div>
          </div>
          <RiskBadge level={overallLevel} />
        </div>

        {/* Details & Explanation */}
        <div className="flex flex-col gap-3 flex-1 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-slate-900 text-xl font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>
                Business Risk Score
              </h2>
            </div>
            <p className="text-slate-700 text-sm font-medium leading-relaxed">
              Calculated from review sentiment, delivery issues, and seller reliability. A <strong>lower score is safer</strong>.
            </p>
          </div>

          {/* Risk scale bar */}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Risk Scale (0 = Safe, 100 = Critical)</span>
              <span style={{ color: briCfg.color }}>Current: {bri.toFixed(0)} / 100</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: "0–20 Safe", color: "#059669", bg: "bg-emerald-500" },
                { label: "21–40 Low", color: "#16a34a", bg: "bg-green-500" },
                { label: "41–60 Moderate", color: "#d97706", bg: "bg-amber-500" },
                { label: "61–80 High", color: "#ea580c", bg: "bg-orange-500" },
                { label: "81–100 Critical", color: "#dc2626", bg: "bg-red-500" },
              ].map((r) => (
                <div key={r.label} className="text-center">
                  <div className={`h-2.5 rounded-full mb-1 ${r.bg}`} />
                  <span className="text-slate-700 text-[11px] font-semibold block">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick non-technical advice */}
          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
            <Info size={16} className="text-slate-700 mt-0.5 shrink-0" />
            <p className="text-slate-700 text-xs font-medium leading-normal">
              {bri <= 40 ? (
                <>Safe standing. High buyer satisfaction and low return likelihood.</>
              ) : bri <= 60 ? (
                <>Moderate risk. Minor customer complaints require attention.</>
              ) : (
                <>High risk. Frequent complaints may lead to returns and rating penalties.</>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 3 Core Risk Breakdown Cards ── */}
      <div>
        <h3 className="text-slate-900 font-bold text-base mb-3" style={{ fontFamily: "'Onest', sans-serif" }}>
          Risk Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {RISK_CARDS.map((card, i) => {
            const cfg = getRiskCfg(card.level);
            return (
              <motion.div
                key={card.label}
                {...fadeUp(0.15 + i * 0.05)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">{card.icon}</span>
                    <RiskBadge level={card.level} />
                  </div>
                  <h4 className="text-slate-900 text-sm font-bold mb-1">{card.label}</h4>
                  <p className="text-slate-600 text-xs font-normal mb-4 leading-relaxed">{card.explanation}</p>
                </div>
                <div>
                  <ScoreBar score={card.score || 0} color={cfg.color} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Sentiment + Aspect Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sentiment Donut */}
        <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
              Customer Sentiment
            </h4>
            <p className="text-slate-600 text-xs font-medium">Overall opinion breakdown from analyzed reviews</p>
          </div>
          {sentimentData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {sentimentData.map((_, i) => (
                        <Cell key={i} fill={SENTIMENT_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} reviews`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                {sentimentData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: SENTIMENT_COLORS[i] }} />
                      <span className="text-slate-800 font-semibold text-xs">{d.name}</span>
                    </div>
                    <span className="text-slate-900 font-extrabold text-sm">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm font-medium py-6 text-center">No sentiment data recorded yet.</p>
          )}
        </motion.div>

        {/* Aspect Stats */}
        <motion.div {...fadeUp(0.35)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="mb-3">
            <h4 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
              Feedback by Category
            </h4>
            <p className="text-slate-600 text-xs font-medium">Distribution of customer mentions across key areas</p>
          </div>
          {statistics?.aspectStatistics && Object.keys(statistics.aspectStatistics).length > 0 ? (
            <div className="flex flex-col gap-3.5 pt-1">
              {Object.entries(statistics.aspectStatistics).slice(0, 5).map(([aspect, val]) => {
                const pct = typeof val === "number" ? val : val?.score || 0;
                return (
                  <div key={aspect} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-800 font-bold">{formatAspectTitle(aspect)}</span>
                      <span className="text-slate-900 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {parseFloat(pct).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="h-full rounded-full bg-emerald-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm font-medium py-6 text-center">No category breakdown available.</p>
          )}
        </motion.div>
      </div>

      {/* ── AI Action Plan to Protect Sales ── */}
      {report && (
        <motion.div {...fadeUp(0.4)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-800" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
                AI Recommendations
              </h4>
              <p className="text-slate-600 text-xs font-medium">Actionable steps tailored for this product</p>
            </div>
          </div>

          {report.summary && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <p className="text-emerald-950 text-sm font-medium leading-relaxed">
                {report.summary}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {report.insights?.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600" />
                  Top Complaints
                </p>
                <div className="flex flex-col gap-2.5">
                  {report.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.actions?.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-700" />
                  Suggested Actions
                </p>
                <div className="flex flex-col gap-2.5">
                  {report.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Sample Reviews ── */}
      {reviewSamples.length > 0 && (
        <motion.div {...fadeUp(0.45)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="mb-4">
            <h4 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
              Customer Reviews
            </h4>
            <p className="text-slate-600 text-xs font-medium">Sample feedback analyzed from customer reviews</p>
          </div>
          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {reviewSamples.map((rev, i) => {
              const sentimentLabel = String(rev.sentiment || "").toUpperCase();
              const isPos = sentimentLabel.includes("POS");
              const isNeg = sentimentLabel.includes("NEG");
              
              return (
                <div key={rev.id || i} className="flex gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="mt-1 shrink-0"><SentimentIcon sentiment={rev.sentiment} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium leading-relaxed">
                      "{rev.reviewText}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        isPos
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isNeg
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {isPos ? "Positive" : isNeg ? "Critical" : "Neutral"}
                      </span>
                      {rev.confidenceScore > 0 && (
                        <span className="text-slate-600 font-medium text-xs">
                          {(rev.confidenceScore * 100).toFixed(0)}% AI confidence
                        </span>
                      )}
                      {rev.aspect && rev.aspect !== "GENERAL" && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-medium text-xs capitalize">
                          {formatAspectTitle(rev.aspect.toLowerCase())}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
