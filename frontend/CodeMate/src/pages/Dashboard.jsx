// src/pages/Dashboard.jsx
import { Suspense, lazy } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardNavbar from "../components/layout/DashboardNavbar";
import StatsCards from "../components/dashboard/StatsCards";
import AIBuddyWidget from "../components/dashboard/AIBuddyWidget";
import { motion } from "framer-motion";
import { Play, Plus, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProgressChart = lazy(() => import("../components/dashboard/ProgressChart"));

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-900 text-white pt-6 pb-12">
      <DashboardNavbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Welcome, {user?.username ?? "Coder"}!</h1>
            <p className="text-slate-400 mt-1">Ready to practice? Invite friends or jump into a match.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards user={user} />

        {/* Wireframe Layout: Progress Chart Left, Vertical Action Cards Stack Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Progress Bar / Weekly Progress */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <Suspense fallback={<div className="p-6 bg-white/5 rounded-xl border border-white/10 text-slate-400">Loading progress...</div>}>
              <ProgressChart />
            </Suspense>
          </div>

          {/* Right Column: Stacked Action Cards */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-4">
            {/* 1. Solo Practice */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/problems")}
              className="w-full flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-bold shadow-lg cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center">
                  <Play className="text-black fill-black" size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold">Solo Practice</div>
                  <div className="text-xs text-black/70 font-medium">Solve coding challenges at your pace</div>
                </div>
              </div>
            </motion.button>

            {/* 2. Create Room */}
            <motion.div
              whileHover={{ translateY: -3 }}
              onClick={() => navigate("/rooms/createroom")}
              className="p-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Create Room</div>
                <div className="text-lg font-semibold text-white mt-0.5">Collaborate now</div>
                <p className="text-xs text-slate-400 mt-1">Invite friends or create a private arena.</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#06b6d4]/20 border border-[#06b6d4]/40 flex items-center justify-center text-[#06b6d4]">
                <Plus size={20} />
              </div>
            </motion.div>

            {/* 3. Join Room */}
            <motion.div
              whileHover={{ translateY: -3 }}
              onClick={() => navigate("/rooms/joinroom")}
              className="p-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Join Room</div>
                <div className="text-lg font-semibold text-white mt-0.5">Enter code</div>
                <p className="text-xs text-slate-400 mt-1">Join friends or public matches instantly.</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <LogIn size={20} />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <AIBuddyWidget />
    </div>
  );
}
