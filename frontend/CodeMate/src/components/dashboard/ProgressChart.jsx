// src/components/dashboard/ProgressChart.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const GUARDIAN = "#0AA1C0";

export default function ProgressChart({ data = null }) {
  const fallback = [
    { name: "Mon", value: 2 },
    { name: "Tue", value: 3 },
    { name: "Wed", value: 1 },
    { name: "Thu", value: 4 },
    { name: "Fri", value: 3 },
    { name: "Sat", value: 5 },
    { name: "Sun", value: 2 },
  ];

  const useData = data || fallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/6"
    >
      <h3 className="text-lg font-semibold mb-3">Weekly Progress</h3>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={useData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip wrapperStyle={{ background: "#0b0b0b" }} />
            <Line type="monotone" dataKey="value" stroke={GUARDIAN} strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
