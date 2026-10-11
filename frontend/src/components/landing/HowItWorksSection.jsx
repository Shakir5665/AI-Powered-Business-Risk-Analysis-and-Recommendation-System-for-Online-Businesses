import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight, Check, Link2, Search, Brain, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bgImage from "../../assets/background.png";
import Step1 from "../../assets/Step1.png";
import Step2 from "../../assets/Step2.png";
import Step3 from "../../assets/Step3.png";
import Step4 from "../../assets/Step4.png";

const steps = [
  {
    id: 1,
    label: "Paste Product URL",
    icon: Link2,
    heading: "Paste Your Product URL",
    subheading: "Simply copy and paste any product link from supported e-commerce platforms like Daraz. No setup required — our system instantly validates and fetches the product data.",
    list: [
      "Supports major e-commerce platforms",
      "Instant URL validation & product preview",
      "Zero technical knowledge required",
    ],
    imgSrc: Step1,
  },
  {
    id: 2,
    label: "AI Fetches Reviews",
    icon: Search,
    heading: "AI Fetches Customer Reviews",
    subheading: "Our automated scraping engine collects and processes all available customer reviews from the product page, giving you a comprehensive dataset for analysis.",
    list: [
      "Automated intelligent web scraping",
      "Large-scale review collection",
      "Real-time data processing pipeline",
    ],
    imgSrc: Step2,
  },
  {
    id: 3,
    label: "AI Performs Analysis",
    icon: Brain,
    heading: "AI Performs Business Risk Analysis",
    subheading: "Advanced NLP and machine learning models analyze the reviews to extract sentiments, detect risk patterns, calculate your Business Risk Index, and identify key strengths and weaknesses.",
    list: [
      "Aspect-Based Sentiment Analysis (ABSA)",
      "Business Risk Index (BRI) calculation",
      "Complaint frequency & strength detection",
    ],
    imgSrc: Step3,
  },
  {
    id: 4,
    label: "View Insights & Recommendations",
    icon: BarChart2,
    heading: "View Insights & Recommendations",
    subheading: "Access your full analysis through an interactive dashboard with visual charts, risk breakdowns, evidence-based quotes, and AI-generated action plans tailored to your product.",
    list: [
      "Interactive visual analytics dashboard",
      "AI-generated strategic recommendations",
      "Evidence-backed customer quotes",
    ],
    imgSrc: Step4,
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function HowItWorksSection({ className }) {
  const [activeTab, setActiveTab] = useState(1);
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const activeStep = steps.find((s) => s.id === activeTab) || steps[0];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet" crossOrigin="anonymous" />

      <section
        id="how-it-works"
        className={"w-full bg-[#F6FDFF] py-20 lg:py-32 overflow-hidden " + (className || "")}
      >
        <div className="w-full max-w-[1248px] mx-auto relative px-4 md:px-6">
          <div className="flex flex-col items-start gap-12 lg:gap-16">

            {/* Header Area */}
            <div className="flex flex-col items-start">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#198F38]/10 bg-[#198F38]/5 whitespace-nowrap mb-6"
              >
                <Sparkles className="w-4 h-4 text-[#198F38]" strokeWidth={2.5} />
                <span className="text-[#198F38] text-center font-inter text-base font-normal leading-6 tracking-[-0.3px]">
                  Process
                </span>
              </motion.div>

              <motion.h2
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-[#042718] text-[32px] sm:text-[44px] lg:text-[52px] font-semibold leading-tight lg:leading-[58px] tracking-[-1.2px] lg:tracking-[-1.8px] w-full lg:max-w-[556px] text-left"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                Analyze business risk
                <br className="block lg:hidden" />
                {" in "}
                <span
                  className="text-black/40 font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                >
                  4 simple
                </span>{" "}
                steps
              </motion.h2>
            </div>

            {/* Tabs and Card Container */}
            <div className="w-full flex flex-col gap-6">
              {/* Tab Selection Row */}
              <div className="w-full">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="w-full bg-white p-4 lg:px-6 lg:py-4 rounded-2xl shadow-[0_1px_20px_0_rgba(4,39,24,0.04)] flex items-center lg:justify-between gap-2 overflow-x-auto overflow-y-hidden snap-x"
                >
                  {steps.map((step) => {
                    const isActive = activeTab === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => setActiveTab(step.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 sm:px-6 py-2.5 rounded-xl transition-all duration-300 shrink-0 snap-start",
                          isActive ? "bg-white" : "hover:bg-[#F6FDFF]"
                        )}
                      >
                        <step.icon
                          className={cn("w-[22px] h-[22px]", isActive ? "text-[#198F38]" : "text-[#042718]/60")}
                          strokeWidth={2.5}
                        />
                        <span
                          className={cn(
                            "font-inter text-base sm:text-[18px] leading-[28px] whitespace-nowrap",
                            isActive ? "text-[#198F38] font-medium" : "text-[#042718]/60 font-normal"
                          )}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Main Content Card */}
              <div className="w-full">
                <div className="w-full bg-white rounded-[32px] border border-[#042718]/[0.04] shadow-[0_0_20px_0_rgba(4,39,24,0.04)] flex flex-col lg:flex-row items-center justify-between p-6 lg:pt-4 lg:pr-4 lg:pb-4 lg:pl-16 gap-12 lg:gap-0 overflow-hidden">

                  {/* Left Column: Text Info */}
                  <div className="w-full lg:w-[534px] flex flex-col items-start text-left">
                    <motion.div
                      key={"icon-" + activeTab}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 rounded-xl border border-[#042718]/10 bg-white shadow-sm flex items-center justify-center p-4 mb-3"
                    >
                      <activeStep.icon className="w-8 h-8 text-[#198F38]" strokeWidth={2.5} />
                    </motion.div>

                    <motion.h3
                      key={"h3-" + activeTab}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#042718] text-[28px] lg:text-[34px] font-semibold leading-tight lg:leading-[38px] tracking-[-1px] mb-4"
                      style={{ fontFamily: "'Onest', sans-serif" }}
                    >
                      {activeStep.heading}
                    </motion.h3>

                    <motion.p
                      key={"p-" + activeTab}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      className="text-[#042718] font-inter text-base lg:text-[18px] font-normal leading-relaxed lg:leading-[28px] opacity-80 mb-8"
                    >
                      {activeStep.subheading}
                    </motion.p>

                    <div className="flex flex-col gap-3 mb-12">
                      {activeStep.list.map((item, i) => (
                        <motion.div
                          key={"li-" + activeTab + "-" + i}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#198F38]/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-[#198F38]" strokeWidth={3} />
                          </div>
                          <span className="text-[#042718] font-inter text-base font-medium leading-6 tracking-[-0.3px]">
                            {item}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <motion.button
                      onMouseEnter={() => setIsHoveringBtn(true)}
                      onMouseLeave={() => setIsHoveringBtn(false)}
                      layout
                      onClick={() => navigate("/register")}
                      className={cn(
                        "flex items-center gap-3 py-2 rounded-full bg-[#042718] group cursor-pointer relative h-14 transition-all duration-300",
                        isHoveringBtn ? "flex-row-reverse pl-2 pr-5" : "flex-row pl-5 pr-2"
                      )}
                    >
                      <motion.span
                        layout
                        className="font-inter text-base lg:text-[18px] font-medium leading-[28px] text-white"
                      >
                        Analyze Product
                      </motion.span>

                      <motion.div
                        layout
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden"
                      >
                        <motion.div
                          animate={{
                            x: isHoveringBtn ? [-20, 0] : 0,
                            opacity: isHoveringBtn ? [0, 1] : 1
                          }}
                          transition={{ duration: 0.3, delay: isHoveringBtn ? 0.1 : 0 }}
                        >
                          <ArrowUpRight className="w-4 h-4 text-[#042718]" />
                        </motion.div>
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Right Column: UI Card */}
                  <div className="w-full lg:w-[516px] h-[400px] sm:h-[500px] lg:h-[560px] relative rounded-[24px] overflow-hidden flex items-center justify-center">
                    {/* Video BG */}
                    <div className="absolute inset-0 z-0">
                      {isMounted && (
                        <img
                          src={bgImage}
                          alt="Background"
                          className="w-full h-full object-cover opacity-60"
                        />
                      )}
                    </div>

                    {/* Dynamic Image */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={"img-" + activeTab}
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.1, opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 w-full flex items-center justify-center p-6 lg:p-0"
                      >
                        <img
                          src={activeStep.imgSrc}
                          alt={activeStep.heading}
                          className="w-full max-w-[384px] h-auto object-contain drop-shadow-2xl"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
