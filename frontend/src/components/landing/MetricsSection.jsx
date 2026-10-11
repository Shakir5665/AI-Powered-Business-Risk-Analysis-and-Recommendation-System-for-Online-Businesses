import React, { useState, useEffect } from "react";
import { motion, animate } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Counter({ value, duration = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: duration,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{displayValue}%</span>;
}

function FeatureCard({ logo, description, percentage, statLabel, bgColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={{ backgroundColor: bgColor }}
      className="flex w-full lg:w-[400px] p-6 md:p-8 flex-col items-start rounded-[24px]"
    >
      <div className="flex items-center gap-[12px] mb-[20px]">
        <div
          className="h-[36px] flex items-center"
          style={{
            filter: "brightness(0) saturate(100%) invert(11%) sepia(21%) saturate(2304%) hue-rotate(111deg) brightness(91%) contrast(100%)",
          }}
        >
          {logo}
        </div>
      </div>

      <p className="font-sans text-[16px] md:text-[18px] font-medium leading-[24px] md:leading-[28px] text-[#042718] opacity-80 min-h-0 md:min-h-[112px]">
        {description}
      </p>

      <div className="mt-12 md:mt-[80px]">
        <h2
          className="font-heading text-[40px] md:text-[52px] font-semibold leading-[46px] md:leading-[58px] tracking-[-1.2px] md:tracking-[-1.8px] text-[#042718]"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          <Counter value={percentage} />
        </h2>
        <p className="mt-[12px] md:mt-[16px] font-sans text-[16px] md:text-[18px] font-normal leading-[24px] md:leading-[28px] text-[#042718] opacity-80">
          {statLabel}
        </p>
      </div>
    </motion.div>
  );
}

export default function MetricsSection({ className }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const cards = [
    {
      delay: 0.1,
      bgColor: "#D2DDEA",
      logo: (
        <span className="text-[24px] font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>
          BRI
        </span>
      ),
      description:
        "AI-driven Business Risk Index (BRI) calculation that quantifies your product's risk level from 0–100 across five critical dimensions.",
      percentage: 42,
      statLabel: "Increase in decision-making efficiency per analysis",
    },
    {
      delay: 0.2,
      bgColor: "#EBE3D2",
      logo: (
        <span className="text-[22px] font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>
          ABSA
        </span>
      ),
      description:
        "Aspect-Based Sentiment Analysis that dissects customer reviews across Quality, Delivery, Pricing, Packaging, and Merchant Trust.",
      percentage: 34,
      statLabel: "Faster identification of critical business risks",
    },
    {
      delay: 0.3,
      bgColor: "#D4E5CD",
      logo: (
        <span className="text-[20px] font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>
          REC
        </span>
      ),
      description:
        "AI-generated strategic recommendations backed by real customer evidence extracted directly from review data.",
      percentage: 26,
      statLabel: "Reduction in operational blind spots",
    },
  ];

  return (
    <>
      <section
        id="about"
        className={"w-full bg-[#F6FDFF] py-20 lg:py-32 flex justify-center " + (className || "")}
      >
        <div className="w-full max-w-[1440px] px-6 lg:px-[96px]">
          <div className="w-full max-w-[1248px] mx-auto">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 md:mb-[64px] gap-8">
              <motion.h1
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-[584px] text-[36px] md:text-[52px] font-semibold leading-[42px] md:leading-[58px] tracking-[-1.2px] md:tracking-[-1.8px] text-[#042718]"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                Smarter risk analysis for scaling{" "}
                <i className="text-[rgba(0,0,0,0.40)]">business growth</i>
              </motion.h1>

              <motion.button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                animate={{
                  paddingLeft: isHovered ? 8 : 20,
                  paddingRight: isHovered ? 20 : 8,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.8 },
                  x: { duration: 0.8 },
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/register")}
                className="flex items-center h-[56px] min-w-fit w-max bg-[#042718] rounded-full group cursor-pointer transition-colors duration-300 hover:bg-[#063b25] overflow-hidden gap-[12px]"
              >
                <motion.div
                  layout="position"
                  style={{ order: isHovered ? 2 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="font-sans text-[18px] font-medium leading-[28px] text-white whitespace-nowrap"
                >
                  Try for Free
                </motion.div>
                <motion.div
                  layout="position"
                  style={{ order: isHovered ? 1 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="w-[40px] h-[40px] bg-white rounded-full flex items-center justify-center shrink-0"
                >
                  <ArrowUpRight className="w-[16px] h-[16px] text-[#042718]" />
                </motion.div>
              </motion.button>
            </div>

            {/* Cards Grid */}
            <div className="flex flex-col lg:flex-row gap-[24px]">
              {cards.map((card, idx) => (
                <FeatureCard
                  key={idx}
                  delay={card.delay}
                  bgColor={card.bgColor}
                  logo={card.logo}
                  description={card.description}
                  percentage={card.percentage}
                  statLabel={card.statLabel}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
