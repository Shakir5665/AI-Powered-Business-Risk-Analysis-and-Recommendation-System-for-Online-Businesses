import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Sparkles, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import amazonLogo from "../../assets/amazonLogo.png";
import darazLogo from "../../assets/darazLogo.png";
import ebayLogo from "../../assets/ebayLogo.png";
import shopifyLogo from "../../assets/shopifyLogo.png";
import aliexpressLogo from "../../assets/aliexpressLogo.png";
import RiskAiLogo1 from "../../assets/RiskAiLogo1.png";

const brandLogos = [
  { name: "Daraz", logo: darazLogo },
  { name: "Amazon", logo: amazonLogo },
  { name: "eBay", logo: ebayLogo },
  { name: "Shopify", logo: shopifyLogo },
  { name: "AliExpress", logo: aliexpressLogo },
];

export default function HeroSection({ className }) {
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isCTAHovered, setIsCTAHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navItems = ["Home", "Features", "How It Works", "About", "Blog"];

  const navAnchors = {
    Home: "/",
    Features: "#features",
    "How It Works": "#how-it-works",
    About: "#about",
    Blog: "#blog",
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet" crossOrigin="anonymous" />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={"relative w-full overflow-hidden min-h-[800px] lg:min-h-[900px] " + (className || "")}
      >
        {/* Background Video — Cloudinary CDN */}
        <div className="absolute inset-0 z-0">
          {isMounted && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              {/* WebM (smaller) served first to browsers that support it, MP4 fallback */}
              <source
                src="https://res.cloudinary.com/rgj4dgir/video/upload/f_auto,q_auto:low/v1788274252/bg.mp4"
                type="video/mp4"
              />
            </video>
          )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-12">
          {/* Navigation */}
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={RiskAiLogo1} alt="RiskAI Logo" className="h-9 sm:h-10 w-auto object-contain" />
            </a>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <li key={item}>
                  <a
                    href={navAnchors[item] || "#"}
                    className={
                      "font-inter text-base leading-6 tracking-[-0.3px] text-[#042718] transition-all " +
                      (item === "Home"
                        ? "font-bold opacity-100"
                        : "font-normal opacity-80 hover:opacity-100 hover:font-bold")
                    }
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <motion.button
                onMouseEnter={() => setIsNavHovered(true)}
                onMouseLeave={() => setIsNavHovered(false)}
                layout
                onClick={() => navigate("/register")}
                className={
                  "hidden sm:flex items-center gap-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 group cursor-pointer relative h-11 transition-all duration-300 " +
                  (isNavHovered ? "flex-row-reverse pl-1.5 pr-[18px]" : "flex-row pl-[18px] pr-1.5")
                }
              >
                <motion.span
                  layout
                  className="font-inter text-base font-medium leading-6 tracking-[-0.3px] text-[#042718]"
                >
                  Get Started
                </motion.span>

                <motion.div
                  layout
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
                >
                  <motion.div
                    animate={{
                      x: isNavHovered ? [-20, 0] : 0,
                      opacity: isNavHovered ? [0, 1] : 1
                    }}
                    transition={{ duration: 0.3, delay: isNavHovered ? 0.1 : 0 }}
                  >
                    <ArrowUpRight className="w-3 h-3 text-[#042718]" />
                  </motion.div>
                </motion.div>
              </motion.button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-[#042718] bg-white/20 backdrop-blur-md rounded-full"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </motion.nav>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] lg:hidden bg-white px-6 py-8 flex flex-col gap-8"
              >
                <div className="flex items-center justify-between">
                  <img src={RiskAiLogo1} alt="RiskAI Logo" className="h-9 w-auto object-contain" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-[#042718] bg-[#042718]/5 rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                <ul className="flex flex-col gap-6">
                  {navItems.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx, ease: "easeOut" }}
                    >
                      <a
                        href={navAnchors[item] || "#"}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="font-inter text-2xl font-semibold text-[#042718]"
                      >
                        {item}
                      </a>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate("/register"); }}
                    className="w-full py-4 rounded-full bg-[#042718] text-white font-inter font-medium text-lg"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Content */}
          <div className="flex flex-col items-center mt-12 lg:mt-[80px]">
            {/* Badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="flex flex-row items-center gap-1.5 sm:gap-2 px-3 sm:px-[14px] py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/40 mb-6 whitespace-nowrap"
            >
              <div className="flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#042718] text-[#042718]" />
                <span className="font-inter text-sm sm:text-base lg:text-[18px] font-medium leading-[28px] text-[#042718]">
                  AI-Powered Analysis
                </span>
              </div>
              <span className="font-inter text-sm sm:text-base lg:text-[18px] font-normal leading-[28px] text-[#000000] opacity-60 shrink-0">
                for smarter business decisions
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="max-w-[750px] w-full text-center font-onest text-[40px] sm:text-[50px] lg:text-[66px] font-semibold leading-tight lg:leading-[72px] tracking-tight lg:tracking-[-3px] text-[#042718]"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              Understand Your{" "}
              <span
                className="font-semibold text-[#000000] opacity-50 tracking-normal lg:tracking-[-3.566px]"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                Business Risk
              </span>{" "}
              with AI
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              className="max-w-[630px] w-full text-center mt-5 font-inter text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] tracking-[-0.4px] text-[#042718]"
            >
              Paste a product URL and let our AI analyze customer reviews, detect risks, calculate your Business Risk Index, and deliver actionable recommendations — instantly.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
              onMouseEnter={() => setIsCTAHovered(true)}
              onMouseLeave={() => setIsCTAHovered(false)}
              layout
              onClick={() => navigate("/register")}
              className={
                "flex items-center gap-3 py-2 rounded-full bg-[#042718] mt-8 lg:mt-12 group cursor-pointer relative h-14 border border-white/20 transition-all duration-300 " +
                (isCTAHovered ? "flex-row-reverse pl-2 pr-5" : "flex-row pl-5 pr-2")
              }
            >
              <motion.span
                layout
                className="font-inter text-base lg:text-[18px] font-medium leading-[28px] text-white"
              >
                Analyze Product
              </motion.span>

              <motion.div
                layout
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden shrink-0"
              >
                <motion.div
                  animate={{
                    x: isCTAHovered ? [-24, 0] : 0,
                    opacity: isCTAHovered ? [0, 1] : 1
                  }}
                  transition={{ duration: 0.3, delay: isCTAHovered ? 0.1 : 0 }}
                >
                  <ArrowUpRight className="w-4 h-4 text-[#042718]" />
                </motion.div>
              </motion.div>
            </motion.button>

            {/* Bottom Branding Section */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
              className="mt-20 lg:mt-[220px] flex flex-col items-center gap-10 w-full"
            >
              <div className="px-[16px] py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/20">
                <p className="font-inter text-sm lg:text-base font-medium leading-6 tracking-[-0.3px] text-white text-center">
                  Trusted by businesses and researchers across e-commerce platforms
                </p>
              </div>

              <div
                className="w-full mt-4 overflow-hidden"
                style={{ maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)" }}
              >
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 25,
                    ease: "linear",
                    repeat: Infinity
                  }}
                  className="flex items-center gap-12 sm:gap-16 lg:gap-24 w-fit"
                >
                  {[...Array(2)].map((_, i) => (
                    <React.Fragment key={i}>
                      {brandLogos.map((brand) => (
                        <img
                          key={brand.name}
                          src={brand.logo}
                          alt={brand.name}
                          className="h-7 lg:h-9 max-w-[120px] object-contain brightness-0 invert opacity-75 hover:opacity-100 transition-opacity"
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
