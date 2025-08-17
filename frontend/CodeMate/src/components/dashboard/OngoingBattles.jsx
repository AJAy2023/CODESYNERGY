// src/components/dashboard/OngoingBattles.jsx
import React from "react";
import { motion } from "framer-motion";

const GUARDIAN = "#0AA1C0";

const matches = [
  { id: "room-123", players: ["Ravi", "Sana"], time: "2:13" },
  { id: "room-456", players: ["Akash", "Maya"], time: "5:02" },
];

export default function OngoingBattles() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {matches.map((m) => (
        <motion.div
          key={m.id}
          whileHover={{ y: -6 }}
          className="p-4 rounded-xl bg-white/3 backdrop-blur-lg border border-white/6 relative overflow-hidden"
          style={{
            boxShadow: `0 10px 30px ${hexToRgba(GUARDIAN, 0.06)}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Match</div>
              <div className="text-lg text-white font-semibold">{m.id}</div>
            </div>
            <div className="text-sm text-slate-400">{m.time}</div>
          </div>

          <div className="mt-3 flex gap-3 items-center">
            {m.players.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/6 text-white font-semibold">
                  {p.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm text-slate-200">{p}</div>
              </div>
            ))}
          </div>

          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: `linear-gradient(90deg, ${hexToRgba(GUARDIAN, 0.06)} 0%, transparent 30%)`,
              mixBlendMode: "overlay",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* helper */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
