
#!/usr/bin/env python3
"""Writes AnalyzeProduct.jsx and History.jsx for the RiskAI frontend."""

analyze = """\
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Link2, ArrowRight, CheckCircle, AlertCircle, Loader2,
  Star, Package, ChevronRight, Sparkles, Shield, StopCircle, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { analysisAPI } from '../api/endpoints';
import { parseError, truncate } from '../utils/helpers';

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('daraz')) return 'Daraz';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('ebay')) return 'eBay';
    if (host.includes('aliexpress')) return 'AliExpress';
    if (host.includes('shopify') || host.includes('myshopify')) return 'Shopify';
    return null;
  } catch { return null; }
}

const RISK_BADGE = {
  VERY_LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};
const DOT = {
  VERY_LOW: 'bg-emerald-500', LOW: 'bg-green-500', MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500', CRITICAL: 'bg-red-500',
};

function RiskBadge({ level }) {
  const key = String(level || 'LOW').toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${RISK_BADGE[key] || RISK_BADGE.LOW}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[key] || DOT.LOW}`} />
      {key.replace('_', ' ')}
    </span>
  );
}

function RiskMeter({ score, label }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const color = pct < 40 ? '#198F38' : pct < 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white">{pct.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1, label: 'Enter URL' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Analyzing' },
  { id: 4, label: 'Results' },
];

const STATUS_MESSAGES = {
  pending: 'Initializing analysis...',
  scraping: 'Scraping product reviews from the platform...',
  processing: 'AI model classifying review sentiments...',
  aggregating: 'Computing business risk scores...',
  completed: 'Analysis complete!',
  failed: 'Analysis failed.',
};

export default function AnalyzeProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [platform, setPlatform] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [analysisId, setAnalysisId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [scrapeCount, setScrapeCount] = useState(0);
  const [stopLoading, setStopLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState('');
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollStatus = useCallback(async (id) => {
    try {
      const res = await analysisAPI.getStatus(id);
      const data = res.data?.data;
      setJobStatus(data);
      setScrapeCount(data?.reviewsScraped || data?.totalReviewsScraped || 0);
      if (data?.status === 'completed' || data?.status === 'failed') {
        stopPolling();
        if (data?.status === 'completed') {
          const resultRes = await analysisAPI.getResult(id);
          setResult(resultRes.data?.data);
          setStep(4);
        } else {
          setResultError(data?.errorMessage || 'Analysis failed. Please try again.');
        }
      }
    } catch (e) { console.error('Poll error:', e); }
  }, [stopPolling]);

  const handleCheckUrl = async (e) => {
    e?.preventDefault();
    setUrlError('');
    const trimmed = url.trim();
    if (!trimmed) { setUrlError('Please enter a product URL.'); return; }
    try { new URL(trimmed); } catch { setUrlError('Please enter a valid URL.'); return; }
    const det = detectPlatform(trimmed);
    if (!det) {
      setUrlError('URL must be from a supported platform: Daraz, Amazon, eBay, AliExpress, or Shopify.');
      return;
    }
    setPlatform(det);
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await analysisAPI.checkProduct(trimmed);
      setPreview(res.data?.data);
      setStep(2);
    } catch (err) {
      setPreviewError(parseError(err) || 'Could not fetch product preview. Please check the URL.');
    } finally { setPreviewLoading(false); }
  };

  const handleStartAnalysis = async () => {
    if (!url) return;
    setStartLoading(true);
    setResultError('');
    try {
      const res = await analysisAPI.startAnalysis(url.trim(), { saveHistory: true });
      const id = res.data?.data?.analysisId;
      setAnalysisId(id);
      setStep(3);
      pollRef.current = setInterval(() => pollStatus(id), 3000);
      pollStatus(id);
    } catch (err) {
      setResultError(parseError(err) || 'Failed to start analysis. Please try again.');
    } finally { setStartLoading(false); }
  };

  const handleStop = async () => {
    if (!analysisId) return;
    setStopLoading(true);
    try { await analysisAPI.stopScraping(analysisId); }
    catch (e) { console.error(e); }
    finally { setStopLoading(false); }
  };

  const handleReset = () => {
    stopPolling();
    setStep(1); setUrl(''); setPreview(null); setPreviewError(''); setUrlError('');
    setAnalysisId(null); setJobStatus(null); setResult(null); setResultError('');
    setScrapeCount(0); setPlatform(null);
  };

  const currentStatus = jobStatus?.status || 'pending';
  const progressPct = currentStatus === 'scraping' ? Math.min(50, scrapeCount / 5)
    : currentStatus === 'processing' ? 65
    : currentStatus === 'aggregating' ? 85
    : currentStatus === 'completed' ? 100 : 5;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2 text-[#042718]/50 text-sm">
            <Shield size={13} className="text-[#198F38]" />
            <span>Guided Product Risk Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#042718] tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
            Analyze Product
          </h1>
          <p className="text-[#042718]/50 text-sm mt-1">4-step AI-powered risk analysis pipeline</p>
        </motion.div>

        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id ? 'bg-[#198F38] text-white' : step === s.id ? 'bg-[#042718] text-white' : 'bg-[#042718]/10 text-[#042718]/40'
                }`}>
                  {step > s.id ? <CheckCircle size={14} /> : s.id}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s.id ? 'text-[#042718]' : 'text-[#042718]/40'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-all ${step > s.id ? 'bg-[#198F38]' : 'bg-[#042718]/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white rounded-2xl border border-[#042718]/8 p-6 shadow-sm">
                <h2 className="text-[#042718] font-semibold mb-1" style={{ fontFamily: "'Onest', sans-serif" }}>Step 1: Enter Product URL</h2>
                <p className="text-[#042718]/50 text-sm mb-5">Paste the product page URL from Daraz, Amazon, eBay, AliExpress, or Shopify.</p>
                <form onSubmit={handleCheckUrl} className="flex flex-col gap-3">
                  <div className="relative">
                    <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#042718]/30" />
                    <input
                      id="productUrl"
                      type="text"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                      placeholder="https://www.daraz.lk/products/..."
                      className={`w-full pl-9 pr-4 py-3 rounded-xl border text-[#042718] text-sm placeholder:text-[#042718]/30 outline-none transition-all ${
                        urlError ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-[#042718]/10 bg-white focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10'
                      }`}
                    />
                  </div>
                  {urlError && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-red-500 text-xs">
                      <AlertCircle size={13} /> {urlError}
                    </motion.p>
                  )}
                  {previewError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-600 text-sm">{previewError}</p>
                    </motion.div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Daraz', 'Amazon', 'eBay', 'AliExpress', 'Shopify'].map((p) => (
                      <span key={p} className="px-2.5 py-1 rounded-lg bg-[#042718]/5 text-[#042718]/50 text-xs font-medium">{p}</span>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={previewLoading || !url.trim()}
                    className="flex items-center justify-between w-full h-12 pl-5 pr-2 rounded-full bg-[#042718] text-white font-medium text-sm mt-2 hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed transition-all group"
                  >
                    <span>{previewLoading ? 'Fetching preview...' : 'Check Product'}</span>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      {previewLoading ? <Loader2 size={14} className="text-[#042718] animate-spin" /> : <ArrowRight size={14} className="text-[#042718] group-hover:translate-x-0.5 transition-transform" />}
                    </div>
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 2 && preview && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white rounded-2xl border border-[#042718]/8 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={15} className="text-[#198F38]" />
                  <h2 className="text-[#042718] font-semibold" style={{ fontFamily: "'Onest', sans-serif" }}>Step 2: Product Preview</h2>
                </div>
                <div className="flex gap-4 mb-5">
                  {preview.imageUrl ? (
                    <img src={preview.imageUrl} alt={preview.title} className="w-20 h-20 rounded-xl object-cover bg-[#042718]/5 shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#042718]/5 flex items-center justify-center shrink-0">
                      <Package size={28} className="text-[#042718]/20" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-[#042718] font-semibold text-base leading-snug line-clamp-2">{preview.title || preview.productTitle}</p>
                    <p className="text-[#042718]/50 text-xs mt-1">{preview.sellerName || preview.seller}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
                        <Star size={12} className="fill-yellow-500" /> {preview.rating || preview.overallRating || 'N/A'}
                      </span>
                      <span className="text-[#042718]/40 text-xs">{preview.reviewCount || preview.totalReviews || 0} reviews</span>
                      {(preview.platform || platform) && (
                        <span className="px-2 py-0.5 rounded-md bg-[#042718]/5 text-[#042718]/60 text-xs">{preview.platform || platform}</span>
                      )}
                    </div>
                  </div>
                </div>
                {resultError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-red-500 text-xs mb-3">
                    <AlertCircle size={13} /> {resultError}
                  </motion.p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl border border-[#042718]/10 text-[#042718]/60 text-sm hover:bg-[#042718]/5 transition-all">
                    \u2190 Change URL
                  </button>
                  <button
                    onClick={handleStartAnalysis}
                    disabled={startLoading}
                    className="flex-1 flex items-center justify-between h-11 pl-5 pr-2 rounded-full bg-[#042718] text-white font-medium text-sm hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {startLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {startLoading ? 'Starting...' : 'Start Analysis'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <ArrowRight size={13} className="text-[#042718]" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white rounded-2xl border border-[#042718]/8 p-6 shadow-sm">
                <h2 className="text-[#042718] font-semibold mb-1" style={{ fontFamily: "'Onest', sans-serif" }}>Step 3: Running Analysis</h2>
                <p className="text-[#042718]/50 text-sm mb-6">{STATUS_MESSAGES[currentStatus]}</p>
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#042718]/60 capitalize">{currentStatus}</span>
                    <span className="text-[#198F38] font-semibold">{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#042718]/8 overflow-hidden">
                    <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#198F38]/60 to-[#198F38]" />
                  </div>
                </div>
                <div className="bg-[#042718]/4 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#042718]/60 text-xs">Reviews scraped</span>
                    <span className="text-[#042718] font-bold text-lg" style={{ fontFamily: "'Onest', sans-serif" }}>{scrapeCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#198F38] animate-pulse" />
                    <span className="text-[#042718]/50 text-xs">Live scraping in progress</span>
                  </div>
                </div>
                {(currentStatus === 'scraping' || currentStatus === 'pending') && (
                  <button
                    onClick={handleStop}
                    disabled={stopLoading}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#042718]/10 text-[#042718]/60 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {stopLoading ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
                    {stopLoading ? 'Stopping...' : 'Stop Scraping (process now)'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && result && (
            <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="space-y-4">
                <div className="bg-[#042718] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Business Risk Index</p>
                      <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Onest', sans-serif" }}>
                        {result.risks?.businessRiskIndex?.toFixed(1) || '\u2014'}
                      </span>
                      <span className="text-white/40 text-lg ml-1">/ 100</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <RiskBadge level={result.risks?.overallRiskLevel} />
                      <span className="text-white/40 text-xs">{result.statistics?.reviewStatistics?.total_reviews || 0} reviews analyzed</span>
                    </div>
                  </div>
                  <div className="space-y-3 mt-5">
                    <RiskMeter score={result.risks?.qualityRisk?.score} label="Quality Risk" />
                    <RiskMeter score={result.risks?.deliveryRisk?.score} label="Delivery Risk" />
                    <RiskMeter score={result.risks?.trustRisk?.score} label="Trust Risk" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#042718]/8 p-5">
                  <h3 className="text-[#042718] font-semibold text-sm mb-3" style={{ fontFamily: "'Onest', sans-serif" }}>Sentiment Distribution</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Positive', count: result.statistics?.sentimentStatistics?.positive || 0, color: 'text-[#198F38]' },
                      { label: 'Neutral', count: result.statistics?.sentimentStatistics?.neutral || 0, color: 'text-yellow-600' },
                      { label: 'Negative', count: result.statistics?.sentimentStatistics?.negative || 0, color: 'text-red-500' },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#042718]/4 rounded-xl p-4">
                        <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Onest', sans-serif" }}>{s.count}</div>
                        <div className="text-[#042718]/50 text-xs mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.recommendation?.action && (
                  <div className="bg-[#F6FDFF] border border-[#198F38]/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-[#198F38]" />
                      <h3 className="text-[#042718] font-semibold text-sm" style={{ fontFamily: "'Onest', sans-serif" }}>AI Recommendation</h3>
                    </div>
                    <p className="text-[#042718] font-semibold text-sm mb-1">{result.recommendation.action}</p>
                    {result.recommendation.summary && <p className="text-[#042718]/60 text-xs leading-relaxed">{result.recommendation.summary}</p>}
                    {Array.isArray(result.recommendation.actions) && result.recommendation.actions.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {result.recommendation.actions.slice(0, 5).map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#042718]/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#198F38] mt-1.5 shrink-0" />{a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {(result.reviews || []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#042718]/8 p-5">
                    <h3 className="text-[#042718] font-semibold text-sm mb-3" style={{ fontFamily: "'Onest', sans-serif" }}>Sample Reviews</h3>
                    <div className="space-y-2">
                      {(result.reviews || []).slice(0, 6).map((r, i) => {
                        const sent = String(r.sentiment || 'NEUTRAL').toUpperCase();
                        const dotColor = sent.includes('POS') ? 'bg-[#198F38]' : sent.includes('NEG') ? 'bg-red-400' : 'bg-yellow-400';
                        return (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#042718]/4">
                            <span className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                            <p className="text-[#042718]/70 text-xs leading-relaxed">{truncate(r.reviewText || '', 120)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#042718]/10 text-[#042718]/60 hover:bg-[#042718]/5 text-sm font-medium transition-all">
                    <RefreshCw size={14} /> Analyze Another
                  </button>
                  <button onClick={() => navigate('/history')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#042718] text-white text-sm font-semibold hover:bg-[#063b25] transition-all">
                    View History <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
"""

history = """\
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon, Search, Filter, Trash2, ChevronRight,
  ChevronLeft, Package, CheckCircle, AlertTriangle, ExternalLink
} from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { historyAPI } from '../api/endpoints';
import { formatDate, truncate } from '../utils/helpers';

const RISK_BADGE = {
  VERY_LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};
const DOT = {
  VERY_LOW: 'bg-emerald-500', LOW: 'bg-green-500', MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500', CRITICAL: 'bg-red-500',
};

function RiskBadge({ level }) {
  const key = String(level || 'LOW').toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${RISK_BADGE[key] || RISK_BADGE.LOW}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[key] || DOT.LOW}`} />
      {key.replace('_', ' ')}
    </span>
  );
}

function RiskMeter({ score, label, dark = false }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const color = pct < 40 ? '#198F38' : pct < 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className={dark ? 'text-white/60' : 'text-[#042718]/60'}>{label}</span>
        <span className="font-semibold" style={{ color }}>{pct.toFixed(0)}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-[#042718]/8'}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

const RISK_LEVELS = ['', 'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit, sort_by: 'created_at', order: 'desc' };
      if (search.trim()) params.search = search.trim();
      if (riskFilter) params.risk_level = riskFilter;
      const res = await historyAPI.getHistory(params);
      const d = res.data?.data;
      setItems(d?.items || []);
      setPagination((p) => ({ ...p, ...d?.pagination, page }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, riskFilter, pagination.limit]);

  useEffect(() => { load(1); }, [search, riskFilter]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await historyAPI.getHistoryDetail(id);
      setDetail(res.data?.data);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await historyAPI.deleteAnalysis(id);
      setItems((p) => p.filter((i) => i.analysisId !== id));
      setPagination((p) => ({ ...p, totalItems: p.totalItems - 1 }));
      if (detail?.analysisId === id) setDetail(null);
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon size={20} className="text-[#042718]/50" />
            <h1 className="text-2xl font-semibold text-[#042718] tracking-tight" style={{ fontFamily: "'Onest', sans-serif" }}>
              Analysis History
            </h1>
          </div>
          <p className="text-[#042718]/50 text-sm">All your previous AI-powered risk analyses</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#042718]/30" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product or ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm placeholder:text-[#042718]/30 outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all" />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#042718]/30" />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-[#042718]/10 bg-white text-[#042718] text-sm outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all appearance-none cursor-pointer">
              <option value="">All Risk Levels</option>
              {RISK_LEVELS.slice(1).map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </select>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 h-16 border border-[#042718]/8 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#042718]/8 p-16 text-center">
            <HistoryIcon className="w-12 h-12 text-[#042718]/15 mx-auto mb-3" />
            <p className="text-[#042718]/50 font-medium">No analyses found</p>
            <p className="text-[#042718]/30 text-sm mt-1">
              {search || riskFilter ? 'Try adjusting your filters.' : 'Run your first analysis to see results here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <motion.div key={item.analysisId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
                className="bg-white rounded-2xl border border-[#042718]/8 hover:border-[#198F38]/20 hover:shadow-sm transition-all">
                <div className="flex items-center gap-4 p-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover bg-[#042718]/5 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#042718]/5 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-[#042718]/25" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#042718] font-medium text-sm truncate">{item.productTitle || 'Product'}</p>
                    <p className="text-[#042718]/40 text-xs mt-0.5">
                      {item.sellerName} \xb7 {item.totalReviews} reviews \xb7 {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-sm font-bold text-[#042718]">{item.businessRiskIndex?.toFixed(0) || '\u2014'}</span>
                      <span className="text-[#042718]/40 text-xs">BRI</span>
                    </div>
                    <RiskBadge level={item.businessRiskLevel} />
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openDetail(item.analysisId)}
                        className="p-1.5 rounded-lg text-[#042718]/40 hover:text-[#198F38] hover:bg-[#198F38]/8 transition-all" title="View Report">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => setDeleteId(item.analysisId)}
                        className="p-1.5 rounded-lg text-[#042718]/30 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-[#042718]/40 text-sm">
              Page {pagination.page} of {pagination.totalPages} \xb7 {pagination.totalItems} total
            </span>
            <div className="flex gap-2">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#042718]/10 text-[#042718]/60 text-sm hover:bg-[#042718]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#042718]/10 text-[#042718]/60 text-sm hover:bg-[#042718]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <h3 className="text-[#042718] font-semibold text-center mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>Delete Analysis</h3>
                <p className="text-[#042718]/50 text-sm text-center mb-6">
                  This analysis record will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#042718]/10 text-[#042718]/70 text-sm font-medium hover:bg-[#042718]/5 transition-all">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(deleteId)} disabled={deleteLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-all">
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(detail || detailLoading) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setDetail(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white z-50 overflow-y-auto shadow-2xl">
              {detailLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#198F38]/30 border-t-[#198F38] rounded-full animate-spin" />
                    <p className="text-[#042718]/50 text-sm">Loading report...</p>
                  </div>
                </div>
              ) : detail ? (
                <DetailDrawer data={detail} onClose={() => setDetail(null)} onDelete={(id) => setDeleteId(id)} />
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function DetailDrawer({ data, onClose, onDelete }) {
  const prod = data.product || {};
  const risks = data.risks || {};
  const metrics = data.metrics || {};
  const rec = data.recommendation || {};
  const reviews = data.reviews || [];
  const sentPos = metrics.totalPositiveReviews || 0;
  const sentNeg = metrics.totalNegativeReviews || 0;
  const sentNeu = metrics.totalNeutralReviews || 0;
  const total = Math.max(1, metrics.totalReviews || 1);

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#042718]/8 flex items-start gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {prod.imageUrl ? (
            <img src={prod.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#042718]/5 flex items-center justify-center shrink-0">
              <Package size={20} className="text-[#042718]/30" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[#042718] font-semibold truncate text-base" style={{ fontFamily: "'Onest', sans-serif" }}>
              {prod.productTitle || prod.title || 'Product'}
            </h2>
            <p className="text-[#042718]/40 text-xs">{prod.platform} \xb7 {formatDate(data.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onDelete(data.analysisId)}
            className="p-1.5 rounded-lg text-[#042718]/30 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-[#042718]/40 hover:text-[#042718] transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="bg-[#042718] rounded-2xl p-5">
          <p className="text-white/60 text-xs mb-1">Business Risk Index</p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-white" style={{ fontFamily: "'Onest', sans-serif" }}>
              {risks.businessRiskIndex?.toFixed(1) || '\u2014'}
            </span>
            <span className="text-white/50 text-sm mb-1">/ 100</span>
            <div className="ml-auto"><RiskBadge level={risks.businessRiskLevel} /></div>
          </div>
          <div className="space-y-3">
            <RiskMeter score={risks.qualityRiskScore} label="Quality Risk" dark />
            <RiskMeter score={risks.deliveryRiskScore} label="Delivery Risk" dark />
            <RiskMeter score={risks.trustRiskScore} label="Trust Risk" dark />
          </div>
        </div>

        <div className="bg-white border border-[#042718]/8 rounded-2xl p-5">
          <h3 className="text-[#042718] font-semibold text-sm mb-3" style={{ fontFamily: "'Onest', sans-serif" }}>Review Sentiment</h3>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
            <motion.div animate={{ width: `${(sentPos/total)*100}%` }} className="bg-[#198F38]" transition={{ duration: 0.8 }} />
            <motion.div animate={{ width: `${(sentNeu/total)*100}%` }} className="bg-yellow-400" transition={{ duration: 0.8 }} />
            <motion.div animate={{ width: `${(sentNeg/total)*100}%` }} className="bg-red-400" transition={{ duration: 0.8 }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ label: 'Positive', count: sentPos, color: 'text-[#198F38]' }, { label: 'Neutral', count: sentNeu, color: 'text-yellow-600' }, { label: 'Negative', count: sentNeg, color: 'text-red-500' }].map((s) => (
              <div key={s.label} className="bg-[#042718]/4 rounded-xl p-3">
                <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Onest', sans-serif" }}>{s.count}</div>
                <div className="text-[#042718]/50 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {rec.action && (
          <div className="bg-[#F6FDFF] border border-[#198F38]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-[#198F38]" />
              <h3 className="text-[#042718] font-semibold text-sm" style={{ fontFamily: "'Onest', sans-serif" }}>AI Recommendation</h3>
            </div>
            <p className="text-[#042718] font-semibold text-sm mb-1">{rec.action}</p>
            {rec.summary && <p className="text-[#042718]/60 text-xs leading-relaxed">{rec.summary}</p>}
            {Array.isArray(rec.actions) && rec.actions.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {rec.actions.slice(0, 5).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#042718]/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#198F38] mt-1.5 shrink-0" />{a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <h3 className="text-[#042718] font-semibold text-sm mb-3" style={{ fontFamily: "'Onest', sans-serif" }}>Sample Reviews</h3>
            <div className="space-y-2">
              {reviews.slice(0, 8).map((r, i) => {
                const sent = String(r.sentiment || 'NEUTRAL').toUpperCase();
                const dotColor = sent.includes('POS') ? 'bg-[#198F38]' : sent.includes('NEG') ? 'bg-red-400' : 'bg-yellow-400';
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#042718]/4">
                    <span className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                    <p className="text-[#042718]/70 text-xs leading-relaxed">{truncate(r.reviewText || '', 130)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {prod.productUrl && (
          <a href={prod.productUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#042718]/10 text-[#042718]/60 hover:text-[#198F38] hover:border-[#198F38]/30 text-sm font-medium transition-all">
            <ExternalLink size={14} /> View Original Product
          </a>
        )}
      </div>
    </div>
  );
}
"""

with open('frontend/src/pages/AnalyzeProduct.jsx', 'w', encoding='utf-8') as f:
    f.write(analyze)
print(f"AnalyzeProduct.jsx written: {len(analyze)} bytes")

with open('frontend/src/pages/History.jsx', 'w', encoding='utf-8') as f:
    f.write(history)
print(f"History.jsx written: {len(history)} bytes")
