// src/components/dashboard/FriendActivity.jsx
import React from "react";
import { motion } from "framer-motion";

const friends = [
  { name: "Ravi", active: true },
  { name: "Sana", active: false },
  { name: "Akash", active: true },
];

export default function FriendActivity() {
  return (
    <div className="bg-white/4 backdrop-blur-lg p-4 rounded-xl border border-white/6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Friends Activity</h3>
        <button className="text-sm text-slate-300">Invite</button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {friends.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center font-semibold text-white">
                {f.name.slice(0, 2).toUpperCase()}
              </div>
              {f.active && <span className="absolute -right-0 -bottom-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-black" />}
            </div>
            <div>
              <div className="text-sm text-white">{f.name}</div>
              <div className="text-xs text-slate-400">
                {f.active ? <TypingDots /> : "Last seen 1h"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.15s" }} />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
    </div>
  );
}
