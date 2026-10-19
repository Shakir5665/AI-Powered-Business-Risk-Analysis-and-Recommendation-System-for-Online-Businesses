import logging
import random
import numpy as np
from typing import Dict, Any
from app.domain.enums import RiskLevel

logger = logging.getLogger(__name__)


def sanitize_native_types(obj: Any) -> Any:
    """
    Recursively converts numpy scalars (np.float64, np.int64, etc.) to standard Python floats, ints, or native types.
    Prevents PostgreSQL psycopg2 (schema 'np' does not exist) errors during SQLAlchemy parameter binding.
    """
    if isinstance(obj, (np.floating, np.integer)):
        return obj.item()
    elif isinstance(obj, np.ndarray):
        return [sanitize_native_types(i) for i in obj.tolist()]
    elif isinstance(obj, dict):
        return {k: sanitize_native_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_native_types(i) for i in obj]
    elif isinstance(obj, tuple):
        return tuple(sanitize_native_types(i) for i in obj)
    return obj


def get_val(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


class AnalysisMapper:
    """
    Mapper transforming internal core AI result structures into API schema-ready dictionaries.
    """

    @staticmethod
    def _determine_risk_level(score: float) -> RiskLevel:
        score_val = float(score)
        if score_val < 20.0:
            return RiskLevel.VERY_LOW
        elif score_val < 40.0:
            return RiskLevel.LOW
        elif score_val < 60.0:
            return RiskLevel.MEDIUM
        elif score_val < 80.0:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    @classmethod
    def to_api_result(cls, pipeline_output: Dict[str, Any]) -> Dict[str, Any]:
        product = pipeline_output.get("product")
        aggregation = pipeline_output.get("aggregation")
        quality = pipeline_output.get("quality")
        delivery = pipeline_output.get("delivery")
        trust = pipeline_output.get("trust")
        business = pipeline_output.get("business")

        scraped_reviews = get_val(product, "reviews", [])
        scraped_count = len(scraped_reviews) if scraped_reviews else int(get_val(product, "total_reviews", 0))

        # Product Info mapping
        product_dict = {
            "title": get_val(product, "title", get_val(product, "product_name", get_val(product, "name", "Product"))),
            "url": get_val(product, "product_url", get_val(product, "url", "")),
            "reviewCount": scraped_count,
            "totalReviews": scraped_count,
            "rating": float(get_val(product, "overall_rating", get_val(product, "rating", get_val(product, "average_rating", 0.0)))),
            "overallRating": float(get_val(product, "overall_rating", get_val(product, "rating", get_val(product, "average_rating", 0.0)))),
            "seller": get_val(product, "seller_name", get_val(product, "seller", "Daraz Verified Seller")),
            "seller_name": get_val(product, "seller_name", get_val(product, "seller", "Daraz Verified Seller")),
            "imageUrl": get_val(product, "image_url", get_val(product, "imageUrl", "")),
            "image_url": get_val(product, "image_url", get_val(product, "imageUrl", "")),
            "platform": get_val(product, "platform", "Daraz"),
            "category": get_val(product, "category", "General")
        }

        # Sentiment statistics extraction
        raw_rev_stats = get_val(aggregation, "review_statistics", get_val(aggregation, "reviewStatistics", {}))
        raw_sent_stats = get_val(aggregation, "sentiment_statistics", get_val(aggregation, "sentimentStatistics", {}))
        raw_aspect_stats = get_val(aggregation, "aspect_statistics", get_val(aggregation, "aspectStatistics", {}))
        raw_conf_stats = get_val(aggregation, "confidence_statistics", get_val(aggregation, "confidenceStatistics", {}))

        pos_count = int(get_val(raw_rev_stats, "positive_reviews", get_val(raw_rev_stats, "positive", get_val(raw_sent_stats, "positive", 0))))
        neg_count = int(get_val(raw_rev_stats, "negative_reviews", get_val(raw_rev_stats, "negative", get_val(raw_sent_stats, "negative", 0))))
        neu_count = int(get_val(raw_rev_stats, "neutral_reviews", get_val(raw_rev_stats, "neutral", get_val(raw_sent_stats, "neutral", 0))))

        if (pos_count + neg_count + neu_count) == 0 and scraped_reviews:
            for rev in scraped_reviews:
                sent = str(get_val(rev, "sentiment", get_val(rev, "label", ""))).upper()
                if "POS" in sent:
                    pos_count += 1
                elif "NEG" in sent:
                    neg_count += 1
                elif "NEU" in sent or "MIX" in sent:
                    neu_count += 1
                else:
                    pass  # skip null or unrecognized sentiments to avoid inflating positive count

        tot_reviews = scraped_count or (pos_count + neg_count + neu_count)

        sent_summary = {
            "total_reviews": tot_reviews,
            "positive_reviews": pos_count,
            "negative_reviews": neg_count,
            "neutral_reviews": neu_count,
            "positive": pos_count,
            "negative": neg_count,
            "neutral": neu_count,
            "positive_ratio": get_val(raw_sent_stats, "positive_ratio", round(pos_count / max(1, tot_reviews), 4)),
            "negative_ratio": get_val(raw_sent_stats, "negative_ratio", round(neg_count / max(1, tot_reviews), 4)),
            "neutral_ratio": get_val(raw_sent_stats, "neutral_ratio", round(neu_count / max(1, tot_reviews), 4)),
        }

        # Statistics mapping
        statistics_dict = {
            "reviewStatistics": sent_summary,
            "sentimentStatistics": sent_summary,
            "aspectStatistics": raw_aspect_stats or {},
            "confidenceStatistics": raw_conf_stats or {}
        }

        # Risk Score Index
        risk_index = float(get_val(business, "business_risk_index", 0.0))

        q_score = float(get_val(quality, "risk_score", get_val(quality, "score", 0.0)))
        d_score = float(get_val(delivery, "risk_score", get_val(delivery, "score", 0.0)))
        t_score = float(get_val(trust, "risk_score", get_val(trust, "score", 0.0)))

        q_level = get_val(quality, "level", None) or cls._determine_risk_level(q_score)
        d_level = get_val(delivery, "level", None) or cls._determine_risk_level(d_score)
        t_level = get_val(trust, "level", None) or cls._determine_risk_level(t_score)
        b_level = get_val(business, "business_risk_level", None) or get_val(business, "overall_risk_level", None) or cls._determine_risk_level(risk_index)

        q_level_val = q_level.value if hasattr(q_level, "value") else str(q_level)
        d_level_val = d_level.value if hasattr(d_level, "value") else str(d_level)
        t_level_val = t_level.value if hasattr(t_level, "value") else str(t_level)
        b_level_val = b_level.value if hasattr(b_level, "value") else str(b_level)

        # Risks mapping
        risks_dict = {
            "qualityRisk": {
                "score": q_score,
                "level": q_level_val
            },
            "deliveryRisk": {
                "score": d_score,
                "level": d_level_val
            },
            "trustRisk": {
                "score": t_score,
                "level": t_level_val
            },
            "businessRiskIndex": risk_index,
            "overallRiskLevel": b_level_val,
            "riskBreakdown": get_val(business, "breakdown", get_val(business, "riskBreakdown", {}))
        }

        predictions = pipeline_output.get("predictions", [])
        negative_reviews_list = []
        formatted_reviews = []

        if predictions:
            for idx, pred in enumerate(predictions):
                rev_txt = pred.get("review") or pred.get("review_text", "")
                s_val = str(pred.get("sentiment", "NEUTRAL")).upper()
                c_val = float(pred.get("confidence") or pred.get("confidence_score") or 0.85)
                detected = pred.get("detected_aspects", [])
                asp_val = str(detected[0]).upper() if detected else "GENERAL"

                if "NEG" in s_val and rev_txt:
                    negative_reviews_list.append(rev_txt)

                if rev_txt:
                    formatted_reviews.append({
                        "id": pred.get("id", f"rev-{idx+1}"),
                        "reviewText": rev_txt,
                        "sentiment": s_val,
                        "confidenceScore": c_val,
                        "aspect": asp_val,
                    })

        if not negative_reviews_list and scraped_reviews:
            for idx, rev in enumerate(scraped_reviews):
                txt = get_val(rev, "review_text", get_val(rev, "text", ""))
                sent = str(get_val(rev, "sentiment", get_val(rev, "label", "NEUTRAL"))).upper()
                conf = float(get_val(rev, "confidence", get_val(rev, "confidence_score", 0.85)))
                if "NEG" in sent and txt:
                    negative_reviews_list.append(txt)

                if txt:
                    formatted_reviews.append({
                        "id": f"rev-{idx+1}",
                        "reviewText": txt,
                        "sentiment": sent,
                        "confidenceScore": conf,
                        "aspect": "GENERAL",
                    })

        top_structured_reviews = cls.extract_top_reviews_per_class(formatted_reviews, max_per_class=10)

        # Recommendation Mapping
        recommendation = pipeline_output.get("recommendation")
        recommendation_dict = None
        if recommendation is not None:
            rep = getattr(recommendation, "report", None)
            meta = getattr(recommendation, "metadata", None)
            gen_ts = getattr(recommendation, "generated_timestamp", None)
            gen_ts_str = gen_ts.isoformat() if hasattr(gen_ts, "isoformat") else str(gen_ts or "")

            recommendation_dict = {
                "report": {
                    "summary": getattr(rep, "summary", "") if rep else "",
                    "insights": list(getattr(rep, "insights", [])) if rep else [],
                    "actions": list(getattr(rep, "actions", [])) if rep else [],
                },
                "metadata": {
                    "highestPriority": getattr(meta, "highest_priority", "") if meta else "",
                    "recommendationCount": getattr(meta, "recommendation_count", 0) if meta else 0,
                    "generatedAt": getattr(meta, "generated_at", "") if meta else "",
                },
                "generatedTimestamp": gen_ts_str,
                "version": getattr(recommendation, "version", "v1"),
                "processingTimeMs": getattr(recommendation, "processing_time_ms", 0),
            }
        if business and (not recommendation_dict or not recommendation_dict.get("aspects")):
            q_score = float(get_val(quality, "risk_score", get_val(quality, "score", 0.0)))
            d_score = float(get_val(delivery, "risk_score", get_val(delivery, "score", 0.0)))
            t_score = float(get_val(trust, "risk_score", get_val(trust, "score", 0.0)))
            rec_from_fis = cls.generate_recommendation_dict(q_score, d_score, t_score, risk_index, b_level_val)
            if rec_from_fis:
                if recommendation_dict is None:
                    recommendation_dict = rec_from_fis
                else:
                    recommendation_dict["aspects"] = rec_from_fis.get("aspects", {})

        result = {
            "product": product_dict,
            "statistics": statistics_dict,
            "risks": risks_dict,
            "recommendation": recommendation_dict,
            "reviews": top_structured_reviews,
            "negativeReviews": negative_reviews_list[:20],
            "negative_reviews": negative_reviews_list[:20]
        }

        return sanitize_native_types(result)

    @classmethod
    def extract_top_reviews_per_class(cls, reviews_list: list, max_per_class: int = 10) -> list:
        """
        Groups reviews by sentiment class (POSITIVE, NEGATIVE, NEUTRAL),
        sorts each class by confidence score descending,
        and returns at most max_per_class items for each class.
        """
        if not reviews_list:
            return []

        pos_reviews = []
        neg_reviews = []
        neu_reviews = []

        for rev in reviews_list:
            if isinstance(rev, dict):
                sent = str(rev.get("sentiment", "") or "").upper()
                conf = float(rev.get("confidenceScore", 0.0) or rev.get("confidence_score", 0.0) or rev.get("confidence", 0.0) or 0.0)
            else:
                sent = str(getattr(rev, "sentiment", "") or "").upper()
                conf = float(getattr(rev, "confidenceScore", 0.0) or getattr(rev, "confidence_score", 0.0) or getattr(rev, "confidence", 0.0) or 0.0)

            if "POS" in sent:
                pos_reviews.append((conf, rev))
            elif "NEG" in sent:
                neg_reviews.append((conf, rev))
            else:
                neu_reviews.append((conf, rev))

        # Sort each class by confidence score descending
        pos_reviews.sort(key=lambda x: x[0], reverse=True)
        neg_reviews.sort(key=lambda x: x[0], reverse=True)
        neu_reviews.sort(key=lambda x: x[0], reverse=True)

        top_pos = [item[1] for item in pos_reviews[:max_per_class]]
        top_neg = [item[1] for item in neg_reviews[:max_per_class]]
        top_neu = [item[1] for item in neu_reviews[:max_per_class]]

        combined = top_pos + top_neg + top_neu

        def get_conf(rev):
            if isinstance(rev, dict):
                return float(rev.get("confidenceScore", 0.0) or rev.get("confidence_score", 0.0) or rev.get("confidence", 0.0) or 0.0)
            return float(getattr(rev, "confidenceScore", 0.0) or getattr(rev, "confidence_score", 0.0) or getattr(rev, "confidence", 0.0) or 0.0)

        combined.sort(key=get_conf, reverse=True)
        return combined

    @classmethod
    def generate_recommendation_dict(
        cls,
        quality_score: float,
        delivery_score: float,
        trust_score: float,
        business_risk_index: float,
        business_risk_level: str
    ) -> Dict[str, Any]:
        """
        Dynamically generates recommendation payload from FIS scores and risk level.
        """
        try:
            from core.business_risk.models.business_risk_result import BusinessRiskResult
            from core.business_risk.models.aspect_risk import AspectRisk
            from core.business_risk.models.risk_level import RiskLevel
            from core.recommendation.service import RecommendationService

            def parse_level(score: float, lvl_str: str) -> str:
                if lvl_str and str(lvl_str).upper() in ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                    return str(lvl_str).upper()
                score_val = float(score)
                if score_val < 20.0: return "VERY_LOW"
                if score_val < 40.0: return "LOW"
                if score_val < 60.0: return "MEDIUM"
                if score_val < 80.0: return "HIGH"
                return "CRITICAL"

            q_lvl = parse_level(quality_score, "")
            d_lvl = parse_level(delivery_score, "")
            t_lvl = parse_level(trust_score, "")
            b_lvl_str = parse_level(business_risk_index, business_risk_level)

            try:
                b_lvl_enum = RiskLevel[b_lvl_str]
            except Exception:
                b_lvl_enum = RiskLevel.MEDIUM

            br_result = BusinessRiskResult(
                quality=AspectRisk(aspect="quality", score=float(quality_score), level=q_lvl),
                delivery=AspectRisk(aspect="delivery", score=float(delivery_score), level=d_lvl),
                trust=AspectRisk(aspect="trust", score=float(trust_score), level=t_lvl),
                business_risk_index=float(business_risk_index),
                business_risk_level=b_lvl_enum,
            )

            rec_service = RecommendationService()
            rec_obj = rec_service.generate_recommendation(br_result)

            rep = getattr(rec_obj, "report", None)
            meta = getattr(rec_obj, "metadata", None)
            gen_ts = getattr(rec_obj, "generated_timestamp", None)
            gen_ts_str = gen_ts.isoformat() if hasattr(gen_ts, "isoformat") else str(gen_ts or "")

            aspects_dict = {}
            try:
                from core.recommendation.knowledge.knowledge_base import RecommendationKnowledgeBase
                kb = getattr(rec_service.engine.selector, "knowledge_base", None) or RecommendationKnowledgeBase()
                if not getattr(kb, "_initialized", False):
                    kb.initialize()

                def build_aspect_rec(aspect_key: str, level_val: str, default_benefits: list):
                    rules = kb.get_rules(aspect_key, level_val)
                    if not rules:
                        rules = kb.get_rules(aspect_key, "MEDIUM") or kb.get_general_rules("MEDIUM")
                    if not rules:
                        return None

                    # Dynamically and randomly pick one primary rule among the valid knowledge-base rules
                    primary = random.choice(rules)

                    # Gather actions, prioritizing the chosen primary rule's actions and supplementing with others
                    collected_actions = list(primary.actions)
                    other_rules = [r for r in rules if r.id != primary.id]
                    random.shuffle(other_rules)
                    for r in other_rules:
                        for act in r.actions:
                            if act not in collected_actions:
                                collected_actions.append(act)
                            if len(collected_actions) >= 5:
                                break
                        if len(collected_actions) >= 5:
                            break

                    # Provide all matching candidates so UI can also dynamically rotate
                    candidates_data = [
                        {
                            "id": r.id,
                            "title": r.title,
                            "description": r.description,
                            "priority": r.priority,
                            "actions": list(r.actions),
                            "reasoning": r.reasoning,
                        }
                        for r in rules
                    ]

                    return {
                        "aspect": aspect_key,
                        "riskLevel": level_val,
                        "title": primary.title,
                        "description": primary.description,
                        "priority": primary.priority,
                        "actions": collected_actions[:5],
                        "reasoning": primary.reasoning,
                        "achievements": default_benefits,
                        "candidates": candidates_data,
                    }

                aspects_dict["DELIVERY"] = build_aspect_rec(
                    "DELIVERY", d_lvl, [
                        "More reliable delivery performance",
                        "Fewer customer complaints",
                        "Improved customer satisfaction",
                        "Stronger reputation for your business"
                    ]
                )
                aspects_dict["QUALITY"] = build_aspect_rec(
                    "QUALITY", q_lvl, [
                        "Higher product quality consistency",
                        "Fewer return and refund requests",
                        "Improved customer ratings and loyalty",
                        "Lower customer support overhead"
                    ]
                )
                aspects_dict["TRUST"] = build_aspect_rec(
                    "TRUST", t_lvl, [
                        "Stronger buyer confidence and credibility",
                        "Protection against marketplace flags",
                        "Higher conversion and customer retention",
                        "Elevated marketplace brand reputation"
                    ]
                )
            except Exception as kb_err:
                logger.warning(f"Failed to assemble aspect-level recommendations: {kb_err}")
                aspects_dict = {}

            return {
                "report": {
                    "summary": getattr(rep, "summary", "") if rep else "",
                    "insights": list(getattr(rep, "insights", [])) if rep else [],
                    "actions": list(getattr(rep, "actions", [])) if rep else [],
                },
                "metadata": {
                    "highestPriority": getattr(meta, "highest_priority", "") if meta else "",
                    "recommendationCount": getattr(meta, "recommendation_count", 0) if meta else 0,
                    "generatedAt": getattr(meta, "generated_at", "") if meta else "",
                },
                "aspects": aspects_dict,
                "generatedTimestamp": gen_ts_str,
                "version": getattr(rec_obj, "version", "v1"),
                "processingTimeMs": getattr(rec_obj, "processing_time_ms", 0),
            }
        except Exception as e:
            logger.error(f"Error in generate_recommendation_dict: {e}", exc_info=True)
            return None
