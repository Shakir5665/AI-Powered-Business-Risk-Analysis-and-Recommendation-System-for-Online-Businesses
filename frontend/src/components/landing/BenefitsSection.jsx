import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  Sparkles, Lightbulb, Zap, User, TrendingUp, MousePointer2,
  ShieldCheck, Globe, PieChart, Bell, Users
} from "lucide-react";

function BenefitItem({ title, description, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="flex gap-6"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-[#f9fafb] border border-[#F8F8FC] rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#138E5F]" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-1">
        <h3
          className="text-[#042718] text-[20px] md:text-[24px] font-semibold leading-[26px] md:leading-[30px] tracking-[-0.6px] md:tracking-[-0.8px]"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-[#042718] font-sans text-base md:text-[18px] font-normal leading-[24px] md:leading-[28px] opacity-80">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function BenefitsSection({ className }) {
  const containerRef = React.useRef(null);
  const listRef = React.useRef(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  React.useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const yTranslate = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);
  const y = isLargeScreen ? yTranslate : 0;

  const tags = [
    "AI Risk Analysis",
    "Sentiment Detection",
    "BRI Scoring",
    "Visual Analytics",
    "Evidence-Based Insights",
  ];

  const benefits = [
    {
      title: "Real-time risk intelligence",
      description: "Get instant visibility into your product's risk profile with AI-computed scores and aspect-level breakdowns.",
      icon: Lightbulb,
    },
    {
      title: "Fast automated analysis",
      description: "No manual review reading — our AI processes thousands of reviews in seconds and delivers structured insights.",
      icon: Zap,
    },
    {
      title: "Tailored for your product",
      description: "Analysis is specific to your product URL, giving you precise, actionable data rather than generic market trends.",
      icon: User,
    },
    {
      title: "Maximize business performance",
      description: "Identify root causes of negative feedback and eliminate operational gaps with targeted AI recommendations.",
      icon: TrendingUp,
    },
    {
      title: "Simple and intuitive interface",
      description: "Clean SaaS dashboard designed for business owners — no data science expertise required to interpret results.",
      icon: MousePointer2,
    },
    {
      title: "Data privacy & security",
      description: "Your product data and analysis results are securely stored and never shared with third parties.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-platform support",
      description: "Analyze products from major e-commerce platforms including Daraz and more, all from a single interface.",
      icon: Globe,
    },
    {
      title: "Deep visual analytics",
      description: "Interactive charts and dashboards give you a comprehensive visual breakdown of every risk dimension.",
      icon: PieChart,
    },
    {
      title: "Complaint frequency tracking",
      description: "Identify the most reported customer complaints so you can prioritize the highest-impact improvements.",
      icon: Bell,
    },
    {
      title: "Built for all stakeholders",
      description: "Valuable for business owners, product managers, researchers, and university evaluators alike.",
      icon: Users,
    },
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet" crossOrigin="anonymous" />

      <section className={"w-full bg-white py-16 md:py-24 lg:py-[120px] flex justify-center " + (className || "")}>
        <div className="w-full max-w-[1440px] px-6 lg:px-[96px]">
          <div className="w-full max-w-[1248px] mx-auto">
            <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-[48px] justify-between">

              {/* Left Column - Sticky */}
              <div className="w-full lg:max-w-[622px] flex flex-col items-start lg:sticky lg:top-[120px] self-start">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="px-4 py-2 bg-[#F2FBF6] border border-[#138E5F]/15 rounded-full flex items-center gap-2 mb-8"
                >
                  <Sparkles className="w-4 h-4 text-[#138E5F] fill-[#138E5F]" />
                  <span className="text-[#138E5F] font-sans text-sm font-medium">Benefits</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  className="text-[#042718] text-[32px] sm:text-[42px] md:text-[52px] font-semibold leading-[38px] sm:leading-[48px] md:leading-[58px] tracking-[-1.2px] md:tracking-[-1.8px] mb-3"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  Take full control of your business risk with{" "}
                  <i className="text-[rgba(0,0,0,0.40)]">intelligent</i> AI tools
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-[#042718] font-sans text-lg md:text-[20px] font-normal leading-[24px] md:leading-[30px] opacity-80 mb-16 max-w-[560px]"
                >
                  Make smarter product decisions with powerful AI tools designed to simplify risk detection, surface customer insights, and drive better business outcomes.
                </motion.p>

                <div className="flex flex-wrap gap-3">
                  {tags.map((tag, idx) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                      className="px-6 py-3 border border-[#042718]/10 rounded-full text-[#042718] font-sans text-[16px] md:text-[18px] font-normal hover:bg-[#F6FDFF] transition-colors cursor-default"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Right Column - Scrollable List */}
              <div ref={containerRef} className="flex-1 lg:max-w-[578px] flex items-start pr-0 lg:h-[300vh] h-auto relative w-full">
                <div className="lg:sticky lg:top-[120px] lg:h-[800px] h-auto flex items-start w-full lg:overflow-hidden overflow-visible">
                  <div className="hidden lg:block absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white via-white/95 to-transparent z-10 pointer-events-none" />

                  <div className="hidden lg:flex flex-col items-center mr-10 xl:mr-12 relative w-[2px] bg-[#138E5F]/10 self-stretch">
                    <motion.div
                      style={{ scaleY, originY: 0 }}
                      className="w-full bg-[#138E5F] absolute top-0 left-0 h-full"
                    />
                  </div>

                  <motion.div
                    ref={listRef}
                    style={{ y }}
                    className="w-full lg:w-[514px] flex flex-col gap-10 md:gap-12 lg:gap-16 lg:pt-28 lg:pb-40 pt-0 pb-0"
                  >
                    {benefits.map((benefit, idx) => (
                      <BenefitItem
                        key={idx}
                        title={benefit.title}
                        description={benefit.description}
                        icon={benefit.icon}
                        delay={0.4 + idx * 0.1}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
