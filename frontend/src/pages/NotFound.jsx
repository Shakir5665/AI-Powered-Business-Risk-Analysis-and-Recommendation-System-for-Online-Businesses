import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#FAFFFD]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
          <ShieldAlert size={32} className="text-emerald-700" />
        </div>

        <span className="text-emerald-700 font-extrabold text-sm uppercase tracking-widest mb-1">
          Error 404
        </span>

        <h1
          className="text-slate-900 text-2xl sm:text-3xl font-bold mb-3"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          Page Not Found
        </h1>

        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8">
          The page or product analysis report you are looking for doesn't exist, was moved, or has expired.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <Home size={16} /> Go to Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm border border-slate-300 transition-colors"
          >
            <ArrowLeft size={16} /> Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
