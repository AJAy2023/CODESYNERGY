import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import socket from "./socket";
import { Mic, MicOff, UserCircle, Loader, DoorOpen, Rocket } from "lucide-react";

const WaitingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [userId] = useState(localStorage.getItem("userId"));

  const isCreator = roomInfo?.creator === userId;

  useEffect(() => {
    socket.emit("room-status", { roomId });

    socket.on("room-status-response", (room) => {
      setRoomInfo(room);
      setParticipants(room?.participants || []);
    });

    socket.on("user-joined", ({ user }) => {
      setParticipants((prev) => [...prev, user]);
    });

    socket.on("user-left", ({ userId }) => {
      setParticipants((prev) => prev.filter((u) => u._id !== userId));
    });

    socket.on("room-start", () => {
      const route = roomInfo?.roomType === "battle" ? "battle" : "discussion";
      navigate(`/${route}/${roomId}`);
    });

    return () => {
      socket.off("room-status-response");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-start");
    };
  }, [roomId, userId, navigate, roomInfo?.roomType]);

  const handleStart = () => {
    socket.emit("room-start", { roomId });
  };

  const handleLeave = () => {
    socket.emit("leave-room", { roomId, userId });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">
        ⏳ Waiting for players to join...
      </h2>

      <p className="text-gray-400 text-sm mb-8">Room ID: <span className="text-white font-semibold">{roomId}</span></p>

      {/* Participants List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-3xl mb-8">
        {participants.map((p, i) => (
          <div key={p._id || i} className="bg-zinc-800 border border-zinc-600 p-4 rounded-lg flex items-center gap-4 shadow">
            <UserCircle size={32} />
            <div>
              <p className="font-semibold text-white">{p.name || "Guest"}</p>
              <div className="flex gap-2 text-sm text-gray-400">
                <Mic size={16} />
                <span>Audio ON</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleLeave}
          className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded flex items-center gap-2"
        >
          <DoorOpen size={18} /> Leave Room
        </button>

        {isCreator && participants.length >= parseInt(roomInfo?.peoplecount || 2) && (
          <button
            onClick={handleStart}
            className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded flex items-center gap-2"
          >
            <Rocket size={18} /> Start
          </button>
        )}
      </div>

      {/* Loader when waiting */}
      {participants.length < parseInt(roomInfo?.peoplecount || 2) && (
        <div className="mt-6 text-gray-400 flex items-center gap-2">
          <Loader className="animate-spin" size={16} />
          Waiting for others to join...
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
