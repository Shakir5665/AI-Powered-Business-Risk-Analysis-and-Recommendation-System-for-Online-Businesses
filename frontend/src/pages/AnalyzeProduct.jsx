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
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-xs ${
                  done ? "bg-[#198F38] text-white" :
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
  const reviews = preview?.totalReviews || preview?.reviewCount;
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
            {reviews !== undefined && reviews !== null && (
              <span className="text-slate-600 font-medium">
                {reviews} review{reviews === 1 ? "" : "s"} found
              </span>
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

function StepStatusRow({ jobStatus, progressPct }) {
  const statusUpper = String(jobStatus?.status || "").toUpperCase();
  const isCompleted = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(statusUpper);
  const reviewsCount = jobStatus?.reviewsCollected ?? 0;

  const isCollecting = statusUpper === "SCRAPING" || (!isCompleted && progressPct < 50);
  const isAnalyzing = statusUpper === "AI_ANALYSIS" || (!isCompleted && progressPct >= 50 && progressPct < 85);
  const isFinalizing = !isCompleted && progressPct >= 85;

  const stages = [
    {
      id: 1,
      label: "Connecting to Store",
      desc: "Product URL verified & store reached",
      done: progressPct >= 15 || isCompleted,
      active: progressPct < 15 && !isCompleted,
    },
    {
      id: 2,
      label: "Collecting Customer Reviews",
      desc: reviewsCount > 0 ? `${reviewsCount} customer reviews collected` : "Reading customer feedback...",
      done: (progressPct >= 50 && !isCollecting) || isCompleted,
      active: isCollecting,
      badge: reviewsCount > 0 ? `${reviewsCount} Reviews` : null,
    },
    {
      id: 3,
      label: "Evaluating Feedback & Risks",
      desc: "Analyzing quality, delivery, and seller trust",
      done: progressPct >= 85 || isCompleted,
      active: isAnalyzing,
    },
    {
      id: 4,
      label: "Compiling Risk Report",
      desc: "Generating Business Risk Index & recommendations",
      done: isCompleted,
      active: isFinalizing,
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 my-4">
      {stages.map((st) => (
        <div
          key={st.id}
          className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
            st.done
              ? "bg-emerald-50/60 border-emerald-200/70"
              : st.active
              ? "bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/10"
              : "bg-slate-50/60 border-slate-200/60 opacity-60"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {st.done ? (
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <CheckCircle size={13} strokeWidth={3} />
              </div>
            ) : st.active ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                <Loader2 size={13} className="animate-spin text-emerald-700" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-400 text-[10px] font-bold">
                {st.id}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs sm:text-sm font-bold ${st.active ? "text-slate-900" : st.done ? "text-emerald-950" : "text-slate-600"}`}>
                {st.label}
              </p>
              {st.badge && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 shrink-0 animate-pulse">
                  {st.badge}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5 font-medium leading-relaxed">
              {st.desc}
            </p>
          </div>
        </div>
      ))}
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

  const progressPct = Math.min(
    100,
    jobStatus?.progress ?? (jobStatus?.reviewsCollected && jobStatus?.totalPages
      ? Math.round((jobStatus.reviewsCollected / Math.max(1, jobStatus.totalPages * 5)) * 100)
      : 30)
  );

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
    } catch (err) {
      setIsFinishingEarly(false);
      setStopError("Could not finalize early. Continuing full analysis...");
    }
  };

  const isCompleted = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(
    String(jobStatus?.status || "").toUpperCase()
  );

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
                  placeholder="Paste product link (Amazon, Daraz, eBay, Shopify...)"
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

            {/* Supported platforms */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xs font-bold text-slate-600 mr-1">Supported:</span>
              {["Daraz", "Amazon", "eBay", "Shopify", "AliExpress"].map((p) => (
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shrink-0">
                {isCompleted ? (
                  <CheckCircle size={14} className="text-emerald-700" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-emerald-700" />
                )}
                <span>
                  {isCompleted
                    ? "Complete"
                    : String(jobStatus?.status || "").toUpperCase() === "SCRAPING"
                    ? "Collecting Reviews"
                    : String(jobStatus?.status || "").toUpperCase() === "AI_ANALYSIS"
                    ? "Analyzing Risks"
                    : "Analyzing"}
                </span>
              </div>
            </div>

            {/* Product Preview Card (Replaces Developer Terminal) */}
            <ProductAnalysisPreviewCard preview={preview} url={url} platform={platform} />

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200/80 mb-2 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              />
            </div>
            <div className="flex items-center justify-between text-slate-600 font-semibold text-xs mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {jobStatus?.reviewsCollected !== undefined
                  ? `${jobStatus.reviewsCollected} customer review${jobStatus.reviewsCollected === 1 ? "" : "s"} collected`
                  : "Collecting customer reviews..."}
              </span>
              <span>
                {jobStatus?.currentPage && jobStatus?.totalPages
                  ? `Batch ${jobStatus.currentPage} of ${jobStatus.totalPages}`
                  : ""}
              </span>
              <span className="text-emerald-800 font-bold">{progressPct}%</span>
            </div>

            {/* Step-by-Step Status Row */}
            <StepStatusRow jobStatus={jobStatus} progressPct={progressPct} />

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

            {/* Generate Report Now Button with Multi-State Logic & Duplicate Click Prevention */}
            <div className="mt-6 flex flex-col items-center gap-2 pt-4 border-t border-slate-100">
              <button
                id="stopScrapingBtn"
                type="button"
                onClick={handleGenerateReportNow}
                disabled={isFinishingEarly || isCompleted}
                className={
                  "flex items-center justify-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold transition-all shadow-xs cursor-pointer " +
                  (isFinishingEarly
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-not-allowed opacity-90"
                    : isCompleted
                    ? "bg-emerald-600 text-white border border-emerald-600 opacity-90 cursor-default"
                    : "bg-white border border-slate-300 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 hover:shadow-sm")
                }
              >
                {isFinishingEarly ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-emerald-700" />
                    <span>Finalizing Report with Current Reviews...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 size={16} className="text-white" />
                    <span>Report Ready! Redirecting...</span>
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
