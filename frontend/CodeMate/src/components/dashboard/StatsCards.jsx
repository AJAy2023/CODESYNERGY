// src/components/dashboard/StatsCards.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Code2, Coins, Users, Award } from "lucide-react";
import { BASE_URL } from "../../api/config";
import CountUp from "react-countup";

const GUARDIAN = "#0AA1C0";

function useCountUp(target = 0, duration = 900) {
  const ref = useRef(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      ref.current = Math.round(target * t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}

export default function StatsCards({ user }) {
  const stats = [
    { label: "Problems Solved", value: Number(user?.solved ?? 42), Icon: Code2 },
    { label: "Coins", value: Number(user?.coins ?? 120), Icon: Coins },
    { label: "Friends Online", value: Number(user?.friendsOnline ?? 3), Icon: Users },
    {
      label: "Leaderboard Rank",
      value: user?.rank ? user.rank : "Top 10",
      Icon: Award,
      color: GUARDIAN,
      href: "/rank/leaderboard"
    //   type: "leaderboard"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s, i) => {
        const valRef = useCountUp(typeof s.value === "number" ? s.value : 0, 900 + i * 70);

        const cardContent = (
          <motion.div
            whileHover={{
              translateY: -6,
              boxShadow: `0 12px 30px ${hexToRgba(GUARDIAN, 0.08)}`
            }}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/6 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid rgba(255,255,255,0.03)`,
                  }}
                >
                  <s.Icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm text-slate-300">{s.label}</div>
                  <div className="text-2xl font-bold mt-1 text-white">
                    {typeof s.value === "number" ? (
                      <CountUp end={s.value} duration={1.5} separator="," />
                       ) : (
                     s.value
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-400">›</div>
            </div>
          </motion.div>
        );

        // If href exists, wrap in clickable div
        return s.href ? (
          <div key={s.label} onClick={() => (window.location.href = s.href)}>
            {cardContent}
          </div>
        ) : (
          <div key={s.label}>{cardContent}</div>
        );
      })}
    </div>
  );
}

/* helpers */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
