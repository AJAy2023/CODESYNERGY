// src/pages/CreateRoom.jsx
import React, { useState, useEffect } from "react";
import {BASE_URL} from "../api/config";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  VideoIcon,
  MicIcon,
  UserCircle,
  Bell,
  Coins,
} from "lucide-react";

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [problem, setProblem] = useState("");
  const [roomType, setRoomType] = useState("");
  const [peopleCount, setPeopleCount] = useState("2");
  const [waiting, setWaiting] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const navigate = useNavigate();

  // Load selected problem from localStorage (after coming from Problems page)
  useEffect(() => {
    const selected = localStorage.getItem("selectedProblem");
    if (selected) {
      setProblem(selected);
    }
  }, []);

  // Polling for room status (if room is ready, auto-navigate)
  useEffect(() => {
    if (!waiting || !createdRoom) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          // `https://codemate-1-nuih.onrender.com/rooms/${createdRoom.roomId}`
          BASE_URL
        );
        const room = res.data.room;

        if (room.users.length >= room.peoplecount) {
          clearInterval(interval);
          localStorage.removeItem("selectedProblem");

          if (room.roomType === "battle") {
            navigate(`/battle/${room.roomId}`);
          } else {
            navigate(`/discussion/${room.roomId}`);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [waiting, createdRoom]);

  const handleProblemSelect = () => {
    navigate("/problems", { state: { fromCreateRoom: true } });
  };

  const handleCreateRoom = async () => {
    const userId = localStorage.getItem("userId");
    if (!roomName || !roomId || !problem || !roomType || !peopleCount || !userId) {
      return alert("Please fill all fields.");
    }

    try {
      const res = await axios.post(
        "https://codemate-1-nuih.onrender.com/rooms/createroom",
        {
          userId,
          roomname: roomName,
          roomId,
          problem,
          roomType,
          peoplecount: parseInt(peopleCount),
        }
      );

      setCreatedRoom(res.data.room);
      setWaiting(true);
    } catch (err) {
      alert(err.response?.data?.msg || "Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-900 text-white p-6">
      {/* Waiting Modal */}
      {waiting && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-zinc-800 p-6 rounded-lg text-center shadow-xl border border-zinc-600">
            <h2 className="text-xl font-bold text-white mb-2">⏳ Waiting for others to join...</h2>
            <p className="text-gray-400 text-sm">Room ID: {roomId}</p>
            <p className="text-gray-400 text-sm">Share it to let others join.</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 hover:text-cyan-400"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-center gap-5">
          <Coins size={20} className="text-yellow-400" />
          <Bell size={20} className="text-white" />
          <UserCircle size={26} className="text-white" />
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-cyan-400 mb-6 text-center">
          🎯 Create a New Room
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Room Name"
            className="p-3 bg-zinc-700 rounded outline-none"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Room ID"
            className="p-3 bg-zinc-700 rounded outline-none"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button
            onClick={handleProblemSelect}
            className="p-3 bg-zinc-700 hover:bg-zinc-600 text-left rounded"
          >
            {problem ? `Problem Selected: ${problem}` : "🔍 Choose Problem"}
          </button>

          <select
            className="p-3 bg-zinc-700 rounded"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="battle">Battle</option>
            <option value="discussion">Discussion</option>
          </select>

          <select
            className="p-3 bg-zinc-700 rounded"
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
          >
            <option value="2">2 People</option>
            <option value="4">4 People</option>
          </select>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <VideoIcon size={18} /> <span>Video ON</span>
            </div>
            <div className="flex items-center gap-2">
              <MicIcon size={18} /> <span>Audio ON</span>
            </div>
          </div>

          <button
            onClick={handleCreateRoom}
            className="bg-green-600 hover:bg-green-500 p-3 rounded text-white mt-4"
          >
            🚀 Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
