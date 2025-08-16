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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/6 flex items-center justify-center text-white font-semibold">AI</div>
                  <div>
                    <div className="text-sm font-semibold">AI Buddy</div>
                    <div className="text-xs text-slate-400">Ask for hints, translations, walkthroughs</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-300">✕</button>
              </div>

              <div className="h-36 overflow-auto bg-transparent rounded p-2 border border-white/3">
                <div className="text-sm text-slate-200 mb-2">AI: Hey coder — what do you want to solve today?</div>
                <div className="text-sm text-slate-400">You: Show me hints for Two Sum</div>
              </div>

              <div className="mt-2 flex gap-2">
                <input placeholder="Ask the AI buddy..." className="flex-1 px-3 py-2 rounded bg-[#00000022] text-white outline-none" />
                <button className="px-3 py-2 rounded bg-emerald-500 text-black">Send</button>
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
