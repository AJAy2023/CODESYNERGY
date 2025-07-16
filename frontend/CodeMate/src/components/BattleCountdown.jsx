// src/components/BattleCountdown.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BattleCountdown = ({ problem, onFinish }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setCount((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onFinish]);

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white">
      <motion.h2
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.8 }}
        className="text-6xl font-extrabold text-cyan-400 mb-4"
      >
        Get Ready!
      </motion.h2>
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="text-[10rem] font-bold text-yellow-400"
      >
        {count}
      </motion.div>
      <p className="mt-4 text-xl text-gray-300">Problem: <span className="font-semibold text-white">{problem?.title}</span></p>
    </div>
  );
};

export default BattleCountdown;
