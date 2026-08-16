
// src/components/layout/Navbar.jsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

import {
  IconHome,
  IconStars,
  IconLogin,
  IconUserPlus,
  IconMenu2,
  IconX,
  IconBolt,
} from "@tabler/icons-react";

const navItems = [
  {
    label: "Home",
    icon: <IconHome size={18} />,
    href: "/",
  },
  {
    label: "Features",
    icon: <IconStars size={18} />,
    href: "#features",
  },
  {
    label: "Upcoming",
    icon: <IconBolt size={18} />,
    href: "#upcoming",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScroll = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();

      const section = document.querySelector(href);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
        });
      }

      setOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#050B16]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center text-2xl font-extrabold tracking-wide"
        >
          <span className="text-white transition group-hover:text-slate-200">
            Buddy
          </span>

          <span className="text-cyan-400 transition group-hover:text-cyan-300">
            Code
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleScroll(e, item.href)}
              className="group relative flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-cyan-400"
            >
              {item.icon}
              {item.label}

              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}

          {/* Login Button */}
          <Link
            to="/login"
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#06b6d4] hover:bg-[#7c3aed]  text-black font-medium transition-colors"
          >
            <IconLogin size={18} /> Login
          </Link>

          {/* Signup Button */}
          <Link
              to="/register"
              className="flex items-center gap-1 px-4 py-2 bg-[#06b6d4] text-black rounded-lg hover:bg-[#7c3aed] transition-colors"
            >
              <IconUserPlus size={18} /> Sign Up
            </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="text-white md:hidden"
        >
          {open ? <IconX size={30} /> : <IconMenu2 size={30} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/10 bg-[#050B16]/95 px-6 py-6 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-5">
              
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleScroll(e, item.href)}
                  className="flex items-center gap-3 text-slate-300 transition hover:text-cyan-400"
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}

              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
              >
                <IconLogin size={18} />
                Login
              </Link>

              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:bg-cyan-300"
              >
                <IconUserPlus size={18} />
                Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}




