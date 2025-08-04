import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import  socket  from "../../Collab/socket";
import { Mic, MicOff, Trash2, LogOut, Rocket, Target } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../api/config";

const RoomWaitingLobby = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [problem, setProblem] = useState(null);
  const [micStatus, setMicStatus] = useState({ creator: false, participant: false });
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [creatorId, setCreatorId] = useState(null);

  useEffect(() => {
  if (!roomId || !userId) {
    console.warn("Missing roomId or userId");
    return;
  }

  socket.emit("join-room", roomId, userId);

  const fetchRoomInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.room;
      setCreator(data.creator);
      setCreatorId(data.creator._id);
      setParticipant(data.participant || null);
      setProblem(data.problem);
    } catch (err) {
      console.error("Error fetching room:", err.message);
    }
  };

  fetchRoomInfo();

  socket.on("room-updated", ({ creator, participant }) => {
    setCreator(creator);
    setParticipant(participant);
  });

  return () => {
    socket.off("room-updated");
  };
}, [roomId, userId]);


  const handleToggleMic = (type) => {
    setMicStatus((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleDeleteRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/rooms/delete/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit("room-deleted", roomId);
      navigate("/rooms/createroom");
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", { roomId, userId });
    navigate("/rooms/createroom");
  };

  const handleStartBattle = () => {
    socket.emit("start-battle", { roomId });
    navigate(`/battle/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-zinc-800 text-white px-6 py-10">
   

      <div className="bg-zinc-900 rounded-xl p-8 shadow-lg flex flex-col items-center justify-center">
        <h2 className="text-2xl text-center font-semibold text-teal-400 mb-4">
           Waiting Lobby - Get Ready to Code!
        </h2>

        <div className="flex justify-between items-start gap-6 w-full max-w-5xl">
          {/* Left: Creator */}
          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow">
            <div className="bg-cyan-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {creator ? creator.username[0].toUpperCase() : "?"}
            </div>
            <p className="text-lg font-semibold mt-2">{creator?.username || "Waiting..."}</p>
            <button onClick={() => handleToggleMic("creator")} className="mt-2 text-pink-400">
              {micStatus.creator ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <p className="text-sm text-zinc-400 mt-1">Creator</p>
            {userId === creatorId && (
              <button
                onClick={handleDeleteRoom}
                className="mt-3 text-red-500 hover:text-red-600 transition-all"
                title="Delete Room"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          {/* Center: Problem Card */}
          <div className="bg-zinc-800 border border-cyan-500 p-6 rounded-lg text-center shadow-md animate-pulse w-1/3">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
              <Target className="inline-block mr-2" />
              {problem?.title || "Loading..."}
            </h3>
            <p className="text-sm text-zinc-300">Quick Battle — Get matched instantly with an opponent of similar skill level.</p>
            
            {creator && participant && userId === creatorId && (
              <button
                onClick={handleStartBattle}
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow transition-all"
              >
                <Rocket size={18} className="inline-block mr-2" />
                Start Quick Battle
              </button>
            )}
          </div>

          {/* Right: Participant */}
          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow">
            <div className="bg-purple-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {participant ? participant.username[0].toUpperCase() : "?"}
            </div>
            <p className="text-lg font-semibold mt-2">{participant?.username || "Waiting..."}</p>
            <button onClick={() => handleToggleMic("participant")} className="mt-2 text-pink-400">
              {micStatus.participant ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <p className="text-sm text-zinc-400 mt-1">Participant</p>
            {userId !== creatorId && participant && (
              <button
                onClick={handleLeaveRoom}
                className="mt-3 text-red-500 hover:text-red-600 transition-all"
                title="Leave Room"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <h3 className="text-xl font-bold text-purple-400 mb-1">⚔️ Battle Mode</h3>
        <p className="text-zinc-400 text-sm">
          Compete head-to-head with other coders and earn prestigious badges. Time to prove your skills!
        </p>
      </div>
    </div>
  );
};

export default RoomWaitingLobby;
