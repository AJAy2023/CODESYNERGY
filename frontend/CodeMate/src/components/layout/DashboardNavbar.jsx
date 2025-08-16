// src/components/layout/DashboardNavbar.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MessageSquare, User, Coins } from "lucide-react";
import { searchUsers } from "../../api/friends";
const GUARDIAN = "#0AA1C0";

export default function DashboardNavbar({ user }) {
  const navigate = useNavigate();
  const [openMobile, setOpenMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // live search from backend (debounced with setTimeout)
  useEffect(() => {
    let active = true;
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await searchUsers(q.trim());
        if (!active) return;
        setSuggestions(res?.data?.users || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (active) setLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchData, 250);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [q]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-3 left-0 right-0 z-40`}
    >
      <div
        className={`max-w-7xl mx-auto px-6 py-3 rounded-xl transition-all flex items-center gap-4 justify-between backdrop-blur-lg`}
        style={{
          background: scrolled ? "rgba(6,10,12,0.68)" : "rgba(6,10,12,0.48)",
          border: `1px solid rgba(255,255,255,0.04)`,
          boxShadow: scrolled ? `0 10px 30px ${hexToRgba(GUARDIAN, 0.06)}` : "none",
        }}
      >
        {/* left - logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              navigate("/dashboard");
            }}
            className="flex items-center gap-3 cursor-pointer"
            aria-label="Go to dashboard"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black"
              style={{
                background: `linear-gradient(180deg, ${shadeHex(GUARDIAN, 6)}, ${GUARDIAN})`,
                boxShadow: `0 6px 18px ${hexToRgba(GUARDIAN, 0.12)}`,
              }}
            >
              BC
            </div>
            <div className="text-white font-bold tracking-wide ">
              <span className="text-white font-bold tracking-wide">Buddy</span>
              <span
                style={{ color: "rgba(10,161,192,1)" }}
                className="text-white font-bold tracking-wide"
              >
                Code
              </span>
            </div>
          </button>
        </div>

        {/* center - search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center relative">
          <div
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid rgba(255,255,255,0.03)`,
            }}
          >
            <Search size={18} className="text-slate-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search problems, users, rooms..."
              className="bg-transparent outline-none text-sm text-slate-200 w-full"
            />
          </div>

          {/* suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-14 bg-[#050505] border border-white/6 rounded-lg py-2 shadow-lg z-50"
              >
                {suggestions.map((u) => (
                  <li
                    key={u._id}
                    onClick={() => {
                      setQ("");
                      setSuggestions([]);
                      navigate(`/profile/${u._id}`);
                    }}
                    className="px-4 py-2 text-sm hover:bg-white/3 cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={u.profilePic || "https://i.pravatar.cc/100?img=4"}
                      alt={u.username}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>{u.username}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            {loadingSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute left-0 right-0 top-14 bg-[#050505] border border-white/6 rounded-lg py-3 text-center text-sm text-slate-400"
              >
                Searching…
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* right actions (unchanged) */}
        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
            title="Coins"
            onClick={() => navigate("/wallet")}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <Coins size={18} className="text-yellow-400" />
            <div className="text-sm font-semibold text-white">{user?.coins ?? 0}</div>
          </div>

          <button
            onClick={() => navigate("/notifications")}
            title="Notifications"
            className="p-2 rounded-md hover:bg-white/3 transition"
          >
            <Bell size={18} className="text-slate-200" />
          </button>

          <button
            onClick={() => navigate("/messages")}
            title="Messages"
            className="p-2 rounded-md hover:bg-white/3 transition"
          >
            <MessageSquare size={18} className="text-slate-200" />
          </button>

          <button
            onClick={() => navigate("/user-profile")}
            title="Profile"
            className="flex items-center gap-2 p-1 px-2 rounded-md hover:bg-white/3 transition cursor-pointer"
            aria-label="Open profile"
          >
            <User size={18} className="text-slate-200" />
            <span className="hidden md:inline text-sm text-slate-200">
              {user?.username ?? "You"}
            </span>
          </button>

          {/* mobile toggle */}
          <div className="md:hidden">
            <button onClick={() => setOpenMobile((s) => !s)}>
              <svg width="26" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="2" rx="1" fill="white" />
                <rect y="9" width="20" height="2" rx="1" fill="white" />
                <rect y="18" width="20" height="2" rx="1" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {openMobile && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="md:hidden mt-2 px-6"
          >
            <div className="bg-[#050505] p-4 rounded-xl border border-white/6">
              <div className="flex flex-col gap-3">
                <button onClick={() => { navigate("/dashboard"); setOpenMobile(false); }} className="text-left">Home</button>
                <button onClick={() => { navigate("/features"); setOpenMobile(false); }} className="text-left">Features</button>
                <button onClick={() => { navigate("/profile"); setOpenMobile(false); }} className="text-left">Profile</button>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 px-3 py-2 rounded bg-emerald-600 text-black" onClick={() => navigate("/login")}>Login</button>
                  <button className="flex-1 px-3 py-2 rounded bg-cyan-500 text-black" onClick={() => navigate("/register")}>Sign up</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
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
