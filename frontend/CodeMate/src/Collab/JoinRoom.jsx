// src/Collab/JoinRoom.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/config";
import socket from "./socket";

const JoinRoom = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!roomId || !userId || !token) {
      alert("Missing credentials or Room ID.");
      return;
    }

    try {
      // 🔐 Backend join room request
      const res = await axios.post(
        `${BASE_URL}/rooms/joinroom`,
        { roomId, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        const { room } = res.data;

        //  Emit correct socket event
        // Emit after socket is connected
if (socket.connected) {
  socket.emit("join-room", { roomId: room.roomId, userId });
} else {
  socket.on("connect", () => {
    socket.emit("join-room", { roomId: room.roomId, userId });
  });
}


        // Navigate to waiting room using roomId
        navigate(`/waitingroom/${room.roomId}`);
      }
    } catch (err) {
      console.error("Join room failed:", err.message);
      alert("Failed to join room. Are you sure the Room ID is correct?");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-black text-white">
      <div className="bg-zinc-900 p-6 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-teal-400">🚪 Join Coding Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-zinc-800 border border-zinc-600"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-2 rounded"
        >
          🔗 Join Room
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;