import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Link2, Search, CheckCircle, ChevronRight, X,
  Loader2, Star, Package, ScanSearch, AlertCircle, StopCircle,
} from "lucide-react";
import { analysisAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Enter URL" },
  { id: 2, label: "Preview Product" },
  { id: 3, label: "Analyzing..." },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  done ? "bg-[#198F38] text-white" :
                  active ? "bg-[#042718] text-white ring-4 ring-[#042718]/15" :
                  "bg-[#042718]/08 text-[#042718]/40"
                }`}
              >
                {done ? <CheckCircle size={16} /> : step.id}
              </div>
              <span className={`text-xs font-medium ${active ? "text-[#042718]" : "text-[#042718]/40"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-16 sm:w-24 mx-1 mb-4 transition-all duration-500 ${done ? "bg-[#198F38]" : "bg-[#042718]/10"}`} />
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

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyzeProduct() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef(null);

  // Detect platform on URL change
  useEffect(() => {
    setPlatform(detectPlatform(url));
  }, [url]);

  // Clear polling on unmount
  useEffect(() => () => clearInterval(pollingRef.current), []);

  // ── Step 1: Check product ─────────────────────────────────────────────────
  const handleCheckProduct = async (e) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Please enter a product URL."); return; }
    try {
      setLoading(true);
      const res = await analysisAPI.checkProduct(url.trim());
      setPreview(res.data?.data);
      setStep(2);
    } catch (err) {
      setError(parseError(err) || "Could not fetch product. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Start analysis ────────────────────────────────────────────────
  const handleStartAnalysis = async () => {
    setError("");
    try {
      setLoading(true);
      const res = await analysisAPI.startAnalysis(url.trim());
      const data = res.data?.data;
      setAnalysisId(data.analysisId);
      setJobStatus({ status: "STARTED", progress: 0, message: "Starting analysis job..." });
      setStep(3);
      startPolling(data.analysisId);
    } catch (err) {
      setError(parseError(err) || "Failed to start analysis.");
    } finally {
      setLoading(false);
    }
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  const startPolling = useCallback((id) => {
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await analysisAPI.getStatus(id);
        const statusData = res.data?.data;
        setJobStatus(statusData);

        const completed = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(
          String(statusData?.status || "").toUpperCase()
        );
        const failed = ["FAILED", "ERROR"].includes(
          String(statusData?.status || "").toUpperCase()
        );

        if (completed) {
          clearInterval(pollingRef.current);
          setTimeout(() => navigate(`/analysis-result/${id}`), 800);
        }
        if (failed) {
          clearInterval(pollingRef.current);
          setError("Analysis failed. Please try again.");
          setStep(1);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 2500);
  }, [navigate]);

  // ── Stop scraping ─────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!analysisId) return;
    try {
      await analysisAPI.stopScraping(analysisId);
      setJobStatus((p) => ({ ...p, message: "Finishing scraping... Processing collected reviews..." }));
    } catch {
      // Ignore
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    clearInterval(pollingRef.current);
    setStep(1);
    setUrl("");
    setPreview(null);
    setAnalysisId(null);
    setJobStatus(null);
    setError("");
  };

  const progressPct = Math.min(
    100,
    jobStatus?.progress ?? (jobStatus?.reviewsScraped && jobStatus?.totalExpected
      ? Math.round((jobStatus.reviewsScraped / jobStatus.totalExpected) * 100)
      : 30)
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
              <h2 className="text-[#042718] text-2xl font-semibold mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
                Enter Product URL
              </h2>
              <p className="text-[#042718]/60 text-sm">
                Paste a product URL from Daraz, Amazon, eBay, Shopify, or AliExpress
              </p>
            </div>

            <form onSubmit={handleCheckProduct} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  id="productUrl"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.daraz.lk/products/..."
                  className="w-full px-4 py-3.5 pr-32 rounded-xl border border-[#042718]/12 bg-[#F6FDFF] text-[#042718] placeholder:text-[#042718]/30 text-sm outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
                />
                {platform && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-[#198F38]/10 text-[#198F38] text-xs font-semibold">
                    {platform}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                id="checkProductBtn"
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center justify-between w-full h-13 px-6 py-3 rounded-full bg-[#042718] text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#063b25] transition-colors"
              >
                <span>{loading ? "Checking product..." : "Check Product"}</span>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              </button>
            </form>

            {/* Supported platforms */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {["Daraz", "Amazon", "eBay", "Shopify", "AliExpress"].map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-full bg-[#042718]/05 text-[#042718]/50 text-xs">
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
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-2xl border border-[#042718]/08 shadow-sm overflow-hidden"
          >
            {/* Product image banner */}
            {(preview.imageUrl || preview.image_url) && (
              <div className="h-40 bg-[#F6FDFF] overflow-hidden">
                <img
                  src={preview.imageUrl || preview.image_url}
                  alt={preview.title || preview.productTitle}
                  className="w-full h-full object-contain p-4"
                />
              </div>
            )}

            <div className="p-6 sm:p-8">
              {/* Platform badge */}
              {(preview.platform) && (
                <span className="inline-block mb-3 px-2.5 py-1 rounded-full bg-[#198F38]/10 text-[#198F38] text-xs font-semibold">
                  {preview.platform}
                </span>
              )}

              <h3 className="text-[#042718] text-lg font-semibold mb-1 leading-snug" style={{ fontFamily: "'Onest', sans-serif" }}>
                {preview.title || preview.productTitle || "Product"}
              </h3>
              <p className="text-[#042718]/50 text-sm mb-4">
                {preview.seller || preview.sellerName || "Seller N/A"}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mb-6 p-3 rounded-xl bg-[#F6FDFF] border border-[#042718]/06">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[#042718] text-sm font-medium">
                    {preview.rating || preview.overallRating || "—"}
                  </span>
                  <span className="text-[#042718]/40 text-xs">rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Search size={14} className="text-[#198F38]" />
                  <span className="text-[#042718] text-sm font-medium">
                    {preview.reviewCount || preview.totalReviews || "—"}
                  </span>
                  <span className="text-[#042718]/40 text-xs">reviews</span>
                </div>
                {preview.category && (
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-[#042718]/40" />
                    <span className="text-[#042718]/60 text-xs">{preview.category}</span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-full border border-[#042718]/12 text-[#042718]/60 text-sm font-medium hover:bg-[#042718]/04 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="startAnalysisBtn"
                  onClick={handleStartAnalysis}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-full bg-[#042718] text-white text-sm font-medium hover:bg-[#063b25] disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting...</>
                  ) : (
                    <><ScanSearch size={16} /> Start AI Analysis</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Live Progress ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-2xl border border-[#042718]/08 shadow-sm p-6 sm:p-8 text-center"
          >
            {/* Animated icon */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-[#198F38]/10 flex items-center justify-center mx-auto mb-6"
            >
              <ScanSearch size={36} className="text-[#198F38]" />
            </motion.div>

            <h2 className="text-[#042718] text-2xl font-semibold mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
              Analyzing Product
            </h2>
            <p className="text-[#042718]/60 text-sm mb-6">
              {jobStatus?.message || "Our AI is scraping and analyzing customer reviews..."}
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#042718]/08 mb-2 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#198F38] to-[#4ade80]"
              />
            </div>

            {/* Stats row */}
            {jobStatus?.reviewsScraped !== undefined && (
              <p className="text-[#042718]/50 text-xs mb-6">
                {jobStatus.reviewsScraped} reviews collected
              </p>
            )}

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#042718]/05 text-[#042718]/60 text-xs mb-8">
              <Loader2 size={12} className="animate-spin text-[#198F38]" />
              <span>{jobStatus?.status || "Processing..."}</span>
            </div>

            {/* Stop button */}
            <div>
              <button
                id="stopScrapingBtn"
                onClick={handleStop}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#042718]/12 text-[#042718]/60 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all mx-auto"
              >
                <StopCircle size={14} />
                Finish Scraping Early
              </button>
              <p className="text-[#042718]/30 text-xs mt-2">
                Stops collecting reviews and processes what was gathered so far
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
