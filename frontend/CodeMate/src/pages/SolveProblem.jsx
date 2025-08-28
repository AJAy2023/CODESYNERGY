// src/pages/SolveProblem.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import {
  Flame,
  Bell,
  User,
  RefreshCcw,
  Expand,
  Coins,
} from "lucide-react";
import Split from "react-split";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../api/config";

const starterCode = {
  javascript: `// JavaScript Boilerplate
function solve(input) {
  // parse input and implement solution
  return input;
}

console.log(solve("Example"));`,
  python: `# Python Boilerplate
def solve(input):
    # parse input and implement solution
    return input

print(solve("Example"))`,
  java: `// Java Boilerplate
public class Solution {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}`,
  cpp: `// C++ Boilerplate
#include <bits/stdc++.h>
using namespace std;
int main() {
  cout << "Hello World\\n";
  return 0;
}`,
};

const GUARDIAN = "#0AA1C0";

export default function SolveProblem() {
  const { id } = useParams();            // <-- this is your problem_id
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(starterCode["javascript"]);
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // test modal
  const [testResults, setTestResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // summary badge
  const [summaryBadge, setSummaryBadge] = useState(null);

  // -------------------- NEW: AI hints state --------------------
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintText, setHintText] = useState("");
  // -------------------------------------------------------------

  // fetch problem + user
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [problemRes, userRes] = await Promise.all([
          axios.get(`${BASE_URL}/${id}`), // adjust if your backend uses a different path
          axios.get(`${BASE_URL}/user-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const p = problemRes.data.room ? problemRes.data.room : problemRes.data;
        setProblem(p);

        const pb = p?.boilerplateCode ?? p?.boilerplates ?? null;
        const initialCode = (pb && pb["javascript"]) || starterCode["javascript"];
        setCode(initialCode);

        setUser(userRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  // boilerplate on language change
  useEffect(() => {
    if (!problem) return;
    const pb = problem.boilerplateCode ?? problem.boilerplates ?? null;
    if (pb && pb[language]) setCode(pb[language]);
    else setCode(starterCode[language]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, problem]);

  // Cmd/Ctrl + Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const normalizeTestResponse = (data) => {
    if (!data) return null;
    const arr = data.tests || data.results || data.hiddenResults || data.details || null;
    if (Array.isArray(arr)) {
      const tests = arr.map((t, i) => {
        if (typeof t === "boolean") return { name: `Test ${i + 1}`, passed: t, message: t ? "Passed" : "Failed" };
        return {
          name: t.name || t.case || `Test ${i + 1}`,
          passed: !!t.passed || !!t.ok || t.status === "pass",
          message: t.message || t.output || t.error || (t.passed ? "Passed" : "Failed"),
        };
      });
      const passedCount = tests.filter((t) => t.passed).length;
      return { tests, passedCount, total: tests.length };
    }
    if (typeof data.passed === "boolean") {
      return { tests: [{ name: "Hidden tests", passed: !!data.passed, message: data.message || "" }], passedCount: data.passed ? 1 : 0, total: 1 };
    }
    return null;
  };

  // Run with optional custom input
  const runCode = useCallback(async () => {
    try {
      setRunning(true);
      setOutput("");
      setTestResults(null);
      setShowResultsModal(false);
      setSummaryBadge(null);

      const res = await axios.post(`${BASE_URL}/run`, {
        language,
        code,
        input: input || undefined, // let backend parse/ignore
        problem_id: id,            // IMPORTANT: backend expects problem_id
      });

      const data = res?.data;

      if (data && (data.actual !== undefined || data.expected !== undefined || typeof data.passed === "boolean")) {
        const actual = typeof data.actual === "object" ? JSON.stringify(data.actual, null, 2) : String(data.actual ?? "");
        const expected = typeof data.expected === "object" ? JSON.stringify(data.expected, null, 2) : String(data.expected ?? "");
        setOutput(
          `Input: ${JSON.stringify(data.input ?? input ?? "")}\n\nExpected:\n${expected}\n\nActual:\n${actual}\n\nPassed: ${data.passed ? "Yes ✅" : "No ❌"}`
        );
      } else {
        const textOutput = data?.output ?? data?.stdout ?? data?.result ?? (typeof data === "string" ? data : JSON.stringify(data, null, 2));
        setOutput(typeof textOutput === "object" ? JSON.stringify(textOutput, null, 2) : String(textOutput ?? ""));
      }

      const normalized = normalizeTestResponse(data);
      if (normalized) {
        setTestResults(normalized);
        setShowResultsModal(true);
        setSummaryBadge({ passedCount: normalized.passedCount, total: normalized.total, ok: normalized.passedCount === normalized.total });
        setTimeout(() => setSummaryBadge(null), 5000);
      } else if (typeof data?.passed === "boolean") {
        setSummaryBadge({ passedCount: data.passed ? 1 : 0, total: 1, ok: !!data.passed });
        setTimeout(() => setSummaryBadge(null), 4000);
      }
    } catch (err) {
      console.error("Run failed:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to run code";
      setOutput(msg);
      setSummaryBadge({ passedCount: 0, total: 1, ok: false });
      setTimeout(() => setSummaryBadge(null), 3000);
    } finally {
      setRunning(false);
    }
  }, [language, code, input, id]);

  // Submit (hidden tests)
  const submitCode = useCallback(async () => {
    try {
      setSubmitting(true);
      setTestResults(null);
      setShowResultsModal(false);
      setSummaryBadge(null);

      const user_id = localStorage.getItem("userId");
      if (!user_id) {
        alert("Not logged in");
        setSubmitting(false);
        return;
      }

      const res = await axios.post(`${BASE_URL}/submit`, {
        user_id,
        problem_id: id, // IMPORTANT
        code,
        language,
      });

      const normalized = normalizeTestResponse(res?.data);
      if (normalized) {
        setTestResults(normalized);
        setShowResultsModal(true);
        setSummaryBadge({ passedCount: normalized.passedCount, total: normalized.total, ok: normalized.passedCount === normalized.total });
      } else {
        const msg = res?.data?.message || res?.data?.status || JSON.stringify(res?.data);
        setOutput(String(msg));
        setSummaryBadge({ passedCount: 0, total: 1, ok: false });
      }
      setTimeout(() => setSummaryBadge(null), 5000);
    } catch (err) {
      console.error("Submit failed", err);
      setOutput(err?.response?.data?.message || err.message || "Failed to submit. Try again.");
      setSummaryBadge({ passedCount: 0, total: 1, ok: false });
      setTimeout(() => setSummaryBadge(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }, [language, code, id]);

  const resetEditor = () => {
    const pb = problem?.boilerplateCode ?? problem?.boilerplates ?? null;
    if (pb && pb[language]) setCode(pb[language]); else setCode(starterCode[language]);
  };

  const toggleFullscreen = () => setFullscreen((s) => !s);

  // -------------------- NEW: fetch AI hint --------------------
  const fetchHint = async () => {
    try {
      setHintLoading(true);
      setHintText("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const body = {
        problem_id: id,
        description: problem?.description || "",
        code,
        language,
      };

      const res = await axios.post(`${BASE_URL}/problem/hints`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const hint = res?.data?.hint?.trim() || "No hint returned.";
      setHintText(hint);
      setHintOpen(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch hint.";
      setHintText(`⚠️ ${msg}`);
      setHintOpen(true);
    } finally {
      setHintLoading(false);
    }
  };
  // ------------------------------------------------------------

  if (loading || !problem || !user) {
    return (
      <div className="text-white p-6 min-h-screen flex items-center justify-center">
        <div className="text-slate-300">Loading problem...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${fullscreen ? "p-0" : "p-2"} bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-700">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Back to Dashboard"
            className="text-2xl font-extrabold text-white/90 hover:text-white transition"
          >
            BuddyCode
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{problem.title}</h2>
            <span
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{
                background:
                  problem.difficulty === "Easy"
                    ? "linear-gradient(90deg,#16a34a,#22c55e)"
                    : problem.difficulty === "Medium"
                    ? "linear-gradient(90deg,#d97706,#f59e0b)"
                    : "linear-gradient(90deg,#b91c1c,#ef4444)",
                color: "#04121a",
              }}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-800/60 backdrop-blur-sm px-3 py-1 rounded-md">
            <Flame size={16} className="text-yellow-400" />
            <span className="text-sm text-yellow-300">🔥 5-Day Streak</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-800/60 backdrop-blur-sm px-3 py-1 rounded-md">
            <Coins size={16} />
            <span className="text-sm text-emerald-300 font-semibold">{user?.coins ?? 0} Coins</span>
          </div>

          <RefreshCcw size={20} onClick={resetEditor} className="cursor-pointer hover:text-red-400" title="Reset Code" />
          <Expand size={20} onClick={toggleFullscreen} className="cursor-pointer hover:text-blue-400" title="Toggle Fullscreen" />
          <Bell size={20} onClick={() => navigate("/notifications")} className="cursor-pointer hover:text-yellow-300" title="Notifications" />
          <User size={20} onClick={() => navigate("/user-profile")} className="cursor-pointer hover:text-green-300" title="Profile" />
        </div>
      </div>

      {/* Main split area */}
      <Split className="flex h-[calc(100vh-80px)]" sizes={[42, 58]} minSize={300} gutterSize={8}>
        {/* Left: Problem Details */}
        <div className="p-6 overflow-y-auto border-r border-zinc-700">
          <div className="rounded-xl bg-white/3 backdrop-blur-md p-4 border border-white/6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{problem.description}</p>

            {problem.examples?.length > 0 && (
              <>
                <h4 className="mt-4 font-semibold">Examples</h4>
                <div className="mt-2 space-y-2">
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="bg-zinc-800 p-3 rounded border border-zinc-600">
                      <div className="text-xs text-slate-300"><strong>Input</strong></div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap">{JSON.stringify(ex.input)}</div>
                      <div className="text-xs text-slate-300 mt-2"><strong>Output</strong></div>
                      <div className="text-sm text-emerald-300 whitespace-pre-wrap">{JSON.stringify(ex.output)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex flex gap-3">
              {/* -------------------- NEW: AI Hint button -------------------- */}
             <button
                  onClick={fetchHint}
                  disabled={hintLoading}
                  className={`px-3 py-2 rounded ${hintLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  style={{
                    background: "linear-gradient(90deg,#10b981,#34d399)",
                    color: "#04121a",
                    fontWeight: 700,
                  }}
                  aria-label="Show AI Hint"
                  title="Get a helpful hint (2 per day)"
                 >
                  {hintLoading ? "Generating…" : "✨ Show AI Hint"}
                </button>
                {hintText && (
                  <div className="mt-2 p-3 bg-zinc-800 rounded border border-zinc-600">
                    <pre className="whitespace-pre-wrap text-slate-200 text-sm">{hintText}</pre>
                    <div className="text-xs text-slate-400 mt-2">
                      Daily limit: 2 hints per day.
                    </div>
                  </div>
                )}
              {/* ------------------------------------------------------------- */}
            </div>
          </div>
        </div>
        
        {/* Right: Editor + controls */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="lang" className="sr-only">Language</label>
              <select
                id="lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-fit bg-zinc-800 text-white px-3 py-1 rounded border border-zinc-600"
                aria-label="Select language"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <div className="text-xs text-slate-400 ml-2">{language.toUpperCase()}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runCode}
                disabled={running}
                className={`flex items-center gap-2 px-4 py-2 rounded ${running ? "opacity-70 cursor-not-allowed" : ""}`}
                style={{
                  background: `linear-gradient(90deg, ${GUARDIAN}, ${shadeHex(GUARDIAN, -12)})`,
                  color: "#042022",
                  fontWeight: 600,
                }}
                aria-label="Run Code (Ctrl+Enter)"
                title="Run Code (Ctrl/Cmd + Enter)"
              >
                ▶ Run
              </button>

              <button
                onClick={submitCode}
                disabled={submitting}
                className={`px-4 py-2 rounded border ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                style={{ background: "transparent", borderColor: "rgba(255,255,255,0.06)" }}
                aria-label="Submit Code"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <div className="h-full rounded-lg overflow-hidden border border-white/6 bg-[#04121a]">
              <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-800 text-white p-3 rounded border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Custom Input</div>
                <div className="text-xs text-slate-400">Optional</div>
              </div>
              <textarea
                rows={4}
                className="w-full p-2 rounded bg-transparent text-sm text-slate-200 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='e.g. [2,7,11,15], 9'
                aria-label="Custom input"
              />
            </div>

            <div className="bg-zinc-800 text-white p-3 rounded border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Output / Console</div>
                <div className="text-xs text-slate-400">Recent run</div>
              </div>
              <pre className="text-sm text-emerald-300 whitespace-pre-wrap min-h-[80px]">
                {output || "No output yet."}
              </pre>
            </div>
          </div>
        </div>
      </Split>

      {/* Floating summary badge */}
      <AnimatePresence>
        {summaryBadge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-20 right-6 z-50 px-3 py-2 rounded-md shadow-lg"
            style={{
              background: summaryBadge.ok ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#ef4444,#f97316)",
              color: "#04121a",
            }}
            role="status"
            aria-live="polite"
          >
            <div className="text-sm font-semibold">
              {summaryBadge.passedCount}/{summaryBadge.total} tests passed
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal (tests) */}
      <AnimatePresence>
        {showResultsModal && testResults && (
          <motion.div className="fixed inset-0 z-60 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResultsModal(false)} />
            <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }} className="relative z-50 w-full max-w-2xl mx-4 rounded-xl overflow-hidden">
              <div className="bg-white/5 backdrop-blur-md p-4 border border-white/6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Test Results</div>
                    <div className="text-sm text-slate-300">
                      {testResults.passedCount}/{testResults.total} passed
                    </div>
                  </div>
                  <button onClick={() => setShowResultsModal(false)} aria-label="Close results" className="px-3 py-1 rounded bg-zinc-800">Close</button>
                </div>
              </div>
              <div className="bg-zinc-900 p-4 max-h-[60vh] overflow-auto border-t border-white/4">
                <ul className="space-y-3">
                  {testResults.tests.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${t.passed ? "bg-emerald-400" : "bg-red-400"}`} aria-hidden />
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-sm text-slate-300 mt-1">{t.message}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------- NEW: Hint Modal -------------------- */}
      <AnimatePresence>
        {hintOpen && (
          <motion.div className="fixed inset-0 z-60 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="AI Hint">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setHintOpen(false)} />
            <motion.div initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 18 }} className="relative z-50 w-full max-w-xl mx-4 rounded-xl overflow-hidden">
              <div className="bg-white/5 backdrop-blur-md p-4 border border-white/6 rounded-t-xl flex items-center justify-between">
                <div className="text-lg font-semibold">AI Hint</div>
                <button onClick={() => setHintOpen(false)} className="px-3 py-1 rounded bg-zinc-800">Close</button>
              </div>
              <div className="bg-zinc-900 p-4 border-t border-white/4 max-h-[60vh] overflow-auto">
                <pre className="whitespace-pre-wrap text-slate-200 text-sm">{hintText || "No hint."}</pre>
                <div className="text-xs text-slate-400 mt-3">Daily limit: 2 hints per day.</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --------------------------------------------------------- */}
    </div>
  );
}

/* Helpers */
function shadeHex(hex, percent) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
  let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
