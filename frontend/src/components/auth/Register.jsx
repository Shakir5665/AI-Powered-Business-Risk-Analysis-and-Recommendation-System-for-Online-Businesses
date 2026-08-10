import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, Check } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { parseError } from "../../utils/helpers";
import bgImage from "../../assets/background.png";
import RiskAiLogo1 from "../../assets/RiskAiLogo1.png";

// ─── Password Strength Indicator ─────────────────────────────────────────────

function PasswordStrength({ password }) {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", ok: /[a-z]/.test(password) },
    { label: "One digit (0-9)", ok: /[0-9]/.test(password) },
    { label: "One special character (!@#$%...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][score];
  const strengthColor = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#198F38"][score];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-2 p-3 rounded-xl bg-[#F6FDFF] border border-[#042718]/06"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#042718]/08 overflow-hidden">
          <motion.div
            animate={{ width: `${(score / 5) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ backgroundColor: strengthColor }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-1 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-[#198F38]" : "bg-[#042718]/10"}`}>
              {c.ok && <Check className="w-2 h-2 text-white" strokeWidth={3.5} />}
            </div>
            <span className={`text-xs ${c.ok ? "text-[#042718]/70" : "text-[#042718]/40"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Register Component ───────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.username || !form.password) {
      setError("Email, username, and password are required.");
      return;
    }

    try {
      setLoading(true);
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim() || undefined,
        role: "seller",
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(parseError(err) || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F6FDFF]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left Brand Panel ── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] }}
        className="hidden lg:flex lg:w-[48%] xl:w-[44%] relative flex-col justify-between overflow-hidden p-12"
      >
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#042718]/20" />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <img src={RiskAiLogo1} alt="RiskAI" className="h-10 w-auto object-contain self-start" />

          <div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-sm font-medium">Free to get started</span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.8 }}
              className="text-white text-[38px] xl:text-[46px] font-semibold leading-[1.15] tracking-[-1.5px] mb-4"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              Start understanding your{" "}
              <span className="text-white/60 italic" style={{ fontFamily: "'Playfair Display', serif" }}>business risk</span>{" "}
              today
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="text-white/70 text-lg leading-relaxed max-w-sm"
            >
              Create your account and instantly start analyzing customer reviews with AI-powered business risk scoring.
            </motion.p>

            {/* Feature bullets */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="flex flex-col gap-3 mt-8"
            >
              {[
                "AI Business Risk Index (BRI) scoring",
                "Aspect-Based Sentiment Analysis",
                "Evidence-backed AI recommendations",
                "Analysis history & dashboard",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-white/80 text-sm">{feat}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] }}
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 min-h-screen overflow-y-auto"
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src={RiskAiLogo1} alt="RiskAI" className="h-9 w-auto object-contain" />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2
              className="text-[#042718] text-3xl font-semibold tracking-tight mb-2"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              Create account
            </h2>
            <p className="text-[#042718]/60 text-base">
              Already have an account?{" "}
              <Link to="/login" className="text-[#198F38] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name (optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#042718] text-sm font-medium">
                Full Name <span className="text-[#042718]/30 font-normal">(optional)</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={update("fullName")}
                className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#042718] text-sm font-medium">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#042718] text-sm font-medium">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="myusername (min 3 chars)"
                value={form.username}
                onChange={update("username")}
                className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[#042718] text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update("password")}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#042718]/40 hover:text-[#042718] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                <PasswordStrength password={form.password} />
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms note */}
            <p className="text-[#042718]/40 text-xs leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="#" className="text-[#042718]/60 hover:underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-[#042718]/60 hover:underline">Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button
              id="registerSubmitBtn"
              type="submit"
              disabled={loading}
              className="flex items-center justify-between w-full h-14 pl-6 pr-2 rounded-full bg-[#042718] text-white font-medium text-base transition-all hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-[#042718] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </form>
        </div>

        <p className="mt-12 text-[#042718]/30 text-xs text-center">
          © 2026 RiskAI · Final Year Research Project · Rajarata University of Sri Lanka
        </p>
      </motion.div>
    </div>
  );
}
