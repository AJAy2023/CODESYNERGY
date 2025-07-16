// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import rewardAnimation from "../assets/reward.json";
import { BASE_URL } from "../api/config";

import {
  Flame,
  Coins,
  Bell,
  MessageSquare,
  User,
  PlayCircle,
  Plus,
  LogIn,
  ShieldCheck,
  Gift,
  Activity,
  Search,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    };
    fetchUser();
  }, []);

  const progressData = [
    { name: "Mon", value: 2 },
    { name: "Tue", value: 3 },
    { name: "Wed", value: 1 },
    { name: "Thu", value: 4 },
    { name: "Fri", value: 3 },
    { name: "Sat", value: 5 },
    { name: "Sun", value: 2 },
  ];

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-zinc-900 min-h-screen text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Left */}
        <div className="flex items-center gap-6">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-3xl font-extrabold text-cyan-400 tracking-wide cursor-pointer"
          >
            CodeMate
          </h1>
          <div className="flex items-center gap-1 animate-pulse text-yellow-400">
            <Flame size={20} />
            <span className="text-sm">🔥 5-Day Streak</span>
          </div>
          {user && (
            <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-green-400">
              <Coins size={16} />
              <span className="text-sm font-bold">{user.coins ?? 0} Coins</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div
          onClick={() => navigate("/search")}
          className="relative w-72 cursor-pointer"
        >
          <div className="flex items-center bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 shadow hover:border-cyan-500">
            <Search size={18} className="text-gray-400" />
            <input
              placeholder="Search users..."
              readOnly
              className="ml-2 bg-transparent outline-none text-sm text-white w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <Bell className="cursor-pointer hover:text-yellow-300" />
          <MessageSquare className="cursor-pointer hover:text-blue-400" />
          <User
            className="cursor-pointer hover:text-blue-400"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-4">Welcome, {user?.username || "User"}!</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[{ label: "Problems Solved", value: "42" },
          { label: "Coins Earned", value: `${user?.coins ?? 0}` },
          { label: "Friends Online", value: "3" },
          { label: "Leaderboard Rank", value: "Top 10", link: "/leaderboard" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            onClick={() => stat.link && navigate(stat.link)}
            className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-cyan-500 transition"
          >
            <h3 className="text-gray-300 text-lg font-medium">{stat.label}</h3>
            <p className="text-white text-2xl font-bold mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/problems")}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-700 via-green-500 to-black text-white px-6 py-4 text-lg rounded-lg shadow-md cursor-pointer border border-zinc-700 hover:border-white"
        >
          <PlayCircle size={20} /> Solo Practice
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/create-room")}
          className="cursor-pointer bg-gradient-to-r from-cyan-600 to-sky-500 text-white p-5 rounded-lg shadow-md border border-zinc-700 hover:border-white"
        >
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Plus /> Create Coding Room
          </div>
          <p className="text-sm mt-2 text-gray-200">
            Launch a collaborative room to solve problems together.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/join-room")}
          className="cursor-pointer bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white p-5 rounded-lg shadow-md border border-zinc-700 hover:border-white"
        >
          <div className="flex items-center gap-2 text-lg font-semibold">
            <LogIn /> Join Room
          </div>
          <p className="text-sm mt-2 text-gray-200">
            Enter a room code and join your friend’s coding match.
          </p>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 hover:border-cyan-500"
        >
          <h3 className="text-xl font-semibold mb-4">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 hover:border-lime-500"
        >
          <div className="flex items-center gap-2 mb-2 text-lime-300">
            <Activity size={20} /> <h3 className="text-lg font-semibold">Live Tracker</h3>
          </div>
          <p className="text-sm text-gray-300">
            🚀 Ajay solved “Two Sum” just now.  
            <br />
            📊 You are currently ranked #7.  
            <br />
            ⏰ 2 users active in your friend list.
          </p>
        </motion.div>
      </div>

      {/* Reward */}
      <div className="flex flex-col items-center mt-6">
        <Lottie animationData={rewardAnimation} className="w-32 h-32" loop />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => alert("🎉 Daily reward claimed!")}
          className="mt-2 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded shadow"
        >
          <Gift size={18} /> Claim Daily Reward
        </motion.button>
      </div>
    </div>
  );
};

export default Dashboard;
