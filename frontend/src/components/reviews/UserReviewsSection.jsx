import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import initialUserReviewsData from "@root_user_reviews";
import { analysisAPI } from "../../api/endpoints";

/**
 * Formats a raw sentiment string to Title Case (Positive, Negative, Neutral).
 */
function formatSentiment(sentiment) {
  if (!sentiment) return "Neutral";
  const s = String(sentiment).trim().toLowerCase();
  if (s.includes("pos")) return "Positive";
  if (s.includes("neg")) return "Negative";
  return "Neutral";
}

/**
 * Extracts and formats mentioned aspects into a comma-separated string (e.g. "Quality, Delivery").
 * Only displays relevant aspects: Quality, Delivery, and Trust, plus any custom aspects.
 */
function formatAspects(aspects) {
  if (!aspects || typeof aspects !== "object") return "-";

  const standardOrder = ["quality", "delivery", "trust"];
  const labelMap = {
    quality: "Quality",
    delivery: "Delivery",
    trust: "Trust",
  };

  const mentioned = [];
  for (const key of standardOrder) {
    const val = aspects[key];
    if (val && String(val).toLowerCase() !== "not_mentioned") {
      mentioned.push(labelMap[key]);
    }
  }

  for (const [key, val] of Object.entries(aspects)) {
    if (!standardOrder.includes(key.toLowerCase()) && val && String(val).toLowerCase() !== "not_mentioned") {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      mentioned.push(label);
    }
  }

  return mentioned.length > 0 ? mentioned.join(", ") : "-";
}

/**
 * Selects reviews for a given sentiment based on current analysis counts.
 * Display limit = min(5, analysis count)
 * - count === 0: returns []
 * - 1 <= count <= 4: selects exactly that number of reviews
 * - count >= 5: selects 5 randomly selected reviews
 */
export function getReviewsForSentiment(sentiment, analysisCounts = {}, reviews = []) {
  const normKey = String(sentiment || "").trim().toLowerCase();

  const hasSpecificCount =
    normKey in analysisCounts ||
    sentiment in analysisCounts ||
    `${normKey}_reviews` in analysisCounts;

  const count = hasSpecificCount
    ? (analysisCounts[normKey] ??
       analysisCounts[sentiment] ??
       analysisCounts[`${normKey}_reviews`] ??
       0)
    : 5;

  if (count <= 0) {
    return [];
  }

  const matchingReviews = (reviews || []).filter((review) => {
    const s = String(
      review.predictions?.sentiment || review.sentiment || ""
    ).trim().toLowerCase();
    return s.includes(normKey);
  });

  const shuffled = [...matchingReviews];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(
    0,
    Math.min(5, count, shuffled.length)
  );
}

/**
 * UserReviewsSection:
 * Positioned directly below Customer Sentiment and above Recommendations.
 * Filters customer comments by Positive, Negative, and Neutral.
 * Number of displayed reviews is determined by the sentiment counts from the current product's analysis.
 * Renders reviews directly from the root user_reviews.json file dynamically.
 */
export default function UserReviewsSection({
  analysisCounts = {},
  reviews: propReviews,
}) {
  const [activeSentiment, setActiveSentiment] = useState("Positive");

  // Keep all reviews in state; default from imported root user_reviews.json
  const [allReviews, setAllReviews] = useState(() => {
    if (Array.isArray(propReviews) && propReviews.length > 0) return propReviews;
    if (Array.isArray(initialUserReviewsData?.reviews)) return initialUserReviewsData.reviews;
    return [];
  });

  // Fetch live reviews from the backend/dev server dynamically so updates to user_reviews.json
  // on disk are immediately reflected without requiring any code changes.
  useEffect(() => {
    if (Array.isArray(propReviews) && propReviews.length > 0) {
      setAllReviews(propReviews);
      return;
    }

    let isMounted = true;

    const fetchLiveReviews = async () => {
      // 1. Try FastAPI backend endpoint first
      try {
        const res = await analysisAPI.getUserReviews();
        const incoming = res.data?.data?.reviews || res.data?.reviews;
        if (isMounted && Array.isArray(incoming) && incoming.length > 0) {
          setAllReviews(incoming);
          return;
        }
      } catch {
        // Backend not reached; fall through to static / dev server fetch
      }

      // 2. Fetch directly from Vite dev server / static endpoint with cache-busting
      try {
        const res = await fetch(`/user_reviews.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data?.reviews) && data.reviews.length > 0) {
            setAllReviews(data.reviews);
          }
        }
      } catch {
        // Keeps initialUserReviewsData as reliable fallback
      }
    };

    fetchLiveReviews();

    return () => {
      isMounted = false;
    };
  }, [propReviews]);

  // Keep displayedReviews in sync with active sentiment, incoming analysis counts, and allReviews
  const [displayedReviews, setDisplayedReviews] = useState(() =>
    getReviewsForSentiment("Positive", analysisCounts, allReviews)
  );

  useEffect(() => {
    setDisplayedReviews(getReviewsForSentiment(activeSentiment, analysisCounts, allReviews));
  }, [activeSentiment, analysisCounts, allReviews]);

  const handleFilterClick = (sentiment) => {
    setActiveSentiment(sentiment);
    setDisplayedReviews(getReviewsForSentiment(sentiment, analysisCounts, allReviews));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.21, 0.45, 0.32, 0.9] }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
    >
      {/* ── Section Header & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4
            className="text-slate-900 font-bold text-base sm:text-lg"
            style={{ fontFamily: "'Onest', sans-serif" }}
          >
            User Reviews
          </h4>
          <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
            Select a sentiment to explore the corresponding customer comments.
          </p>
        </div>

        {/* Exactly three filter buttons: Positive, Negative, Neutral (always visible) */}
        <div className="flex items-center gap-2" role="group" aria-label="Sentiment Filters">
          {["Positive", "Negative", "Neutral"].map((sentiment) => {
            const isActive = activeSentiment === sentiment;

            let buttonClass = "";
            if (sentiment === "Positive") {
              buttonClass = isActive
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800";
            } else if (sentiment === "Negative") {
              buttonClass = isActive
                ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-800";
            } else {
              buttonClass = isActive
                ? "bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800";
            }

            return (
              <button
                key={sentiment}
                type="button"
                onClick={() => handleFilterClick(sentiment)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border cursor-pointer ${buttonClass}`}
              >
                {sentiment}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table with exactly three columns: Reviews, Sentiment, Aspect ── */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              <th className="py-3 px-4 rounded-l-xl" style={{ width: "62%" }}>
                Reviews
              </th>
              <th className="py-3 px-4" style={{ width: "18%" }}>
                Sentiment
              </th>
              <th className="py-3 px-4 rounded-r-xl" style={{ width: "20%" }}>
                Aspect
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence mode="wait">
              {displayedReviews.length === 0 ? (
                <motion.tr
                  key={`empty-${activeSentiment}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={3} className="py-8 text-center text-slate-500 text-xs sm:text-sm font-medium">
                    No {activeSentiment.toLowerCase()} customer reviews found.
                  </td>
                </motion.tr>
              ) : (
                displayedReviews.map((review, index) => {
                  const sentiment = formatSentiment(review.predictions?.sentiment || review.sentiment);
                  const aspectString = formatAspects(review.predictions?.aspects || review.aspects);

                  let sentimentBadge = null;
                  if (sentiment === "Positive") {
                    sentimentBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Positive
                      </span>
                    );
                  } else if (sentiment === "Negative") {
                    sentimentBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Negative
                      </span>
                    );
                  } else {
                    sentimentBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Neutral
                      </span>
                    );
                  }

                  return (
                    <motion.tr
                      key={review.id || `${activeSentiment}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                        {review.comment || review.review_text || review.reviewText}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sentimentBadge}
                      </td>
                      <td className="py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {aspectString}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

