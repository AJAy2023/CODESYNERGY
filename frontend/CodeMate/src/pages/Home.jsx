import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";

function Home() {
  const features = [
    "👨‍💻 Real-time Editor",
    "💬 Live Chat & Video",
    "🏆 Gamified XP System",
    "⚙️ Code Execution Engine"
  ];

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white overflow-hidden relative">
      <section className="text-center py-32 px-6 min-h-[85vh] w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-800 to-black animate-background-pan">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
        >
          Empower Your Coding Journey
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-xl text-blue-200"
        >
          Code. Collaborate. Conquer — all in one platform.
        </motion.p>

        <Link
          to="/register"
          className="inline-block mt-12 bg-gradient-to-r from-green-400 to-blue-500 hover:scale-105 px-8 py-3 rounded-full shadow text-white font-semibold text-lg transition"
        >
          Start Coding Together
        </Link>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-10">Why Choose CodeMate?</h2>
          <div className="flex space-x-4 overflow-hidden animate-slide-horizontal items-center justify-center">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="min-w-[240px] p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-purple-500/40 rounded-xl shadow-inner animate-glow text-center"
              >
                <p className="text-3xl mb-2">{feature.slice(0, 2)}</p>
                <p className="font-semibold text-sm">{feature.slice(2)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Code Together in Real-Time</h2>
        <p className="text-purple-400 mb-4 font-mono text-sm">two-sum.js</p>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 px-4">
          <div className="bg-black p-6 rounded-lg w-full shadow-lg border border-purple-600 animate-fadeIn">
            <pre className="text-left text-green-400 font-mono whitespace-pre-wrap animate-type">
              <Typewriter
                options={{
                  strings: [
                    `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}`
                  ],
                  autoStart: true,
                  delay: 30,
                }}
              />
            </pre>
          </div>

          <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 rounded-lg w-full shadow-md border border-blue-400 animate-slideIn">
            <h3 className="text-xl mb-4">💬 Live Chat</h3>
            <div className="space-y-2 text-left">
              <div className="bg-gray-700 p-2 rounded">👨‍💻 User1: Try hashmap?</div>
              <div className="bg-gray-700 p-2 rounded">👩‍💻 User2: Good idea! Go O(n)</div>
              <div className="bg-gray-700 p-2 rounded">👨‍🏫 User3: Let me try 🚀</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black text-gray-300 py-16 px-4 mt-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xl font-semibold mb-2">CodeMate</h4>
            <p className="text-sm">Powering your journey from beginner to pro — collaborate, solve, and achieve.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Explore</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-white">Contests</a></li>
              <li><a href="#" className="hover:text-white">Leaderboard</a></li>
              <li><a href="#" className="hover:text-white">Challenges</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <ul className="space-y-1 text-sm">
              <li>Email: support@codemate.com</li>
              <li>Twitter: @CodeMateHQ</li>
              <li>Discord: CodeMate Community</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs mt-12 text-gray-500">© 2025 CodeMate. Designed with passion and purpose.</div>
      </footer>
    </div>
  );
}

export default Home;
