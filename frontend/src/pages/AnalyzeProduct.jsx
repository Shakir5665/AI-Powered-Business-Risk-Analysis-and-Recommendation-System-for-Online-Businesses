import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Link2, Search, CheckCircle, ChevronRight, X,
  Loader2, ScanSearch, AlertCircle, StopCircle, Terminal,
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

// ── Terminal log color mapping & Friendly Tag Formatting ─────────────────────

const TAG_MAP = {
  "[SCRAPER]":   "[Reviews]",
  "[AI_ENGINE]": "[Analysis]",
  "[FIS]":       "[Risk Model]",
  "[DATABASE]":  "[System]",
  "[COMPLETED]": "[Complete]",
  "[USER]":      "[Action]",
  "[SYSTEM]":    "[System]",
  "[ERROR]":     "[Alert]",
};

function getLogColor(line) {
  const upper = line.toUpperCase();
  if (upper.includes("[ERROR]") || upper.includes("[ALERT]"))     return "#ff5f5f";
  if (upper.includes("[SCRAPER]") || upper.includes("[REVIEWS]")) return "#67e8f9";   // cyan
  if (upper.includes("[AI_ENGINE]") || upper.includes("[ANALYSIS]")) return "#fde047"; // yellow
  if (upper.includes("[FIS]") || upper.includes("[RISK MODEL]"))  return "#d8b4fe";   // purple
  if (upper.includes("[DATABASE]") || upper.includes("[STORAGE]")) return "#60a5fa";  // blue
  if (upper.includes("[COMPLETED]") || upper.includes("[COMPLETE]")) return "#4ade80"; // bright green
  if (upper.includes("[USER]") || upper.includes("[ACTION]"))     return "#fb923c";   // orange
  if (upper.includes("[SYSTEM]"))                                 return "#e2e8f0";   // near-white
  return "#86efac";                                                                   // default soft green
}

function TerminalLine({ line, animate }) {
  const color = getLogColor(line);
  // Split at the category tag for bold highlighting
  const match = line.match(/^(\[\d{2}:\d{2}:\d{2}\]\s)?(\[[A-Z_]+\])(.*)/);
  if (match) {
    const rawTag = match[2];
    const friendlyTag = TAG_MAP[rawTag] || rawTag;
    return (
      <motion.div
        initial={animate ? { opacity: 0, x: -6 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-2 leading-relaxed"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: "12px" }}
      >
        {match[1] && <span style={{ color: "#6b7280" }}>{match[1]}</span>}
        <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{friendlyTag}</span>
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
          Live Activity
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
            Starting scan...
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

        {/* ── Step 3: Live Progress + Terminal ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
          >
            {/* Header row */}
            <div className="flex items-center gap-4 mb-5">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300 shadow-xs"
              >
                <ScanSearch size={28} className="text-emerald-800" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-slate-900 text-xl font-bold tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
                  Analyzing Reviews
                </h2>
                <p className="text-slate-700 text-sm font-medium truncate mt-0.5">
                  {jobStatus?.currentStep || jobStatus?.message || "Extracting customer feedback and calculating risk score..."}
                </p>
              </div>
              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shrink-0">
                {["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(String(jobStatus?.status || "").toUpperCase())
                  ? <CheckCircle size={14} className="text-emerald-700" />
                  : <Loader2 size={14} className="animate-spin text-emerald-700" />
                }
                <span>{jobStatus?.status || "Analyzing"}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 mb-2 overflow-hidden">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#198F38] to-[#4ade80]"
              />
            </div>
            <div className="flex items-center justify-between text-slate-700 font-semibold text-xs mb-5">
              <span>
                {jobStatus?.reviewsCollected !== undefined
                  ? `${jobStatus.reviewsCollected} reviews collected`
                  : "Collecting reviews..."}
              </span>
              <span>
                {jobStatus?.currentPage && jobStatus?.totalPages
                  ? `Page ${jobStatus.currentPage} of ${jobStatus.totalPages}`
                  : ""}
              </span>
              <span className="text-emerald-800 font-bold">{progressPct}%</span>
            </div>

            {/* ── Terminal log panel ── */}
            <TerminalPanel logs={logs} jobStatus={jobStatus} />

            {/* Stop button */}
            <div className="mt-5 flex flex-col items-center gap-1.5">
              <button
                id="stopScrapingBtn"
                onClick={() => stopScraping(analysisId)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-300 text-slate-800 font-bold text-sm hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
              >
                <StopCircle size={16} />
                Generate Report Now
              </button>
              <p className="text-slate-500 font-medium text-xs text-center max-w-md">
                Complete analysis immediately with reviews collected so far
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
