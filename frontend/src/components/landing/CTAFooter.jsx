import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ArrowUpRight } from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import RiskAiLogo1 from "../../assets/RiskAiLogo1.png";

function CTAButton({ text, variant = "primary", onClick }) {
  const isPrimary = variant === "primary";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={
        "relative flex items-center h-12 sm:h-[56px] rounded-full transition-all duration-500 overflow-hidden gap-3 w-full sm:w-auto justify-between " +
        (isPrimary
          ? "bg-[#042718] text-white shadow-[0_8px_32px_rgba(4,39,24,0.15)]"
          : "bg-white/20 backdrop-blur-xl border border-white/60 text-[#042718] shadow-[0_8px_32px_rgba(255,255,255,0.1)]") +
        " " +
        (isHovered ? "pl-2 pr-5 flex-row-reverse" : "pl-5 pr-2 flex-row")
      }
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="font-sans font-medium text-base sm:text-[18px] leading-[28px] whitespace-nowrap z-10"
      >
        {text}
      </motion.span>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={
          "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 z-20 " +
          (isPrimary ? "bg-white" : "bg-[#042718]")
        }
      >
        <ArrowUpRight className={"w-4 h-4 " + (isPrimary ? "text-[#042718]" : "text-white")} />
      </motion.div>
    </motion.button>
  );
}

export default function CTAFooter({ className }) {
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.45, 0.32, 0.9],
      },
    },
  };

  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Security", href: "#about" },
  ];

  const projectLinks = [
    { label: "About", href: "#about" },
    { label: "Research", href: "#blog" },
    { label: "Documentation", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <footer className={"relative w-full overflow-hidden flex flex-col items-center " + (className || "")}>
      <div className="absolute inset-0 z-0">
        {isMounted && (
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="https://cdn.jiro.build/Amox/All%20Images/P01-Header-01-BG.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-white/20" />
        <div className="absolute bottom-0 left-0 right-0 h-[280px] sm:h-[400px] bg-white/2 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
      </div>

      {/* CTA SECTION */}
      <section className="w-full relative pt-16 sm:pt-20 md:pt-24 lg:pt-[120px] pb-0 overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white via-white/40 to-transparent" />

        <div className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-[96px] relative z-10 flex flex-col items-center">
          <div className="max-w-[1248px] w-full flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4F3EB] border border-[#138E5F]/10 mb-6 sm:mb-[30px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#138E5F]" />
              <span className="text-[#138E5F] text-[11px] sm:text-[13px] font-sans font-medium uppercase tracking-wider">
                Built for serious business intelligence
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="w-full max-w-[742px] text-center text-[#042718] font-semibold text-[28px] sm:text-[36px] md:text-[48px] lg:text-[68px] leading-[1.15] md:leading-[1.1] lg:leading-[80px] tracking-tight md:tracking-[-1.5px] lg:tracking-[-2.2px] mb-3 sm:mb-[12px] px-1"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              Take full control of your{" "}
              <span className="italic text-[rgba(0,0,0,0.40)]">business risk</span> today
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="w-full max-w-[660px] text-center text-[#042718] font-sans text-base sm:text-lg md:text-[20px] leading-relaxed md:leading-[30px] tracking-tight opacity-80 mb-10 sm:mb-12 lg:mb-[64px] px-2"
            >
              Analyze customer reviews, detect business risks, calculate your BRI score, and receive AI-driven recommendations — all in one powerful and intuitive platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-sm sm:max-w-none"
            >
              <CTAButton text="Analyze Product Now" variant="primary" onClick={() => navigate("/register")} />
              <CTAButton text="View Demo" variant="secondary" onClick={() => navigate("/login")} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER LINKS */}
      <div className="relative w-full flex flex-col items-center">
        <div className="relative z-10 w-full max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 lg:px-12 xl:px-[96px] pt-10 sm:pt-12 lg:pt-[64px] pb-6 sm:pb-8 flex flex-col items-start bg-transparent">
          <motion.div
            className="w-full pt-10 sm:pt-12 lg:pt-[120px] pb-10 sm:pb-12 lg:pb-[96px] flex flex-col lg:flex-row items-start gap-10 sm:gap-12 lg:gap-[80px] xl:gap-[130px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <div className="w-full lg:w-[400px] xl:w-[440px] flex flex-col gap-5 sm:gap-6">
              <motion.h3
                variants={itemVariants}
                className="text-[#042718] text-xl sm:text-[24px] font-semibold leading-tight tracking-tight"
                style={{ fontFamily: "'Onest', sans-serif" }}
              >
                Stay ahead of the latest AI insights
              </motion.h3>
              <motion.p variants={itemVariants} className="text-[#042718] font-sans text-base sm:text-[18px] font-normal leading-relaxed opacity-80">
                Get research updates, product tips, and platform news straight to your inbox.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-1 relative w-full flex flex-col sm:flex-row items-stretch sm:items-center p-3 sm:p-1.5 gap-3 sm:gap-0 rounded-[24px] sm:rounded-full border border-white/60 bg-white/15 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)]"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border-none outline-none px-4 py-2 sm:py-0 font-sans text-base sm:text-[18px] text-[#042718] placeholder:text-[#042718]/60 min-w-0"
                />
                <button className="flex items-center justify-between sm:justify-start gap-3 bg-white pl-5 pr-2 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 shrink-0">
                  <span className="font-sans text-base sm:text-[18px] font-medium text-[#042718]">Subscribe</span>
                  <div className="w-9 h-9 bg-[#042718] rounded-full flex items-center justify-center shrink-0">
                    <ArrowRight size={18} strokeWidth={2.5} className="text-white" />
                  </div>
                </button>
              </motion.div>
            </div>

            <div className="lg:ml-auto grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-6 sm:gap-x-8 lg:gap-x-12 xl:gap-[64px] w-full lg:w-auto">
              <div className="flex flex-col gap-4 sm:gap-5 relative">
                <motion.h4
                  variants={itemVariants}
                  className="text-[#042718] text-lg sm:text-[24px] font-semibold leading-tight tracking-tight"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  Product
                </motion.h4>
                <ul className="flex flex-col gap-3 sm:gap-4">
                  {productLinks.map((link) => (
                    <motion.li key={link.label} variants={itemVariants}>
                      <a href={link.href} className="text-[#042718] font-sans text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed opacity-80 hover:opacity-100 hover:font-medium transition-all">
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4 sm:gap-5 relative">
                <motion.h4
                  variants={itemVariants}
                  className="text-[#042718] text-lg sm:text-[24px] font-semibold leading-tight tracking-tight"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  Project
                </motion.h4>
                <ul className="flex flex-col gap-3 sm:gap-4">
                  {projectLinks.map((link) => (
                    <motion.li key={link.label} variants={itemVariants}>
                      <a href={link.href} className="text-[#042718] font-sans text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed opacity-80 hover:opacity-100 hover:font-medium transition-all">
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col gap-4 sm:gap-5">
                <motion.h4
                  variants={itemVariants}
                  className="text-[#042718] text-lg sm:text-[24px] font-semibold leading-tight tracking-tight"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  Social
                </motion.h4>
                <ul className="flex flex-row sm:flex-col flex-wrap gap-4 sm:gap-4">
                  {[
                    { name: "GitHub", icon: FaGithub },
                    { name: "LinkedIn", icon: FaLinkedin },
                    { name: "Twitter", icon: FaTwitter },
                    { name: "Instagram", icon: FaInstagram },
                  ].map((social) => (
                    <motion.li key={social.name} variants={itemVariants}>
                      <a href="#" className="flex items-center gap-2 sm:gap-3 text-[#042718] font-sans text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed opacity-80 hover:opacity-100 hover:font-medium transition-all">
                        <social.icon size={18} fill="currentColor" strokeWidth={0} />
                        {social.name}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          <div className="w-full max-w-[1248px] py-6 sm:py-10 lg:py-14 flex justify-center items-center select-none mx-auto overflow-hidden">
            <motion.img
              src={RiskAiLogo1}
              alt="RiskAI Logo"
              initial={{ y: "100%", opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.21, 0.45, 0.32, 0.9] }}
              className="max-h-[80px] sm:max-h-[140px] md:max-h-[240px] lg:max-h-[320px] w-auto max-w-full object-contain"
            />
          </div>

          <motion.div
            className="w-full mt-4 sm:mt-6 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border-t border-white/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white font-sans text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed opacity-80">
              <a href="#" className="hover:opacity-100 hover:font-medium transition-all">Terms &amp; Conditions</a>
              <a href="#" className="hover:opacity-100 hover:font-medium transition-all">Privacy Policy</a>
            </div>

            <div className="text-white font-sans text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed opacity-80 text-center">
              &copy; 2026 RiskAI. All rights reserved.
            </div>

            <div className="text-white font-sans text-xs sm:text-sm lg:text-[18px] font-normal leading-relaxed opacity-80 text-center max-w-xs lg:max-w-none">
              Final Year Research Project —{" "}
              <span className="underline underline-offset-4">Rajarata University of Sri Lanka</span>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
