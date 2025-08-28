// src/components/dashboard/ProgressChart.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import axios from "axios";
import { BASE_URL } from "../../api/config";

const GUARDIAN = "#0AA1C0";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProgressChart({ userId: propUserId = null }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);

      
      const uid = propUserId || localStorage.getItem("userId");
      if (!uid) {
        setError("No userId found (pass prop or set localStorage 'userId').");
        setLoading(false);
        return;
      }

      
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        null;

      
      const base = String(BASE_URL || process.env.REACT_APP_API_URL ).replace(/\/$/, "");

      
      const endpoints = [
        `${base}/progress/${uid}`,       
        `${base}/users/progress/${uid}`  
      ];

      let json = null;
      let lastError = null;
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            
          });
          if (res && res.data) {
            json = res.data;
            console.log("Progress fetched from:", url, res.data);
            break;
          }
        } catch (err) {
          
          lastError = err;
          console.warn("Progress fetch failed for", url, err && err.response ? err.response.status : err.message);
        }
      }

      if (!json) {
        if (mounted) {
          setError(`Failed to fetch progress. ${lastError ? lastError.message : ""}`);
          setChartData(DAY_NAMES.map(d => ({ name: d, value: 0 })));
          setLoading(false);
        }
        return;
      }


      let arr = new Array(7).fill(0);
      if (Array.isArray(json.progress)) {
        for (let i = 0; i < Math.min(7, json.progress.length); i++) {
          arr[i] = Number(json.progress[i]) || 0;
        }
      } else if (json.progress && typeof json.progress === "object") {
       
        const fullDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        for (let i = 0; i < 7; i++) {
          const full = fullDays[i];
          const short = DAY_NAMES[i];
          arr[i] = Number(json.progress[full] ?? json.progress[short] ?? json.progress[full.toLowerCase()] ?? 0) || 0;
        }
      } else {
        
        console.warn("Unexpected progress shape:", json.progress);
      }

      const mapped = DAY_NAMES.map((d, i) => ({ name: d, value: arr[i] }));

      if (mounted) {
        setChartData(mapped);
        setLoading(false);
      }
    };

    fetchProgress();
    return () => {
      mounted = false;
    };
  }, [propUserId]);

 
  const maxVal = Math.max(1, ...(chartData.map(d => Number(d.value) || 0)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Weekly Progress</h3>
        <div className="text-sm text-gray-400">{loading ? "Loading…" : error ? "Error" : ""}</div>
      </div>

      <div style={{ width: "100%", height: 220 }} className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: GUARDIAN, borderTopColor: "transparent" }} />
              <div className="text-sm text-gray-300">Loading progress…</div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="text-sm text-rose-400">Error: {error}</div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <YAxis stroke="#9ca3af" allowDecimals={false} domain={[0, maxVal]} tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <Tooltip wrapperStyle={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.04)" }} itemStyle={{ color: GUARDIAN }} />
            <Line type="monotone" dataKey="value" stroke={GUARDIAN} strokeWidth={3} dot={{ r: 4, stroke: "#0b0b0b", strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
