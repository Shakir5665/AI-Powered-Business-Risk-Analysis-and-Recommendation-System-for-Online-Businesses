import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import RiskAiLogo1 from "../../assets/RiskAiLogo1.png";
import RiskAiLogo2 from "../../assets/RiskAiLogo2.png";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Analyze Product", icon: ScanSearch, to: "/analyze" },
  { label: "History", icon: History, to: "/history" },
  { label: "Profile", icon: User, to: "/profile" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Initials avatar
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  // ── Mobile drawer overlay ───────────────────────────────────────────────────
  const MobileOverlay = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col lg:hidden"
            style={{ background: "#042718" }}
          >
            <SidebarContent
              collapsed={false}
              initials={initials}
              user={user}
              onLogout={handleLogout}
              onClose={onClose}
              isMobile
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // ── Desktop sidebar ─────────────────────────────────────────────────────────
  return (
    <>
      <MobileOverlay />

      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.21, 0.45, 0.32, 0.9] }}
        className="hidden lg:flex flex-col shrink-0 relative overflow-hidden"
        style={{ background: "#042718", minHeight: "100vh" }}
      >
        <SidebarContent
          collapsed={collapsed}
          initials={initials}
          user={user}
          onLogout={handleLogout}
          onToggleCollapse={() => setCollapsed((p) => !p)}
        />
      </motion.aside>
    </>
  );
}

// ── Inner content shared between mobile/desktop ──────────────────────────────

function SidebarContent({
  collapsed,
  initials,
  user,
  onLogout,
  onToggleCollapse,
  onClose,
  isMobile = false,
}) {
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <AnimatePresence mode="wait">
          {!collapsed || isMobile ? (
            <motion.img
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={RiskAiLogo1}
              alt="RiskAI"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <motion.img
              key="logo-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={RiskAiLogo2}
              alt="RA"
              className="h-8 w-8 object-contain brightness-0 invert mx-auto"
            />
          )}
        </AnimatePresence>

        {/* Mobile close / Desktop collapse */}
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#198F38] text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              } ${collapsed && !isMobile ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={`shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`}
                />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <div
          className={`flex items-center gap-3 px-2 py-2 rounded-xl mb-1 ${
            collapsed && !isMobile ? "justify-center" : ""
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#198F38] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white text-sm font-medium truncate leading-tight">
                  {user?.username || "User"}
                </p>
                <p className="text-white/40 text-xs truncate">{user?.email || ""}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 ${
            collapsed && !isMobile ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
