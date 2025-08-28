// src/Collab/DiscussionRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "./socket";
import { BASE_URL } from "../api/config";
import DiscussionWhiteboard from "../components/Room/DiscussionWhiteboard";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

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

export default function DiscussionRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Refs
  const localVideoRef = useRef(null);
  const peerMapRef = useRef({});            // host: viewerClientId -> RTCPeerConnection
  const myClientIdRef = useRef(null);       // my socket.id
  const localStreamRef = useRef(null);      // keep mutable

  // State
  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [participants, setParticipants] = useState([]); // [{clientId, userId, username, role}]
  const [isHost, setIsHost] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [hostMediaAllowed, setHostMediaAllowed] = useState({ audio: true, video: true });

  // ---- REST bootstrap (room + problem, host check) ----
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
        const creatorId = creator?._id ?? creator;
        setIsHost(String(creatorId) === String(userId));
      } catch (e) {
        console.warn("room bootstrap failed", e);
      }
    })();
    return () => {
      dead = true;
    };
  }, [roomId, userId]);

  // ---- Socket lifecycle ----
  useEffect(() => {
    if (!roomId || !userId) return;

    socket.emit("join-room", { roomId, userId });

    const onRoomJoined = (data) => {
      // { clientId, participants, creator, isCreator, problem? }
      if (data?.clientId) myClientIdRef.current = data.clientId;
      if (Array.isArray(data?.participants)) setParticipants(data.participants);
      if (data?.problem) setProblem(data.problem);

      const creatorId = data?.creator?._id ?? data?.creator;
      if (creatorId) setIsHost(String(creatorId) === String(userId));
    };

    const onRoomUpdated = (payload) => {
      if (payload?.participants) setParticipants(payload.participants);
      if (payload?.problem) setProblem(payload.problem);
      const c = payload?.creator?._id ?? payload?.creator;
      if (c) setIsHost(String(c) === String(userId));
    };

    const onDiscussionStarted = ({ starterId }) => {
      setIsLive(true);
      if (String(starterId) === String(userId)) {
        // I'm the host; publish media and create offers to current viewers
        startHostMediaAndOfferAll();
      }
    };

    const onHostMediaState = ({ audio, video }) => {
      setHostMediaAllowed({ audio, video });
    };

    const onRoomFull = () => {
      alert("This discussion room is full (max 4).");
      navigate("/dashboard");
    };

    // --- WebRTC signaling ---
    // Viewer receives host offer
    const onWebrtcOffer = async ({ sdp, fromClientId, toClientId }) => {
      try {
        if (toClientId && myClientIdRef.current && String(toClientId) !== String(myClientIdRef.current)) return;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // When host media arrives: (optional) attach to an element if you want to preview
        pc.ontrack = (e) => {
          // add UI element if you later want to show host stream to viewer
          console.log("[viewer] host track arrived", e.streams);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("webrtc-ice", {
              candidate: e.candidate,
              toClientId: fromClientId,
              roomId,
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        peerMapRef.current[fromClientId] = pc;

        socket.emit("webrtc-answer", {
          sdp: answer,
          toClientId: fromClientId,
          roomId,
        });
      } catch (err) {
        console.error("viewer: offer handling failed", err);
      }
    };

    // Host receives viewer answer
    const onWebrtcAnswer = async ({ sdp, fromClientId }) => {
      const pc = peerMapRef.current[fromClientId];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (e) {
        console.error("host: setRemoteDescription(answer) failed", e);
      }
    };

    // Both sides add ICE
    const onWebrtcIce = async ({ candidate, fromClientId }) => {
      const pc = peerMapRef.current[fromClientId];
      if (!pc) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn("addIceCandidate failed", e);
      }
    };

    // Host creates PC + Offer when new viewer appears
    const onNewParticipant = ({ clientId }) => {
      if (!isHost) return;
      if (!clientId || clientId === myClientIdRef.current) return;
      createPeerAndOfferFor(clientId);
    };

    // Handle peer leaving (close host-side PC)
    const onPeerLeft = ({ clientId }) => {
      const pc = peerMapRef.current[clientId];
      if (pc) {
        try { pc.close(); } catch {}
        delete peerMapRef.current[clientId];
      }
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("room-updated", onRoomUpdated);
    socket.on("room-full", onRoomFull);
    socket.on("discussion-started", onDiscussionStarted);
    socket.on("host-media-state", onHostMediaState);
    socket.on("webrtc-offer", onWebrtcOffer);
    socket.on("webrtc-answer", onWebrtcAnswer);
    socket.on("webrtc-ice", onWebrtcIce);
    socket.on("new-participant", onNewParticipant);
    socket.on("peer-left", onPeerLeft);

    // ask for snapshot
    socket.emit("request-room-state", { roomId });

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-full", onRoomFull);
      socket.off("discussion-started", onDiscussionStarted);
      socket.off("host-media-state", onHostMediaState);
      socket.off("webrtc-offer", onWebrtcOffer);
      socket.off("webrtc-answer", onWebrtcAnswer);
      socket.off("webrtc-ice", onWebrtcIce);
      socket.off("new-participant", onNewParticipant);
      socket.off("peer-left", onPeerLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, isHost]);

  // ---- Host media + offers ----
  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = s;
    if (localVideoRef.current) localVideoRef.current.srcObject = s;
    return s;
  };

  const startHostMediaAndOfferAll = async () => {
    if (!isHost) return;
    await ensureLocalStream();

    const viewers = (participants || []).filter(
      (p) => String(p.clientId) !== String(myClientIdRef.current)
    );
    viewers.forEach((p) => {
      if (p.clientId && !peerMapRef.current[p.clientId]) {
        createPeerAndOfferFor(p.clientId);
      }
    });
  };

  const createPeerAndOfferFor = async (targetClientId) => {
    if (!isHost || !targetClientId) return;

    const stream = await ensureLocalStream();
    if (peerMapRef.current[targetClientId]) return;

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice", {
            candidate: e.candidate,
            toClientId: targetClientId,
            roomId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          try { pc.close(); } catch {}
          delete peerMapRef.current[targetClientId];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      peerMapRef.current[targetClientId] = pc;

      socket.emit("webrtc-offer", {
        sdp: offer,
        toClientId: targetClientId,
        roomId,
      });
    } catch (e) {
      console.error("createPeerAndOfferFor failed", e);
    }
  };

  // ---- Host-only toggles (broadcast state so viewers’ UI updates) ----
  const toggleHostAudio = async () => {
    if (!isHost || !localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setHostMediaAllowed((s) => ({ ...s, audio: track.enabled }));
    socket.emit("host-media-toggle", { roomId, audio: track.enabled, video: hostMediaAllowed.video });
  };

  const toggleHostVideo = async () => {
    if (!isHost || !localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setHostMediaAllowed((s) => ({ ...s, video: track.enabled }));
    socket.emit("host-media-toggle", { roomId, audio: hostMediaAllowed.audio, video: track.enabled });
  };

  // ---- Leave / cleanup ----
  const leaveRoom = () => {
    socket.emit("leave-room", { roomId, userId });

    Object.values(peerMapRef.current).forEach((pc) => {
      try { pc.close(); } catch {}
    });
    peerMapRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    navigate("/dashboard");
  };

  // ---- Helpers ----
  const renderExample = (ex) => {
    if (typeof ex === "string" || typeof ex === "number") {
      return <pre className="text-xs whitespace-pre-wrap">{String(ex)}</pre>;
    }
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ex, null, 2)}</pre>;
  };

  // ---- UI ----
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{room?.roomName || "room"}</h1>
          <div className="text-sm text-slate-400">Room ID: {roomId} • {isLive ? "Live" : "Not live"}</div>
        </div>
        <div className="flex items-center gap-3">
          {isHost ? (
            <>
              <button onClick={toggleHostAudio} className={`px-3 py-2 rounded ${hostMediaAllowed.audio ? "bg-emerald-500" : "bg-gray-700"}`}>
                {hostMediaAllowed.audio ? <Mic /> : <MicOff />}
              </button>
              <button onClick={toggleHostVideo} className={`px-3 py-2 rounded ${hostMediaAllowed.video ? "bg-emerald-500" : "bg-gray-700"}`}>
                {hostMediaAllowed.video ? <Video /> : <VideoOff />}
              </button>
            </>
          ) : (
            <div className="text-sm text-slate-400 px-3 py-2 rounded bg-gray-800">Viewer</div>
          )}
          <button onClick={leaveRoom} className="ml-2 px-3 py-2 bg-red-600 rounded">Leave</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: problem panel */}
        <div className="col-span-3 bg-slate-800 rounded p-4 overflow-auto max-h-[76vh]">
          <h3 className="text-lg font-semibold text-cyan-300">{problem?.title || "Problem"}</h3>
          <p className="mt-3 text-slate-300 whitespace-pre-line">{problem?.description || "Problem description will appear here."}</p>

          {problem?.examples && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-teal-300 mb-2">Examples</h4>
              <div className="space-y-3">
                {(Array.isArray(problem.examples) ? problem.examples : [problem.examples]).map((ex, idx) => (
                  <div key={`ex-${idx}`} className="bg-slate-900 p-3 rounded">
                    {renderExample(ex)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: whiteboard */}
        <div className="col-span-6 bg-slate-900 rounded p-4">
          <DiscussionWhiteboard
            roomId={roomId}
            socket={socket}
            isHost={isHost}
            disableDrawing={!isHost}
          />
        </div>

        {/* Right: status + participants */}
        <div className="col-span-3 space-y-4">
          <div className="bg-slate-800 p-4 rounded">
            <h4 className="font-semibold">Host Status</h4>
            <div className="mt-2 text-sm text-slate-300">
              Audio: {hostMediaAllowed.audio ? "ON" : "OFF"} <br />
              Video: {hostMediaAllowed.video ? "ON" : "OFF"}
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded">
            <h4 className="font-semibold">Session Info</h4>
            <div className="mt-2 text-sm text-slate-300">
              Problem: <span className="text-cyan-300">{problem?.title || "-"}</span><br />
              Type: <span className="text-cyan-300">Discussion</span><br />
              Participants: <span className="text-cyan-300">{participants?.length ?? 0}/4</span>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded">
            <h4 className="font-semibold mb-2">Participants</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              {(participants || []).map((p, idx) => (
                <li
                  key={`${p.clientId || p.socketId || p.userId || idx}-${idx}`}  // ✅ always unique
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{p.username ?? (p.userId?.username ?? "User")}</div>
                    <div className="text-xs text-slate-400">
                      {p.role === "host" ? "Host" : "Viewer"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{(p.clientId || p.socketId) ? "online" : "?"}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* hidden host preview */}
      <video ref={localVideoRef} autoPlay muted playsInline style={{ display: "none" }} />
    </div>
  );
}
