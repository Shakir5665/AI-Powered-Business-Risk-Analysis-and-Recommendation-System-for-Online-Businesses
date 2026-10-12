import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Package, ExternalLink,
  ThumbsUp, ThumbsDown, Minus,
  Loader2, AlertCircle, Info,
  Truck, ShieldCheck, ChevronRight, Target, Settings
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { analysisAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";
import UserReviewsSection from "../components/reviews/UserReviewsSection";

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

const KNOWLEDGE_FALLBACKS = {
  DELIVERY: {
    HIGH: {
      title: "Improve Delivery Reliability",
      description: "Customer feedback indicates recurring delivery-related problems that may affect customer satisfaction and confidence in your business.",
      priority: "HIGH",
      reasoning: "This recommendation was selected because customer feedback indicates significant delivery concerns. These actions address common delivery issues while allowing you to investigate the underlying causes.",
      actions: [
        "Review recent delivery complaints to identify recurring problems.",
        "Compare promised delivery dates with actual delivery times.",
        "Review packaging practices if customers report damaged items.",
        "Improve order tracking and communicate delays proactively.",
        "Work with delivery partners to address consistent performance issues."
      ],
      achievements: [
        "More reliable delivery performance",
        "Fewer customer complaints",
        "Improved customer satisfaction",
        "Stronger reputation for your business"
      ]
    },
    CRITICAL: {
      title: "Restore Delivery Operations and Resolve Priority Orders",
      description: "Act immediately on critical delivery failures and widespread shipping disruptions to protect customer retention.",
      priority: "CRITICAL",
      reasoning: "Critical delivery delays demand rapid operational intervention to prevent customer escalations and marketplace penalties.",
      actions: [
        "Trace all stalled and delayed orders with logistics carriers immediately.",
        "Proactively communicate tracking updates and compensation options to affected buyers.",
        "Enforce protective packaging protocols to eliminate in-transit breakage.",
        "Activate secondary courier or backup fulfillment channels for delayed routes.",
        "Audit dispatch bottlenecks within the warehouse and handoff timeline."
      ],
      achievements: [
        "Immediate fulfillment backlog resolution",
        "Prevention of marketplace disputes and penalties",
        "Restoration of courier accountability",
        "Protection of seller ratings and repeat sales"
      ]
    },
    MEDIUM: {
      title: "Improve Delivery Efficiency & Transit Timing",
      description: "Moderate transit inconsistencies suggest opportunities to tighten carrier dispatch and improve delivery communications.",
      priority: "NORMAL",
      reasoning: "Customer feedback indicates occasional transit delays or packaging wear that can be resolved before becoming high severity.",
      actions: [
        "Benchmark courier transit times against promised delivery estimates.",
        "Improve automated shipping notification workflows with live tracking links.",
        "Review packaging durability for fragile items to reduce transit damage.",
        "Set clear cut-off times for daily order dispatch.",
        "Establish routine performance check-ins with delivery partners."
      ],
      achievements: [
        "Consistent on-time delivery rates",
        "Fewer delivery status customer inquiries",
        "Higher fulfillment speed ratings",
        "Enhanced customer unboxing experience"
      ]
    },
    LOW: {
      title: "Maintain Reliable Delivery Operations",
      description: "Fulfilment operations are dependable. Continue routine monitoring to sustain high customer satisfaction.",
      priority: "LOW",
      reasoning: "Delivery feedback is consistently positive. Routine monitoring ensures standards are maintained.",
      actions: [
        "Monitor dispatch and delivery performance routinely.",
        "Keep tracking details readily accessible to customers.",
        "Review carrier performance on a regular schedule.",
        "Maintain current high standards for packaging and order protection."
      ],
      achievements: [
        "Sustained 5-star delivery feedback",
        "Minimal logistics-related customer inquiries",
        "Strong customer retention and positive ratings",
        "Reliable delivery partner relationships"
      ]
    },
    VERY_LOW: {
      title: "Maintain Reliable Delivery Operations",
      description: "Continue the fulfilment practices that help orders reach customers in the expected condition and timeframe.",
      priority: "LOW",
      reasoning: "Current delivery feedback indicates exemplary shipping operations. Maintain standard procedures.",
      actions: [
        "Monitor dispatch and delivery performance routinely.",
        "Keep tracking details readily accessible to customers.",
        "Review carrier performance on a regular schedule.",
        "Maintain current high standards for packaging and order protection."
      ],
      achievements: [
        "Industry-leading fulfillment metrics",
        "High customer retention and positive reviews",
        "Reliable carrier partnership pricing",
        "Effortless fulfillment scalability"
      ]
    }
  },
  QUALITY: {
    HIGH: {
      title: "Resolve Major Product Quality Issues",
      description: "Customer feedback highlights noticeable defects, durability concerns, or discrepancies between descriptions and actual items.",
      priority: "HIGH",
      reasoning: "High quality risk threatens return rates and product ratings. Targeted inspection and supplier calibration are urgent.",
      actions: [
        "Review recent quality complaints and return reasons to isolate specific batch defects.",
        "Perform pre-dispatch quality checks on high-risk product batches.",
        "Align product listing descriptions, dimensions, and materials with actual items.",
        "Work directly with suppliers or manufacturers to enforce stricter quality standards.",
        "Provide prompt repair, replacement, or refund resolutions for affected customers."
      ],
      achievements: [
        "Noticeable reduction in product returns and refunds",
        "Improved product star ratings and review sentiment",
        "Stronger customer confidence in product durability",
        "Protected marketplace listing health"
      ]
    },
    CRITICAL: {
      title: "Contain Critical Product Quality Risks",
      description: "Severe quality concerns threaten product safety, customer trust, and marketplace listing compliance.",
      priority: "CRITICAL",
      reasoning: "Critical quality issues require immediate batch isolation and manufacturer accountability to avert listing penalties.",
      actions: [
        "Quarantine affected inventory batches immediately pending thorough inspection.",
        "Audit component suppliers and production line quality verification logs.",
        "Update product warnings, usage instructions, or compatibility notices.",
        "Offer expedited resolutions or full refunds to dissatisfied customers.",
        "Establish zero-tolerance criteria for recurring manufacturing defects."
      ],
      achievements: [
        "Immediate containment of customer dissatisfaction",
        "Elimination of defective inventory from circulation",
        "Protection against account suspensions or policy flags",
        "Restoration of core brand integrity"
      ]
    },
    MEDIUM: {
      title: "Improve Product Quality and Consistency",
      description: "Moderate quality concerns point to minor material inconsistencies or mismatched buyer expectations.",
      priority: "NORMAL",
      reasoning: "Feedback suggests the product works well overall but has specific points of friction that can be improved.",
      actions: [
        "Analyze critical review keywords to identify specific weak points in materials or finish.",
        "Update product photographs and specifications to set accurate customer expectations.",
        "Implement random batch sampling during incoming stock inventory checks.",
        "Provide clearer user guides or assembly instructions to reduce user error.",
        "Review supplier tolerance levels for key components."
      ],
      achievements: [
        "Higher product ratings and consistency",
        "Fewer return and refund requests",
        "Improved customer loyalty and repeat purchases",
        "Lower support and replacement costs"
      ]
    },
    LOW: {
      title: "Maintain Product Inspection Standards",
      description: "Product quality is consistently well-received. Keep up current inspection and supplier review protocols.",
      priority: "LOW",
      reasoning: "Quality feedback is predominantly positive. Routine quality assurance safeguards current high performance.",
      actions: [
        "Maintain current sample inspection checklists for new inventory arrivals.",
        "Track return codes and buyer comments to detect emerging issues early.",
        "Ensure marketing descriptions remain accurate as product revisions occur.",
        "Acknowledge and thank customers who praise product craftsmanship."
      ],
      achievements: [
        "Consistently high product review scores",
        "Minimal return and warranty expenses",
        "High customer satisfaction and word-of-mouth growth",
        "Predictable manufacturing consistency"
      ]
    },
    VERY_LOW: {
      title: "Maintain Product Inspection Standards",
      description: "Continue routine checks so current product quality remains consistent as orders and suppliers change.",
      priority: "LOW",
      reasoning: "Current feedback indicates excellent quality standards. Maintain preventive controls.",
      actions: [
        "Keep a regular sample-inspection schedule for incoming goods.",
        "Record defects and returns by product batch.",
        "Review supplier quality periodically to sustain standards.",
        "Celebrate craftsmanship and durability in brand marketing."
      ],
      achievements: [
        "Best-in-class product satisfaction",
        "Industry-leading return rate metrics",
        "Exceptional repeat customer rate",
        "Strong brand equity and pricing power"
      ]
    }
  },
  TRUST: {
    HIGH: {
      title: "Restore Customer Trust & Support Transparency",
      description: "Elevated trust risk indicates buyer doubts regarding seller authenticity, policy clarity, or customer support responsiveness.",
      priority: "HIGH",
      reasoning: "Negative trust sentiment directly impacts conversion and buyer confidence. Proactive transparency is essential.",
      actions: [
        "Audit listing representations, certifications, and product authenticity documentation.",
        "Accelerate customer support response times and resolve pending buyer disputes.",
        "Make return, replacement, and warranty policies clear and easy to find.",
        "Address public customer complaints with polite, constructive resolutions.",
        "Verify seller badges and platform compliance requirements."
      ],
      achievements: [
        "Rebuilt buyer confidence and brand credibility",
        "Higher purchase conversion rates across listings",
        "Lower dispute and chargeback rates",
        "Protected marketplace seller rating"
      ]
    },
    CRITICAL: {
      title: "Investigate Critical Trust or Authenticity Concerns",
      description: "Urgent trust alerts require immediate review of authenticity claims, seller policies, and customer dispute resolution.",
      priority: "CRITICAL",
      reasoning: "Severe trust complaints can lead to account restrictions or customer attrition. Immediate action is critical.",
      actions: [
        "Provide verifiable proof of authenticity and authorized distribution.",
        "Audit customer service channels to resolve all unanswered escalations within 24 hours.",
        "Revise disputed product descriptions and clarify warranty terms immediately.",
        "Implement dedicated escalation handling for fraud or counterfeit claims.",
        "Conduct an internal audit of all seller disclosures and store policies."
      ],
      achievements: [
        "Immediate defense against account suspension or penalties",
        "Restoration of core buyer trust and verified status",
        "De-escalation of customer disputes and claims",
        "Long-term marketplace compliance assurance"
      ]
    },
    MEDIUM: {
      title: "Improve Transparency and Customer Communication",
      description: "Moderate trust concerns indicate opportunities to clarify product information and improve after-sales communication.",
      priority: "NORMAL",
      reasoning: "Clearer customer communication and transparent store policies will prevent misunderstandings.",
      actions: [
        "Clarify return conditions and warranty coverage on product detail pages.",
        "Ensure prompt and courteous responses to customer inquiries.",
        "Provide honest guidance regarding product capabilities and compatibility.",
        "Follow up with customers after delivery to ensure complete satisfaction.",
        "Maintain up-to-date business contact information and FAQs."
      ],
      achievements: [
        "Stronger buyer confidence and credibility",
        "Protection against marketplace flags",
        "Higher conversion and customer retention",
        "Elevated marketplace brand reputation"
      ]
    },
    LOW: {
      title: "Maintain Customer Trust and Transparency",
      description: "Maintain transparent communication and responsive support to protect your strong customer relationship.",
      priority: "LOW",
      reasoning: "Customer trust is high. Continue the policies and open communication that earned this trust.",
      actions: [
        "Review customer communications to ensure accurate guidance.",
        "Maintain responsive support routes for customer queries.",
        "Keep product information, policies, and order updates accurate.",
        "Uphold fair return and dispute handling practices."
      ],
      achievements: [
        "Industry-leading seller trust score",
        "Exceptional repeat customer purchase rate",
        "Maximum marketplace platform visibility",
        "Resilient, loyal brand following"
      ]
    },
    VERY_LOW: {
      title: "Maintain Customer Trust and Transparency",
      description: "Maintain transparent communication and responsive support to protect your strong customer relationship.",
      priority: "LOW",
      reasoning: "Customer trust is high. Continue the policies and open communication that earned this trust.",
      actions: [
        "Review customer communications to ensure accurate guidance.",
        "Maintain responsive support routes for customer queries.",
        "Keep product information, policies, and order updates accurate.",
        "Uphold fair return and dispute handling practices."
      ],
      achievements: [
        "Industry-leading seller trust score",
        "Exceptional repeat customer purchase rate",
        "Maximum marketplace platform visibility",
        "Resilient, loyal brand following"
      ]
    }
  }
};

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAspect, setSelectedAspect] = useState("DELIVERY");

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
  const sumSentiment = positiveCount + negativeCount + neutralCount;
  const totalSentimentReviews =
    stats.total_reviews ??
    (sumSentiment > 0 ? sumSentiment : (product?.reviewCount || product?.totalReviews || 0));

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

      {/* ── Customer Sentiment Row ── */}
      <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-slate-900 font-bold text-base sm:text-lg" style={{ fontFamily: "'Onest', sans-serif" }}>
              Customer Sentiment
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">Overall opinion breakdown from analyzed reviews</p>
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs self-start sm:self-auto">
            <span className="text-slate-500 text-xs font-semibold">Total Reviews:</span>
            <span className="text-slate-900 font-black text-base">{totalSentimentReviews}</span>
          </div>
        </div>
        {sentimentData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
            <div className="relative w-[150px] h-[150px] shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {sentimentData.map((_, i) => (
                      <Cell key={i} fill={SENTIMENT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} reviews`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Big, clear Total Reviews count in the donut hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-slate-900 font-black text-2xl sm:text-3xl leading-none tracking-tight">
                  {totalSentimentReviews}
                </span>
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mt-1">
                  Reviews
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {sentimentData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: SENTIMENT_COLORS[i] }} />
                    <span className="text-slate-800 font-semibold text-xs sm:text-sm">{d.name}</span>
                  </div>
                  <span className="text-slate-900 font-extrabold text-sm sm:text-base">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm font-medium py-6 text-center">No sentiment data recorded yet.</p>
        )}
      </motion.div>

      {/* ── User Reviews Section ── */}
      <UserReviewsSection
        analysisCounts={{
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
        }}
      />

      {/* ── Recommendations Section (Matching Screenshot) ── */}
      {(() => {
        const aspectRecommendations = recommendation?.aspects || {};

        const getAspectData = (key) => {
          const rawLevel = (
            key === "DELIVERY"
              ? risks?.deliveryRisk?.level
              : key === "QUALITY"
              ? risks?.qualityRisk?.level
              : risks?.trustRisk?.level
          ) || "MEDIUM";
          const normLevel = String(rawLevel).toUpperCase().replace(/\s+/g, "_");

          const fromApi = aspectRecommendations[key];
          const fallback = (KNOWLEDGE_FALLBACKS[key] && (KNOWLEDGE_FALLBACKS[key][normLevel] || KNOWLEDGE_FALLBACKS[key]["MEDIUM"] || KNOWLEDGE_FALLBACKS[key]["HIGH"])) || {};

          const title = fromApi?.title || fallback.title || "Improve Operations";
          const description = fromApi?.description || fallback.description || "Review customer feedback to optimize operational performance.";
          const priority = fromApi?.priority || fallback.priority || (normLevel === "HIGH" || normLevel === "CRITICAL" ? "HIGH" : "NORMAL");
          const reasoning = fromApi?.reasoning || fallback.reasoning || "Based on customer feedback analysis across reviews.";

          const actions = (fromApi?.actions && fromApi.actions.length > 0)
            ? fromApi.actions
            : (fallback.actions || []);

          const achievements = (fromApi?.achievements && fromApi.achievements.length > 0)
            ? fromApi.achievements
            : (fallback.achievements || []);

          return {
            title,
            description,
            priority,
            reasoning,
            actions,
            achievements,
            riskLevel: normLevel,
          };
        };

        const getPillBadge = (level) => {
          const norm = String(level || "").toUpperCase();
          if (norm.includes("CRIT")) {
            return { label: "Critical Risk", bg: "bg-rose-50 text-rose-700 border-rose-200" };
          }
          if (norm.includes("HIGH")) {
            return { label: "High Risk", bg: "bg-rose-50 text-rose-600 border-rose-100" };
          }
          if (norm.includes("MED") || norm.includes("MOD")) {
            return { label: "Moderate Risk", bg: "bg-amber-50 text-amber-700 border-amber-200/60" };
          }
          if (norm.includes("VERY_LOW")) {
            return { label: "Very Low Risk", bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
          }
          return { label: "Low Risk", bg: "bg-emerald-50 text-emerald-600 border-emerald-100" };
        };

        const aspectCards = [
          {
            key: "DELIVERY",
            title: "Delivery",
            subtitle: "Recommended actions to improve delivery reliability.",
            icon: Truck,
            iconBoxClass: "bg-blue-50 text-blue-500 border border-blue-100/80",
            riskLevel: String(risks?.deliveryRisk?.level || "HIGH").toUpperCase().replace(/\s+/g, "_"),
          },
          {
            key: "QUALITY",
            title: "Quality",
            subtitle: "Recommended actions to improve product quality and consistency.",
            icon: Package,
            iconBoxClass: "bg-amber-50 text-amber-600 border border-amber-100/80",
            riskLevel: String(risks?.qualityRisk?.level || "MEDIUM").toUpperCase().replace(/\s+/g, "_"),
          },
          {
            key: "TRUST",
            title: "Trust & Authenticity",
            subtitle: "Recommended actions to maintain customer trust and transparency.",
            icon: ShieldCheck,
            iconBoxClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/80",
            riskLevel: String(risks?.trustRisk?.level || "LOW").toUpperCase().replace(/\s+/g, "_"),
          },
        ];

        const activeData = getAspectData(selectedAspect);
        const activeCard = aspectCards.find((c) => c.key === selectedAspect) || aspectCards[0];
        const ActiveIcon = activeCard.icon;

        const isHighRisk = activeData.riskLevel.includes("HIGH") || activeData.riskLevel.includes("CRIT");
        const isMediumRisk = activeData.riskLevel.includes("MED") || activeData.riskLevel.includes("MOD");

        const bannerTheme = isHighRisk
          ? {
              container: "bg-[#FFF6F6] border-rose-200/70",
              iconBox: "bg-rose-100 text-rose-500",
              priorityBadge: "bg-rose-100/90 text-rose-600 border-rose-200/70",
              priorityIcon: "text-rose-600 fill-rose-600 text-white",
              priorityLabel: activeData.riskLevel.includes("CRIT") ? "Critical Priority" : "High Priority",
              numberBadge: "bg-rose-100 text-rose-600",
            }
          : isMediumRisk
          ? {
              container: "bg-[#FFFBF0] border-amber-200/70",
              iconBox: "bg-amber-100 text-amber-600",
              priorityBadge: "bg-amber-100/90 text-amber-700 border-amber-200/70",
              priorityIcon: "text-amber-600 fill-amber-600 text-white",
              priorityLabel: "Moderate Priority",
              numberBadge: "bg-amber-100 text-amber-700",
            }
          : {
              container: "bg-[#F0FDF4] border-emerald-200/70",
              iconBox: "bg-emerald-100 text-emerald-600",
              priorityBadge: "bg-emerald-100/90 text-emerald-700 border-emerald-200/70",
              priorityIcon: "text-emerald-600",
              priorityLabel: "Normal Priority",
              numberBadge: "bg-emerald-100 text-emerald-700",
            };

        return (
          <motion.div {...fadeUp(0.4)} className="flex flex-col gap-5">
            {/* Header with Title */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                Recommendations
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Actionable guidance to help you improve your business and customer experience.
              </p>
            </div>

            {/* 2-Column Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: 3 Aspect Cards */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {aspectCards.map((card) => {
                  const isSelected = selectedAspect === card.key;
                  const pill = getPillBadge(card.riskLevel);
                  const CardIcon = card.icon;

                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => setSelectedAspect(card.key)}
                      className={`w-full rounded-2xl p-4 text-left transition-all duration-200 flex items-center justify-between gap-3 border cursor-pointer ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBoxClass}`}>
                          <CardIcon size={24} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{card.title}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${pill.bg}`}>
                              {pill.label}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs leading-snug mt-1 line-clamp-2">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className={`shrink-0 transition-colors ${
                          isSelected ? "text-blue-600 font-bold" : "text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active Recommendation Detail Panel */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col gap-6">
                {/* Top Banner */}
                <div className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start justify-between gap-4 ${bannerTheme.container}`}>
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bannerTheme.iconBox}`}>
                      <ActiveIcon size={24} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-slate-900 font-extrabold text-lg sm:text-xl tracking-tight leading-snug" style={{ fontFamily: "'Onest', sans-serif" }}>
                        {activeData.title}
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                        {activeData.description}
                      </p>
                    </div>
                  </div>

                  {/* Priority Pill */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 border ${bannerTheme.priorityBadge}`}>
                    <AlertCircle size={14} className={bannerTheme.priorityIcon} />
                    <span>{bannerTheme.priorityLabel}</span>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="flex flex-col gap-3">
                  <h5 className="text-slate-900 font-bold text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
                    Recommended Actions
                  </h5>
                  <div className="flex flex-col gap-3">
                    {activeData.actions.map((act, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${bannerTheme.numberBadge}`}>
                          {i + 1}
                        </span>
                        <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                          {act}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom 2 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Card 1: Why This Recommendation? */}
                  <div className="bg-rose-50/40 border border-rose-100/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-start">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm sm:text-base">
                      <Target size={18} className="text-rose-600 shrink-0" />
                      <span>Why This Recommendation?</span>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-2.5">
                      {activeData.reasoning}
                    </p>
                  </div>

                  {/* Card 2: What You Can Achieve */}
                  <div className="bg-blue-50/40 border border-blue-100/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-start">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-sm sm:text-base">
                      <Settings size={18} className="text-blue-700 shrink-0" />
                      <span>What You Can Achieve</span>
                    </div>
                    <ul className="flex flex-col gap-2 mt-2.5">
                      {activeData.achievements.map((ach, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

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
