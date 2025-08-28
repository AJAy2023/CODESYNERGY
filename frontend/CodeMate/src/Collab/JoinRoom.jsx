// src/Collab/JoinRoom.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, XCircle } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../api/config";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      const code = (roomCode || "").trim();

      if (!code || !userId || !token) {
        alert("Missing Room ID or login credentials.");
        return;
      }

      // (optional) basic format check to catch typos early
      if (!/^[a-zA-Z0-9_-]{3,}$/.test(code)) {
        alert("Room ID must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.");
        return;
      }

      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/rooms/joinroom`,
        { roomId: code, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // accept 200 or 201; some backends return success flag too
      if (res?.status === 200 || res?.status === 201 || res?.data?.success) {
        // try to read the room object and its type robustly
        const room =
          res?.data?.room ??
          res?.data?.data?.room ??
          res?.data; // fallback if backend returns room at top-level

        const roomId = room?.roomId || code;
        const rawType =
          room?.roomType ??
          room?.type ??
          res?.data?.roomType ??
          res?.data?.type ??
          "battle"; // default to battle if missing

        const roomType = String(rawType).toLowerCase();

        // route by type
        if (roomType === "discussion") {
          navigate(`/discussion/${roomId}`);
        } else {
          navigate(`/waitingroom/${roomId}`);
        }
        return;
      }

      // any other status → show message
      const msg =
        res?.data?.msg ||
        res?.data?.message ||
        "Failed to join room. Please check the code.";
      alert(msg);
    } catch (err) {
      console.error("Join room failed:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to join room. Please check the code.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-md rounded-2xl shadow-lg border border-white/10 bg-white/5 backdrop-blur-xl p-8"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Close Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          <XCircle className="w-5 h-5 text-white" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Join a Coding Room
        </h2>

        {/* Input Form */}
        <form onSubmit={handleJoin} className="space-y-5">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-emerald-500 to-cyan-400 hover:opacity-90 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Joining…" : "🔗 Join Room"}
          </motion.button>
        </form>

        {/* Helper text */}
        <p className="mt-4 text-sm text-slate-400 text-center">
          Enter the code shared by your friend to join the room.
        </p>
      </motion.div>
    </div>
  );
};

export default JoinRoom;
