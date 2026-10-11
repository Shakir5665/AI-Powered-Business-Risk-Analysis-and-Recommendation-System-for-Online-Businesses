# -*- coding: utf-8 -*-
"""
=============================================================
  BRI Fuzzy Inference System -- Research Evaluation Suite
=============================================================

Covers:
  1. Rule-by-Rule Validation       -- Verifies all 9 rules per FIS
  2. Boundary & Sensitivity Tests  -- Tests extreme and mid-point inputs
  3. Monotonicity Test             -- Confirms risk rises as inputs rise
  4. BRI Aggregation Tests         -- Verifies max-score logic
  5. Business Rule Engine Tests    -- Verifies Tier-1/2/3 override rules
  6. Summary Report                -- Prints a research-ready results table

Run with:
    python -m tests.business_risk.evaluate_fis
    OR
    python tests/business_risk/evaluate_fis.py
"""

from dataclasses import dataclass
from typing import Optional

from core.business_risk.aggregation.aggregation_result import AggregationResult
from core.business_risk.calculator.business_risk_calculator import BusinessRiskCalculator
from core.business_risk.fuzzy.delivery_fis import DeliveryFIS
from core.business_risk.fuzzy.quality_fis import QualityFIS
from core.business_risk.fuzzy.trust_fis import TrustFIS
from core.business_risk.models.aspect_risk import AspectRisk
from core.business_risk.models.risk_level import RiskLevel


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def make_aspect(name: str, score: float, level: RiskLevel) -> AspectRisk:
    return AspectRisk(aspect=name, score=score, level=level)


def empty_aggregation() -> AggregationResult:
    return AggregationResult()


@dataclass
class TestResult:
    test_id: str
    category: str
    description: str
    passed: bool
    actual: str
    expected: str
    note: str = ""


RESULTS: list[TestResult] = []
calculator = BusinessRiskCalculator()


def run_test(
    test_id: str,
    category: str,
    description: str,
    actual,
    expected,
    note: str = "",
) -> bool:
    passed = actual == expected
    RESULTS.append(TestResult(
        test_id=test_id,
        category=category,
        description=description,
        passed=passed,
        actual=str(actual),
        expected=str(expected),
        note=note,
    ))
    status = "[PASS]" if passed else "[FAIL]"
    print(f"  [{status}] {test_id}: {description}")
    if not passed:
        print(f"           Expected={expected}  Got={actual}")
    return passed


# ==================================================================
# SECTION 1 -- Rule-by-Rule FIS Validation
# ==================================================================

def section_1_rule_validation():
    print("\n" + "=" * 65)
    print("  SECTION 1 -- Rule-by-Rule Validation (Trust / Quality / Delivery)")
    print("=" * 65)

    # All three FIS share the same 9-rule structure
    fis_cases = [
        ("TrustFIS",    TrustFIS()),
        ("QualityFIS",  QualityFIS()),
        ("DeliveryFIS", DeliveryFIS()),
    ]

    # (mention_ratio, negative_strength) -> expected level
    # Directly maps to the 3×3 rule table
    rule_table = [
        (0.10, 0.10, RiskLevel.VERY_LOW,  "R1: LOW×LOW   -> VERY_LOW"),
        (0.10, 0.50, RiskLevel.LOW,       "R2: LOW×MED   -> LOW"),
        (0.10, 0.90, RiskLevel.MEDIUM,    "R3: LOW×HIGH  -> MEDIUM"),
        (0.50, 0.10, RiskLevel.LOW,       "R4: MED×LOW   -> LOW"),
        (0.50, 0.50, RiskLevel.MEDIUM,    "R5: MED×MED   -> MEDIUM"),
        (0.50, 0.90, RiskLevel.HIGH,      "R6: MED×HIGH  -> HIGH"),
        (0.90, 0.10, RiskLevel.MEDIUM,    "R7: HIGH×LOW  -> MEDIUM"),
        (0.90, 0.50, RiskLevel.HIGH,      "R8: HIGH×MED  -> HIGH"),
        (0.90, 0.90, RiskLevel.CRITICAL,  "R9: HIGH×HIGH -> CRITICAL"),
    ]

    for fis_name, fis in fis_cases:
        print(f"\n  [{fis_name}]")
        for i, (mr, ns, expected_level, rule_label) in enumerate(rule_table, 1):
            result = fis.evaluate(
                mention_ratio=mr,
                average_negative_strength=ns,
            )
            run_test(
                test_id=f"1.{fis_name[:1]}{i}",
                category="Rule Validation",
                description=f"{fis_name} {rule_label}",
                actual=result.level,
                expected=expected_level,
                note=f"score={result.score:.2f}",
            )


# ==================================================================
# SECTION 2 -- Score Range Validation
# ==================================================================

def section_2_score_ranges():
    print("\n" + "=" * 65)
    print("  SECTION 2 -- Score Range Validation")
    print("=" * 65)

    fis = TrustFIS()

    cases = [
        (0.05, 0.05, (0,  20),  "Extreme low inputs  -> score in VERY_LOW band  [0-20]"),
        (0.10, 0.90, (20, 60),  "Sparse but severe   -> score in LOW-MEDIUM band [20-60]"),
        (0.50, 0.50, (35, 65),  "Mid-point inputs    -> score in MEDIUM band     [35-65]"),
        (0.90, 0.50, (55, 80),  "Widespread, medium  -> score in HIGH band       [55-80]"),
        (0.95, 0.95, (80, 100), "Extreme high inputs -> score in CRITICAL band   [80-100]"),
    ]

    print("\n  [TrustFIS -- Score Range Checks]")
    for i, (mr, ns, (lo, hi), desc) in enumerate(cases, 1):
        result = fis.evaluate(mention_ratio=mr, average_negative_strength=ns)
        in_range = lo <= result.score <= hi
        run_test(
            test_id=f"2.{i}",
            category="Score Range",
            description=desc,
            actual=f"{result.score:.2f} in [{lo},{hi}]={in_range}",
            expected=f"{result.score:.2f} in [{lo},{hi}]=True",
            note=f"level={result.level}",
        )


# ==================================================================
# SECTION 3 -- Monotonicity Test
# ==================================================================

def section_3_monotonicity():
    """
    As mention_ratio and negative_strength both increase from 0->1,
    the risk score must be non-decreasing (monotonic).
    """
    print("\n" + "=" * 65)
    print("  SECTION 3 -- Monotonicity Verification")
    print("=" * 65)

    fis_cases = [
        ("TrustFIS",    TrustFIS()),
        ("QualityFIS",  QualityFIS()),
        ("DeliveryFIS", DeliveryFIS()),
    ]

    steps = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

    for fis_name, fis in fis_cases:
        print(f"\n  [{fis_name} -- diagonal sweep mention_ratio = negative_strength]")
        scores = []
        for v in steps:
            # Clamp to valid range (avoid 0.0 and 1.0 exactly at boundaries)
            v_safe = max(0.01, min(0.99, v))
            r = fis.evaluate(mention_ratio=v_safe, average_negative_strength=v_safe)
            scores.append((v_safe, r.score, r.level))

        # Check monotonicity
        violations = []
        for j in range(1, len(scores)):
            if scores[j][1] < scores[j - 1][1] - 1.0:   # allow 1-pt float tolerance
                violations.append((scores[j - 1], scores[j]))

        is_monotonic = len(violations) == 0
        print(f"    Scores: {[round(s[1], 1) for s in scores]}")
        run_test(
            test_id=f"3.{fis_name[:1]}",
            category="Monotonicity",
            description=f"{fis_name} score is non-decreasing along diagonal",
            actual=is_monotonic,
            expected=True,
            note=f"violations={violations}",
        )


# ==================================================================
# SECTION 4 -- BRI Aggregation (Max Logic)
# ==================================================================

def section_4_bri_aggregation():
    print("\n" + "=" * 65)
    print("  SECTION 4 -- BRI Aggregation (Max-Score Strategy)")
    print("=" * 65)

    cases = [
        # (q_score, q_lvl, d_score, d_lvl, t_score, t_lvl, expected_bri)
        (10, RiskLevel.VERY_LOW,  12, RiskLevel.VERY_LOW,  8,  RiskLevel.VERY_LOW,  12,  "All VERY_LOW -> BRI = max(10,12,8) = 12"),
        (30, RiskLevel.LOW,       25, RiskLevel.LOW,        22, RiskLevel.LOW,        30,  "All LOW      -> BRI = max(30,25,22) = 30"),
        (55, RiskLevel.MEDIUM,    40, RiskLevel.MEDIUM,     48, RiskLevel.MEDIUM,     55,  "All MEDIUM   -> BRI = max(55,40,48) = 55"),
        (72, RiskLevel.HIGH,      45, RiskLevel.MEDIUM,     35, RiskLevel.LOW,        72,  "Dominant Q   -> BRI = max(72,45,35) = 72"),
        (30, RiskLevel.LOW,       30, RiskLevel.LOW,        95, RiskLevel.CRITICAL,   95,  "Dominant T   -> BRI = max(30,30,95) = 95"),
        (80, RiskLevel.CRITICAL,  82, RiskLevel.CRITICAL,   30, RiskLevel.LOW,        82,  "Two critical -> BRI = max(80,82,30) = 82"),
    ]

    for i, (qs, ql, ds, dl, ts, tl, exp_bri, desc) in enumerate(cases, 1):
        result = calculator.calculate(
            aggregation=empty_aggregation(),
            quality=make_aspect("quality",  qs, ql),
            delivery=make_aspect("delivery", ds, dl),
            trust=make_aspect("trust",    ts, tl),
        )
        run_test(
            test_id=f"4.{i}",
            category="BRI Aggregation",
            description=desc,
            actual=round(result.business_risk_index, 1),
            expected=float(exp_bri),
        )


# ==================================================================
# SECTION 5 -- Business Rule Engine (Tier 1 / 2 / 3)
# ==================================================================

def section_5_business_rules():
    print("\n" + "=" * 65)
    print("  SECTION 5 -- Business Rule Engine Override Rules")
    print("=" * 65)

    cases = [
        # Tier 1
        (
            make_aspect("quality",  40, RiskLevel.MEDIUM),
            make_aspect("delivery", 35, RiskLevel.LOW),
            make_aspect("trust",    95, RiskLevel.CRITICAL),
            RiskLevel.CRITICAL,
            "Tier-1: Trust=CRITICAL, others<HIGH -> Overall=CRITICAL",
        ),
        (
            make_aspect("quality",  95, RiskLevel.CRITICAL),
            make_aspect("delivery", 35, RiskLevel.LOW),
            make_aspect("trust",    30, RiskLevel.LOW),
            RiskLevel.HIGH,
            "Tier-1: Quality=CRITICAL, others<HIGH -> Overall=HIGH",
        ),
        (
            make_aspect("quality",  30, RiskLevel.LOW),
            make_aspect("delivery", 90, RiskLevel.CRITICAL),
            make_aspect("trust",    40, RiskLevel.MEDIUM),
            RiskLevel.HIGH,
            "Tier-1: Delivery=CRITICAL, others<HIGH -> Overall=HIGH",
        ),
        # Tier 2
        (
            make_aspect("quality",  75, RiskLevel.HIGH),
            make_aspect("delivery", 80, RiskLevel.HIGH),
            make_aspect("trust",    30, RiskLevel.LOW),
            RiskLevel.CRITICAL,
            "Tier-2: >=2 aspects=HIGH -> Overall=CRITICAL",
        ),
        (
            make_aspect("quality",  75, RiskLevel.HIGH),
            make_aspect("delivery", 30, RiskLevel.LOW),
            make_aspect("trust",    85, RiskLevel.CRITICAL),
            RiskLevel.CRITICAL,
            "Tier-2: Q=HIGH + T=CRITICAL (>=2 HIGH+) -> Overall=CRITICAL",
        ),
        # Tier 3
        (
            make_aspect("quality",  5,  RiskLevel.VERY_LOW),
            make_aspect("delivery", 8,  RiskLevel.VERY_LOW),
            make_aspect("trust",    12, RiskLevel.VERY_LOW),
            RiskLevel.VERY_LOW,
            "Tier-3: All=VERY_LOW -> Overall=VERY_LOW",
        ),
        (
            make_aspect("quality",  25, RiskLevel.LOW),
            make_aspect("delivery", 22, RiskLevel.LOW),
            make_aspect("trust",    28, RiskLevel.LOW),
            RiskLevel.LOW,
            "Tier-3: All=LOW -> Overall=LOW",
        ),
        (
            make_aspect("quality",  50, RiskLevel.MEDIUM),
            make_aspect("delivery", 55, RiskLevel.MEDIUM),
            make_aspect("trust",    48, RiskLevel.MEDIUM),
            RiskLevel.MEDIUM,
            "Tier-3: All=MEDIUM -> Overall=MEDIUM",
        ),
    ]

    for i, (q, d, t, expected_level, desc) in enumerate(cases, 1):
        result = calculator.calculate(
            aggregation=empty_aggregation(),
            quality=q,
            delivery=d,
            trust=t,
        )
        run_test(
            test_id=f"5.{i}",
            category="Business Rule Engine",
            description=desc,
            actual=result.business_risk_level,
            expected=expected_level,
        )


# ==================================================================
# SECTION 6 -- Sensitivity Analysis (mention_ratio sweep)
# ==================================================================

def section_6_sensitivity():
    """
    Hold negative_strength constant, sweep mention_ratio from 0->1.
    Documents how risk score changes -- useful for research discussion.
    """
    print("\n" + "=" * 65)
    print("  SECTION 6 -- Sensitivity Analysis (printed, no pass/fail)")
    print("=" * 65)

    fis = TrustFIS()
    strengths = [0.20, 0.50, 0.80]
    sweep = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]

    header = f"  {'Mention':>8} | " + " | ".join(f"Str={s:.2f}" for s in strengths)
    print(f"\n  TrustFIS -- Risk Score as mention_ratio increases")
    print("  " + "-" * (len(header) - 2))
    print(header)
    print("  " + "-" * (len(header) - 2))

    for mr in sweep:
        row = f"  {mr:>8.2f} | "
        row += " | ".join(
            f"{fis.evaluate(mention_ratio=mr, average_negative_strength=s).score:>8.2f}"
            for s in strengths
        )
        print(row)

    print("\n  (Higher strength = faster risk escalation as mention_ratio rises)")


# ==================================================================
# SUMMARY REPORT
# ==================================================================

def print_summary():
    print("\n" + "=" * 65)
    print("  EVALUATION SUMMARY")
    print("=" * 65)

    total   = len(RESULTS)
    passed  = sum(1 for r in RESULTS if r.passed)
    failed  = total - passed

    print(f"\n  Total Tests : {total}")
    print(f"  Passed      : {passed}  (OK)")
    print(f"  Failed      : {failed}  (!!!)")
    print(f"  Pass Rate   : {passed/total*100:.1f}%\n")

    categories = {}
    for r in RESULTS:
        categories.setdefault(r.category, []).append(r)

    print(f"  {'Category':<30} {'Pass':>5} {'Total':>6} {'Rate':>7}")
    print("  " + "-" * 52)
    for cat, results in categories.items():
        p = sum(1 for r in results if r.passed)
        t = len(results)
        print(f"  {cat:<30} {p:>5} {t:>6} {p/t*100:>6.1f}%")

    if failed > 0:
        print("\n  FAILED TESTS:")
        for r in RESULTS:
            if not r.passed:
                print(f"    [FAIL] [{r.test_id}] {r.description}")
                print(f"       Expected: {r.expected}")
                print(f"       Actual  : {r.actual}")
    else:
        print("\n  All tests passed -- FIS system behaves as designed.")

    print("=" * 65)


# ==================================================================
# MAIN
# ==================================================================

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("  BRI Fuzzy Inference System -- Research Evaluation Suite")
    print("=" * 65)

    section_1_rule_validation()
    section_2_score_ranges()
    section_3_monotonicity()
    section_4_bri_aggregation()
    section_5_business_rules()
    section_6_sensitivity()
    print_summary()
