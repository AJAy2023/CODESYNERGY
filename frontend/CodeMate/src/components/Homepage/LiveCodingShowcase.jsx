import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const codeLines = [
  'const socket = io("https://codesynergy.dev");',
  "socket.on('connect', () => {",
  "   console.log('🚀 Connected to battle room!');",
  "});",
  "socket.emit('joinRoom', { roomId: '123', user: 'Ravi' });",
  "socket.on('battleStart', () => {",
  "   console.log('⚡ Battle started! Time to code...');",
  "});",
  "function solveProblem() {",
  "   return 'Victory is mine! 🏆';",
  "}",
  "console.log(solveProblem());",
];

export default function LiveCodingShowcase() {
  const [displayedCode, setDisplayedCode] = useState([]);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedCode((prev) => {
        const nextLines = [...prev, codeLines[lineIndex]];
        if (nextLines.length > codeLines.length) {
          return [codeLines[lineIndex]]; // reset animation smoothly
        }
        return nextLines;
      });

      setLineIndex((prev) => (prev + 1) % codeLines.length);
    }, 1200); // time between lines

    return () => clearInterval(interval);
  }, [lineIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-black/60 backdrop-blur-md border border-green-500/60 shadow-[0_0_20px_rgba(168,85,247,0.6)] rounded-xl p-4 max-w-2xl mx-auto mt-12"
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
      </div>
      <pre className="text-green-400 font-mono text-sm leading-relaxed overflow-hidden">
        {displayedCode.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {line}
          </motion.div>
        ))}
      </pre>
    </motion.div>
  );
}
