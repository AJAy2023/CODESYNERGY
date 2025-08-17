// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import {
  IconHome,
  IconStars,
  IconLogin,
  IconUserPlus,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

const navItems = [
  { label: "Home", icon: <IconHome size={18} />, href: "/", type: "home" },
  { label: "Features", icon: <IconStars size={18} />, href: "#features" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScroll = (e, href, type) => {
    e.preventDefault();
    if (type === "home") {
      navigate("/", { replace: true });
      window.location.reload(); // force re-render
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "fixed top-0 w-full z-50 transition-all",
        scrolled ? "backdrop-blur-lg bg-[#0b1220]/80 shadow-lg" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-2xl font-bold flex items-center">
          <span className="text-white">Buddy</span>
          <span style={{ color: "rgba(10,161,192,1)" }}>Code</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(({ label, icon, href, type }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => handleScroll(e, href, type)}
              className="group flex items-center gap-1 text-white hover:text-[#06b6d4] transition-colors relative"
            >
              {icon}
              {label}
              <span className="absolute -bottom-1 left-0 block w-0 h-0.5 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all group-hover:w-full" />
            </a>
          ))}
          <Link
            to="/login"
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#06b6d4] text-black font-medium transition-colors"
          >
            <IconLogin size={18} /> Login
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#7c3aed] text-black font-medium transition-colors"
          >
            <IconUserPlus size={18} /> Sign Up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <IconX size={28} /> : <IconMenu2 size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0b1220]/90 backdrop-blur-lg px-6 py-4 space-y-4"
          >
            {navItems.map(({ label, icon, href, type }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleScroll(e, href, type)}
                className="flex items-center gap-2 text-white hover:text-[#06b6d4] transition-colors"
              >
                {icon}
                {label}
              </a>
            ))}
            <Link
              to="/login"
              className="flex items-center gap-1 px-4 py-2 bg-[#7c3aed] text-black rounded-lg hover:bg-[#06b6d4] transition-colors"
            >
              <IconLogin size={18} /> Login
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1 px-4 py-2 bg-[#06b6d4] text-black rounded-lg hover:bg-[#7c3aed] transition-colors"
            >
              <IconUserPlus size={18} /> Sign Up
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
