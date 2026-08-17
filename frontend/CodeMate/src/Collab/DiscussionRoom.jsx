// src/Collab/DiscussionRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "./socket";
import { BASE_URL } from "../api/config";
import DiscussionWhiteboard from "../components/Room/DiscussionWhiteboard";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  UserCheck,
  Shield,
  BookOpen,
  Users,
  Palette,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

// Video Feed Component to reliably bind WebRTC MediaStreams to HTML5 <video> elements
function VideoFeed({ stream, isMuted, isCamOff, pName }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 1.0;
      videoRef.current.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("VideoFeed play error:", err);
        }
      });
    }
  }, [stream, isMuted]);

  if (!stream || isCamOff) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold text-xs bg-zinc-900 p-2">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-cyan-400 text-sm mb-1 font-bold border border-white/10 shadow">
          {pName ? pName.charAt(0).toUpperCase() : "?"}
        </div>
        <span className="text-[10px] text-slate-500 font-medium">{isCamOff ? "Cam OFF" : "Connecting..."}</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-cover rounded-xl"
    />
  );
}

export default function DiscussionRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Refs
  const localVideoRef = useRef(null);
  const peerMapRef = useRef({}); // clientId -> RTCPeerConnection
  const pendingIceRef = useRef({}); // clientId -> RTCIceCandidate[] (buffered before remoteDesc)
  const myClientIdRef = useRef(null);
  const localStreamRef = useRef(null);
  // Maps socketId -> userId so video slots survive DB clientId staleness
  const streamOwnerRef = useRef({}); // { [socketId]: userId }

  // State
  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [activeDrawerId, setActiveDrawerId] = useState(null);
  const [activeDrawerName, setActiveDrawerName] = useState("Host");

  // Local media states
  const [localStream, setLocalStream] = useState(null);
  const [localAudioOn, setLocalAudioOn] = useState(true);
  const [localVideoOn, setLocalVideoOn] = useState(true);

  // Remote WebRTC streams map { [clientId]: MediaStream }
  const [remoteStreams, setRemoteStreams] = useState({});

  // Collapsible problem state
  const [showProblem, setShowProblem] = useState(true);
  const [userLeftToast, setUserLeftToast] = useState(null);

  // ---- Initialize Media Stream ----
  const initLocalStream = async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn("Could not access camera/mic:", err.message);
      return null;
    }
  };

  // Helper to trigger peer offers for new participants in room
  const checkAndConnectPeers = (participantList) => {
    if (!Array.isArray(participantList)) return;
    console.log("[DiscussionRoom] Host checkAndConnectPeers running. userId:", userId, "participants:", participantList);
    participantList.forEach((p) => {
      const targetUserId = String(p.userId?._id || p.userId || p._id);
      if (targetUserId && targetUserId !== String(userId)) {
        const existingPc = peerMapRef.current[targetUserId];
        if (!existingPc || existingPc.connectionState !== "connected") {
          console.log("[DiscussionRoom] Host initiating offer to peer userId:", targetUserId);
          createPeerOfferTo(targetUserId);
        }
      }
    });
  };

  // ---- REST Bootstrap ----
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (dead) return;
        const roomObj = res.data?.room ?? res.data;
        setRoom(roomObj);
        setProblem(roomObj?.problem ?? res.data?.problem ?? null);

        const creator = roomObj?.creator ?? roomObj?.createdBy;
        const cId = creator?._id ?? creator;
        setHostId(cId);
        const hostCheck = String(cId) === String(userId);
        setIsHost(hostCheck);

        if (!activeDrawerId) {
          setActiveDrawerId(cId);
          setActiveDrawerName(creator?.username || "Host");
        }
      } catch (e) {
        console.warn("Room REST bootstrap failed", e);
      }
    })();
    return () => {
      dead = true;
    };
  }, [roomId, userId]);

  // ---- Socket & WebRTC Lifecycle ----
  useEffect(() => {
    if (!roomId || !userId) return;

    // Await stream FIRST so tracks are ready before any peer offer is sent
    initLocalStream().then(() => {
      socket.emit("join-room", { roomId, userId });
    });

    const onRoomJoined = (data) => {
      console.log("[DiscussionRoom] onRoomJoined:", data);
      if (data?.clientId) myClientIdRef.current = data.clientId;
      const creator = data?.creator ?? data?.createdBy;
      const cId = creator?._id ?? creator;
      const amIHost = cId ? String(cId) === String(userId) : false;

      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
        if (amIHost) {
          checkAndConnectPeers(data.participants);
        }
      }
      if (data?.problem) setProblem(data.problem);

      if (cId) {
        setHostId(cId);
        setIsHost(amIHost);
        if (!activeDrawerId) {
          setActiveDrawerId(cId);
          setActiveDrawerName(creator?.username || "Host");
        }
      }
    };

    const onRoomUpdated = (payload) => {
      console.log("[DiscussionRoom] onRoomUpdated:", payload);
      const creator = payload?.creator ?? payload?.createdBy;
      const cId = creator?._id ?? creator;
      const amIHost = cId ? String(cId) === String(userId) : false;

      if (payload?.participants) {
        setParticipants(payload.participants);
        if (amIHost) {
          checkAndConnectPeers(payload.participants);
        }
      }
      if (payload?.problem) setProblem(payload.problem);
      if (cId) {
        setHostId(cId);
        setIsHost(amIHost);
      }
    };

    const onRoomFull = () => {
      alert("This discussion room is full (max 4 participants).");
      navigate("/dashboard");
    };

    // Draw Access Permission Update
    const onDrawAccessUpdated = ({ activeDrawerId: drawerId, activeDrawerName: drawerName }) => {
      setActiveDrawerId(drawerId);
      setActiveDrawerName(drawerName || "Participant");
    };

    const onUserLeft = ({ userId: leftUserId, username }) => {
      if (!leftUserId || String(leftUserId) === String(userId)) return;
      setUserLeftToast(`👋 ${username || "Participant"} left the room.`);
      setTimeout(() => setUserLeftToast(null), 4000);
      setParticipants((prev) => prev.filter((p) => String(p.userId?._id || p.userId || p._id) !== String(leftUserId)));

      // If active drawer left, reset drawer back to host
      if (String(leftUserId) === String(activeDrawerId)) {
        setActiveDrawerId(hostId);
        setActiveDrawerName("Host");
      }
    };

    // WebRTC Signaling using userId
    const onWebrtcOffer = async ({ sdp, from }) => {
      if (!from || String(from) === String(userId)) return;
      console.log("[DiscussionRoom] onWebrtcOffer received from userId:", from);
      try {
        const stream = await initLocalStream();
        let pc = peerMapRef.current[from];
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          peerMapRef.current[from] = pc;

          if (stream) {
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
          }

          pc.ontrack = (e) => {
            console.log("[DiscussionRoom] ontrack fired from offer-side for userId:", from, e.streams);
            if (e.streams && e.streams[0]) {
              setRemoteStreams((prev) => ({
                ...prev,
                [from]: e.streams[0],
              }));
            }
          };

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socket.emit("webrtc-ice", {
                candidate: e.candidate,
                from: userId,
                roomId,
              });
            }
          };
        }

        if (pc.signalingState !== "stable") {
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" }),
            pc.setRemoteDescription(new RTCSessionDescription(sdp)),
          ]);
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }

        await drainIce(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[DiscussionRoom] Sending webrtc-answer from userId:", userId, "to:", from);

        socket.emit("webrtc-answer", {
          sdp: answer,
          from: userId,
          roomId,
        });
      } catch (err) {
        console.error("webrtc offer handling error", err);
      }
    };

    const onWebrtcAnswer = async ({ sdp, from }) => {
      if (!from || String(from) === String(userId)) return;
      console.log("[DiscussionRoom] onWebrtcAnswer received from userId:", from);
      const pc = peerMapRef.current[from];
      if (!pc || pc.signalingState !== "have-local-offer") {
        console.log("[DiscussionRoom] Ignoring answer, PC signaling state is:", pc?.signalingState);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await drainIce(from);
      } catch (e) {
        console.error("webrtc answer handling error", e);
      }
    };

    const onWebrtcIce = async ({ candidate, from }) => {
      if (!from || String(from) === String(userId)) return;
      const pc = peerMapRef.current[from];
      if (!pc || !pc.remoteDescription) {
        if (!pendingIceRef.current[from]) {
          pendingIceRef.current[from] = [];
        }
        pendingIceRef.current[from].push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("addIceCandidate failed", e);
      }
    };

    // Helper: drain buffered ICE candidates after remoteDescription is set
    const drainIce = async (fromUserId) => {
      const pc = peerMapRef.current[fromUserId];
      const pending = pendingIceRef.current[fromUserId] || [];
      if (!pc || !pending.length) return;
      pendingIceRef.current[fromUserId] = [];
      for (const c of pending) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
      }
    };

    const onPeerLeft = ({ userId: leftId }) => {
      if (!leftId) return;
      const pc = peerMapRef.current[leftId];
      if (pc) {
        try { pc.close(); } catch {}
        delete peerMapRef.current[leftId];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[leftId];
        return copy;
      });
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("room-updated", onRoomUpdated);
    socket.on("room-full", onRoomFull);
    socket.on("draw-access-updated", onDrawAccessUpdated);
    socket.on("user-left", onUserLeft);
    socket.on("webrtc-offer", onWebrtcOffer);
    socket.on("webrtc-answer", onWebrtcAnswer);
    socket.on("webrtc-ice", onWebrtcIce);
    socket.on("peer-left", onPeerLeft);

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-full", onRoomFull);
      socket.off("draw-access-updated", onDrawAccessUpdated);
      socket.off("user-left", onUserLeft);
      socket.off("webrtc-offer", onWebrtcOffer);
      socket.off("webrtc-answer", onWebrtcAnswer);
      socket.off("webrtc-ice", onWebrtcIce);
      socket.off("peer-left", onPeerLeft);
    };
  }, [roomId, userId]);

  // Create Peer Offer using userId
  const createPeerOfferTo = async (targetUserId) => {
    if (!targetUserId || peerMapRef.current[targetUserId]) {
      console.log("[DiscussionRoom] Skipping offer to userId", targetUserId, "already in peerMap");
      return;
    }
    console.log("[DiscussionRoom] createPeerOfferTo starting for userId:", targetUserId);
    try {
      const stream = await initLocalStream();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerMapRef.current[targetUserId] = pc;

      if (stream) {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      }

      pc.ontrack = (e) => {
        console.log("[DiscussionRoom] ontrack fired from answer-side for userId:", targetUserId, e.streams);
        if (e.streams && e.streams[0]) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetUserId]: e.streams[0],
          }));
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice", {
            candidate: e.candidate,
            from: userId,
            roomId,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[DiscussionRoom] Emitting webrtc-offer from userId:", userId, "to room:", roomId);

      socket.emit("webrtc-offer", {
        sdp: offer,
        from: userId,
        roomId,
      });
    } catch (e) {
      console.error("createPeerOfferTo failed", e);
    }
  };

  // ---- Media Toggles ----
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const tracks = localStreamRef.current.getAudioTracks();
    if (tracks.length > 0) {
      const enabled = !tracks[0].enabled;
      tracks.forEach((t) => (t.enabled = enabled));
      setLocalAudioOn(enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const tracks = localStreamRef.current.getVideoTracks();
    if (tracks.length > 0) {
      const enabled = !tracks[0].enabled;
      tracks.forEach((t) => (t.enabled = enabled));
      setLocalVideoOn(enabled);
    }
  };

  // ---- Host Whiteboard Access Transfer ----
  const handleGrantAccess = (targetUserId, targetUsername) => {
    if (!isHost) return;
    setActiveDrawerId(targetUserId);
    setActiveDrawerName(targetUsername);
    socket.emit("transfer-draw-access", {
      roomId,
      activeDrawerId: targetUserId,
      activeDrawerName: targetUsername,
    });
  };

  // Leave Room Cleanup
  const leaveRoom = () => {
    socket.emit("leave-room", { roomId, userId });
    Object.values(peerMapRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peerMapRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    navigate("/dashboard");
  };

  // Determine drawing capability (Host or Granted Participant)
  const canDraw = String(userId) === String(activeDrawerId) || (isHost && !activeDrawerId);

  // Formatted Examples helper
  const renderExample = (ex) => {
    if (typeof ex === "string" || typeof ex === "number") {
      return <pre className="text-xs whitespace-pre-wrap font-mono text-slate-200">{String(ex)}</pre>;
    }
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono text-cyan-300">
        {JSON.stringify(ex, null, 2)}
      </pre>
    );
  };

  // Deduplicate participants cleanly by userId for accurate slot mapping
  const uniqueParticipants = Array.from(
    new Map(
      (participants || []).map((p) => [
        String(p.userId?._id || p.userId || p._id || p.clientId),
        p,
      ])
    ).values()
  );

  const maxSlots = room?.peopleCount ? Math.min(4, Math.max(2, Number(room.peopleCount))) : 4;

  const videoSlots = Array.from({ length: maxSlots }).map((_, idx) => {
    const participant = uniqueParticipants[idx];
    const pUserId = participant ? String(participant.userId?._id || participant.userId || participant._id) : null;
    const isMe = pUserId ? pUserId === String(userId) : (idx === 0 && uniqueParticipants.length === 0);

    return {
      index: idx,
      participant,
      isMe,
      pUserId,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-slate-100 p-4 font-sans flex flex-col">
      {userLeftToast && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{userLeftToast}</span>
          <button onClick={() => setUserLeftToast(null)} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-wrap justify-between items-center bg-zinc-900/90 border border-white/10 p-4 rounded-2xl mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>{room?.roomName || "Discussion Workbench"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                Room ID: {roomId}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Collaborative 4-Person Whiteboard & Audio/Video Discussion
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <button
            onClick={toggleAudio}
            title="Toggle Microphone"
            className={`p-2.5 rounded-xl border text-sm font-semibold transition flex items-center gap-2 ${
              localAudioOn
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
            }`}
          >
            {localAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
            <span className="hidden sm:inline">{localAudioOn ? "Mic ON" : "Muted"}</span>
          </button>

          <button
            onClick={toggleVideo}
            title="Toggle Camera"
            className={`p-2.5 rounded-xl border text-sm font-semibold transition flex items-center gap-2 ${
              localVideoOn
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
            }`}
          >
            {localVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            <span className="hidden sm:inline">{localVideoOn ? "Cam ON" : "Cam OFF"}</span>
          </button>

          <button
            onClick={leaveRoom}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition flex items-center gap-1.5 shadow-lg"
          >
            <LogOut size={18} />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Main 12-Column Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        {/* Left Panel (col-span-3): 4-Person Video Feed Grid + Problem Statement */}
        <div className="lg:col-span-3 space-y-4">
          {/* 4-Person Video Feed Grid */}
          <div className="bg-zinc-900/90 rounded-2xl border border-white/10 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} /> 4-Person Camera Grid ({participants.length}/4)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {videoSlots.map((slot) => {
                const p = slot.participant;
                const pName = p?.username || p?.userId?.username || (slot.isMe ? "You" : `Peer ${slot.index + 1}`);
                const pRole = p?.role === "host" || String(p?.userId?._id || p?.userId) === String(hostId) ? "Host" : "Viewer";
                const isDrawing = String(p?.userId?._id || p?.userId) === String(activeDrawerId);

                // Look up stream: match by participant userId or remote stream list
                const remoteStreamList = Object.values(remoteStreams);
                const nonMeSlots = videoSlots.filter((s) => !s.isMe);
                const slotIndexAmongNonMe = nonMeSlots.indexOf(slot);
                const feedStream = slot.isMe
                  ? localStream
                  : (slot.pUserId && remoteStreams[slot.pUserId]) || remoteStreamList[slotIndexAmongNonMe] || null;
                const isCamOff = slot.isMe ? !localVideoOn : false;

                return (
                  <div
                    key={`slot-${slot.index}`}
                    className="relative bg-zinc-950 rounded-xl border border-white/10 aspect-video overflow-hidden flex items-center justify-center shadow-inner group"
                  >
                    <VideoFeed
                      stream={feedStream}
                      isMuted={slot.isMe}
                      isCamOff={isCamOff}
                      pName={pName}
                    />

                    {/* Participant Info Overlay Badge */}
                    <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm flex items-center justify-between text-[10px] text-slate-200 z-10">
                      <span className="truncate font-semibold text-white">{pName}</span>
                      <span className={`px-1 rounded text-[9px] font-bold ${isDrawing ? "bg-cyan-500 text-black" : "bg-zinc-800 text-slate-400"}`}>
                        {isDrawing ? "🎨 Drawing" : pRole}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem Statement Card */}
          <div className="bg-zinc-900/90 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md">
            <div
              onClick={() => setShowProblem((prev) => !prev)}
              className="flex items-center justify-between cursor-pointer border-b border-white/10 pb-2 mb-3"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Topic / Problem Details
                </span>
              </div>
              <button className="text-slate-400 hover:text-white">
                {showProblem ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showProblem && (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                <h3 className="text-base font-bold text-white">{problem?.title || "Discussion Topic"}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {problem?.description || "Collaborative whiteboard room for architectural discussion and algorithm breakdown."}
                </p>

                {problem?.examples && (
                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Examples & Test Cases</h4>
                    <div className="space-y-2">
                      {(Array.isArray(problem.examples) ? problem.examples : [problem.examples]).map((ex, idx) => (
                        <div key={`ex-${idx}`} className="bg-zinc-950 p-2.5 rounded-lg border border-white/10 text-xs">
                          {renderExample(ex)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel (col-span-6): Playful Smooth Collaborative Whiteboard */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[72vh]">
          {/* Active Drawer Indicator Banner */}
          <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 px-4 py-2 rounded-xl mb-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Palette size={16} className="text-cyan-400 animate-pulse" />
              <span>Active Whiteboard Drawer: <strong className="text-white underline">{activeDrawerName}</strong></span>
            </div>
            <div className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {canDraw ? "✨ You Have Draw Access" : "👀 Read-Only Viewer"}
            </div>
          </div>

          <div className="flex-1 bg-zinc-950/80 rounded-2xl border border-white/10 p-3 shadow-2xl backdrop-blur-md">
            <DiscussionWhiteboard
              roomId={roomId}
              socket={socket}
              isHost={isHost}
              canDraw={canDraw}
              disableDrawing={!canDraw}
            />
          </div>
        </div>

        {/* Right Panel (col-span-3): Session Info & Participants Access Control */}
        <div className="lg:col-span-3 space-y-4">
          {/* Session Info Card */}
          <div className="bg-zinc-900/90 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-3 flex items-center gap-1.5">
              <Shield size={14} /> Session Information
            </h4>
            <div className="space-y-2 text-xs text-slate-300 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Host:</span>
                <span className="font-bold text-white">{participants.find((p) => String(p.userId?._id || p.userId) === String(hostId))?.username || "Host"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Topic:</span>
                <span className="font-bold text-cyan-300 truncate max-w-[140px]">{problem?.title || "Discussion"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Drawer:</span>
                <span className="font-bold text-emerald-400">{activeDrawerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Participants:</span>
                <span className="font-bold text-yellow-400">{participants.length} / 4</span>
              </div>
            </div>
          </div>

          {/* Participants & Whiteboard Access Control Card */}
          <div className="bg-zinc-900/90 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} /> Participants & Controls
              </h4>
              {isHost && (
                <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                  Host Admin
                </span>
              )}
            </div>

            <ul className="space-y-2 text-xs">
              {(uniqueParticipants || []).map((p, idx) => {
                const pUserId = String(p.userId?._id || p.userId || p._id);
                const pUsername = p.username || p.userId?.username || `User ${idx + 1}`;
                const isHostUser = String(pUserId) === String(hostId);
                const isCurrentDrawer = String(pUserId) === String(activeDrawerId);

                return (
                  <li
                    key={`${pUserId}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs">
                        {pUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{pUsername}</span>
                          {isHostUser && <span className="text-[9px] text-yellow-400 font-bold">👑</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isHostUser ? "Host Administrator" : "Participant"}
                        </div>
                      </div>
                    </div>

                    {/* Host Transfer Board Control */}
                    <div>
                      {isCurrentDrawer ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          Drawer ✅
                        </span>
                      ) : isHost ? (
                        <button
                          onClick={() => handleGrantAccess(pUserId, pUsername)}
                          className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition cursor-pointer"
                        >
                          Grant Access
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Viewer</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Hidden local video preview fallback for audio/video stream processing */}
      <video ref={localVideoRef} autoPlay muted playsInline style={{ display: "none" }} />
    </div>
  );
}
