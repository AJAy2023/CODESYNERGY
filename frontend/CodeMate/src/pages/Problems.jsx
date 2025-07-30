// src/pages/Problems.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Flame,
  Search,
  Bell,
  User,
  Lock,
  Coins,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { BASE_URL } from "../api/config";
import { toast } from "react-hot-toast";

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeDifficulty, setActiveDifficulty] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();

  const FREE_PROBLEM_IDS = [
    "Two Sum",
    "Reverse Integer",
    "Palindrome Number",
    "Roman to Integer",
    "Longest Common Prefix",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [problemRes, userRes] = await Promise.all([
          axios.get(`${BASE_URL}/problems`),
          axios.get(`${BASE_URL}/user-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProblems(problemRes.data);
        setFilteredProblems(problemRes.data);
        setUser(userRes.data);

        const last = new Date(userRes.data.lastLoginReward);
        const now = new Date();
        const diffHours = (now - last) / (1000 * 60 * 60);
        if (diffHours < 0.2) {
          toast.success("🎉 You got 5 coins for logging in today!", {
            style: {
              background: "#1f2937",
              color: "#10b981",
            },
          });
        }
      } catch (err) {
        console.error("Error loading problems or user", err);
      }
    };

    fetchData();
  }, []);

  const getUnlockCost = (difficulty) => {
    if (difficulty === "Easy") return 5;
    if (difficulty === "Medium") return 10;
    return 15;
  };

  const isUnlocked = (problem) => {
    return (
      FREE_PROBLEM_IDS.includes(problem.title) ||
      user?.unlockedProblems?.includes(problem._id)
    );
  };

  const isSolved = (problemId) => {
    return user?.solvedProblems?.includes(problemId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const matchedProblems = problems.filter((p) =>
      p.problemType.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProblems(matchedProblems);
  };

  const handleFilter = (difficulty) => {
    setActiveDifficulty(difficulty);
    const matchedProblems = problems.filter((p) => p.difficulty === difficulty);
    setFilteredProblems(matchedProblems);
  };

  const handleStatusFilter = (status) => {
    setActiveStatus(status);
    if (status === "solved") {
      setFilteredProblems(problems.filter((p) => isSolved(p._id)));
    } else if (status === "unsolved") {
      setFilteredProblems(problems.filter((p) => !isSolved(p._id)));
    } else {
      setFilteredProblems(problems);
    }
  };

  const handleUnlock = async (problem) => {
    try {
      const token = localStorage.getItem("token");
      const unlockCost = getUnlockCost(problem.difficulty);
      const confirmed = window.confirm(
        `This problem requires ${unlockCost} coins. Do you want to unlock it?`
      );
      if (!confirmed) return;

      const res = await axios.post(
        `${BASE_URL}/unlock-problem`,
        { problemId: problem._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data.updatedUser);
    } catch (err) {
      console.error("Failed to unlock problem", err);
      alert("Something went wrong while unlocking.");
    }
  };

  const difficulties = ["Easy", "Medium", "Hard"];
  const solvedCount = (level) =>
    problems.filter((p) => p.difficulty === level && isSolved(p._id)).length;

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-zinc-900 min-h-screen text-white px-6 py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-6">
          <h1
            className="text-3xl font-extrabold text-cyan-400 tracking-wide cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            CodeMate
          </h1>
          <div className="flex items-center gap-1 animate-pulse text-yellow-400">
            <Flame size={20} />
            <span className="text-sm">🔥 5-Day Streak</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-green-400 font-bold text-sm bg-zinc-800 px-2 py-1 rounded">
            <Coins size={16} />
            {user?.coins ?? 0} Coins
          </div>
          <Bell className="cursor-pointer hover:text-yellow-300" />
          <User
            className="cursor-pointer hover:text-blue-400"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search problem type..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {difficulties.map((level) => (
            <button
              key={level}
              onClick={() => handleFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                level === "Easy"
                  ? "bg-green-700 hover:bg-green-600"
                  : level === "Medium"
                  ? "bg-yellow-700 hover:bg-yellow-600"
                  : "bg-red-700 hover:bg-red-600"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "solved", "unsolved"].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {difficulties.map((level) => (
          <div
            key={level}
            className={`rounded-xl p-4 shadow-md text-center font-semibold text-lg ${
              level === "Easy"
                ? "bg-green-900 text-green-300"
                : level === "Medium"
                ? "bg-yellow-900 text-yellow-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {level}: {solvedCount(level)} Solved
          </div>
        ))}
      </div>

      {/* Problem List */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-zinc-700 font-semibold text-md text-gray-300">
          <span>Title</span>
          <span>Difficulty</span>
          <span>Type</span>
          <span>Action</span>
        </div>
        {filteredProblems.map((problem) => {
          const unlocked = isUnlocked(problem);
          const solved = isSolved(problem._id);

          return (
            <motion.div
              key={problem._id}
              whileHover={{ scale: 1.01 }}
              className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800 transition text-sm items-center"
            >
              <span className="flex items-center gap-2 font-semibold text-green-300">
                {problem.title}{" "}
                {solved && <CheckCircle size={16} className="text-green-400" />}
              </span>
              <span
                className={`font-semibold ${
                  problem.difficulty === "Easy"
                    ? "text-green-400"
                    : problem.difficulty === "Medium"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {problem.difficulty}
              </span>
              <span className="text-blue-400">{problem.problemType}</span>

              {/* ACTION BUTTON */}
              {unlocked ? (
                location.state?.fromCreateRoom ? (
                  <button
                    onClick={() => {
                      localStorage.setItem(
                        "selectedProblem",
                        JSON.stringify(problem)
                      );
                      navigate("/rooms/createroom", {
                        state: { reopenPopup: true },
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-sm rounded shadow"
                  >
                    ✅ Use This
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/${problem._id}`)}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1 text-sm rounded shadow"
                  >
                    Solve
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleUnlock(problem)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 text-sm rounded flex items-center gap-1"
                >
                  <Lock size={14} />
                  {getUnlockCost(problem.difficulty)} Coins
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Problems;
