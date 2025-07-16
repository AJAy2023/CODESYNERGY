import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "./socket";
import { ArrowLeft } from "lucide-react";

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [problem, setProblem] = useState("");
  const [roomType, setRoomType] = useState("");
  const [peopleCount, setPeopleCount] = useState("2");
  const navigate = useNavigate();

  useEffect(() => {
    const selected = localStorage.getItem("selectedProblem");
    if (selected) {
      setProblem(selected);
    }
  }, []);

  const handleCreateRoom = async () => {
    const userId = localStorage.getItem("userId");

    if (!roomName || !roomId || !problem || !roomType || !peopleCount || !userId) {
      return alert("Please fill all fields.");
    }

    try {
      const res = await axios.post("http://localhost:8000/rooms/createroom", {
        userId,
        roomname: roomName,
        roomId,
        problem,
        roomType,
        peoplecount: parseInt(peopleCount),
      });

      localStorage.removeItem("selectedProblem");

      socket.connect();
      socket.emit("join-room", { userId, roomId });

      navigate(`/waitingroom/${roomId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Server error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 mb-4">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="max-w-xl mx-auto bg-zinc-800 p-6 rounded-xl shadow-lg border border-zinc-700">
        <h2 className="text-xl font-bold text-cyan-400 mb-6 text-center">🎯 Create a New Room</h2>

        <input
          type="text"
          placeholder="Room Name"
          className="p-3 bg-zinc-700 rounded w-full mb-3"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Room ID (auto or custom)"
          className="p-3 bg-zinc-700 rounded w-full mb-3"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          onClick={() => navigate("/problems", { state: { fromCreateRoom: true } })}
          className="p-3 bg-zinc-700 rounded w-full mb-3 text-left"
        >
          {problem ? `Problem: ${problem}` : "Choose Problem"}
        </button>

        <select
          className="p-3 bg-zinc-700 rounded w-full mb-3"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
        >
          <option value="">Select Type</option>
          <option value="battle">Battle</option>
          <option value="discussion">Discussion</option>
        </select>

        <select
          className="p-3 bg-zinc-700 rounded w-full mb-3"
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
        >
          <option value="2">2 People</option>
          <option value="4">4 People</option>
        </select>

        <button
          onClick={handleCreateRoom}
          className="bg-green-600 hover:bg-green-500 p-3 rounded text-white w-full mt-4"
        >
          🚀 Create Room
        </button>
      </div>
    </div>
  );
};

export default CreateRoom;
