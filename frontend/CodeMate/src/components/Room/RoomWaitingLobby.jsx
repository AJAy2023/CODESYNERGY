import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../Collab/socket";
import axios from "axios";
import { BASE_URL } from "../../api/config";
import { Mic, MicOff, Target, Rocket, LogOut, Trash2, Copy, Check, Share2, Volume2, VolumeX } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Avengers Battle Theme Audio
  useEffect(() => {
    const audio = new Audio("/media/battelsong/TheAvengers.mp4");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Theme audio play error:", err);
        }
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.pause();
    } else {
      const p = audio.play();
      if (p !== undefined) p.catch(() => {});
    }
  }, [isMuted]);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    console.log("the uid :", uid);
    if (uid) setUserId(uid);
  }, []);

  const handleCopyId = () => {
    if (!routeParam) return;
    navigator.clipboard.writeText(routeParam);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    } catch (err) {
      console.error("Delete error:", err.message);
    } finally {
      localStorage.removeItem("createdRoomData");
      localStorage.removeItem("roomId");
      navigate("/dashboard");
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", { roomId: routeParam, userId });
    localStorage.removeItem("createdRoomData");
    localStorage.removeItem("roomId");
    navigate("/dashboard");
  };

  const handleStartBattle = () => {
    socket.emit("start-battle", { roomId: routeParam });
    navigate(`/battle/${routeParam}`, { state: { problem } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-zinc-800 text-white px-6 py-10">
      <div className="bg-zinc-900 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center">
        <h2 className="text-2xl text-center font-semibold text-teal-400 mb-6">
          Waiting Lobby - Get Ready to Code!
        </h2>

        {/* Share Room ID Banner Card */}
        <div className="w-full max-w-5xl mb-6 p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Share2 size={24} />
            </div>
            <div>
              <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Share with your friend</div>
              <div className="text-[#06b6d4] text-xl font-bold tracking-wide font-mono mt-0.5 flex items-center gap-2">
                <span>Room ID:</span>
                <span className="text-white bg-black/40 px-2.5 py-1 rounded border border-white/10 select-all">{routeParam}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Your friend can use this Room ID to join from the 'Join Room' tab on their dashboard.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer"
              title={isMuted ? "Unmute Battle Song" : "Mute Battle Song"}
            >
              {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-cyan-400" />}
              <span className="text-xs font-mono">{isMuted ? "Muted" : "Theme Audio"}</span>
            </button>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow transition-all cursor-pointer"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? "Copied!" : "Copy Room ID"}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start gap-6 w-full max-w-5xl">
          {/* Creator */}
          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow border border-white/10">
            <div className="bg-cyan-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {creator?.username ? creator.username.charAt(0).toUpperCase() : "?"}
            </div>
            <p className="text-lg font-semibold mt-2">{creator?.username || "Waiting..."}</p>
            <button onClick={() => handleToggleMic("creator")} className="mt-2 text-pink-400">
              {micStatus.creator ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <p className="text-sm text-zinc-400 mt-1">Creator</p>
            {String(userId) === String(creatorId) && (
              <button
                onClick={handleDeleteRoom}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                title="Delete & Cancel Room"
              >
                <Trash2 size={16} />
                <span>Delete Room</span>
              </button>
            )}
          </div>

          {/* Problem */}
          <div className="bg-zinc-800 border border-cyan-500/50 p-6 rounded-lg text-center shadow-md w-1/3">
            <h3 className="text-xl font-bold text-cyan-400 mb-2 flex items-center justify-center">
              <Target className="inline-block mr-2" />
              {problem?.title || "Loading Problem..."}
            </h3>
            <p className="text-sm text-zinc-300 mb-4">
              Quick Battle — Get matched instantly with an opponent of similar skill level.
            </p>

            {creator && participant && String(userId) === String(creatorId) && (
              <button
                onClick={handleStartBattle}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg shadow transition cursor-pointer"
              >
                <Rocket size={18} className="inline-block mr-2" />
                Start Battle
              </button>
            )}
          </div>

          {/* Participant */}
          <div className="bg-zinc-800 p-6 rounded-lg flex flex-col items-center w-1/3 shadow border border-white/10">
            <div className="bg-purple-500 text-black w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold">
              {participant?.username ? participant.username.charAt(0).toUpperCase() : "?"}
            </div>
            <p className="text-lg font-semibold mt-2">{participant?.username || "Waiting..."}</p>
            <button onClick={() => handleToggleMic("participant")} className="mt-2 text-pink-400">
              {micStatus.participant ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <p className="text-sm text-zinc-400 mt-1">Participant</p>
            {String(userId) !== String(creatorId) && participant && (
              <button
                onClick={handleLeaveRoom}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
              >
                <LogOut size={16} />
                <span>Leave Room</span>
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
