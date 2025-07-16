import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { motion } from "framer-motion";
import {
  User,
  Flame,
  Trophy,
  Coins,
  Bell,
  Crown,
} from "lucide-react";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/rank/leaderboard`);
        setLeaderboard(res.data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }
    };
    fetchLeaderboard();
  }, []);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const getBadge = (user) => {
    if (user.streak >= 5) return "🔥 Active";
    if (user.score > 700) return "🎯 Consistent";
    if (user.coins >= 1000) return "💎 Pro";
    return null;
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-zinc-900 min-h-screen text-white px-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
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
        </div>
        <div className="flex items-center gap-4">
          <Trophy className="text-yellow-500" />
          <Bell className="cursor-pointer hover:text-yellow-300" />
          <User
            className="cursor-pointer hover:text-blue-400"
            onClick={() => navigate("/user-profile")}
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-4xl font-extrabold mb-10 text-center text-yellow-400">🏆 Leaderboard</h2>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row justify-center gap-6 mb-12 items-end">
        {/* 2nd */}
        {topThree[1] && (
          <div className="flex flex-col items-center bg-zinc-800 px-4 py-6 rounded-xl border border-zinc-600 shadow-md w-80">
            <img
              src={topThree[1].avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=2nd"}
              className="w-16 h-16 rounded-full mb-2"
              alt="2nd"
            />
            <p className="text-lg font-bold text-gray-200">{topThree[1].username}</p>
            <p className="text-sm text-yellow-300 flex items-center gap-1">
              <Coins size={14} /> {topThree[1].coins}
            </p>
            <p className="text-white text-xl mt-1">🥈</p>
            <p className="text-sm text-cyan-300">Score: {topThree[1].score}</p>
          </div>
        )}

        {/* 1st */}
        {topThree[0] && (
          <div className="flex flex-col items-center bg-yellow-500 text-black px-6 py-8 rounded-xl border-4 border-yellow-300 shadow-lg w-68">
            <div className="relative">
              <img
                src={topThree[0].avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=1st"}
                className="w-20 h-20 rounded-full mb-2"
                alt="1st"
              />
              <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-300" size={24} />
            </div>
            <p className="text-xl font-bold">{topThree[0].username}</p>
            <p className="text-sm flex items-center gap-1">
              <Coins size={14} /> {topThree[0].coins}
            </p>
            <p className="text-2xl mt-1">🥇</p>
            <p className="text-sm text-gray-900">Score: {topThree[0].score}</p>
          </div>
        )}

        {/* 3rd */}
        {topThree[2] && (
          <div className="flex flex-col items-center bg-zinc-800 px-4 py-6 rounded-xl border border-zinc-600 shadow-md w-80">
            <img
              src={topThree[2].avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=3rd"}
              className="w-16 h-16 rounded-full mb-2"
              alt="3rd"
            />
            <p className="text-lg font-bold text-gray-200">{topThree[2].username}</p>
            <p className="text-sm text-yellow-300 flex items-center gap-1">
              <Coins size={14} /> {topThree[2].coins}
            </p>
            <p className="text-white text-xl mt-1">🥉</p>
            <p className="text-sm text-cyan-300">Score: {topThree[2].score}</p>
          </div>
        )}
      </div>

      {/* Top 10 Table */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 shadow-md">
        <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-zinc-700 font-bold text-lg text-gray-300">
          <span>Rank</span>
          <span>User</span>
          <span>Coins</span>
          <span>Score</span>
          <span>Badge</span>
        </div>

        {rest.map((user, index) => (
          <motion.div
            key={user._id}
            whileHover={{ scale: 1.01 }}
            className="grid grid-cols-5 gap-4 px-6 py-5 border-b border-zinc-800 transition-all duration-200 text-base font-medium hover:bg-zinc-800"
          >
            <span className="font-bold text-xl">{getMedal(index + 3)}</span>
            <span className="flex items-center gap-2 text-green-400 text-lg">
              <img
                src={user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=top"}
                className="w-8 h-8 rounded-full"
                alt="avatar"
              />
              {user.username}
            </span>
            <span className="flex items-center gap-1 text-yellow-300 text-lg">
              <Coins size={18} /> {user.coins}
            </span>
            <span className="text-cyan-300 text-lg font-semibold">{user.score}</span>
            <span className="text-sm text-lime-400">{getBadge(user) || "—"}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
