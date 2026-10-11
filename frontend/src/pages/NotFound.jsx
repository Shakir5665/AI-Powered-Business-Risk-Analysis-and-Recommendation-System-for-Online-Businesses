import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import RiskAiLogo1 from "../assets/RiskAiLogo1.png";

export default function NotFound() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 bg-[#F6FDFF]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md w-full"
      >
        <img
          src={RiskAiLogo1}
          alt="RiskAI"
          className="h-8 sm:h-10 w-auto object-contain mb-8 sm:mb-10"
        />

        <p
          className="text-[#198F38] text-6xl sm:text-7xl md:text-8xl font-semibold tracking-tight mb-3"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          404
        </p>

        <h1
          className="text-[#042718] text-xl sm:text-2xl font-semibold mb-2"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          Page not found
        </h1>

        <p className="text-[#042718]/55 text-sm sm:text-base leading-relaxed mb-8 px-2">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#042718] text-white text-sm font-medium hover:bg-[#063b25] transition-colors"
          >
            <Home size={16} />
            Return Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#042718]/12 text-[#042718]/70 text-sm font-medium hover:bg-[#042718]/04 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
