// src/pages/Problems.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Flame,
  Search as IconSearch,
  Bell,
  User,
  Lock,
  Coins,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { BASE_URL } from "../api/config";
import { toast } from "react-hot-toast";
import DashboardNavbar from "@/components/layout/DashboardNavbar";


const GUARDIAN = "#0AA1C0";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeDifficulty, setActiveDifficulty] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);


    // ------- Normalized id sets (handles multiple shapes returned by backend) -------
  const solvedIdSet = useMemo(() => {
    const arr = user?.solvedProblems || [];
    return new Set(
      (Array.isArray(arr) ? arr : []).map((item) => {
        if (!item) return "";
        if (typeof item === "string") return String(item);
        // common possible shapes: { _id }, { problem }, { problemId }, { problem_id }
        if (item._id) return String(item._id);
        if (item.problem) return String(item.problem);
        if (item.problemId) return String(item.problemId);
        if (item.problem_id) return String(item.problem_id);
        // fallback
        return String(item);
      })
    );
  }, [user]);

  const unlockedIdSet = useMemo(() => {
    const arr = user?.unlockedProblems || [];
    return new Set((Array.isArray(arr) ? arr : []).map((id) => String(id)));
  }, [user]);


  const navigate = useNavigate();
  const location = useLocation();

  const FREE_PROBLEM_IDS = useMemo(
    () => [
      "Two Sum",
      "Reverse Integer",
      "Palindrome Number",
      "Roman to Integer",
      "Longest Common Prefix",
    ],
    []
  );

  // initial fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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

        // existing reward logic (unchanged)
        const last = new Date(userRes.data.lastLoginReward);
        const now = new Date();
        const diffHours = (now - last) / (1000 * 60 * 60);
        if (diffHours < 0.2) {
          toast.success("🎉 You got 5 coins for logging in today!", {
            style: { background: "#1f2937", color: "#10b981" },
          });
        }
      } catch (err) {
        console.error("Error loading problems or user", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // combine filters (search + difficulty + status) => keeps UI consistent
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, searchQuery, activeDifficulty, activeStatus, user]);

  const applyFilters = () => {
    let res = Array.isArray(problems) ? [...problems] : [];

    // search
    const q = (searchQuery || "").trim().toLowerCase();
    if (q) {
      res = res.filter((p) => {
        const inTitle = (p.title || "").toLowerCase().includes(q);
        const inType = (p.problemType || "").toLowerCase().includes(q);
        const inDesc = (p.description || "").toLowerCase().includes(q);
        const inTags =
          Array.isArray(p.tags) && p.tags.some((t) => (t || "").toLowerCase().includes(q));
        return inTitle || inType || inDesc || inTags;
      });
    }

    // difficulty
    if (activeDifficulty) {
      res = res.filter((p) => p.difficulty === activeDifficulty);
    }

    // status: solved / unsolved / all
    if (activeStatus === "solved") {
      res = res.filter((p) => isSolved(p._id));
    } else if (activeStatus === "unsolved") {
      res = res.filter((p) => !isSolved(p._id));
    }

    setFilteredProblems(res);
  };

  const getUnlockCost = (difficulty) => {
    switch ((difficulty || "").toLowerCase()) {
      case "easy":
        return 5;
      case "medium":
        return 10;
      case "hard":
        return 15;
      default:
        return 5;
    }
  };

    // Robust check: is problem solved by the current user?
  const isSolved = (problemId) => {
    if (!problemId) return false;
    return solvedIdSet.has(String(problemId));
  };

  // Robust check: is problem unlocked for the current user?
  const isUnlocked = (problem) => {
    if (!problem) return false;
    if (problem?.isFree) return true;
    if (FREE_PROBLEM_IDS.includes(problem.title)) return true;

    // First check the user's unlocked list
    if (unlockedIdSet.has(String(problem._id))) return true;

    // Also accept a problem-level permanent unlock flag if backend provides it
    if (problem.unlocked && problem.unlocked.permanent) return true;
    if (problem.permanentUnlock || problem.permanentlyUnlocked) return true;

    return false;
  };


  // Search helper (connected to applyFilters)
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilter = (difficulty) => {
    setActiveDifficulty(difficulty);
  };

  const handleStatusFilter = (status) => {
    setActiveStatus(status);
  };

  const handleUnlock = async (problem) => {
    try {
      if (!user) {
        toast.error("User not loaded. Please login and try again.");
        return;
      }

      const token = localStorage.getItem("token");
      const unlockCost = getUnlockCost(problem.difficulty);

      if (user.coins < unlockCost) {
        toast.error("Not enough coins to unlock this problem.");
        return;
      }

      const confirmed = window.confirm(
        `This problem requires ${unlockCost} coins. Do you want to unlock it?`
      );
      if (!confirmed) return;

      // prefer user._id from state; fall back to localStorage
      const userId = user?._id || localStorage.getItem("userId");
      if (!userId) {
        toast.error("User id not found. Please login again.");
        return;
      }

      // call backend (matches your backend body keys)
      const res = await axios.post(
        `${BASE_URL}/unlock`,
        {
          user_id: userId,
          problem_id: problem._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data || {};

      // backend returns unlocked and coinsLeft (based on your controller)
      if (data.unlocked) {
        // coinsLeft may come from backend; otherwise subtract cost locally
        const coinsLeft =
          typeof data.coinsLeft === "number" ? data.coinsLeft : (user.coins ?? 0) - unlockCost;

        // update user: coins + unlockedProblems & persist to localStorage
        setUser((prev) => {
          const prevUnlocked = (prev?.unlockedProblems || []).map(String);
          const newUnlocked = prevUnlocked.includes(String(problem._id))
            ? prevUnlocked
            : [...prevUnlocked, String(problem._id)];
          const updated = {
            ...prev,
            coins: coinsLeft,
            unlockedProblems: newUnlocked,
          };
          localStorage.setItem("userData", JSON.stringify(updated));
          return updated;
        });

        // update problems array (not strictly necessary for isUnlocked but keeps local dataset consistent)
        setProblems((prev) =>
          prev.map((p) => (String(p._id) === String(problem._id) ? { ...p } : p))
        );

        // update filteredProblems too so displayed card re-renders immediately
        setFilteredProblems((prev) =>
          prev.map((p) => (String(p._id) === String(problem._id) ? { ...p } : p))
        );

        toast.success(data.msg || "Problem unlocked successfully!");
      } else {
        toast.error(data.msg || "Failed to unlock problem.");
      }
    } catch (err) {
      console.error("Failed to unlock problem", err);
      toast.error("Something went wrong while unlocking.");
    }
  };

  const difficulties = ["Easy", "Medium", "Hard"];

    // Compute counts per difficulty using normalized solved set
  const countForCard = (level) => {
    const inLevel = Array.isArray(problems) ? problems.filter((p) => p.difficulty === level) : [];
    if (activeStatus === "unsolved") {
      // show number of unsolved problems for this difficulty
      return inLevel.filter((p) => !isSolved(p._id)).length;
    }
    // default: show number solved for this difficulty
    return inLevel.filter((p) => isSolved(p._id)).length;
  };

  // cardLabel not required visually; keep for logic if you need it elsewhere
  const cardLabel = activeStatus === "unsolved" ? "Unsolved" : "Solved";

  return (
    <div>
      <DashboardNavbar />

      <motion.div
        className="min-h-screen text-white px-4 md:px-6 py-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: "linear-gradient(180deg, #06070a 0%, #0b1016 100%)",
          paddingTop: 88,
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-start md:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white cursor-pointer" onClick={() => navigate("")}>
                Problems
              </h1>

              <div className="flex items-center gap-2 rounded-full bg-zinc-800/60 px-3 py-1.5 border border-white/10">
                <Coins size={16} />
                <span className="text-sm text-emerald-300 font-semibold">{user?.coins ?? 0} Coins</span>
              </div>
            </div>

            <div className="w-full md:w-2/5">
              <AnimatedSearch value={searchQuery} onChange={handleSearch} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
            <div className="flex flex-wrap gap-3">
              {difficulties.map((level) => (
                <motion.button
                  key={level}
                  onClick={() => handleFilter(level)}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-shadow ${activeDifficulty === level ? "ring-2 ring-offset-2" : ""}`}
                  style={{
                    background:
                      level === "Easy"
                        ? "linear-gradient(90deg,#16a34a,#22c55e)"
                        : level === "Medium"
                        ? "linear-gradient(90deg,#d97706,#f59e0b)"
                        : "linear-gradient(90deg,#b91c1c,#ef4444)",
                    boxShadow: activeDifficulty === level ? `0 10px 30px ${hexToRgba(GUARDIAN, 0.12)}` : undefined,
                    color: "#04121a",
                  }}
                >
                  {level}
                </motion.button>
              ))}

              <motion.button onClick={() => { setActiveDifficulty(""); setSearchQuery(""); setFilteredProblems(problems); }} whileTap={{ scale: 0.98 }} className="px-3 py-2 rounded-full bg-zinc-800/50 text-sm text-slate-200">
                Reset
              </motion.button>
            </div>

            <div className="flex items-center gap-3">
              {["all", "solved", "unsolved"].map((status) => (
                <button key={status} onClick={() => handleStatusFilter(status)} className={`px-3 py-1 rounded-md text-sm ${activeStatus === status ? "bg-zinc-700 text-white" : "bg-transparent text-slate-300 hover:bg-zinc-800"}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {difficulties.map((level) => (
                            <motion.div key={level} whileHover={{ y: -6 }} className="p-4 rounded-xl bg-white/3 backdrop-blur-md border border-white/6">
                <div className="text-sm text-slate-300">{level}</div>
                <div className="text-4xl font-extrabold mt-1 text-white">
                  {countForCard(level)}
                </div>
              </motion.div>

            ))}
          </div>

          {/* Problems list */}
          <div className="mt-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProblems.length === 0 ? (
                  <div className="p-8 bg-zinc-900 rounded-xl text-center text-slate-400">No problems found.</div>
                ) : (
                  filteredProblems.map((problem) => {
                    const unlocked = isUnlocked(problem);
                    const solved = isSolved(problem._id);
                    return (
                      <motion.div key={problem._id} variants={cardVariants}>
                        <ProblemCard
                          problem={problem}
                          unlocked={unlocked}
                          solved={solved}
                          onUse={() => {
                            if (location.state?.fromCreateRoom) {
                              localStorage.setItem("selectedProblem", JSON.stringify(problem));
                              navigate("/rooms/createroom", { state: { reopenPopup: true } });
                            } else {
                              navigate(`/${problem._id}`);
                            }
                          }}
                          onUnlock={() => handleUnlock(problem)}
                        />
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
        `}</style>
      </motion.div>
    </div>
  );
}

/* -------------------------
   ProblemCard component
   ------------------------- */
function ProblemCard({ problem, unlocked, solved, onUse, onUnlock }) {
  const difficultyColor =
    problem.difficulty === "Easy"
      ? { from: "#16a34a", to: "#22c55e", text: "#052e16" }
      : problem.difficulty === "Medium"
      ? { from: "#d97706", to: "#f59e0b", text: "#4a2d03" }
      : { from: "#b91c1c", to: "#ef4444", text: "#3b0f12" };

  return (
    <div className="p-4 rounded-xl bg-white/4 backdrop-blur-md border border-white/6 hover:shadow-xl transition relative" style={{ minHeight: 160 }}>
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
            {solved && <CheckCircle size={16} className="text-green-400" />}
          </div>
          <p className="text-sm text-slate-300 mt-1">{problem.description ?? problem.problemType}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: `linear-gradient(90deg, ${difficultyColor.from}, ${difficultyColor.to})`, color: difficultyColor.text }}>
            {problem.difficulty}
          </div>

          <div className="text-xs text-slate-400">Type: <span className="text-blue-300">{problem.problemType}</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="text-sm text-slate-300">
          Reward: <span className="text-emerald-300 font-semibold">{getRewardFor(problem.difficulty)} coins</span>
        </div>

        <div className="flex items-center gap-3">
          {unlocked ? (
            <button onClick={onUse} className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 transition flex items-center gap-2 text-white cursor-pointer">Solve</button>
          ) : (
            <button onClick={onUnlock} className="px-4 py-2 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-500 transition flex items-center gap-2">
              <Lock size={14} /> {getUnlockCostStatic(problem.difficulty)} Coins
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   SkeletonCard component
   ------------------------- */
function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-white/3 backdrop-blur-md border border-white/6 animate-pulse" style={{ minHeight: 160 }}>
      <div className="h-6 bg-gradient-to-r from-transparent via-white/8 to-transparent rounded w-3/5 mb-3" style={{ animation: "shimmer 1.2s linear infinite" }} />
      <div className="h-4 bg-gradient-to-r from-transparent via-white/6 to-transparent rounded w-4/5 mb-3" style={{ animation: "shimmer 1.2s linear infinite" }} />
      <div className="h-3 bg-gradient-to-r from-transparent via-white/6 to-transparent rounded w-2/5 mb-5" style={{ animation: "shimmer 1.2s linear infinite" }} />
      <div className="flex justify-between items-center">
        <div className="h-8 w-24 rounded bg-white/5" />
        <div className="h-8 w-28 rounded bg-white/5" />
      </div>
    </div>
  );
}

/* -------------------------
   AnimatedSearch component
   ------------------------- */
function AnimatedSearch({ value, onChange }) {
  return (
    <motion.div className="relative" initial="rest" whileHover="hover" animate="rest">
      <motion.div className="flex items-center gap-2 bg-zinc-800/60 backdrop-blur-sm rounded-md px-3 py-2" initial={{ boxShadow: "none" }}>
        <IconSearch className="text-slate-300" />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search problem title, type, tag..." className="bg-transparent outline-none text-sm text-white w-full" aria-label="Search problems" />
        <button aria-label="Clear search" onClick={() => onChange("")} className="ml-2 text-sm text-slate-300 hover:text-white transition">Clear</button>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------
   Helper utilities
   ------------------------- */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getRewardFor(difficulty) {
  if (difficulty === "Easy") return 5;
  if (difficulty === "Medium") return 10;
  return 15;
}
function getUnlockCostStatic(difficulty) {
  if (difficulty === "Easy") return 5;
  if (difficulty === "Medium") return 10;
  return 15;
}
