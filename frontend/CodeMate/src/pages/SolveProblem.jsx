// src/pages/SolveProblem.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import {
  Flame,
  Bell,
  User,
  RefreshCcw,
  Expand,
  Lock,
  Coins,
  Unlock,
} from "lucide-react";
import Split from "react-split";
import { BASE_URL } from "../api/config";

const starterCode = {
  javascript: "// Write your JavaScript code here",
  python: "# Write your Python code here",
  java: "// Write your Java code here",
  cpp: "// Write your C++ code here",
};

const SolveProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(starterCode["javascript"]);
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const [problemRes, userRes] = await Promise.all([
          axios.get(`${BASE_URL}/${id}`),
          axios.get(`${BASE_URL}/user-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProblem(problemRes.data);
        setUser(userRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const runCode = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/run`, {
        language,
        code,
        input,
      });
      setOutput(res.data.output || res.data.error);
    } catch (err) {
      setOutput("Failed to execute code");
    }
  };

  const resetEditor = () => {
    setCode(starterCode[language]);
  };

  const toggleFullscreen = () => {
    setFullscreen((prev) => !prev);
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    setCode(starterCode[selectedLang]);
  };

  const getUnlockCost = () => {
    if (problem.difficulty === "Easy") return 5;
    if (problem.difficulty === "Medium") return 10;
    if (problem.difficulty === "Hard") return 15;
    return 10;
  };

  const isProblemUnlocked = () => {
    return user?.unlockedProblems?.includes(id);
  };

  const handleUnlock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/unlock-problem`,
        { problemId: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data.updatedUser);
    } catch (err) {
      alert("Failed to unlock problem. Not enough coins?");
      console.error(err);
    }
  };

  if (loading || !problem || !user)
    return <div className="text-white p-6">Loading...</div>;

  // ✅ Show locked screen only if not unlocked
  // if (!isProblemUnlocked()) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center p-6">
  //       <Lock size={50} className="text-red-500 mb-4" />
  //       <h2 className="text-2xl font-bold mb-2">This problem is locked 🔒</h2>
  //       <p className="mb-4">
  //         You need <strong>{getUnlockCost()} coins</strong> to unlock this{" "}
  //         <span className="capitalize">{problem.difficulty}</span> problem.
  //       </p>
  //       <button
  //         onClick={handleUnlock}
  //         className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded text-sm font-semibold transition"
  //       >
  //         <Unlock size={18} /> Unlock Now
  //       </button>
  //       <div className="mt-4 text-green-400 flex items-center gap-1">
  //         <Coins size={18} />
  //         {user?.coins} coins left
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div
      className={`min-h-screen ${
        fullscreen ? "p-0" : "p-2"
      } bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-700">
        <div className="flex items-center gap-6">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-3xl font-extrabold text-cyan-400 tracking-wide cursor-pointer"
          >
            CodeMate
          </h1>
          <div className="flex items-center gap-1 text-yellow-400 animate-pulse">
            <Flame size={18} /> <span className="text-sm">🔥 5-Day Streak</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RefreshCcw
            size={20}
            onClick={resetEditor}
            className="cursor-pointer hover:text-red-400"
            title="Reset Code"
          />
          <Expand
            size={20}
            onClick={toggleFullscreen}
            className="cursor-pointer hover:text-blue-400"
            title="Toggle Fullscreen"
          />
          <Bell
            size={20}
            onClick={() => navigate("/notifications")}
            className="cursor-pointer hover:text-yellow-300"
          />
          <User
            size={20}
            onClick={() => navigate("/user-profile")}
            className="cursor-pointer hover:text-green-300"
          />
        </div>
      </div>

      {/* Problem + Editor */}
      <Split className="flex h-[calc(100vh-80px)]" sizes={[50, 50]} minSize={300} gutterSize={10}>
        {/* Left Side - Problem Description */}
        <div className="p-6 overflow-y-auto border-r border-zinc-700">
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 text-sm rounded bg-gradient-to-r from-yellow-200 via-orange-300 to-pink-300 text-black font-semibold">
              {problem.difficulty}
            </span>
            <span className="px-2 py-1 text-sm rounded bg-gradient-to-r from-yellow-200 via-orange-300 to-pink-300 text-black font-semibold">
              {problem.problemType}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-green-400 mb-3">{problem.title}</h2>
          <h3 className="font-bold mb-1 text-lg">Description:</h3>
          <p className="text-md text-gray-300 mb-4 whitespace-pre-wrap">{problem.description}</p>

          <h3 className="font-bold mb-1 text-lg">Examples:</h3>
          {problem.examples.map((ex, idx) => (
            <div
              key={idx}
              className="text-sm text-gray-300 mb-4 bg-zinc-800 p-3 rounded border border-zinc-600"
            >
              <p>
                <strong>Input:</strong> {ex.input}
              </p>
              <p>
                <strong>Output:</strong> {ex.output}
              </p>
            </div>
          ))}

          <button
            className="mt-2 px-4 py-2 rounded bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-sm"
            onClick={() => alert("AI Hint will be generated here")}
          >
            ✨ Show AI Hint
          </button>
        </div>

        {/* Right Side - Code Editor */}
        <div className="p-4 flex flex-col gap-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="w-fit bg-zinc-800 text-white px-3 py-1 rounded border border-zinc-600"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <Editor
            height="300px"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={(val) => setCode(val)}
            theme="vs-dark"
          />

          <div>
            <label className="block mb-1 text-sm text-gray-400">Custom Input (Optional)</label>
            <textarea
              rows={4}
              className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. [2,7,11,15], 9"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button
              onClick={runCode}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
            >
              ▶ Run Code
            </button>
            <button
              onClick={() => alert("Submit API & redirect to /submissions")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
            >
              🚀 Submit
            </button>
          </div>

          <div className="bg-zinc-800 text-white p-4 mt-4 rounded border border-zinc-600">
            <h3 className="text-sm font-bold mb-2">Output:</h3>
            <pre className="text-sm text-green-400 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      </Split>
    </div>
  );
};

export default SolveProblem;
