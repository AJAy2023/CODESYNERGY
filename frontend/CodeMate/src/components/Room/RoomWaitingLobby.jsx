import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../Collab/socket";
import axios from "axios";
import { BASE_URL } from "../../api/config";
import { Mic, MicOff, Target, Rocket, LogOut, Trash2, Copy, Check, Share2, Volume2, VolumeX } from "lucide-react";

const ICE_CONFIG = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const RoomWaitingLobby = () => {
  const { roomId: routeParam } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [problem, setProblem] = useState(null);
  const [micStatus, setMicStatus] = useState({ creator: true, participant: true });
  const [userId, setUserId] = useState(null);
  const [creatorId, setCreatorId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const themeAudioRef = useRef(null);
  const localAudioStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const hasJoinedRef = useRef(false);

  // Avengers Battle Theme Audio
  useEffect(() => {
    const audio = new Audio("/media/battelsong/TheAvengers.mp4");
    audio.loop = true;
    audio.volume = 0.35;
    themeAudioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Theme audio play error:", err);
        }
      });
    }

    return () => {
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
        themeAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const audio = themeAudioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.pause();
    } else {
      const p = audio.play();
      if (p !== undefined) p.catch(() => { });
    }
  }, [isMuted]);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) setUserId(uid);
  }, []);

  // Helper to reliably get local microphone stream
  const getLocalAudio = async () => {
    if (localAudioStreamRef.current && localAudioStreamRef.current.active) {
      return localAudioStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localAudioStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.warn("Lobby mic permission error:", err.message);
      setMicStatus((prev) => ({ ...prev, creator: false, participant: false }));
      return null;
    }
  };

  // Helper to ensure lobby peer connection
  const ensureLobbyPeer = (stream) => {
    if (peerConnectionRef.current) {
      if (stream) {
        stream.getAudioTracks().forEach((t) => {
          const senders = peerConnectionRef.current.getSenders();
          if (!senders.some((s) => s.track === t)) {
            peerConnectionRef.current.addTrack(t, stream);
          }
        });
      }
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnectionRef.current = pc;

    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        pc.addTrack(t, stream);
      });
    }

    pc.ontrack = (event) => {
      console.log("[Lobby] ontrack received audio stream:", event.streams);
      const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch((err) => console.warn("Lobby remote audio play error:", err));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", {
          candidate: event.candidate,
          roomId: routeParam,
          from: userId,
        });
      }
    };

    return pc;
  };

  // Main Socket & Lobby Management
  useEffect(() => {
    if (!userId || !routeParam) return;
    let mounted = true;

    // Start audio offer as Creator
    const startLobbyAudioOffer = async () => {
      const stream = await getLocalAudio();
      const pc = ensureLobbyPeer(stream);

      if (pc.signalingState === "have-local-offer" && pc.localDescription) {
        socket.emit("webrtc-offer", {
          sdp: pc.localDescription,
          roomId: routeParam,
          from: userId,
        });
        return;
      }

      if (pc.signalingState !== "stable") return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", {
          sdp: offer,
          roomId: routeParam,
          from: userId,
        });
      } catch (err) {
        console.error("Lobby createOffer error:", err);
      }
    };

    const onRoomUpdated = async ({ creator: newCreator, participants, problem: newProblem }) => {
      if (!mounted) return;
      if (newCreator) {
        setCreator(newCreator);
        const cid = newCreator._id || newCreator.id || newCreator;
        setCreatorId(cid);
      }
      const cid = newCreator?._id || newCreator?.id || newCreator || creatorId;
      const opp = (participants || []).filter((p) => {
        const pid = p.userId?._id || p.userId?.id || p.userId;
        return String(pid) !== String(cid);
      });
      const oppUser = opp[0]?.userId;
      const foundParticipant = typeof oppUser === "object" ? oppUser : (opp[0] || null);
      setParticipant(foundParticipant);
      if (newProblem) setProblem(newProblem);

      // If Creator and Opponent is present, Creator starts voice chat
      const isCreator = String(userId) === String(cid);
      if (isCreator && foundParticipant) {
        startLobbyAudioOffer();
      }
    };

    const onBattleStarted = ({ problem: startedProblem }) => {
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
        localAudioStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
        peerConnectionRef.current = null;
      }
      navigate(`/battle/${routeParam}`, { state: { problem: startedProblem || problem } });
    };

    const onWebrtcOffer = async ({ sdp, from }) => {
      if (String(from) === String(userId)) return;
      console.log("[Lobby] received webrtc-offer from:", from);
      const stream = await getLocalAudio();
      const pc = ensureLobbyPeer(stream);
      try {
        if (pc.signalingState !== "stable") {
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" }),
            pc.setRemoteDescription(new RTCSessionDescription(sdp)),
          ]);
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        while (pendingCandidatesRef.current.length) {
          const c = pendingCandidatesRef.current.shift();
          try { await pc.addIceCandidate(c); } catch (e) {}
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          sdp: answer,
          roomId: routeParam,
          from: userId,
        });
      } catch (err) {
        console.error("Lobby handleOffer error:", err);
      }
    };

    const onWebrtcAnswer = async ({ sdp, from }) => {
      if (String(from) === String(userId)) return;
      console.log("[Lobby] received webrtc-answer from:", from);
      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState !== "have-local-offer") {
        console.log("[Lobby] Ignoring answer — PC state is", pc?.signalingState);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        while (pendingCandidatesRef.current.length) {
          const c = pendingCandidatesRef.current.shift();
          try { await pc.addIceCandidate(c); } catch (e) {}
        }
      } catch (err) {
        console.error("Lobby handleAnswer error:", err);
      }
    };

    const onWebrtcIce = async ({ candidate, from }) => {
      if (String(from) === String(userId)) return;
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn("Lobby addIceCandidate error:", e);
      }
    };

    const onMicToggle = ({ userId: senderId, micOn: senderMicOn }) => {
      setMicStatus((prev) => {
        const isSenderCreator = String(senderId) === String(creatorId);
        return isSenderCreator
          ? { ...prev, creator: senderMicOn }
          : { ...prev, participant: senderMicOn };
      });
    };

    socket.on("room-updated", onRoomUpdated);
    socket.on("battle-started", onBattleStarted);
    socket.on("webrtc-offer", onWebrtcOffer);
    socket.on("webrtc-answer", onWebrtcAnswer);
    socket.on("webrtc-ice", onWebrtcIce);
    socket.on("mic-toggle", onMicToggle);

    const fetchRoomInfo = async () => {
      try {
        // Start microphone acquisition in parallel
        getLocalAudio();

        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${BASE_URL}/rooms/${routeParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;
        const data = res.data.room;
        if (data.creator) {
          setCreator(data.creator);
          setCreatorId(data.creator._id || data.creator.id || null);
        }
        if (data.problem) setProblem(data.problem);

        const cid = data.creator?._id || data.creator?.id;
        const opponents = (data.participants || []).filter(
          (p) =>
            String(p.userId?._id || p.userId?.id || p.userId) !== String(cid)
        );
        const oppUser = opponents[0]?.userId;
        const foundParticipant = typeof oppUser === "object" ? oppUser : (opponents[0] || null);
        setParticipant(foundParticipant);

        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socket.emit("join-room", { roomId: data.roomId || routeParam, userId });
        }

        const isCreator = String(userId) === String(cid);
        if (isCreator && foundParticipant) {
          startLobbyAudioOffer();
        }
      } catch (err) {
        console.error("Error fetching room:", err.message);
      }
    };

    fetchRoomInfo();

    return () => {
      mounted = false;
      socket.off("room-updated", onRoomUpdated);
      socket.off("battle-started", onBattleStarted);
      socket.off("webrtc-offer", onWebrtcOffer);
      socket.off("webrtc-answer", onWebrtcAnswer);
      socket.off("webrtc-ice", onWebrtcIce);
      socket.off("mic-toggle", onMicToggle);
    };
  }, [userId, routeParam, creatorId, navigate]);

  const handleCopyId = () => {
    if (!routeParam) return;
    navigator.clipboard.writeText(routeParam);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMic = (type) => {
    const isCreator = String(userId) === String(creatorId);
    const isMyCard = (type === "creator" && isCreator) || (type === "participant" && !isCreator);
    if (!isMyCard) return; // Only control own microphone

    const stream = localAudioStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextStatus = audioTrack.enabled;
      setMicStatus((prev) => ({ ...prev, [type]: nextStatus }));
      socket.emit("mic-toggle", {
        roomId: routeParam,
        userId,
        micOn: nextStatus,
      });
    }
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
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      localAudioStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
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

      {/* Hidden audio element for lobby voice chat */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
    </div>
  );
};

export default RoomWaitingLobby;
