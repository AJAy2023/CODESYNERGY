// src/components/dashboard/AIBuddyWidget.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";

export default function AIBuddyWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed right-6 bottom-6 z-50">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              className="w-80 bg-white/4 backdrop-blur-lg rounded-xl p-3 border border-white/6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">AI</div>
                  <div>
                    <div className="text-sm font-bold text-cyan-300">AI Coding Buddy</div>
                    <div className="text-[10px] text-emerald-400 font-medium">Coming Soon 🚀</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition">✕</button>
              </div>

              <div className="bg-zinc-950/80 rounded-xl p-3 border border-white/10 space-y-2">
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 text-cyan-300">
                  <span>🤖</span>
                  <span>AI Buddy Assistant Status:</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your AI Coding Buddy will be active soon! We are actively working on building real-time code hints, debugging assistance, and problem walkthroughs.
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  disabled
                  placeholder="AI Buddy activating soon..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-white/10 text-slate-500 cursor-not-allowed outline-none"
                />
                <button
                  onClick={() => alert("🚀 AI Buddy: Coming Soon!\nWe are actively working on this feature.")}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
                >
                  Notify
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((s) => !s)}
          className="mt-3 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(180deg,#00e4b4,#0aa1c0)",
          }}
          aria-label="Open AI buddy"
        >
          <MessageSquare className="text-black" />
        </button>
      </div>
    </>
  );
}
