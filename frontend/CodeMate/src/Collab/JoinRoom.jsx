import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "./socket";
import axios from "axios";
import { ArrowLeftCircle } from "lucide-react";

const JoinRoom = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    const trimmedId = roomId.trim();
    const userId = localStorage.getItem("userId");

    if (!trimmedId) return alert("Please enter Room ID");

    try {
      const res = await axios.post("http://localhost:8000/rooms/joinroom", {
        userId,
        roomId: trimmedId,
      });

      socket.connect();
      socket.emit("join-room", { userId, roomId: trimmedId });

      navigate(`/waitingroom/${roomId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md w-full bg-zinc-800 border border-zinc-700 p-6 rounded-lg shadow-lg">
        <button onClick={() => navigate("/dashboard")} className="mb-4 text-cyan-400 flex items-center">
          <ArrowLeftCircle size={18} className="mr-2" /> Back
        </button>
        <h2 className="text-center text-2xl font-bold mb-6">Join Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="p-3 bg-zinc-700 rounded w-full mb-4"
        />
        <button
          onClick={handleJoinRoom}
          className="bg-gradient-to-r from-cyan-600 to-emerald-500 p-3 rounded w-full text-white font-bold"
        >
          🔗 Join Room
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;
