import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bgImage from "../../assets/background.png";

const plans = [
  {
    name: "Starter Plan",
    description: "Perfect for individual sellers getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "5 product analyses per month",
      "Basic Business Risk Index (BRI)",
      "Sentiment analysis overview",
      "Aspect breakdown summary",
      "Export analysis as PDF",
    ],
  },
  {
    name: "Pro Plan",
    description: "Best for growing businesses & active sellers",
    monthlyPrice: 29,
    yearlyPrice: 22,
    features: [
      "Everything in Starter Plan",
      "50 product analyses per month",
      "Full Aspect-Based Analysis (ABSA)",
      "AI-generated recommendations",
      "Evidence-based customer quotes",
    ],
  },
  {
    name: "Business Plan",
    description: "Built for teams, researchers & enterprises",
    monthlyPrice: 79,
    yearlyPrice: 60,
    features: [
      "Everything in Pro Plan",
      "Unlimited product analyses",
      "Team access & collaboration",
      "Advanced analytics dashboard",
      "Priority support & API access",
    ],
  },
];

function PricingCard({ plan, isVisualActive, onClick, onMouseEnter, onMouseLeave, isMonthly }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const price = isMonthly ? plan.monthlyPrice : plan.yearlyPrice;
  const navigate = useNavigate();

  return (
    <motion.div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        "relative flex flex-col items-start w-full lg:w-[404px] p-[32px] rounded-[30px] border transition-all duration-500 overflow-hidden cursor-pointer group " +
        (isVisualActive ? "border-transparent shadow-2xl" : "border-[#042718]/08 bg-white")
      }
      animate={{ y: isVisualActive ? -10 : 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.45, 0.32, 0.9] }}
    >
      <AnimatePresence>
        {isVisualActive && (
          <motion.div
            key="active-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0"
          >
            <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#D4E8E1]/15 backdrop-blur-[4px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full flex flex-col">
        <div className="flex flex-col gap-[6px]">
          <h3
            className="text-[#042718] text-[28px] font-semibold leading-[34px] tracking-[-0.8px]"
            style={{ fontFamily: "'Onest', sans-serif" }}
          >
            {plan.name}
          </h3>
          <p className="text-[#042718] font-inter text-[16px] font-normal leading-[24px] tracking-[-0.3px] opacity-80">
            {plan.description}
          </p>
        </div>

        <div className={"mt-[16px] border-t w-full transition-colors duration-300 " + (isVisualActive ? "border-[#042718]/20" : "border-[#042718]/08")} />

        <div className="mt-[16px] flex flex-col">
          <div className="flex items-baseline">
            {price === 0 ? (
              <span
                className="text-[#042718] text-[56px] font-semibold leading-[64px] tracking-[-2px]"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                Free
              </span>
            ) : (
              <span
                className="text-[#042718] text-[56px] font-semibold leading-[64px] tracking-[-2px]"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                ${price}
              </span>
            )}
          </div>
          <p className="mt-[16px] text-[#042718] font-inter text-[18px] font-normal leading-[28px] tracking-[-0.3px] opacity-80">
            {price === 0 ? "No credit card required" : "Monthly subscription"}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClick(); navigate("/register"); }}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          className={
            "mt-[24px] flex items-center justify-between self-stretch rounded-full border transition-all duration-500 relative overflow-hidden " +
            (isBtnHovered || isVisualActive ? "bg-[#042718] border-[#042718] text-white" : "bg-white border-[#042718]/10 text-[#042718]") +
            " " +
            (isBtnHovered ? "p-[8px_20px_8px_8px] flex-row-reverse" : "p-[8px_8px_8px_20px] flex-row")
          }
        >
          <motion.span layout className="font-inter text-[18px] font-medium leading-[28px] z-10">
            {price === 0 ? "Start for Free" : "Get Started"}
          </motion.span>
          <motion.div
            layout
            className={
              "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 z-10 " +
              (isBtnHovered || isVisualActive ? "bg-white" : "bg-[#042718]")
            }
          >
            <ArrowUpRight
              size={18}
              strokeWidth={2.5}
              className={"transition-colors duration-300 " + (isBtnHovered || isVisualActive ? "text-[#042718]" : "text-white")}
            />
          </motion.div>
        </button>

        <div className="mt-[24px] flex flex-col">
          <p
            className={
              "font-inter text-[14px] font-medium leading-[20px] uppercase transition-colors duration-300 " +
              (isVisualActive ? "text-white opacity-70" : "text-[#042718]/40")
            }
          >
            FEATURES
          </p>

          <ul className="mt-[16px] flex flex-col gap-[12px]">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div
                  className={
                    "mt-1 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500 " +
                    (isVisualActive ? "bg-white" : "bg-transparent")
                  }
                >
                  <Check
                    size={14}
                    strokeWidth={3.5}
                    className={isVisualActive ? "text-[#042718]" : "text-[#15803D]"}
                  />
                </div>
                <span
                  className={
                    "font-inter text-[18px] font-normal leading-[28px] tracking-[-0.3px] transition-colors duration-300 " +
                    (isVisualActive ? "text-white" : "text-[#042718]/80")
                  }
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export default function PricingSection({ className }) {
  const [isMonthly, setIsMonthly] = useState(true);
  const [activePlan, setActivePlan] = useState("Pro Plan");
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Onest:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap" rel="stylesheet" />

      <section
        id="pricing"
        className={"w-full bg-[#ffffff] py-20 lg:py-32 overflow-hidden flex justify-center " + (className || "")}
      >
        <div className="w-full max-w-[1248px] lg:px-0 px-6 flex flex-col items-center">

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E5F2ED] border border-[#042718]/08"
          >
            <Sparkles size={14} strokeWidth={3} className="text-[#15803D]" />
            <span className="font-inter text-sm font-medium text-[#15803D]">Pricing Plan</span>
          </motion.div>

          <motion.h2
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 w-full max-w-[800px] text-center text-[#042718] text-[36px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.1] tracking-[-2px] sm:tracking-[-3px]"
            style={{ fontFamily: "'Onest', sans-serif" }}
          >
            Choose the{" "}
            <span
              className="font-medium text-black/40"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              plan
            </span>{" "}
            that fits your business needs
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 w-full max-w-[600px] text-center font-inter text-[16px] sm:text-[18px] font-normal leading-[24px] sm:leading-[28px] text-[#042718] opacity-80"
          >
            Simple, transparent pricing to help you analyze, monitor, and reduce business risk with confidence.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex items-center p-1.5 bg-white border border-[#042718]/08 rounded-full shadow-sm mb-16"
          >
            <button
              onClick={() => setIsMonthly(true)}
              className={
                "px-8 py-2 h-11 flex items-center justify-center rounded-full text-[15px] font-medium transition-all duration-300 " +
                (isMonthly ? "bg-[#042718] text-white shadow-md shadow-[#042718]/10" : "text-[#042718]/60 hover:text-[#042718]")
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setIsMonthly(false)}
              className={
                "px-8 py-2 h-11 flex items-center justify-center rounded-full text-[15px] font-medium transition-all duration-300 gap-2 " +
                (!isMonthly ? "bg-[#042718] text-white shadow-md shadow-[#042718]/10" : "text-[#042718]/60 hover:text-[#042718]")
              }
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-[#22C55E] text-[10px] text-white font-bold whitespace-nowrap">
                Save 24%
              </span>
            </button>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6 w-full justify-center">
            {plans.map((plan, idx) => {
              const isVisualActive = hoveredPlan ? hoveredPlan === plan.name : activePlan === plan.name;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 + idx * 0.1, ease: [0.21, 0.45, 0.32, 0.9] }}
                  className="w-full lg:w-auto"
                >
                  <PricingCard
                    plan={plan}
                    isMonthly={isMonthly}
                    isVisualActive={mounted && isVisualActive}
                    onClick={() => setActivePlan(plan.name)}
                    onMouseEnter={() => setHoveredPlan(plan.name)}
                    onMouseLeave={() => setHoveredPlan(null)}
                  />
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}
