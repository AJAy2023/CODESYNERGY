// src/Components/HomePage/AIChatAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot } from "lucide-react";

const GUARDIAN = "#06B6D4";

const messageVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.995 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6 },
};

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, who: "assistant", text: "Hi — I’m your coding assistant. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const idRef = useRef(2);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Simulate assistant reply (replace with API call later)
  const simulateAssistantReply = (userText) => {
    setTyping(true);
    setTimeout(() => {
      const reply = generateReply(userText);
      setMessages((m) => [
        ...m,
        { id: idRef.current++, who: "assistant", text: reply },
      ]);
      setTyping(false);
    }, 900 + Math.min(1200, userText.length * 20));
  };

  const generateReply = (userText) => {
    if (!userText.trim()) return "Could you share more details?";
    if (userText.toLowerCase().includes("optimize")) {
      return "Try reducing nested loops and using built-in methods like .map()/.reduce() where possible. Also profile hotspots.";
    }
    if (userText.toLowerCase().includes("two sum")) {
      return "A hashmap (value->index) gives O(n) time — iterate once and check complements.";
    }
    return "Nice question — here's a short hint: break the problem into smaller steps, test each part, and debug with small inputs.";
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: idRef.current++, who: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    simulateAssistantReply(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section aria-labelledby="ai-assistant-heading" className="py-16 px-4 relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] via-[#0F3460] to-[#16213E] text-white">
      {/* Animated glowing background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1.2 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glass card */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
              border: `1px solid rgba(6,182,212,0.12)`,
              boxShadow: `0 10px 30px rgba(6,182,212,0.04)`,
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div
                className="flex-none rounded-lg p-2"
                style={{
                  background: "linear-gradient(180deg, rgba(6,182,212,0.12), rgba(6,182,212,0.06))",
                  border: `1px solid rgba(6,182,212,0.14)`,
                }}
                aria-hidden
              >
                <Bot size={22} color={GUARDIAN} />
              </div>

              <div>
                <h3 id="ai-assistant-heading" className="text-lg font-semibold text-white">
                  AI Coding Assistant
                </h3>
                <p className="text-sm text-slate-300">
                  Ask questions, get hints, and debug faster — instant help inside the flow.
                </p>
              </div>
            </div>

            {/* Chat list */}
            <div
              ref={listRef}
              className="h-72 overflow-y-auto p-6 space-y-3"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.005), rgba(255,255,255,0.002))" }}
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={messageVariants}
                    transition={{ duration: 0.28 }}
                    className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-snug`}
                      style={
                        m.who === "user"
                          ? {
                              background: `linear-gradient(180deg, rgba(6,182,212,0.12), rgba(6,182,212,0.08))`,
                              color: "#052027",
                              border: `1px solid rgba(6,182,212,0.16)`,
                              boxShadow: `0 8px 20px rgba(6,182,212,0.06)`,
                            }
                          : {
                              background: "rgba(255,255,255,0.025)",
                              color: "rgba(255,255,255,0.95)",
                              border: "1px solid rgba(255,255,255,0.03)",
                            }
                      }
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* typing indicator */}
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="px-4 py-3 rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-300/40 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-slate-300/40 animate-pulse delay-75" />
                      <div className="h-2 w-2 rounded-full bg-slate-300/40 animate-pulse delay-150" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input area */}
            <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the assistant (press Enter to send)"
                  rows={1}
                  className="flex-1 resize-none px-4 py-3 rounded-xl bg-transparent border border-white/6 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSend}
                  aria-label="Send message"
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(180deg, ${GUARDIAN}, ${shadeHex(GUARDIAN, -12)})`,
                    boxShadow: `0 8px 20px ${hexToRgba(GUARDIAN, 0.18)}`,
                  }}
                >
                  <Send size={18} color="#022022" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------
  Small helper functions
   -------------------------- */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
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
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
