// src/components/dashboard/LiveFeed.jsx
import React from "react";
import { motion } from "framer-motion";

const feed = [
  "🚀 Ajay solved Two Sum (5m ago)",
  "📊 You moved to rank #7",
  "🔥 3 users joined room 'room-123' just now",
  "🎉 Maya earned 20 coins for streak",
];

export default function LiveFeed() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
      }}
      className="bg-white/4 backdrop-blur-lg p-4 rounded-xl border border-white/6"
    >
      <h3 className="font-semibold mb-3">Live Activity</h3>
      <div className="flex flex-col gap-3">
        {feed.map((f, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
            className="px-3 py-2 rounded-md bg-transparent hover:bg-white/3 transition"
          >
            {f}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
