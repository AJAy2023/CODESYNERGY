import React from "react";
import {
  FaTwitter,
  FaLinkedinIn,
  FaGithub,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-[#050B16]">
      
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-100px] bottom-[-100px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-extrabold tracking-wide text-white">
              Buddy<span className="text-cyan-400">Code</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-400">
              Real-time coding battles, AI-powered help,
              collaborative coding rooms, and competitive
              programming — all in one platform.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-4">
              
              <a
                href="https://x.com/ParadoxDevX"
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:scale-110 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                  <FaTwitter />
                </div>
              </a>

              <a
                href="https://www.linkedin.com/company/paradoxdevx/"
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:scale-110 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                  <FaLinkedinIn />
                </div>
              </a>

              <a
                href="https://github.com/Paradoxdevx"
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:scale-110 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                  <FaGithub />
                </div>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Platform
            </h3>

            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/problems"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Problems
                </Link>
              </li>

              <li>
                <Link
                  to="/battle"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Battle Arena
                </Link>
              </li>

              <li>
                <Link
                  to="/discussion"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Discussions
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Features
            </h3>

            <ul className="space-y-4 text-slate-400">
              <li className="transition hover:text-cyan-400 cursor-pointer">
                Live Collaboration
              </li>

              <li className="transition hover:text-cyan-400 cursor-pointer">
                AI Code Help
              </li>

              <li className="transition hover:text-cyan-400 cursor-pointer">
                Multiplayer Battles
              </li>

              <li className="transition hover:text-cyan-400 cursor-pointer">
                Coding Rooms
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Community
            </h3>

            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#upcoming"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Upcoming
                </a>
              </li>

              <li>
                <a
                  href="/"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  href="/"
                  className="text-slate-400 transition hover:text-cyan-400"
                >
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()}{" "}
              <a
                href="https://paradoxdevx.online/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                ParadoxDevx
              </a>
              . All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="/" className="transition hover:text-cyan-400">
                Privacy
              </a>

              <a href="/" className="transition hover:text-cyan-400">
                Terms
              </a>

              <a href="/" className="transition hover:text-cyan-400">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;