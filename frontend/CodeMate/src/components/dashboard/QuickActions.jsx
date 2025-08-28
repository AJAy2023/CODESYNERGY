// src/components/dashboard/QuickActions.jsx
import React from "react";
import { motion } from "framer-motion";
import { Play, Plus, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GUARDIAN = "#0AA1C0";

export default function QuickActions() {
  const nav = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.button
        whileHover={{ scale: 1.03 }}
        onClick={() => nav("/problems")}
        className="flex items-center gap-3 justify-center bg-gradient-to-r from-emerald-500 to-cyan-400 text-black px-6 py-4 rounded-lg font-semibold shadow-md cursor-pointer"
      >
        <Play /> Solo Practice
      </motion.button>

      <motion.div
        whileHover={{ translateY: -6 }}
        className="p-4 rounded-lg bg-white/4 backdrop-blur-lg border border-white/6 cursor-pointer"
        onClick={() => nav("/rooms/createroom")}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300">Create Room</div>
            <div className="text-lg font-semibold text-white">Collaborate now</div>
          </div>
          <div
            className="p-2 rounded-md"
            style={{
              background: `linear-gradient(180deg, ${shadeHex(GUARDIAN, 4)}, ${GUARDIAN})`,
              boxShadow: `0 8px 28px ${hexToRgba(GUARDIAN, 0.08)}`,
            }}
          >
            <Plus className="text-black" />
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-3">Invite friends or create a private arena.</p>
      </motion.div>

      <motion.div
        whileHover={{ translateY: -6 }}
        className="p-4 rounded-lg bg-white/4 backdrop-blur-lg border border-white/6 cursor-pointer"
        onClick={() => nav("/rooms/joinroom")}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300">Join Room</div>
            <div className="text-lg font-semibold text-white">Enter code </div>
          </div>
          <div
            className="p-2 rounded-md"
            style={{
              background: `linear-gradient(180deg, ${shadeHex(GUARDIAN, 4)}, ${GUARDIAN})`,
              boxShadow: `0 8px 28px ${hexToRgba(GUARDIAN, 0.08)}`,
            }}
          >
            <LogIn className="text-black" />
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-3">Join friends or public matches instantly.</p>
      </motion.div>
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
function shadeHex(hex, percent) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
  let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
