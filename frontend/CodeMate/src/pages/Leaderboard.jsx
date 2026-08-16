import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { sendFriendRequest } from "../api/friends";
import { motion } from "framer-motion";
import {
  User,
  Flame,
  Trophy,
  Coins,
  Crown,
  MessageSquare,
  UserPlus,
  UserCheck,
  ExternalLink,
} from "lucide-react";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [addingFriend, setAddingFriend] = useState({});
  const [myFriends, setMyFriends] = useState([]);
  const [myPending, setMyPending] = useState([]);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  const getFriendButtonUI = (targetId) => {
    const tid = String(targetId);
    if (tid === String(currentUserId)) {
      return { label: "Your Profile", icon: User, cls: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/40" };
    }
    if (myFriends.includes(tid)) {
      return { label: "Friends ", icon: UserCheck, cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/40" };
    }
    if (myPending.includes(tid)) {
      return { label: "Pending ", icon: UserCheck, cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/40" };
    }
    return { label: "Add Friend", icon: UserPlus, cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/40" };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/rank/leaderboard`);
        setLeaderboard(res.data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }

      if (currentUserId) {
        try {
          const [fRes, oRes] = await Promise.all([
            axios.get(`${BASE_URL}/friends/list/${currentUserId}`),
            axios.get(`${BASE_URL}/friends/outgoing/${currentUserId}`)
          ]);
          const friendIds = (fRes.data?.friends || []).map(f => String(f._id || f));
          const pendingIds = (oRes.data?.requests || []).map(r => String(r.receiver?._id || r.receiver));
          setMyFriends(friendIds);
          setMyPending(pendingIds);
        } catch (e) {
          console.warn("Failed to fetch my friends/requests", e.message);
        }
      }
    };
    fetchData();
  }, [currentUserId]);

  const handleSendFriendRequest = async (targetId, e) => {
    if (e) e.stopPropagation();
    if (!currentUserId) {
      alert("Please log in first!");
      return;
    }
    if (currentUserId === targetId) {
      navigate(`/profile/${targetId}`);
      return;
    }
    if (myFriends.includes(String(targetId))) {
      navigate(`/profile/${targetId}`);
      return;
    }
    try {
      setAddingFriend((prev) => ({ ...prev, [targetId]: true }));
      await sendFriendRequest(currentUserId, targetId);
      setMyPending((prev) => [...prev, String(targetId)]);
      alert("🎉 Friend request sent successfully!");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || "Failed to send request";
      alert(`Info: ${msg}`);
    } finally {
      setAddingFriend((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getBadge = (user) => {
    if (user.solvedCount >= 5) return " Master Solver";
    if (user.score >= 50) return " Code Elite";
    if (user.coins >= 100) return " Vault Pro";
    return " Challenger";
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-zinc-950 min-h-screen text-white px-4 sm:px-8 py-6">
      {/* Top Navigation Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-6">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-3xl font-black text-cyan-400 tracking-wider cursor-pointer hover:opacity-90 transition"
          >
            CodeMate
          </h1>
          
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert(" Messaging & Notifications: Coming Soon!\nWe are actively working on this feature.")}
            title="Messages & Notifications - Coming Soon"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare size={14} className="text-cyan-400" />
            <span>Coming Soon</span>
          </button>
          <button
            onClick={() => navigate("/user-profile")}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition cursor-pointer"
            title="Your Profile"
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-2">
          🏆 Global Leaderboard
        </h2>
        <p className="text-sm text-slate-400">
          Click any user to view profile or send friend requests!
        </p>
      </div>

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-12 items-end max-w-5xl mx-auto">
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/profile/${topThree[1]._id}`)}
              className="flex flex-col items-center bg-zinc-900/90 hover:bg-zinc-800/90 p-5 rounded-2xl border border-zinc-700 shadow-xl w-full md:w-72 cursor-pointer relative group transition"
            >
              <div className="absolute top-3 right-3 text-2xl font-black text-slate-400">🥈</div>
              <img
                src={topThree[1].profilePic || "https://api.dicebear.com/7.x/bottts/svg?seed=2nd"}
                className="w-20 h-20 rounded-full mb-3 border-2 border-slate-400 object-cover shadow-lg"
                alt="2nd"
              />
              <p className="text-lg font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1">
                <span>{topThree[1].username}</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition text-cyan-400" />
              </p>
              <div className="flex items-center gap-3 text-xs mt-2">
                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                  <Coins size={14} /> {topThree[1].coins}
                </span>
                <span className="text-cyan-400 font-bold">Score: {topThree[1].score}</span>
              </div>
              <button
                onClick={(e) => handleSendFriendRequest(topThree[1]._id, e)}
                disabled={addingFriend[topThree[1]._id]}
                className={`mt-4 px-4 py-1.5 w-full rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${getFriendButtonUI(topThree[1]._id).cls}`}
              >
                {(() => { const UI = getFriendButtonUI(topThree[1]._id); const Icon = UI.icon; return <><Icon size={14} /><span>{UI.label}</span></>; })()}
              </button>
            </motion.div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/profile/${topThree[0]._id}`)}
              className="flex flex-col items-center bg-gradient-to-b from-amber-500 to-yellow-600 p-6 rounded-2xl border-4 border-yellow-300 shadow-2xl w-full md:w-80 cursor-pointer relative group text-zinc-950 font-bold transition"
            >
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-300 filter drop-shadow animate-bounce" size={32} />
              <img
                src={topThree[0].profilePic || "https://api.dicebear.com/7.x/bottts/svg?seed=1st"}
                className="w-24 h-24 rounded-full mb-3 border-4 border-yellow-200 object-cover shadow-xl"
                alt="1st"
              />
              <p className="text-xl font-extrabold text-black group-hover:underline flex items-center gap-1">
                <span>{topThree[0].username}</span>
                <ExternalLink size={16} className="text-black" />
              </p>
              <div className="flex items-center gap-3 text-xs mt-2 text-zinc-900 font-bold">
                <span className="flex items-center gap-1 bg-yellow-300/40 px-2 py-0.5 rounded">
                  <Coins size={14} /> {topThree[0].coins}
                </span>
                <span className="bg-black/20 text-yellow-100 px-2 py-0.5 rounded">Score: {topThree[0].score}</span>
              </div>
              <button
                onClick={(e) => handleSendFriendRequest(topThree[0]._id, e)}
                disabled={addingFriend[topThree[0]._id]}
                className="mt-4 px-4 py-1.5 w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 text-yellow-300 border border-yellow-300/40 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
              >
                {(() => { const UI = getFriendButtonUI(topThree[0]._id); const Icon = UI.icon; return <><Icon size={14} /><span>{UI.label}</span></>; })()}
              </button>
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/profile/${topThree[2]._id}`)}
              className="flex flex-col items-center bg-zinc-900/90 hover:bg-zinc-800/90 p-5 rounded-2xl border border-amber-700/50 shadow-xl w-full md:w-72 cursor-pointer relative group transition"
            >
              <div className="absolute top-3 right-3 text-2xl font-black text-amber-600">🥉</div>
              <img
                src={topThree[2].profilePic || "https://api.dicebear.com/7.x/bottts/svg?seed=3rd"}
                className="w-20 h-20 rounded-full mb-3 border-2 border-amber-600 object-cover shadow-lg"
                alt="3rd"
              />
              <p className="text-lg font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1">
                <span>{topThree[2].username}</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition text-cyan-400" />
              </p>
              <div className="flex items-center gap-3 text-xs mt-2">
                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                  <Coins size={14} /> {topThree[2].coins}
                </span>
                <span className="text-cyan-400 font-bold">Score: {topThree[2].score}</span>
              </div>
              <button
                onClick={(e) => handleSendFriendRequest(topThree[2]._id, e)}
                disabled={addingFriend[topThree[2]._id]}
                className={`mt-4 px-4 py-1.5 w-full rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${getFriendButtonUI(topThree[2]._id).cls}`}
              >
                {(() => { const UI = getFriendButtonUI(topThree[2]._id); const Icon = UI.icon; return <><Icon size={14} /><span>{UI.label}</span></>; })()}
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Top Rankings Table */}
      <div className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-white/10 shadow-xl max-w-5xl mx-auto">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-white/10 font-bold text-xs sm:text-sm text-cyan-400 uppercase tracking-wider">
          <span className="col-span-1">Rank</span>
          <span className="col-span-2">User</span>
          <span className="col-span-1">Coins</span>
          <span className="col-span-1">Score</span>
          <span className="col-span-1 text-right">Action</span>
        </div>

        {(rest.length > 0 ? rest : leaderboard).map((user, index) => {
          const rankIdx = rest.length > 0 ? index + 3 : index;
          const ui = getFriendButtonUI(user._id);
          const IconComp = ui.icon;
          return (
            <motion.div
              key={user._id}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
              onClick={() => navigate(`/profile/${user._id}`)}
              className="grid grid-cols-6 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-white/5 transition-all duration-200 text-sm font-medium items-center cursor-pointer group"
            >
              <span className="col-span-1 font-extrabold text-base text-slate-300">
                {getMedal(rankIdx)}
              </span>
              <span className="col-span-2 flex items-center gap-2.5 text-white font-bold group-hover:text-cyan-300 transition">
                <img
                  src={user.profilePic || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                  className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover shrink-0"
                  alt="avatar"
                />
                <span className="truncate">{user.username}</span>
              </span>
              <span className="col-span-1 flex items-center gap-1 text-yellow-400 font-semibold">
                <Coins size={16} /> {user.coins}
              </span>
              <span className="col-span-1 text-cyan-300 font-extrabold text-base">
                {user.score}
              </span>
              <span className="col-span-1 flex justify-end">
                <button
                  onClick={(e) => handleSendFriendRequest(user._id, e)}
                  disabled={addingFriend[user._id]}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${ui.cls}`}
                >
                  <IconComp size={12} />
                  <span className="hidden sm:inline">{ui.label}</span>
                </button>
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
