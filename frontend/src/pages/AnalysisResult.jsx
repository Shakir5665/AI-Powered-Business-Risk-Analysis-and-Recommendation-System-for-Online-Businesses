import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Package, ExternalLink,
  ShieldAlert, ThumbsUp, ThumbsDown, Minus,
  CheckCircle, TrendingUp, Loader2, AlertCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { analysisAPI } from "../api/endpoints";
import { parseError, formatDate } from "../utils/helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  VERY_LOW: { label: "Very Low",  color: "#10B981", bg: "bg-emerald-50", text: "text-emerald-700" },
  LOW:      { label: "Low",       color: "#22C55E", bg: "bg-green-50",   text: "text-green-700"   },
  MEDIUM:   { label: "Medium",    color: "#EAB308", bg: "bg-yellow-50",  text: "text-yellow-700"  },
  HIGH:     { label: "High",      color: "#F97316", bg: "bg-orange-50",  text: "text-orange-700"  },
  CRITICAL: { label: "Critical",  color: "#EF4444", bg: "bg-red-50",     text: "text-red-700"     },
};

function getRiskCfg(level) {
  const key = String(level || "").toUpperCase().replace(" ", "_");
  return RISK_CONFIG[key] || { label: level || "N/A", color: "#6B7280", bg: "bg-gray-50", text: "text-gray-600" };
}

function RiskBadge({ level }) {
  const cfg = getRiskCfg(level);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#042718]/08 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, score)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[#042718] text-sm font-bold w-12 text-right">
        {parseFloat(score || 0).toFixed(1)}
      </span>
    </div>
  );
}

const SENTIMENT_COLORS = ["#22C55E", "#EF4444", "#EAB308"];

function SentimentIcon({ sentiment }) {
  const s = String(sentiment || "").toUpperCase();
  if (s.includes("POS")) return <ThumbsUp size={12} className="text-green-500" />;
  if (s.includes("NEG")) return <ThumbsDown size={12} className="text-red-500" />;
  return <Minus size={12} className="text-yellow-500" />;
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
        setError(parseError(err) || "Could not load analysis result.");
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
          <Loader2 size={36} className="text-[#198F38]" />
        </motion.div>
        <p className="text-[#042718]/60 text-sm">Loading analysis result...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-[#042718] font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-full bg-[#042718] text-white text-sm">
          Go Back
        </button>
      </div>
    );
  }

  if (!result) return null;

  const { product, risks, statistics, recommendation, reviews, negativeReviews } = result;

  const bri = parseFloat(risks?.businessRiskIndex || 0);
  const overallLevel = risks?.overallRiskLevel || "MEDIUM";
  const briCfg = getRiskCfg(overallLevel);

  const stats = statistics?.sentimentStatistics || statistics?.reviewStatistics || {};
  const sentimentData = [
    { name: "Positive", value: stats.positive_reviews || stats.positive || 0 },
    { name: "Negative", value: stats.negative_reviews || stats.negative || 0 },
    { name: "Neutral",  value: stats.neutral_reviews  || stats.neutral  || 0 },
  ].filter((d) => d.value > 0);

  const RISK_CARDS = [
    { label: "Quality Risk",  score: risks?.qualityRisk?.score,  level: risks?.qualityRisk?.level,  icon: "🏭" },
    { label: "Delivery Risk", score: risks?.deliveryRisk?.score, level: risks?.deliveryRisk?.level, icon: "🚚" },
    { label: "Trust Risk",    score: risks?.trustRisk?.score,    level: risks?.trustRisk?.level,    icon: "🤝" },
  ];

  const report = recommendation?.report;
  const reviewSamples = reviews || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Back button */}
      <motion.button
        {...fadeUp(0)}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#042718]/50 hover:text-[#042718] text-sm transition-colors w-fit"
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      {/* ── Product Info Bar ── */}
      <motion.div
        {...fadeUp(0.05)}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        {(product?.imageUrl || product?.image_url) ? (
          <img
            src={product.imageUrl || product.image_url}
            alt={product.title}
            className="w-16 h-16 rounded-xl object-contain border border-[#042718]/08 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[#042718]/05 flex items-center justify-center shrink-0">
            <Package size={24} className="text-[#042718]/30" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {product?.platform && (
              <span className="px-2 py-0.5 rounded-full bg-[#198F38]/10 text-[#198F38] text-xs font-semibold">
                {product.platform}
              </span>
            )}
            {product?.category && (
              <span className="text-[#042718]/40 text-xs">{product.category}</span>
            )}
          </div>
          <h2 className="text-[#042718] font-semibold text-base sm:text-lg leading-snug mb-1 truncate" style={{ fontFamily: "'Onest', sans-serif" }}>
            {product?.title || product?.productTitle || "Product"}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#042718]/50">
            {(product?.seller || product?.sellerName) && (
              <span>{product.seller || product.sellerName}</span>
            )}
            {(product?.rating || product?.overallRating) > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                {product.rating || product.overallRating}
              </span>
            )}
            <span>{product?.reviewCount || product?.totalReviews || 0} reviews analyzed</span>
          </div>
        </div>

        {(product?.url || product?.productUrl) && (
          <a
            href={product.url || product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#042718]/12 text-[#042718]/60 text-xs hover:text-[#042718] transition-colors shrink-0"
          >
            View Product <ExternalLink size={12} />
          </a>
        )}
      </motion.div>

      {/* ── BRI Hero ── */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
      >
        {/* Score gauge */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-lg"
            style={{ borderColor: briCfg.color + "30", background: briCfg.color + "08" }}
          >
            <div className="flex flex-col items-center">
              <span className="font-bold text-3xl" style={{ color: briCfg.color, fontFamily: "'Onest', sans-serif" }}>
                {bri.toFixed(1)}
              </span>
              <span className="text-[#042718]/40 text-xs">/ 100</span>
            </div>
          </div>
          <RiskBadge level={overallLevel} />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 flex-1 w-full">
          <div>
            <h3 className="text-[#042718] text-xl font-semibold mb-1" style={{ fontFamily: "'Onest', sans-serif" }}>
              Business Risk Index
            </h3>
            <p className="text-[#042718]/60 text-sm">
              Overall risk assessment based on Quality, Delivery, and Trust dimensions.
            </p>
          </div>

          {/* Risk scale */}
          <div className="flex items-center gap-1 mt-2">
            {[
              { l: "Very Low", c: "#10B981", range: "0–20" },
              { l: "Low",      c: "#22C55E", range: "20–40" },
              { l: "Medium",   c: "#EAB308", range: "40–60" },
              { l: "High",     c: "#F97316", range: "60–80" },
              { l: "Critical", c: "#EF4444", range: "80–100" },
            ].map((r) => (
              <div key={r.l} className="flex-1 text-center">
                <div className="h-2 rounded-full mb-1" style={{ background: r.c }} />
                <span className="text-[#042718]/40 text-[10px] hidden sm:block">{r.l}</span>
              </div>
            ))}
          </div>

          {/* Indicator */}
          <div className="relative">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-md absolute -top-7"
              style={{ left: `${Math.min(98, bri)}%`, transform: "translateX(-50%)", background: briCfg.color }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Risk Breakdown Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {RISK_CARDS.map((card, i) => {
          const cfg = getRiskCfg(card.level);
          return (
            <motion.div
              key={card.label}
              {...fadeUp(0.15 + i * 0.05)}
              className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <RiskBadge level={card.level} />
              </div>
              <p className="text-[#042718]/60 text-xs font-medium mb-2">{card.label}</p>
              <ScoreBar score={card.score || 0} color={cfg.color} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Sentiment + Aspect Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sentiment Donut */}
        <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5">
          <h4 className="text-[#042718] font-semibold mb-4" style={{ fontFamily: "'Onest', sans-serif" }}>
            Sentiment Distribution
          </h4>
          {sentimentData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {sentimentData.map((_, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Reviews"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {sentimentData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: SENTIMENT_COLORS[i] }} />
                    <span className="text-[#042718]/70 text-sm">{d.name}</span>
                    <span className="text-[#042718] font-semibold text-sm ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[#042718]/40 text-sm">No sentiment data available.</p>
          )}
        </motion.div>

        {/* Aspect Stats */}
        <motion.div {...fadeUp(0.35)} className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5">
          <h4 className="text-[#042718] font-semibold mb-4" style={{ fontFamily: "'Onest', sans-serif" }}>
            Aspect Analysis
          </h4>
          {statistics?.aspectStatistics && Object.keys(statistics.aspectStatistics).length > 0 ? (
            <div className="flex flex-col gap-3">
              {Object.entries(statistics.aspectStatistics).slice(0, 5).map(([aspect, val]) => {
                const pct = typeof val === "number" ? val : val?.score || 0;
                return (
                  <div key={aspect} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#042718]/70 capitalize">{aspect.replace(/_/g, " ")}</span>
                      <span className="text-[#042718] font-medium">{parseFloat(pct).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#042718]/08 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="h-full rounded-full bg-[#198F38]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#042718]/40 text-sm">No aspect data available.</p>
          )}
        </motion.div>
      </div>

      {/* ── AI Recommendations ── */}
      {report && (
        <motion.div {...fadeUp(0.4)} className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#198F38]/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-[#198F38]" />
            </div>
            <h4 className="text-[#042718] font-semibold" style={{ fontFamily: "'Onest', sans-serif" }}>
              AI Recommendations
            </h4>
          </div>

          {report.summary && (
            <p className="text-[#042718]/70 text-sm leading-relaxed mb-5 p-4 rounded-xl bg-[#F6FDFF] border border-[#198F38]/10">
              {report.summary}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {report.insights?.length > 0 && (
              <div>
                <p className="text-[#042718]/50 text-xs font-semibold uppercase tracking-wide mb-3">Key Insights</p>
                <div className="flex flex-col gap-2">
                  {report.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-[#042718]/70 text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.actions?.length > 0 && (
              <div>
                <p className="text-[#042718]/50 text-xs font-semibold uppercase tracking-wide mb-3">Action Items</p>
                <div className="flex flex-col gap-2">
                  {report.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[#198F38] mt-0.5 shrink-0" />
                      <p className="text-[#042718]/70 text-sm">{action}</p>
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
        <motion.div {...fadeUp(0.45)} className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-5 sm:p-6">
          <h4 className="text-[#042718] font-semibold mb-4" style={{ fontFamily: "'Onest', sans-serif" }}>
            Sample Reviews
          </h4>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {reviewSamples.map((rev, i) => (
              <div key={rev.id || i} className="flex gap-3 p-3 rounded-xl bg-[#F6FDFF] border border-[#042718]/06">
                <div className="mt-0.5 shrink-0"><SentimentIcon sentiment={rev.sentiment} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#042718]/80 text-sm leading-relaxed">{rev.reviewText}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[#042718]/40 text-xs capitalize">{(rev.sentiment || "").toLowerCase()}</span>
                    {rev.confidenceScore > 0 && (
                      <span className="text-[#042718]/30 text-xs">
                        {(rev.confidenceScore * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    {rev.aspect && rev.aspect !== "GENERAL" && (
                      <span className="px-1.5 py-0.5 rounded bg-[#042718]/05 text-[#042718]/50 text-xs capitalize">
                        {rev.aspect.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
