import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  Moon,
  Globe,
  Mail,
  Save,
  CheckCircle,
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.21, 0.45, 0.32, 0.9] },
});

function Toggle({ enabled, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        enabled ? "bg-[#198F38]" : "bg-[#042718]/15"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          id: "emailAlerts",
          icon: Mail,
          label: "Email alerts",
          description: "Receive email when an analysis completes",
          enabled: emailAlerts,
          onChange: setEmailAlerts,
        },
        {
          id: "riskAlerts",
          icon: Shield,
          label: "High-risk alerts",
          description: "Notify when BRI score enters High or Critical",
          enabled: riskAlerts,
          onChange: setRiskAlerts,
        },
        {
          id: "weeklyDigest",
          icon: Bell,
          label: "Weekly digest",
          description: "Summary of your analyses every Monday",
          enabled: weeklyDigest,
          onChange: setWeeklyDigest,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
      <motion.div {...fadeUp(0)}>
        <h2
          className="text-[#042718] text-xl sm:text-2xl font-semibold mb-1"
          style={{ fontFamily: "'Onest', sans-serif" }}
        >
          Settings
        </h2>
        <p className="text-[#042718]/50 text-sm">
          Manage notifications and account preferences
        </p>
      </motion.div>

      {sections.map((section, sIdx) => (
        <motion.div
          key={section.title}
          {...fadeUp(0.08 + sIdx * 0.05)}
          className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-[#042718]/06">
            <section.icon size={16} className="text-[#198F38]" />
            <h3
              className="text-[#042718] font-semibold text-sm sm:text-base"
              style={{ fontFamily: "'Onest', sans-serif" }}
            >
              {section.title}
            </h3>
          </div>

          <div className="divide-y divide-[#042718]/05">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-[#042718]/04 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <item.icon size={16} className="text-[#042718]/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#042718] text-sm font-medium">{item.label}</p>
                  <p className="text-[#042718]/45 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <Toggle
                  id={item.id}
                  enabled={item.enabled}
                  onChange={item.onChange}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Appearance / Language placeholders */}
      <motion.div
        {...fadeUp(0.15)}
        className="bg-white rounded-2xl border border-[#042718]/06 shadow-sm p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-[#F6FDFF] border border-[#042718]/06">
            <Moon size={16} className="text-[#042718]/40 shrink-0" />
            <div className="min-w-0">
              <p className="text-[#042718] text-sm font-medium">Theme</p>
              <p className="text-[#042718]/45 text-xs">Light (default)</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-[#F6FDFF] border border-[#042718]/06">
            <Globe size={16} className="text-[#042718]/40 shrink-0" />
            <div className="min-w-0">
              <p className="text-[#042718] text-sm font-medium">Language</p>
              <p className="text-[#042718]/45 text-xs">English</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#042718] text-white text-sm font-medium hover:bg-[#063b25] transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle size={16} className="text-[#4ade80]" />
              Saved
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
        <p className="text-[#042718]/35 text-xs text-center sm:text-left">
          Preferences are stored locally for this session
        </p>
      </motion.div>
    </div>
  );
}
