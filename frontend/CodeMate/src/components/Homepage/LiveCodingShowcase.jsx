import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const codeLines = [
  'const socket = io("https://buddycode.fun");',
  "socket.on('connect', () => {",
  "   console.log('Connected to battle room!');",
  "});",
  "socket.emit('joinRoom', { roomId: '01', user: 'Aj' });",
  "socket.on('battleStart', () => {",
  "   console.log(' Battle started! Time to code...');",
  "});",
  "function solveProblem() {",
  "   return 'Victory is mine!';",
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
          return [codeLines[lineIndex]]; // reset smoothly
        }
        return nextLines;
      });

      setLineIndex((prev) => (prev + 1) % codeLines.length);
    }, 600); // ⏩ faster speed (was 750)

    return () => clearInterval(interval);
  }, [lineIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/70 backdrop-blur-lg border border-green-500/60 
                 shadow-[0_0_25px_rgba(34,197,94,0.4)] 
                 rounded-xl p-2 max-w-2xl mx-auto my-1"  
    >
      {/* Top bar (terminal style) */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        <span className="ml-3 text-xs text-zinc-400 font-mono">live-coding.js</span>
      </div>

      {/* Live code feed */}
      <pre
  className="
    text-green-400
    font-mono
    text-sm
    leading-relaxed
    px-2
    py-1
    h-64
  overflow-hidden
  "
>
        {displayedCode.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {line}
          </motion.div>
        ))}
        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.7 }}
          className="inline-block w-2 h-4 bg-green-400 ml-1 align-middle"
        />
      </pre>
    </motion.div>
  );
}
