// src/components/Room/RoomWaitingLobby.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../Collab/socket";
import axios from "axios";
import { BASE_URL } from "../../api/config";

const RoomWaitingLobby = () => {
  const { roomId: routeParam } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [problem, setProblem] = useState(null);
  const [micStatus, setMicStatus] = useState({ creator: false, participant: false });
  const [userId, setUserId] = useState(null);
  const [creatorId, setCreatorId] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    console.log("the uid :", uid);
    if (uid) setUserId(uid);
  }, []);

  useEffect(() => {
    if (!userId || !routeParam || joined) return;
    let mounted = true;

    const fetchRoomInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${BASE_URL}/rooms/${routeParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;
        const data = res.data.room;
        setCreator(data.creator || {});
        setCreatorId(data.creator?._id || data.creator?.id || null);
        setProblem(data.problem || null);

        const opponents = (data.participants || []).filter(
          (p) =>
            String(p.userId?._id || p.userId?.id || p.userId) !==
            String(data.creator?._id)
        );
        setParticipant(opponents[0]?.userId || null);

        const onRoomUpdated = ({ creator: newCreator, participants, problem: newProblem }) => {
          setCreator(newCreator || {});
          const cid = newCreator?._id || newCreator?.id || null;
          setCreatorId(cid);
          const opponents = (participants || []).filter((p) => {
            const pid = p.userId?._id || p.userId?.id || p.userId;
            return String(pid) !== String(cid);
          });
          setParticipant(opponents[0]?.userId || null);
          setProblem(newProblem || null);
        };

        const onBattleStarted = ({ problem: startedProblem }) => {
          navigate(`/battle/${routeParam}`, { state: { problem: startedProblem || problem } });
        };

        socket.on("room-updated", onRoomUpdated);
        socket.on("battle-started", onBattleStarted);

        if (!joined) {
          if (socket.connected) {
            socket.emit("join-room", { roomId: data.roomId, userId });
          } else {
            socket.once("connect", () => {
              socket.emit("join-room", { roomId: data.roomId, userId });
            });
          }
          setJoined(true);
        }

        return () => {
          mounted = false;
          socket.off("room-updated", onRoomUpdated);
          socket.off("battle-started", onBattleStarted);
        };
      } catch (err) {
        console.error("Error fetching room:", err.message);
      }
    };

    fetchRoomInfo();
  }, [userId, routeParam, joined, navigate]);

  const handleToggleMic = (type) => {
    setMicStatus((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDeleteRoom = async () => {
    try {
      const token = localStorage.getItem("token");

      let idToSend = routeParam;

      await axios.delete(`${BASE_URL}/rooms/delete/${idToSend}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit("room-deleted", idToSend);
      navigate("/rooms/createroom");
    } catch (err) {
      console.error("Delete error:", err.message);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", { roomId: routeParam, userId });
    navigate("/rooms/createroom");
  };

  const handleStartBattle = () => {

    // Emit socket event as usual
    socket.emit("start-battle", { roomId: routeParam });
    // Immediately navigate with problem so battle page has it
    navigate(`/battle/${routeParam}`, { state: { problem } });

    const idToSend = canonicalRoomId || routeParam;
    socket.emit("start-battle", { roomId: idToSend });
    navigate(`/battle/${idToSend}`);

  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-zinc-800 text-white px-6 py-10">
      <div className="bg-zinc-900 rounded-xl p-8 shadow-lg flex flex-col items-center justify-center">
        <h2 className="text-2xl text-center font-semibold text-teal-400 mb-4">
          Waiting Lobby - Get Ready to Code!
        </h2>

        <div className="flex justify-between items-start gap-6 w-full max-w-5xl">

          {/* Creator Card */}

          {/* Creator */}

          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow">
            <div className="bg-cyan-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {creator?.username ? creator.username.charAt(0).toUpperCase() : "?"}
            </div>
            <p className="text-lg font-semibold mt-2">{creator?.username || "Waiting..."}</p>
            <button onClick={() => handleToggleMic("creator")} className="mt-2 text-pink-400">
              {micStatus.creator ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <p className="text-sm text-zinc-400 mt-1">Creator</p>
            {userId === creatorId && (
              <button onClick={handleDeleteRoom} className="mt-3 text-red-500 hover:text-red-600">
                <Trash2 size={20} />
              </button>
            )}
          </div>


          {/* Problem Card */}

          {/* Problem */}

          <div className="bg-zinc-800 border border-cyan-500 p-6 rounded-lg text-center shadow-md animate-pulse w-1/3">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
              <Target className="inline-block mr-2" />
              {problem?.title || "Loading..."}
            </h3>
            <p className="text-sm text-zinc-300">
              Quick Battle — Get matched instantly with an opponent of similar skill level.
            </p>

            {creator && participant && String(userId) === String(creatorId) && (
              <button
                onClick={handleStartBattle}
                className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow"
              >
                <Rocket size={18} className="inline-block mr-2" />
                Start Quick Battle
              </button>
            )}
          </div>


          {/* Participant Card */}

          {/* Participant */}

          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow">
            <div className="bg-purple-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {participant?.username ? participant.username.charAt(0).toUpperCase() : "?"}
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
