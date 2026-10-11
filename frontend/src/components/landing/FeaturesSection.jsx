import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, ShieldAlert, PieChart, TrendingUp, Sparkles } from "lucide-react";
import bgImage from "../../assets/background.png";
import feature1 from "../../assets/feature1.png";
import feature2 from "../../assets/feature2.png";
import feature3 from "../../assets/feature3.png";
import feature4 from "../../assets/feature4.png";

function FeatureCard({ title, description, icon: Icon, uiSrc, className = "", delay = 0, isMounted = false }) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.45, 0.32, 0.9] }}
      className={"flex flex-col items-start shrink-0 border border-[#042718]/10 overflow-hidden bg-white group w-full rounded-[24px] sm:rounded-[32px] " + (className || "")}
    >
      <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[440px] overflow-hidden flex items-center justify-center p-6 sm:p-8 bg-[#F9FAFB]">
        {isMounted && (
          <img
            src={bgImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
          />
        )}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img
            src={uiSrc}
            alt={title}
            className="h-full w-full object-contain pointer-events-none select-none transition-all duration-500 group-hover:translate-y-[-10px]"
          />
        </div>
      </div>

      <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-start gap-5 self-stretch bg-white">
        <div className="w-10 h-10 p-2 flex items-center justify-center border border-[#198F38]/20 bg-[#198F38]/5 rounded-lg shrink-0">
          <Icon className="w-6 h-6 text-[#198F38]" strokeWidth={3} />
        </div>
        <div className="flex flex-col gap-[10px]">
          <h3
            className="text-[#042718] text-xl sm:text-2xl font-semibold leading-tight sm:leading-[30px] tracking-[-0.8px]"
            style={{ fontFamily: "'Onest', sans-serif" }}
          >
            {title}
          </h3>
          <p className="text-[#042718] font-inter text-base sm:text-lg font-normal leading-relaxed sm:leading-[28px] opacity-80">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection({ className }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      title: "AI Sentiment & Risk Analysis",
      description: "Our deep NLP models automatically analyze every customer review, classifying sentiment and detecting risk signals across product quality, delivery, pricing, and trust.",
      icon: BarChart3,
      uiSrc: feature1,
    },
    {
      title: "Business Risk Index (BRI)",
      description: "Get a quantified risk score from 0–100 with clear categories: Very Low, Low, Medium, High, and Critical — so you always know exactly where your business stands.",
      icon: ShieldAlert,
      uiSrc: feature2,
    },
    {
      title: "Aspect-Based Review Analysis",
      description: "Drill into specific product dimensions — Quality, Delivery, Packaging, Pricing, and Merchant Trust — to understand exactly what drives positive or negative customer perception.",
      icon: PieChart,
      uiSrc: feature3,
    },
    {
      title: "AI Recommendations & Evidence",
      description: "Receive targeted strategic action plans backed by real extracted customer quotes, giving you both the guidance and the evidence to make immediate improvements.",
      icon: TrendingUp,
      uiSrc: feature4,
    },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet" crossOrigin="anonymous" />

      <section
        id="features"
        className={"w-full bg-[#FFFFFF] py-20 lg:py-32 overflow-hidden " + (className || "")}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">

            <div className="flex flex-col items-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#198F38]/10 bg-[#198F38]/5 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#198F38]" />
                <span className="text-[#198F38] text-center font-inter text-base font-normal leading-6 tracking-[-0.3px]">
                  Our Powerful Features
                </span>
              </motion.div>

              <motion.h2
                initial={{ y: 24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 w-full max-w-[686px] text-[#042718] text-center text-[32px] sm:text-[40px] lg:text-[52px] font-semibold leading-tight lg:leading-[58px] tracking-[-1.2px] sm:tracking-[-1.8px]"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                Understand Your Product
                <br className="block sm:hidden" />
                {" with "}
                <span
                  className="text-black/40 font-semibold"
                  style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                >
                  AI features
                </span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-3 w-full max-w-[514px] text-[#042718] text-center font-inter text-base sm:text-lg font-normal leading-relaxed sm:leading-7 opacity-80"
              >
                Everything you need to detect risks, analyze customer sentiment, and make smarter product decisions in one powerful platform.
              </motion.p>
            </div>

            <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {cards.map((card, idx) => (
                <FeatureCard
                  key={idx}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  uiSrc={card.uiSrc}
                  isMounted={isMounted}
                  delay={0.2 + idx * 0.1}
                  className="w-full"
                />
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
