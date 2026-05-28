// src/Components/HomePage/HeroSection.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* Guardian color (kept consistent across the site) */
const GUARDIAN = "#0AA1C0";

const CODE_LINES = [
  "// Live collaborative session",
  "function startBattle(roomId) {",
  "  console.log(' Coding battle started in', roomId);",
  "  syncWithTeam();",
  "  // broadcast result to room",
  "}",
  "startBattle('room-123');",
];

export default function HeroSection() {
  // typing state (kept from your original implementation)
  const [displayedLines, setDisplayedLines] = useState([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const editorRef = useRef(null);

  // typing effect: continuous loop (unchanged logic but preserved)
  useEffect(() => {
    if (paused) return;
    const current = CODE_LINES[lineIndex] || "";
    const typingDelay = 25; // ms per char

    const timer = setTimeout(() => {
      setDisplayedLines((prev) => {
        const copy = prev.slice();
        if (!copy[lineIndex]) copy[lineIndex] = "";
        copy[lineIndex] = current.slice(0, charIndex + 1);
        return copy;
      });

      if (charIndex + 1 > current.length) {
        // go to next line after short pause
        setCharIndex(0);
        setLineIndex((li) => {
          const next = li + 1;
          if (next >= CODE_LINES.length) {
            // reset after finishing all lines
            setPaused(true);
            setTimeout(() => {
              setDisplayedLines([]);
              setLineIndex(0);
              setCharIndex(0);
              setPaused(false);
            }, 1200);
            return 0;
          }
          return next;
        });
      } else {
        setCharIndex((c) => c + 1);
      }
    }, typingDelay);

    return () => clearTimeout(timer);
  }, [charIndex, lineIndex, paused]);

  // keep scroll at bottom
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.scrollTop = editorRef.current.scrollHeight;
  }, [displayedLines]);

  // small helpers (kept your highlight function)
  const highlight = (text) => {
    if (!text) return text;
    const esc = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let html = esc(text)
      .replace(/\b(function|const|let|return|var)\b/g, `<span class="text-amber-300">$1</span>`)
      .replace(/\b(console|syncWithTeam|startBattle)\b/g, `<span class="text-sky-300">$1</span>`)
      .replace(/('.*?')/g, `<span class="text-emerald-300">$1</span>`);
    return html;
  };

  // avatars data (you can replace with real images later)
  const avatars = [
    { id: "rv", label: "Ajay", src: null },
    { id: "aj", label: "Amol", src: null },
    { id: "dh", label: "Dhruv", src: null },
    { id: "th", label: "Thushar", src: null },
  ];

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden"
      style={{
        minHeight: "75vh",
        
        background:
          "linear-gradient(135deg, #0B1120 0%, #0A0F1F 40%, #0D1724 100%)",
      }}
    >
      {/* animated overlay / moving gradient (subtle) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(600px 400px at 10% 10%, rgba(10,161,192,0.06), transparent 10%), radial-gradient(500px 350px at 90% 85%, rgba(10,161,192,0.04), transparent 12%)",
          animation: "bgShift 18s linear infinite alternate",
        }}
      />

      {/* faint grid / texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none -z-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)",
          backgroundSize: "20px 20px, 20px 20px",
          opacity: 0.03,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-20 lg:flex lg:items-center lg:gap-12">
        {/* LEFT: copy (font sizes balanced, not overpowering) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:w-1/2 text-center lg:text-left"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
            <span>Battle </span>      
            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(10,161,192,1) 0%, rgba(59,130,246,0.95) 40%, rgba(10,161,192,1) 100%)",
                backgroundSize: "200% 100%",
                display: "inline-block",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              in real-time
            </motion.span>

            <span>, collaborate with friends,</span>
            <br />
            <span>and get </span>

            <motion.span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(10,161,192,1) 0%, rgba(59,130,246,0.95) 40%, rgba(10,161,192,1) 100%)",
                backgroundSize: "200% 100%",
                display: "inline-block",
              }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            >
              AI-powered help
            </motion.span>

            <span> — all in one platform.</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
            Code live with teammates, challenge others in timed arenas, and get instant hints to fix issues.
            Designed for learners, teams, and competitive coders — fast, secure, and collaborative.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
            <a
              href="/coming-soon"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold"
              style={{
                background: `linear-gradient(180deg, ${GUARDIAN}, ${shadeHex(GUARDIAN, -12)})`,
                color: "#042022",
                boxShadow: `0 10px 30px ${hexToRgba(GUARDIAN, 0.16)}`,
              }}
            >
              Get Started <ArrowRight size={16} />
            </a>

            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold border border-white/10 text-white hover:border-white/20 transition"
            >
              Learn More
            </a>
          </div>

          {/* micro features — small, neat */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 text-sm">
            <div className="px-3 py-2 rounded-lg bg-white/3 text-slate-200 text-center">Real-time Editor</div>
            <div className="px-3 py-2 rounded-lg bg-white/3 text-slate-200 text-center">Live Battles</div>
            <div className="px-3 py-2 rounded-lg bg-white/3 text-slate-200 text-center">AI Hints</div>
          </div>
        </motion.div>

        {/* RIGHT: larger panel with glow border, avatars + live code */}
        <motion.div
          initial={{ opacity: 0, x: 12, scale: 0.99 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.12 }}
          className="lg:w-3/5 mt-8 lg:mt-0 flex justify-center"
        >
          {/* Glow border wrapper */}
          <div
            className="rounded-2xl p-[1.5px]"
            style={{
              background: `linear-gradient(90deg, ${hexToRgba(GUARDIAN, 0.12)}, rgba(255,255,255,0.04))`,
              boxShadow: `0 12px 40px ${hexToRgba(GUARDIAN, 0.08)}`,
            }}
          >
            {/* inner panel */}
            <div
              className="w-full max-w-4xl rounded-2xl p-5"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                backdropFilter: "blur(8px)",
                border: `1px solid rgba(255,255,255,0.02)`,
                boxShadow: `0 18px 50px rgba(3,10,12,0.6)`,
              }}
            >
              {/* avatar stack & invite */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex -space-x-2 items-center">
                  {avatars.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, scale: 0.85, x: -6 * i }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.06, type: "spring", stiffness: 100 }}
                      className="relative group"
                      style={{ zIndex: avatars.length - i }}
                    >
                      {/* avatar circle (initials) */}
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{
                          background: shadeHex(GUARDIAN, -(i * 6)),
                          border: "2px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        {t.label.slice(0, 2).toUpperCase()}
                      </div>

                      {/* tooltip */}
                      <div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-slate-900 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ transformOrigin: "center" }}
                      >
                        {t.label}
                      </div>

                      {/* pulse ring */}
                      <span
                        aria-hidden
                        className="absolute -inset-1 rounded-full"
                        style={{
                          boxShadow: `0 0 20px ${hexToRgba(GUARDIAN, 0.10)}`,
                          animation: "pulseRing 1.8s infinite ease-in-out",
                        }}
                      />
                    </motion.div>
                  ))}
                  <div className="ml-3 text-sm text-slate-300">4 collaborators</div>
                </div>

                <button
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium"
                  style={{
                    background: `linear-gradient(180deg, ${shadeHex(GUARDIAN, -8)}, ${shadeHex(GUARDIAN, -18)})`,
                    color: "#eafcff",
                    boxShadow: `0 8px 24px ${hexToRgba(GUARDIAN, 0.12)}`,
                  }}
                >
                  Invite
                </button>
              </div>

              {/* editor header (mac dots + live badge) */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-t-lg mb-2" style={{ background: "rgba(0,0,0,0.12)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-auto text-xs text-slate-400">Live - Realtime Feed</div>
              </div>

              {/* editor body */}
              <div
                ref={editorRef}
                className="relative h-72 rounded-lg p-4 font-mono text-sm text-slate-200 overflow-auto"
                style={{
                  background: "#04121a",
                  border: `1px solid rgba(255,255,255,0.02)`,
                }}
              >
                {/* collaborator moving caret (animated) */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "40px",
                    left: "8%",
                    width: "2px",
                    height: "18px",
                    background: shadeHex(GUARDIAN, -8),
                    opacity: 0.95,
                    borderRadius: 2,
                    animation: "collaboratorMove 4s linear infinite",
                    boxShadow: `0 0 12px ${hexToRgba(GUARDIAN, 0.5)}`,
                  }}
                />

                {/* lines */}
                {displayedLines.length === 0 ? (
                  <div className="text-slate-500">Waiting for participants...</div>
                ) : (
                  <pre className="whitespace-pre-wrap">
                    {displayedLines.map((ln, i) => (
                      <div key={i} className="leading-6">
                        <span dangerouslySetInnerHTML={{ __html: highlight(ln) }} />
                        {i === displayedLines.length - 1 && (
                          <span
                            style={{
                              display: "inline-block",
                              marginLeft: 6,
                              width: 2,
                              height: 16,
                              background: GUARDIAN,
                              animation: "blinkCaret 1s steps(2,start) infinite",
                              verticalAlign: "middle",
                              boxShadow: `0 0 8px ${hexToRgba(GUARDIAN, 0.9)}`,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Keyframes & small CSS helpers */}
      <style>{`
        @keyframes blinkCaret {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes collaboratorMove {
          0% { left: 6%; opacity: 0.95; }
          20% { left: 28%; opacity: 0.95; }
          45% { left: 55%; opacity: 0.95; }
          70% { left: 36%; opacity: 0.95; }
          100% { left: 6%; opacity: 0.95; }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 ${hexToRgba(GUARDIAN,0.12)}; }
          50% { box-shadow: 0 0 18px 6px ${hexToRgba(GUARDIAN,0.06)}; }
          100% { box-shadow: 0 0 0 0 ${hexToRgba(GUARDIAN,0.02)}; }
        }
        @keyframes bgShift {
          0% { transform: translateY(0) scale(1); filter: hue-rotate(0deg); }
          50% { transform: translateY(-6px) scale(1.01); filter: hue-rotate(6deg); }
          100% { transform: translateY(0) scale(1); filter: hue-rotate(0deg); }
        }

        /* moving gradient text smoothing */
        .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
      `}</style>
    </section>
  );
}

/* --------------------------
  Small helpers used above
-------------------------- */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
 
// shade: -100..100 where negative darkens, positive lightens
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
