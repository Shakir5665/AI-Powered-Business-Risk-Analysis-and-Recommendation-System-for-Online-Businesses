import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Link2, Search, CheckCircle, ChevronRight, X,
  Loader2, Star, Package, ScanSearch, AlertCircle, StopCircle, Terminal,
} from "lucide-react";
import { analysisAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";
import { useAnalysis } from "../context/AnalysisContext";

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

// ── Terminal log color mapping ────────────────────────────────────────────────

function getLogColor(line) {
  const upper = line.toUpperCase();
  if (upper.includes("[ERROR]"))     return "#ff5f5f";
  if (upper.includes("[SCRAPER]"))   return "#67e8f9";   // cyan
  if (upper.includes("[AI_ENGINE]")) return "#fde047";   // yellow
  if (upper.includes("[FIS]"))       return "#d8b4fe";   // purple
  if (upper.includes("[DATABASE]"))  return "#60a5fa";   // blue
  if (upper.includes("[COMPLETED]")) return "#4ade80";   // bright green
  if (upper.includes("[USER]"))      return "#fb923c";   // orange
  if (upper.includes("[SYSTEM]"))    return "#e2e8f0";   // near-white
  return "#86efac";                                      // default soft green
}

function TerminalLine({ line, animate }) {
  const color = getLogColor(line);
  // Split at the category tag for bold highlighting
  const match = line.match(/^(\[\d{2}:\d{2}:\d{2}\]\s)?(\[[A-Z_]+\])(.*)/);
  if (match) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, x: -6 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-2 leading-relaxed"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: "12px" }}
      >
        {match[1] && <span style={{ color: "#6b7280" }}>{match[1]}</span>}
        <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{match[2]}</span>
        <span style={{ color: "#d1fae5" }}>{match[3]}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={animate ? { opacity: 0, x: -6 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      style={{ color: "#86efac", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: "12px", lineHeight: "1.6" }}
    >
      {line}
    </motion.div>
  );
}

// ── Terminal panel ────────────────────────────────────────────────────────────

function TerminalPanel({ logs, jobStatus }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevLogCountRef = useRef(0);

  // Auto-scroll only when new lines arrive
  useEffect(() => {
    if (logs.length > prevLogCountRef.current) {
      prevLogCountRef.current = logs.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const isRunning = !["COMPLETED", "DONE", "FINISHED", "SUCCESS", "FAILED", "ERROR"].includes(
    String(jobStatus?.status || "").toUpperCase()
  );

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border"
      style={{ borderColor: "#198F38/30", background: "#0a1a0f" }}
    >
      {/* Terminal title bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: "#1a3a1f", background: "#071210" }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <Terminal size={12} className="ml-2 text-[#198F38]" />
        <span
          className="text-xs text-[#4ade80]/60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          analysis-log — riskAI
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {isRunning && (
            <>
              <span className="w-2 h-2 rounded-full bg-[#198F38] animate-pulse" />
              <span className="text-[10px] text-[#4ade80]/60" style={{ fontFamily: "monospace" }}>
                LIVE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Log body */}
      <div
        className="p-4 overflow-y-auto flex flex-col gap-0.5"
        style={{ height: "280px", maxHeight: "280px" }}
      >
        {logs.length === 0 ? (
          <span style={{ color: "#4ade80/40", fontFamily: "monospace", fontSize: "12px" }}>
            Waiting for logs...
          </span>
        ) : (
          logs.map((line, i) => (
            <TerminalLine
              key={`${i}-${line.slice(0, 20)}`}
              line={line}
              animate={i >= logs.length - 5}
            />
          ))
        )}
        {/* Blinking cursor */}
        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              color: "#4ade80",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: 1,
              display: "inline-block",
              marginTop: "2px",
            }}
          >
            █
          </motion.span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyzeProduct() {
  const navigate = useNavigate();

  const {
    step, setStep,
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
    if (!url.trim()) { setError("Please enter a product URL."); return; }
    try {
      setLoading(true);
      const res = await analysisAPI.checkProduct(url.trim());
      setProductPreview(res.data?.data, url.trim());
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
      await startAnalysis(url.trim());
    } catch (err) {
      setError(parseError(err) || "Failed to start analysis.");
    } finally {
      setLoading(false);
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
              <div className="h-64 sm:h-72 bg-[#F6FDFF] overflow-hidden flex items-center justify-center">
                <img
                  src={preview.imageUrl || preview.image_url}
                  alt={preview.title || preview.productTitle}
                  className="max-h-full max-w-full object-contain p-6"
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

        {/* ── Step 3: Live Progress + Terminal ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-2xl border border-[#042718]/08 shadow-sm p-6 sm:p-8"
          >
            {/* Header row */}
            <div className="flex items-center gap-4 mb-5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl bg-[#198F38]/10 flex items-center justify-center shrink-0"
              >
                <ScanSearch size={26} className="text-[#198F38]" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[#042718] text-xl font-semibold" style={{ fontFamily: "'Onest', sans-serif" }}>
                  Analyzing Product
                </h2>
                <p className="text-[#042718]/55 text-sm truncate">
                  {jobStatus?.currentStep || jobStatus?.message || "AI is scraping and analyzing reviews..."}
                </p>
              </div>
              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#042718]/05 text-[#042718]/60 text-xs shrink-0">
                {["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(String(jobStatus?.status || "").toUpperCase())
                  ? <CheckCircle size={11} className="text-[#198F38]" />
                  : <Loader2 size={11} className="animate-spin text-[#198F38]" />
                }
                <span>{jobStatus?.status || "Processing"}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#042718]/08 mb-1.5 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#198F38] to-[#4ade80]"
              />
            </div>
            <div className="flex items-center justify-between text-[#042718]/40 text-xs mb-5">
              <span>
                {jobStatus?.reviewsCollected !== undefined
                  ? `${jobStatus.reviewsCollected} reviews collected`
                  : "Collecting reviews..."}
              </span>
              <span>
                {jobStatus?.currentPage && jobStatus?.totalPages
                  ? `Page ${jobStatus.currentPage}/${jobStatus.totalPages}`
                  : ""}
              </span>
              <span>{progressPct}%</span>
            </div>

            {/* ── Terminal log panel ── */}
            <TerminalPanel logs={logs} jobStatus={jobStatus} />

            {/* Stop button */}
            <div className="mt-5 flex flex-col items-center gap-1.5">
              <button
                id="stopScrapingBtn"
                onClick={() => stopScraping(analysisId)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#042718]/12 text-[#042718]/60 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
              >
                <StopCircle size={14} />
                Finish Scraping Early
              </button>
              <p className="text-[#042718]/30 text-xs">
                Stops collecting reviews and processes what was gathered so far
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
