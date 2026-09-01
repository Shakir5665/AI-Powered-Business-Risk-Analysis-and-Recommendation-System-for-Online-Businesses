import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/analyze": "Analyze Product",
  "/history": "Analysis History",
  "/profile": "My Profile",
  "/settings": "Settings",
};

function getBreadcrumbs(pathname) {
  const title = PAGE_TITLES[pathname] || "Page";
  return ["Home", title];
}

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const crumbs = getBreadcrumbs(location.pathname);
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-[#042718]/06 sticky top-0 z-30"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          id="sidebarToggle"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-[#042718]/50 hover:text-[#042718] hover:bg-[#042718]/05 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1 text-[#042718]/40 text-xs">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={crumb}>
                {i > 0 && <ChevronRight size={12} />}
                <span className={i === crumbs.length - 1 ? "text-[#042718]/60 font-medium" : ""}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
          {/* Page title */}
          <h1
            className="text-[#042718] text-lg font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "'Onest', sans-serif" }}
          >
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: greeting + avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Greeting (hidden on very small screens) */}
        <span className="hidden md:block text-[#042718]/50 text-sm">
          {greeting},{" "}
          <span className="text-[#042718] font-medium">{user?.username || "User"}</span>
        </span>

        {/* Divider */}
        <div className="hidden md:block w-px h-5 bg-[#042718]/10" />

        {/* Avatar button → profile */}
        <button
          id="navProfileBtn"
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full bg-[#198F38] flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-[#198F38]/40 transition-all"
        >
          {initials}
        </button>
      </div>
    </motion.header>
  );
}
