import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api/endpoints";
import { parseError } from "../../utils/helpers";
import bgImage from "../../assets/background.png";
import RiskAiLogo1 from "../../assets/RiskAiLogo1.png";

// ─── Tabs: login | forgot | reset ───────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // View state
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form
  const [loginForm, setLoginForm] = useState({ emailOrUsername: "", password: "" });

  // Forgot/reset form
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ email: "", otpCode: "", newPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // ── Login Submit ──────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!loginForm.emailOrUsername.trim() || !loginForm.password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      await login({ emailOrUsername: loginForm.emailOrUsername.trim(), password: loginForm.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(parseError(err) || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Submit ────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!forgotEmail.trim()) { setError("Please enter your email address."); return; }
    try {
      setLoading(true);
      await authAPI.forgotPassword(forgotEmail.trim());
      setSuccess("A 6-digit OTP has been sent to your email.");
      setResetForm((p) => ({ ...p, email: forgotEmail.trim() }));
      setTimeout(() => { setView("reset"); setSuccess(""); }, 1500);
    } catch (err) {
      setError(parseError(err) || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password Submit ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    const { email, otpCode, newPassword } = resetForm;
    if (!email || !otpCode || !newPassword) { setError("All fields are required."); return; }
    try {
      setLoading(true);
      await authAPI.resetPassword(email, otpCode, newPassword);
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => { setView("login"); setSuccess(""); }, 2000);
    } catch (err) {
      setError(parseError(err) || "OTP verification failed. Please try again.");
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
        {/* Background image */}
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#042718]/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <img src={RiskAiLogo1} alt="RiskAI" className="h-10 w-auto object-contain self-start" />

          {/* Tagline */}
          <div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-sm font-medium">AI-Powered Risk Analysis</span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.8 }}
              className="text-white text-[38px] xl:text-[46px] font-semibold leading-[1.15] tracking-[-1.5px] mb-4"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              Welcome back to<br />
              <span className="text-white/60 italic" style={{ fontFamily: "'Playfair Display', serif" }}>smarter</span>{" "}
              business decisions
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="text-white/70 text-lg leading-relaxed max-w-sm"
            >
              Sign in to access your AI-powered risk dashboard, view analysis history, and make data-driven product decisions.
            </motion.p>

            {/* Stats strip */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="flex items-center gap-6 mt-8"
            >
              {[
                { value: "120K+", label: "Reviews Analyzed" },
                { value: "87%", label: "Better Decisions" },
                { value: "5+", label: "Platforms" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Onest', sans-serif" }}>{stat.value}</span>
                  <span className="text-white/60 text-xs mt-0.5">{stat.label}</span>
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
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 min-h-screen"
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src={RiskAiLogo1} alt="RiskAI" className="h-9 w-auto object-contain" />
        </div>

        <div className="w-full max-w-[420px]">
          {/* ── LOGIN VIEW ── */}
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-8">
                  <h2 className="text-[#042718] text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
                    Sign in
                  </h2>
                  <p className="text-[#042718]/60 text-base">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-[#198F38] font-medium hover:underline">
                      Create one
                    </Link>
                  </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  {/* Email / Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#042718] text-sm font-medium">Email or Username</label>
                    <input
                      id="emailOrUsername"
                      type="text"
                      autoComplete="username"
                      placeholder="you@example.com or username"
                      value={loginForm.emailOrUsername}
                      onChange={(e) => setLoginForm((p) => ({ ...p, emailOrUsername: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[#042718] text-sm font-medium">Password</label>
                      <button
                        type="button"
                        onClick={() => { clearMessages(); setView("forgot"); }}
                        className="text-[#198F38] text-sm font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
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
                  </div>

                  {/* Feedback */}
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

                  {/* Submit */}
                  <button
                    id="loginSubmitBtn"
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-between w-full h-14 pl-6 pr-2 rounded-full bg-[#042718] text-white font-medium text-base transition-all hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    <span>{loading ? "Signing in..." : "Sign in"}</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-[#042718] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <button onClick={() => { clearMessages(); setView("login"); }} className="flex items-center gap-1.5 text-[#042718]/50 hover:text-[#042718] text-sm mb-6 transition-colors">
                  ← Back to sign in
                </button>
                <div className="mb-8">
                  <h2 className="text-[#042718] text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
                    Reset password
                  </h2>
                  <p className="text-[#042718]/60 text-base">
                    Enter your email and we'll send a 6-digit OTP to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#042718] text-sm font-medium">Email Address</label>
                    <input
                      id="forgotEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-red-600 text-sm">{error}</p>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-emerald-700 text-sm">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button id="sendOtpBtn" type="submit" disabled={loading}
                    className="flex items-center justify-between w-full h-14 pl-6 pr-2 rounded-full bg-[#042718] text-white font-medium text-base transition-all hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed group">
                    <span>{loading ? "Sending OTP..." : "Send OTP"}</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-[#042718]" />
                    </div>
                  </button>

                  <button type="button" onClick={() => { clearMessages(); setView("reset"); }}
                    className="text-[#198F38] text-sm font-medium text-center hover:underline mt-1">
                    Already have an OTP? Enter it →
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── RESET PASSWORD VIEW ── */}
            {view === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <button onClick={() => { clearMessages(); setView("forgot"); }} className="flex items-center gap-1.5 text-[#042718]/50 hover:text-[#042718] text-sm mb-6 transition-colors">
                  ← Back
                </button>
                <div className="mb-8">
                  <h2 className="text-[#042718] text-3xl font-semibold tracking-tight mb-2" style={{ fontFamily: "'Onest', sans-serif" }}>
                    Enter new password
                  </h2>
                  <p className="text-[#042718]/60 text-base">
                    Enter the OTP sent to your email and set a new password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#042718] text-sm font-medium">Email Address</label>
                    <input id="resetEmail" type="email" placeholder="you@example.com"
                      value={resetForm.email}
                      onChange={(e) => setResetForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#042718] text-sm font-medium">OTP Code</label>
                    <input id="otpCode" type="text" maxLength={16} placeholder="6-digit OTP"
                      value={resetForm.otpCode}
                      onChange={(e) => setResetForm((p) => ({ ...p, otpCode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all tracking-[0.2em]" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#042718] text-sm font-medium">New Password</label>
                    <div className="relative">
                      <input id="newPassword" type={showNewPassword ? "text" : "password"} placeholder="Min 8 chars, 1 upper, 1 digit, 1 symbol"
                        value={resetForm.newPassword}
                        onChange={(e) => setResetForm((p) => ({ ...p, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-[#042718]/10 bg-white text-[#042718] placeholder:text-[#042718]/30 text-base outline-none focus:border-[#198F38] focus:ring-2 focus:ring-[#198F38]/10 transition-all" />
                      <button type="button" onClick={() => setShowNewPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#042718]/40 hover:text-[#042718] transition-colors">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-red-600 text-sm">{error}</p>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-emerald-700 text-sm">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button id="resetPasswordBtn" type="submit" disabled={loading}
                    className="flex items-center justify-between w-full h-14 pl-6 pr-2 rounded-full bg-[#042718] text-white font-medium text-base transition-all hover:bg-[#063b25] disabled:opacity-60 disabled:cursor-not-allowed group">
                    <span>{loading ? "Resetting..." : "Reset Password"}</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-[#042718]" />
                    </div>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-12 text-[#042718]/30 text-xs text-center">
          © 2026 RiskAI · Final Year Research Project · Rajarata University of Sri Lanka
        </p>
      </motion.div>
    </div>
  );
}
