import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analysisAPI } from "../api/endpoints";

// ─── Context ─────────────────────────────────────────────────────────────────

const AnalysisContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AnalysisProvider({ children }) {
  // useNavigate is valid here because AnalysisProvider is inside <BrowserRouter>
  const navigate = useNavigate();

  // Keep navigate in a ref so the stable polling closure can always read the
  // latest value without needing it as a dependency.
  const navigateFnRef = useRef(navigate);
  useEffect(() => { navigateFnRef.current = navigate; }, [navigate]);

  // ── Wizard step (1 = URL input, 2 = Product preview, 3 = Live progress) ──
  const [step, setStep] = useState(1);

  // ── Persistent job fields ─────────────────────────────────────────────────
  const [url, setUrl] = useState(() => {
    try { return sessionStorage.getItem("riskoraAI_url") || ""; } catch { return ""; }
  });
  const [preview, setPreview] = useState(() => {
    try {
      const stored = sessionStorage.getItem("riskoraAI_preview");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [analysisId, setAnalysisId] = useState(() => {
    // Restore from sessionStorage so a hard-refresh doesn't lose the job
    try { return sessionStorage.getItem("riskoraAI_analysisId") || sessionStorage.getItem("riskAI_analysisId") || null; } catch { return null; }
  });
  const [jobStatus, setJobStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  // ── Internal refs ─────────────────────────────────────────────────────────
  const pollingRef = useRef(null);
  const seenLogsRef = useRef(new Set()); // deduplicate log lines across polls

  // ── Persist fields to sessionStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      if (analysisId) {
        sessionStorage.setItem("riskoraAI_analysisId", analysisId);
      } else {
        sessionStorage.removeItem("riskoraAI_analysisId");
        sessionStorage.removeItem("riskAI_analysisId");
      }
    } catch { /* ignore */ }
  }, [analysisId]);

  useEffect(() => {
    try {
      if (preview) {
        sessionStorage.setItem("riskoraAI_preview", JSON.stringify(preview));
      } else {
        sessionStorage.removeItem("riskoraAI_preview");
      }
      if (url) {
        sessionStorage.setItem("riskoraAI_url", url);
      } else {
        sessionStorage.removeItem("riskoraAI_url");
      }
    } catch { /* ignore */ }
  }, [preview, url]);

  // ─────────────────────────────────────────────────────────────────────────
  // Full reset — defined early so polling callback can reference it via ref
  // ─────────────────────────────────────────────────────────────────────────

  const resetRef = useRef(null); // ref so the stable polling closure can call it

  const reset = useCallback(() => {
    clearInterval(pollingRef.current);
    setStep(1);
    setUrl("");
    setPreview(null);
    setAnalysisId(null);
    setJobStatus(null);
    setLogs([]);
    setError("");
    seenLogsRef.current = new Set();
    try { 
      sessionStorage.removeItem("riskoraAI_analysisId"); 
      sessionStorage.removeItem("riskAI_analysisId"); 
      sessionStorage.removeItem("riskoraAI_preview");
      sessionStorage.removeItem("riskoraAI_url");
    } catch { /* ignore */ }
  }, []);

  // Keep resetRef up-to-date so polling closure always calls the latest reset
  useEffect(() => { resetRef.current = reset; }, [reset]);

  // ─────────────────────────────────────────────────────────────────────────
  // Internal polling engine
  // Defined with empty deps — uses refs for navigate and reset so the closure
  // never goes stale.
  // ─────────────────────────────────────────────────────────────────────────

  const _startPolling = useCallback((id) => {
    clearInterval(pollingRef.current);
    seenLogsRef.current = new Set();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await analysisAPI.getStatus(id);
        const statusData = res.data?.data;
        if (!statusData) return;

        setJobStatus(statusData);

        // Merge new log lines (avoid duplicates across polls)
        const incoming = Array.isArray(statusData.logs) ? statusData.logs : [];
        const newLines = incoming.filter((line) => !seenLogsRef.current.has(line));
        if (newLines.length > 0) {
          newLines.forEach((line) => seenLogsRef.current.add(line));
          setLogs((prev) => [...prev, ...newLines]);
        }

        const statusUpper = String(statusData?.status || "").toUpperCase();
        const completed = ["COMPLETED", "DONE", "FINISHED", "SUCCESS"].includes(statusUpper);
        const failed = ["FAILED", "ERROR"].includes(statusUpper);

        if (completed) {
          // Stop polling immediately
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          // Clear session so the completed job isn't resumed on next mount
          try { 
            sessionStorage.removeItem("riskoraAI_analysisId"); 
            sessionStorage.removeItem("riskAI_analysisId"); 
          } catch { /* ignore */ }
          // Navigate via ref (always current, no stale closure)
          setTimeout(() => {
            navigateFnRef.current(`/analysis-result/${id}`);
            // Reset context state after a brief delay so the navigation settles
            setTimeout(() => { resetRef.current?.(); }, 300);
          }, 800);
        }

        if (failed) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setError("Analysis failed. Please try again.");
          resetRef.current?.();
        }
      } catch {
        // Silently swallow transient polling errors
      }
    }, 2500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ Empty deps intentional — all mutable dependencies accessed via refs above

  // ── On mount: if we have a saved analysisId, resume polling immediately ──
  useEffect(() => {
    const savedId = sessionStorage.getItem("riskoraAI_analysisId") || sessionStorage.getItem("riskAI_analysisId");
    if (savedId) {
      setAnalysisId(savedId);
      setStep(3);
      _startPolling(savedId);
    }
    // Cleanup on unmount (page unload)
    return () => clearInterval(pollingRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /** Called by AnalyzeProduct after Step 1 succeeds */
  const setProductPreview = useCallback((previewData, productUrl) => {
    setPreview(previewData);
    setUrl(productUrl);
    setStep(2);
    setError("");
  }, []);

  /** Called by AnalyzeProduct after Step 2 — starts analysis + polling */
  const startAnalysis = useCallback(async (productUrl) => {
    setError("");
    const res = await analysisAPI.startAnalysis(productUrl.trim());
    const data = res.data?.data;
    const id = data.analysisId;

    setAnalysisId(id);
    setJobStatus({ status: "STARTED", progress: 0, message: "Connecting to product page and starting review collection..." });
    setLogs([]);
    seenLogsRef.current = new Set();
    setStep(3);

    _startPolling(id);
    return id;
  }, [_startPolling]);

  /** Called when user clicks "Generate Report Now" */
  const stopScraping = useCallback(async (id) => {
    if (!id) return;
    try {
      await analysisAPI.stopScraping(id);
      setJobStatus((p) => ({
        ...p,
        message: "Wrapping up review collection... Analyzing feedback...",
      }));
    } catch { /* ignore */ }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const value = {
    // State
    step,
    url,
    setUrl,
    preview,
    analysisId,
    jobStatus,
    logs,
    error,
    setError,

    // Actions
    setStep,
    setProductPreview,
    startAnalysis,
    stopScraping,
    reset,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside <AnalysisProvider>");
  return ctx;
}
