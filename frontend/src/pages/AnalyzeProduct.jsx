import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, CheckCircle, ChevronRight,
  Loader2, ScanSearch, AlertCircle,
  Package, Star, Sparkles, ExternalLink, CheckCircle2
} from "lucide-react";
import { analysisAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";
import { useAnalysis } from "../context/AnalysisContext";

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Link" },
  { id: 2, label: "Preview" },
  { id: 3, label: "Analysis" },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-xs ${done ? "bg-[#198F38] text-white" :
                  active ? "bg-[#042718] text-white ring-4 ring-[#198F38]/20" :
                    "bg-slate-100 text-slate-600 border border-slate-300"
                  }`}
              >
                {done ? <CheckCircle size={18} /> : step.id}
              </div>
              <span className={`text-xs font-bold ${active ? "text-slate-900" : done ? "text-emerald-700" : "text-slate-500"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 transition-all duration-500 ${done ? "bg-[#198F38]" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Platform badge detection ──────────────────────────────────────────────────

function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("daraz")) return "Daraz";
  if (u.includes("amazon")) return "Amazon";
  if (u.includes("ebay")) return "eBay";
  if (u.includes("shopify") || u.includes("myshopify")) return "Shopify";
  if (u.includes("aliexpress")) return "AliExpress";
  return null;
}

// ── Product Analysis Preview Card (Replaces Terminal) ─────────────────────────

function ProductAnalysisPreviewCard({ preview, url, platform }) {
  const title = preview?.title || preview?.productTitle || "Product under analysis";
  const image = preview?.imageUrl || preview?.image_url;
  const seller = preview?.seller || preview?.sellerName || "Store Seller";
  const rating = preview?.overallRating || preview?.rating || 0;
  const displayPlatform = preview?.platform || platform || detectPlatform(url) || "Online Store";

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-4 sm:p-5 shadow-xs mb-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        {/* Thumbnail Frame */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-slate-200/80 p-2 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Package size={32} className="text-slate-400 stroke-1" />
              <span className="text-[10px] font-semibold text-slate-500 mt-1">Preview</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {displayPlatform}
              </span>
              {seller && (
                <span className="text-slate-600 text-xs font-medium truncate max-w-[200px]">
                  Sold by <strong className="text-slate-800">{seller}</strong>
                </span>
              )}
            </div>

            <h3
              className="text-slate-900 font-bold text-base sm:text-lg leading-snug line-clamp-2"
              style={{ fontFamily: "'Onest', sans-serif" }}
              title={title}
            >
              {title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 pt-3 border-t border-slate-200/60 text-xs">
            {rating > 0 && (
              <div className="flex items-center gap-1 text-slate-700 font-bold">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-slate-500 font-normal">/ 5.0</span>
              </div>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline ml-auto"
              >
                <span>View Product Link</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step-by-Step Status Row ──────────────────────────────────────────────────

function StepStatusRow({ jobStatus, progressPct, isFinishingEarly }) {
  const statusUpper = String(jobStatus?.status || "").toUpperCase();
  const isCompleted = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(statusUpper);
  const isFailed = ["FAILED", "ERROR"].includes(statusUpper);
  const isStopped = Boolean(jobStatus?.stopRequested) || isFinishingEarly;
  const reviewsCount = Number(jobStatus?.reviewsCollected ?? 0);
  const errorMessage = jobStatus?.errorMessage || jobStatus?.message || "";

  // ── Step 1: Store Connection ──────────────────────────────────────────────
  let step1State = "pending";
  if (isFailed && progressPct < 15 && reviewsCount === 0) {
    step1State = "error";
  } else if (statusUpper === "CONNECTING" || (!statusUpper && progressPct < 15)) {
    step1State = "in_progress";
  } else {
    // Once product page is reached and scraping begins or completed
    step1State = "completed";
  }

  // ── Step 2: Collecting Customer Reviews ───────────────────────────────────
  let step2State = "pending";
  if (step1State === "in_progress" || (progressPct < 15 && statusUpper === "CONNECTING")) {
    step2State = "pending";
  } else if (isFailed && progressPct < 65) {
    step2State = "error";
  } else if (isStopped) {
    step2State = "stopped";
  } else if (statusUpper === "SCRAPING" || (!isCompleted && progressPct < 65 && !["AI_ANALYSIS", "REPORT_GENERATION"].includes(statusUpper))) {
    step2State = "in_progress";
  } else {
    // Moved past collection into AI analysis, report generation, or complete
    step2State = "completed";
  }

  // ── Step 3: Analyzing Customer Feedback ───────────────────────────────────
  let step3State = "pending";
  if (["pending", "in_progress"].includes(step2State) && statusUpper !== "AI_ANALYSIS" && statusUpper !== "REPORT_GENERATION" && !isCompleted) {
    step3State = "pending";
  } else if (isFailed && progressPct < 85) {
    step3State = "error";
  } else if (statusUpper === "AI_ANALYSIS" || (!isCompleted && progressPct >= 65 && progressPct < 85 && statusUpper !== "REPORT_GENERATION")) {
    step3State = "in_progress";
  } else if (statusUpper === "REPORT_GENERATION" || isCompleted || progressPct >= 85) {
    step3State = "completed";
  }

  // ── Step 4: Generating Risk Report ────────────────────────────────────────
  let step4State = "pending";
  if (["pending", "in_progress"].includes(step3State) && statusUpper !== "REPORT_GENERATION" && !isCompleted) {
    step4State = "pending";
  } else if (isFailed) {
    step4State = "error";
  } else if (statusUpper === "REPORT_GENERATION" || (!isCompleted && progressPct >= 85)) {
    step4State = "in_progress";
  } else if (isCompleted) {
    step4State = "completed";
  }

  const stages = [
    {
      id: 1,
      title: step1State === "in_progress"
        ? "Connecting to Store"
        : step1State === "error"
          ? "Store Connection Failed"
          : "Connected to Store",
      description: step1State === "in_progress"
        ? "Opening the product page..."
        : step1State === "error"
          ? (errorMessage || "Could not reach the product page.")
          : "Successfully opened the product page",
      state: step1State,
    },
    {
      id: 2,
      title: step2State === "completed"
        ? "Reviews Collected Successfully"
        : step2State === "stopped"
          ? "Review Collection Stopped"
          : step2State === "error"
            ? "Review Collection Failed"
            : "Collecting Customer Reviews",
      description: step2State === "completed"
        ? `You have collected all ${reviewsCount} reviews.`
        : step2State === "stopped"
          ? `You collected ${reviewsCount} reviews before stopping.`
          : step2State === "error"
            ? (errorMessage || "Failed to collect customer reviews.")
            : "Finding and collecting customer reviews...",
      state: step2State,
    },
    {
      id: 3,
      title: step3State === "completed"
        ? "Customer Feedback Analyzed"
        : step3State === "error"
          ? "Feedback Analysis Failed"
          : "Analyzing Customer Feedback",
      description: step3State === "completed"
        ? "Customer opinions and product features have been identified."
        : step3State === "in_progress"
          ? "Understanding customer opinions and what they like or dislike..."
          : step3State === "error"
            ? (errorMessage || "Could not complete sentiment and aspect analysis.")
            : "Identifying positive, negative, and neutral opinions and the product features customers mention.",
      state: step3State,
    },
    {
      id: 4,
      title: step4State === "completed"
        ? "Risk Report Ready"
        : step4State === "error"
          ? "Report Generation Failed"
          : "Generating Risk Report",
      description: step4State === "completed"
        ? "Your business risk report is ready to view."
        : step4State === "error"
          ? (errorMessage || "Could not generate business risk report.")
          : "Preparing your business risk report and recommendations...",
      state: step4State,
    },
  ];

  return (
    <div className="flex flex-col gap-3 my-4">
      {stages.map((st) => {
        const isDone = st.state === "completed";
        const isActive = st.state === "in_progress";
        const isStop = st.state === "stopped";
        const isErr = st.state === "error";

        let cardBgBorder = "bg-slate-50/50 border-slate-200/80 opacity-70";
        if (isDone) cardBgBorder = "bg-emerald-50/40 border-emerald-300/80 shadow-2xs";
        else if (isActive) cardBgBorder = "bg-white border-2 border-emerald-500 shadow-xs ring-4 ring-emerald-500/10";
        else if (isStop) cardBgBorder = "bg-amber-50/50 border border-amber-300 shadow-2xs";
        else if (isErr) cardBgBorder = "bg-red-50/50 border border-red-300 shadow-2xs";

        return (
          <div
            key={st.id}
            className={`flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ${cardBgBorder}`}
          >
            {/* Left side: Icon + Title & Description */}
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={18} strokeWidth={2.8} />
                  </div>
                ) : isActive ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 border border-emerald-400 flex items-center justify-center text-emerald-700 shadow-2xs">
                    <Loader2 size={18} className="animate-spin text-emerald-600" strokeWidth={2.5} />
                  </div>
                ) : isStop ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center">
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </div>
                ) : isErr ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 border border-red-300 text-red-600 flex items-center justify-center">
                    <AlertCircle size={18} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-400 text-xs font-bold">
                    {st.id}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm sm:text-base font-bold tracking-tight ${isErr ? "text-red-950" : isDone ? "text-slate-900" : isActive ? "text-slate-900" : isStop ? "text-slate-900" : "text-slate-700"
                    }`}
                >
                  {st.title}
                </h3>
                <p
                  className={`text-xs sm:text-sm mt-0.5 leading-relaxed ${isErr ? "text-red-700 font-medium" : isStop ? "text-amber-900 font-medium" : isActive ? "text-slate-600 font-medium" : "text-slate-500 font-normal"
                    }`}
                >
                  {st.description}
                </p>
              </div>
            </div>

            {/* Right side: Large Prominent Review Count Indicator for Step 2 */}
            {st.id === 2 && (
              <div
                className={`shrink-0 flex flex-col items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border shadow-2xs text-center min-w-[105px] sm:min-w-[125px] transition-all duration-300 ${isStop
                  ? "bg-amber-100/70 border-amber-300 text-amber-900"
                  : isErr
                    ? "bg-red-100/60 border-red-300 text-red-900"
                    : isDone
                      ? "bg-emerald-100/80 border-emerald-300 text-emerald-950"
                      : isActive
                        ? "bg-emerald-100/70 border-emerald-300 text-emerald-950 ring-2 ring-emerald-500/15"
                        : "bg-slate-100/80 border-slate-200 text-slate-500"
                  }`}
              >
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight leading-none font-mono ${isStop
                    ? "text-amber-800"
                    : isErr
                      ? "text-red-700"
                      : !isDone && !isActive
                        ? "text-slate-400"
                        : "text-emerald-700"
                    }`}
                >
                  {reviewsCount}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${isStop
                    ? "text-amber-700/90"
                    : isErr
                      ? "text-red-700/80"
                      : !isDone && !isActive
                        ? "text-slate-400"
                        : "text-emerald-800"
                    }`}
                >
                  Reviews Collected
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyzeProduct() {
  const {
    step,
    url, setUrl,
    preview,
    analysisId,
    jobStatus,
    logs,
    error, setError,
    setProductPreview,
    startAnalysis,
    stopScraping,
    reset,
  } = useAnalysis();

  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFinishingEarly, setIsFinishingEarly] = useState(false);
  const [stopError, setStopError] = useState("");

  // Keep developer logs running in the background console without showing raw terminal to users
  useEffect(() => {
    if (logs && logs.length > 0) {
      const latest = logs[logs.length - 1];
      console.debug("[Riskora AI Analysis]", latest);
    }
  }, [logs]);

  // Detect platform on URL change
  useEffect(() => {
    setPlatform(detectPlatform(url));
  }, [url]);

  const statusUpper = String(jobStatus?.status || "").toUpperCase();
  const isCompleted = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(statusUpper);
  const isFailed = ["FAILED", "ERROR"].includes(statusUpper);
  const isStopped = Boolean(jobStatus?.stopRequested) || isFinishingEarly;

  const rawProgress = Number(jobStatus?.progress ?? 0);
  const progressPct = isCompleted
    ? 100
    : Math.min(98, Math.max(5, rawProgress > 0 ? rawProgress : 5));

  // ── Step 1: Check product ─────────────────────────────────────────────────
  const handleCheckProduct = async (e) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Please paste a product link."); return; }
    try {
      setLoading(true);
      const res = await analysisAPI.checkProduct(url.trim());
      setProductPreview(res.data?.data, url.trim());
    } catch (err) {
      setError(parseError(err) || "Could not load product. Please check the link.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Start analysis ────────────────────────────────────────────────
  const handleStartAnalysis = async () => {
    setError("");
    try {
      setLoading(true);
      await startAnalysis(url.trim());
    } catch (err) {
      setError(parseError(err) || "Could not start analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Generate report now with clear states & duplicate click prevention
  const handleGenerateReportNow = async () => {
    if (isFinishingEarly || !analysisId) return;
    try {
      setIsFinishingEarly(true);
      setStopError("");
      await stopScraping(analysisId);
    } catch {
      setIsFinishingEarly(false);
      setStopError("Could not finalize early. Continuing full analysis...");
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Step bar */}
      <StepBar current={step} />

      <AnimatePresence mode="wait">

        {/* ── Step 1: URL Input ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-2xl border border-[#042718]/08 shadow-sm p-6 sm:p-8"
          >
            <div className="mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#198F38]/10 flex items-center justify-center mx-auto mb-4">
                <Link2 size={28} className="text-[#198F38]" />
              </div>
              <h2 className="text-slate-900 text-2xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                Analyze Product
              </h2>
              <p className="text-slate-600 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Paste any product link to evaluate customer feedback, quality, and seller risks.
              </p>
            </div>

            <form onSubmit={handleCheckProduct} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  id="productUrl"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste product link (Daraz)"
                  className="w-full px-4 py-3.5 pr-32 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/20 transition-all font-medium shadow-2xs"
                />
                {platform && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                    {platform}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-700 text-sm font-semibold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                id="checkProductBtn"
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center justify-between w-full h-13 px-6 py-3.5 rounded-full bg-[#042718] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#063b25] transition-colors cursor-pointer shadow-sm"
              >
                <span>{loading ? "Checking link..." : "Continue"}</span>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xs font-bold text-slate-600 mr-1">Supported:</span>
              {["Daraz"].map((p) => (
                <span key={p} className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Product Preview ── */}
        {step === 2 && preview && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6.5 relative overflow-hidden"
          >
            {/* Subtle ambient background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6">
              {/* Product image frame */}
              {(preview.imageUrl || preview.image_url) && (
                <div className="w-full sm:w-56 h-56 sm:h-auto sm:min-h-[220px] rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-100 p-4 flex items-center justify-center shrink-0 relative overflow-hidden group">
                  <img
                    src={preview.imageUrl || preview.image_url}
                    alt={preview.title || preview.productTitle}
                    className="max-h-full max-w-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Product details & actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0 w-full">
                <div>
                  {/* Platform badge */}
                  {preview.platform && (
                    <span className="inline-flex items-center gap-1.5 mb-2.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold tracking-tight shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {preview.platform}
                    </span>
                  )}

                  <h3
                    className="text-slate-900 text-lg sm:text-xl font-extrabold mb-4 leading-snug tracking-tight line-clamp-2"
                    style={{ fontFamily: "'Onest', sans-serif" }}
                    title={preview.title || preview.productTitle}
                  >
                    {preview.title || preview.productTitle || "Product Preview"}
                  </h3>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-xs sm:text-sm font-semibold">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 sm:border-0 sm:pt-0">
                  <button
                    onClick={reset}
                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 text-sm font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Back
                  </button>
                  <button
                    id="startAnalysisBtn"
                    onClick={handleStartAnalysis}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#042718] hover:bg-[#063b25] text-white text-sm font-bold disabled:opacity-50 transition-all shadow-md shadow-[#042718]/15 hover:shadow-lg cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <ScanSearch size={18} strokeWidth={2.2} />
                        <span>Run Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Live Progress & Product Preview ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8"
          >
            {/* Header row */}
            <div className="flex items-center gap-4 mb-5">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-13 h-13 rounded-2xl bg-emerald-100/90 flex items-center justify-center shrink-0 border border-emerald-300 shadow-xs"
              >
                <ScanSearch size={26} className="text-emerald-800" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  Evaluating Product Risks
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium truncate mt-0.5">
                  {jobStatus?.currentStep || jobStatus?.message || "Collecting customer reviews and evaluating risks..."}
                </p>
              </div>
              {/* Status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 ${isCompleted
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : isFailed
                    ? "bg-red-50 text-red-800 border-red-300"
                    : isStopped
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300"
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-700" />
                ) : isFailed ? (
                  <AlertCircle size={14} className="text-red-700" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-emerald-700" />
                )}
                <span>
                  {isCompleted
                    ? "Complete"
                    : isFailed
                      ? "Failed"
                      : isStopped
                        ? "Collection Stopped"
                        : statusUpper === "CONNECTING"
                          ? "Connecting to Store"
                          : statusUpper === "SCRAPING"
                            ? "Collecting Reviews"
                            : statusUpper === "AI_ANALYSIS"
                              ? "Analyzing Feedback"
                              : statusUpper === "REPORT_GENERATION"
                                ? "Generating Report"
                                : "Analyzing"}
                </span>
              </div>
            </div>

            {/* Product Preview Card (Replaces Developer Terminal) */}
            <ProductAnalysisPreviewCard preview={preview} url={url} platform={platform} />

            {/* Progress bar */}
            <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-100 border border-slate-200/80 mb-2.5 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>
            <div className="flex items-center justify-between text-slate-600 font-semibold text-xs sm:text-sm mb-4 px-0.5">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompleted
                    ? "bg-emerald-600"
                    : isFailed
                      ? "bg-red-500"
                      : isStopped
                        ? "bg-amber-500"
                        : "bg-emerald-500 animate-pulse"
                    }`}
                />
                <span className="text-slate-800 font-semibold">
                  {jobStatus?.reviewsCollected !== undefined
                    ? `${jobStatus.reviewsCollected} customer review${jobStatus.reviewsCollected === 1 ? "" : "s"} collected`
                    : "Connecting to store..."}
                </span>
              </span>
              <span className="text-slate-500 font-medium">
                {jobStatus?.currentPage && jobStatus?.totalPages
                  ? `Batch ${jobStatus.currentPage} of ${jobStatus.totalPages}`
                  : ""}
              </span>
              <span className="text-emerald-800 font-bold font-mono">{progressPct}%</span>
            </div>

            {/* Step-by-Step Status Row */}
            <StepStatusRow
              jobStatus={jobStatus}
              progressPct={progressPct}
              isFinishingEarly={isFinishingEarly}
            />

            {/* Error notice if stop action hit an issue */}
            <AnimatePresence>
              {stopError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold my-3"
                >
                  <AlertCircle size={15} className="shrink-0 text-amber-700" />
                  <span>{stopError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Failure banner with restart option */}
            <AnimatePresence>
              {isFailed && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 rounded-2xl bg-red-50 border border-red-200 my-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-red-950 font-bold text-sm">Analysis Could Not Complete</h4>
                      <p className="text-red-700 text-xs mt-0.5">
                        {jobStatus?.errorMessage || error || "Failed to complete the analysis. Please check the URL or try again."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-100 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    Start Over
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Report Now Button with Multi-State Logic & Duplicate Click Prevention */}
            <div className="mt-6 flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
              <button
                id="stopScrapingBtn"
                type="button"
                onClick={handleGenerateReportNow}
                disabled={
                  isFinishingEarly ||
                  isCompleted ||
                  isFailed ||
                  Boolean(jobStatus?.stopRequested) ||
                  statusUpper === "CONNECTING"
                }
                className={
                  "flex items-center justify-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold transition-all shadow-xs cursor-pointer " +
                  (isFinishingEarly || Boolean(jobStatus?.stopRequested)
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-not-allowed opacity-90"
                    : isCompleted
                      ? "bg-emerald-600 text-white border border-emerald-600 opacity-90 cursor-default"
                      : isFailed
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : statusUpper === "CONNECTING"
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-white border border-slate-300 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 hover:shadow-sm")
                }
              >
                {isFinishingEarly || Boolean(jobStatus?.stopRequested) ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-emerald-700" />
                    <span>Finalizing Report with Current Reviews...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 size={16} className="text-white" />
                    <span>Report Ready! Redirecting...</span>
                  </>
                ) : isFailed ? (
                  <>
                    <AlertCircle size={16} className="text-slate-400" />
                    <span>Analysis Stopped</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-emerald-700" />
                    <span>Generate Report Now</span>
                  </>
                )}
              </button>
              <p className="text-slate-500 font-medium text-xs text-center max-w-sm">
                Complete analysis immediately using the reviews collected so far
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
