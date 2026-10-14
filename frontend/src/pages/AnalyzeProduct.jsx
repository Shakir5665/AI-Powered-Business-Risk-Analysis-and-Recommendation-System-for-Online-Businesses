import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, CheckCircle, ChevronRight,
  Loader2, ScanSearch, AlertCircle, StopCircle,
  Globe, FileSearch, Brain, ClipboardCheck,
} from "lucide-react";
import { analysisAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";
import { useAnalysis } from "../context/AnalysisContext";

// -- Step indicator -----------------------------------------------------------

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

// -- Platform badge detection -------------------------------------------------

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

  // -- Step 1: Check product --------------------------------------------------
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

  // -- Step 2: Start analysis -------------------------------------------------
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

  // -- Step 3: Generate report now with clear states & duplicate click prevention
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

        {/* -- Step 1: URL Input -- */}
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

        {/* -- Step 2: Product Preview -- */}
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

        {/* -- Step 3: Premium Progress Panel -- */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* Phase Steps Track */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between gap-1 mb-5">
                {[
                  { icon: Globe,          label: "Connecting",       done: true },
                  { icon: FileSearch,     label: "Reading Reviews",  done: (jobStatus?.currentPage || 0) > 0 },
                  { icon: Brain,          label: "AI Analysis",      done: ["COMPLETED","DONE","FINISHED","SUCCESS"].includes(String(jobStatus?.status||"").toUpperCase()) },
                  { icon: ClipboardCheck, label: "Generating Report",done: ["COMPLETED","DONE","FINISHED","SUCCESS"].includes(String(jobStatus?.status||"").toUpperCase()) },
                ].map((phase, i, arr) => {
                  const isActive = !phase.done && (i === 0 || arr[i-1]?.done);
                  return (
                    <React.Fragment key={phase.label}>
                      <div className="flex flex-col items-center gap-1.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          phase.done
                            ? "bg-[#198F38] text-white shadow-md shadow-[#198F38]/25"
                            : isActive
                            ? "bg-[#042718] text-white ring-2 ring-[#198F38]/30 shadow-sm"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                          {phase.done
                            ? <CheckCircle size={18} />
                            : isActive
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Loader2 size={18} /></motion.div>
                            : <phase.icon size={16} />
                          }
                        </div>
                        <span className={`text-[10px] font-bold text-center leading-tight ${
                          phase.done ? "text-[#198F38]" : isActive ? "text-slate-900" : "text-slate-400"
                        }`}>
                          {phase.label}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full mb-5 transition-all duration-700 ${
                          phase.done ? "bg-[#198F38]" : "bg-slate-200"
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Main Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
                <motion.div
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #042718, #198F38, #4ade80)" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4">
                <span>Progress</span>
                <span className="text-[#198F38] text-sm">{progressPct}%</span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Pages */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSearch size={14} className="text-[#198F38]" />
                    <span className="text-slate-500 text-xs font-semibold">Pages Read</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-2xl" style={{ fontFamily: "'Onest', sans-serif" }}>
                      {jobStatus?.currentPage ?? "—"}
                    </span>
                    {jobStatus?.totalPages && (
                      <span className="text-slate-400 text-sm font-semibold">of {jobStatus.totalPages}</span>
                    )}
                  </div>
                  {jobStatus?.totalPages && (
                    <div className="w-full h-1 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <motion.div
                        animate={{ width: `${Math.round(((jobStatus.currentPage||0)/jobStatus.totalPages)*100)}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-[#198F38]"
                      />
                    </div>
                  )}
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5">Review pages checked</p>
                </div>

                {/* Reviews */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain size={14} className="text-purple-500" />
                    <span className="text-slate-500 text-xs font-semibold">Reviews Found</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-2xl" style={{ fontFamily: "'Onest', sans-serif" }}>
                      {jobStatus?.reviewsCollected ?? 0}
                    </span>
                    <span className="text-slate-400 text-sm font-semibold">reviews</span>
                  </div>
                  {jobStatus?.reviewsCollected > 0 && (
                    <div className="w-full h-1 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <motion.div
                        animate={{ width: `${Math.min(100, (jobStatus.reviewsCollected/500)*100)}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-purple-400"
                      />
                    </div>
                  )}
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5">Customer opinions collected</p>
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-4 flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-[#198F38]/10 flex items-center justify-center shrink-0"
              >
                <ScanSearch size={16} className="text-[#198F38]" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-semibold">
                  {jobStatus?.currentStep
                    ? jobStatus.currentStep.replace(/scraping/gi, "reading").replace(/scraped/gi, "read").replace(/XLM-?Roberta|BERT|NLP model/gi, "AI")
                    : "Our AI is reading customer feedback and calculating your risk score..."}
                </p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">This usually takes 1–3 minutes</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                <motion.div animate={{ opacity: [1,0,1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <span className="w-2 h-2 rounded-full bg-[#198F38] block" />
                </motion.div>
                <span className="text-[#198F38] text-xs font-bold">Live</span>
              </div>
            </div>

            {/* Generate Report Early Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                id="stopScrapingBtn"
                onClick={() => stopScraping(analysisId)}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all cursor-pointer shadow-xs"
              >
                {isFinishingEarly ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-emerald-700" />
                    <span>Finalizing Report with Current Reviews...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle size={16} className="text-white" />
                    <span>Report Ready! Redirecting...</span>
                  </>
                ) : (
                  <>
                    <StopCircle size={16} className="text-slate-600" />
                    <span>Generate Report Now</span>
                  </>
                )}
              </button>
              <p className="text-slate-400 text-xs text-center max-w-xs">
                Stop collecting and instantly generate your report with the reviews gathered so far
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
