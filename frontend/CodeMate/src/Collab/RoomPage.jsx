

import { useEffect, useRef, useState } from "react"; // React hooks for state and effects
import { useParams, useNavigate } from "react-router-dom"; // For URL params and navigation
import socket from "./socket"; // Socket.io connection for real-time communication
import { Mic, MicOff, Video, VideoOff, ScreenShare, LogOut } from "lucide-react"; // Icons for UI
import Editor from "@monaco-editor/react"; // Monaco code editor
import axios from "axios"; // HTTP client
import { BASE_URL } from "../api/config"; // API base URL

const RoomPage = () => {
  // Get room ID from URL params
  const { roomId } = useParams();
  // Navigation hook
  const navigate = useNavigate();

  // Refs for video elements
  const localVideoRef = useRef(null); // Local video element
  const remoteVideoRef = useRef(null); // Remote video element
  // Peer connection for WebRTC
  const peerConnectionRef = useRef(null);
  // Local media stream
  const localStreamRef = useRef(null);

  // Buffer for ICE candidates before remote description is set
  const pendingCandidatesRef = useRef([]);
  // Flag if remote description is set
  const remoteDescSetRef = useRef(false);
  // ID of the peer we're connected to
  const peerIdRef = useRef(null);
  // Flag if local stream is ready
  const streamReadyRef = useRef(false);
  // Flag if battle is active
  const isBattleActiveRef = useRef(false);

  // State for mic on/off
  const [micOn, setMicOn] = useState(true);
  // State for camera on/off
  const [camOn, setCamOn] = useState(true);
  // Code for user 1 (current user)
  const [codeUser1, setCodeUser1] = useState("// Your Code Here");
  // Code for user 2 (opponent)
  const [codeUser2, setCodeUser2] = useState("// Opponent's Code");
  // Programming language
  const [language, setLanguage] = useState("javascript");
  // Problem object
  const [problem, setProblem] = useState(null);
  // Timer in seconds
  const [timer, setTimer] = useState(15 * 60); // 15 minutes

  // User ID from localStorage
  const userId = localStorage.getItem("userId") || "unknown";

  // WebRTC configuration with STUN/TURN servers
  const config = {
    iceServers: [
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
    ],
  };

  // Key for storing timer in localStorage per room
  const TIMER_KEY = `room-timer-${roomId}`;

  // Load timer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_KEY);
    if (saved && !isNaN(Number(saved))) {
      setTimer(Number(saved));
    }
  }, [roomId]);

  // Timer countdown effect
  useEffect(() => {
    if (timer <= 0) return; // Don't tick after 0
    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        localStorage.setItem(TIMER_KEY, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, TIMER_KEY]);

  // Handle timer end
  useEffect(() => {
    if (timer === 0) {
      localStorage.removeItem(TIMER_KEY);
      socket.emit("room-finished", { roomId });
      doExit(); // Navigate away
    }
  }, [timer]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Exit function
  const doExit = () => {
    navigate("/dashboard");
  };

  // Log peer connection state
  const logPC = (pc, tag) => {
    if (!pc) return;
    console.log(`[PC] ${tag}`, {
      signalingState: pc.signalingState,
      iceConnectionState: pc.iceConnectionState,
      connectionState: pc.connectionState,
    });
  };

  // Ensure peer connection exists
  const ensurePeer = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    // Add local tracks if available
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      tracks.forEach((t) => {
        try {
          const existingSender = pc.getSenders().find((s) => s.track && s.track.kind === t.kind);
          if (existingSender) existingSender.replaceTrack(t);
          else pc.addTrack(t, localStreamRef.current);
        } catch (e) {
          console.warn("track add/replace error:", e);
        }
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log("[PC] ontrack fired, streams:", event.streams);
      const stream = (event.streams && event.streams[0]) || null;
      if (stream) {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
        }
      } else {
        const remoteStream = new MediaStream();
        if (event.track) remoteStream.addTrack(event.track);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", {
          candidate: event.candidate,
          roomId,
          from: userId,
          to: peerIdRef.current || null,
        });
      }
    };

    // Log state changes
    pc.onconnectionstatechange = () => logPC(pc, "connectionStateChange");
    pc.oniceconnectionstatechange = () => logPC(pc, "iceConnectionStateChange");

    return pc;
  };

  // Drain buffered ICE candidates
  const drainPendingCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    while (pendingCandidatesRef.current.length) {
      const c = pendingCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(c);
      } catch (e) {
        console.warn("Failed to add buffered ICE candidate:", e);
      }
    }
  };

  // Wait for local stream to be ready
  const waitForLocalStream = async () => {
    if (localStreamRef.current) return;
    await new Promise((resolve) => {
      const maxWaitMs = 4000;
      const started = Date.now();
      const t = setInterval(() => {
        if (localStreamRef.current || Date.now() - started > maxWaitMs) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  };

  // Debounce code edits
  const codeDebounceRef = useRef(null);
  const sendCodeEdit = (code) => {
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => {
      try {
        socket.emit("code-edit", { roomId, from: userId, code });
      } catch (e) {
        console.warn("code-edit emit failed", e);
      }
    }, 200);
  };

  // Handle battle result
  useEffect(() => {
    const handleBattleResult = ({ winner, submissions, message }) => {
      if (winner) {
        if (String(winner) === String(userId)) {
          alert("You win the battle!" + (message ? `\n${message}` : ""));
        } else {
          alert("You lost the battle." + (message ? `\n${message}` : ""));
        }
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    };
    socket.on("battle-result", handleBattleResult);
    return () => socket.off("battle-result", handleBattleResult);
  }, [userId, navigate]);

  // Main effect for socket and media setup
  useEffect(() => {
    // Socket event handlers
    const handleJoinAck = (data) => {
      console.log("join-room ack", data);
    };

    const handleRoomState = async (state) => {
      if (!state) return;

      // Load problem
      if (state?.problem) {
        if (typeof state.problem === "string" || typeof state.problem === "number") {
          await fetchProblemById(state.problem);
        } else if (typeof state.problem === "object") {
          setProblem(state.problem);
          const starter =
            state.problem.starterCode ||
            state.problem.boiler ||
            state.problem.boilerplate ||
            state.problem.template ||
            state.problem.defaultCode ||
            "// Your Code Here";
          setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
          if (socket && roomId) {
            socket.emit("code-init", { roomId, code: starter });
          }
        }
      }

      // Load code map
      if (state?.codeMap) {
        const otherId = Object.keys(state.codeMap).find((id) => String(id) !== String(userId));
        setCodeUser1(state.codeMap[userId] ?? codeUser1);
        setCodeUser2(otherId ? state.codeMap[otherId] : codeUser2);
      }

      // Set battle active
      if (state?.battleActive) {
        isBattleActiveRef.current = true;
      }
    };

    const handleCodeEdit = ({ from, code }) => {
      if (String(from) === String(userId)) return;
      setCodeUser2(code);
    };

    const handleBattleStarted = async ({ starterId, opponentId, problem: p }) => {
      console.log("battle-started event:", { starterId, opponentId, problem: !!p });
      if (p) {
        setProblem(p);
        const starter = p.starterCode || p.boiler || p.boilerplate || p.template || "";
        setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
      }

      const me = userId;
      const amStarter = String(starterId) === String(me);
      peerIdRef.current = amStarter ? opponentId : starterId;
      isBattleActiveRef.current = true;

      await waitForLocalStream();
      const pc = ensurePeer();

      if (amStarter) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        logPC(pc, "after setLocalDescription(offer)");
        socket.emit("webrtc-offer", {
          sdp: offer,
          roomId,
          from: me,
          to: peerIdRef.current,
        });
      } else {
        logPC(pc, "participant waiting for offer");
      }
    };

    const handleOffer = async ({ sdp, from }) => {
      console.log("webrtc-offer received from:", from);
      peerIdRef.current = from;
      await waitForLocalStream();
      const pc = ensurePeer();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        remoteDescSetRef.current = true;
        await drainPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          sdp: answer,
          roomId,
          from: userId,
          to: from,
        });
      } catch (e) {
        console.error("Error handling offer:", e);
      }
    };

    const handleAnswer = async ({ sdp, from }) => {
      console.log("webrtc-answer received", { from });
      peerIdRef.current = from || peerIdRef.current;
      const pc = ensurePeer();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        remoteDescSetRef.current = true;
        await drainPendingCandidates();
      } catch (e) {
        console.error("Error handling answer:", e);
      }
    };

    const handleIce = async ({ candidate, from }) => {
      if (String(from) === String(userId)) return;
      const pc = peerConnectionRef.current;
      if (!pc) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (e) {
        console.warn("addIceCandidate failed (late remote desc?):", e);
        pendingCandidatesRef.current.push(candidate);
      }
    };

    // Attach socket listeners
    socket.emit("join-room", { roomId, userId });
    socket.on("join-ack", handleJoinAck);
    socket.on("room-state", handleRoomState);
    socket.on("code-edit", handleCodeEdit);
    socket.on("battle-started", handleBattleStarted);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice", handleIce);

    // Reconnect handler
    const onSocketConnect = () => {
      console.log("socket reconnected, re-joining room");
      try {
        socket.emit("join-room", { roomId, userId });
        socket.emit("request-room-state", { roomId });
      } catch (e) {
        console.warn("rejoin failed", e);
      }
    };
    socket.on("connect", onSocketConnect);

    // Fetch room data
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const room = res.data?.room ?? res.data;
        if (room?.problem) {
          if (typeof room.problem === "object" && room.problem.title) {
            setProblem(room.problem);
            const starter =
              room.problem.starterCode ||
              room.problem.boiler ||
              room.problem.boilerplate ||
              room.problem.template ||
              "";
            setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
          } else {
            await fetchProblemById(room.problem);
          }
        }
      } catch (err) {
        console.error("Problem fetch failed", err?.message);
      }
    })();

    // Request room state
    try {
      socket.emit("request-room-state", { roomId });
    } catch (e) {
      /* ignore */
    }

    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        localStreamRef.current = stream;
        streamReadyRef.current = true;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }
        if (peerConnectionRef.current) {
          const pc = peerConnectionRef.current;
          stream.getTracks().forEach((t) => {
            const existing = pc.getSenders().find((s) => s.track && s.track.kind === t.kind);
            try {
              if (existing) existing.replaceTrack(t);
              else pc.addTrack(t, stream);
            } catch (e) {
              console.warn("add/replace track error:", e);
            }
          });
        }
      })
      .catch((e) => {
        console.error("getUserMedia failed:", e);
        setCamOn(false);
        setMicOn(false);
      });

    // Prevent accidental refresh
    const beforeUnload = (e) => {
      if (isBattleActiveRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
      return undefined;
    };
    window.addEventListener("beforeunload", beforeUnload);

    // Cleanup
    return () => {
      try {
        socket.emit("leave-room", { roomId, userId });
      } catch (err) {}
      socket.off("join-ack", handleJoinAck);
      socket.off("room-state", handleRoomState);
      socket.off("code-edit", handleCodeEdit);
      socket.off("battle-started", handleBattleStarted);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice", handleIce);
      socket.off("connect", onSocketConnect);

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        localStreamRef.current = null;
      }
      pendingCandidatesRef.current = [];
      remoteDescSetRef.current = false;
      isBattleActiveRef.current = false;
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [roomId]);

  // Fetch problem by ID
  const fetchProblemById = async (prob) => {
    let pid = prob;
    if (prob && typeof prob === "object" && prob._id) pid = prob._id;
    if (!pid) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/problems/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const p = res.data?.problem ?? res.data;
      if (p) {
        setProblem(p);
        const starter =
          p.starterCode || p.boiler || p.boilerplate || p.template || p.defaultCode || "";
        setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
      }
    } catch (e) {
      console.error("fetchProblemById failed", e);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    const ls = localStreamRef.current;
    if (!ls) return;
    const audioTracks = ls.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((s) => {
          s.getAudioTracks().forEach((t) => {
            try {
              localStreamRef.current.addTrack(t);
            } catch (e) {}
          });
          setMicOn(true);
        })
        .catch((err) => {
          console.warn("getUserMedia(audio) failed", err);
        });
      return;
    }
    audioTracks.forEach((t) => (t.enabled = !t.enabled));
    setMicOn(audioTracks[0].enabled);
    const newAudioTrack = localStreamRef.current.getAudioTracks()[0];
    if (peerConnectionRef.current && newAudioTrack) {
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "audio");
      try {
        if (sender) sender.replaceTrack(newAudioTrack);
        else peerConnectionRef.current.addTrack(newAudioTrack, localStreamRef.current);
      } catch (e) {
        console.warn("Failed to attach audio track to peerConnection:", e);
      }
    }
  };

  // Toggle camera
  const toggleCam = async () => {
    const ls = localStreamRef.current;
    const videoTrack = ls?.getVideoTracks()?.[0];

    if (videoTrack) {
      try {
        if (typeof ls.removeTrack === "function") {
          ls.removeTrack(videoTrack);
        }
        videoTrack.stop();
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            sender.replaceTrack(null);
          } catch (err) {
            console.warn("replaceTrack(null) failed", err);
          }
        }
      } catch (e) {
        console.warn("Error stopping video track:", e);
      }
      setCamOn(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = ls;
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      try {
        localStreamRef.current.addTrack(newVideoTrack);
      } catch (e) {
        console.warn("addTrack error:", e);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) {
        try {
          await sender.replaceTrack(newVideoTrack);
        } catch (e) {
          console.warn("replaceTrack(newVideoTrack) failed", e);
        }
      } else if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
        } catch (e) {}
      }
      setCamOn(true);
    } catch (err) {
      console.error("Re-acquiring camera failed", err);
    }
  };

  // Handle screen share
  const handleScreenShare = async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStream);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

      screenTrack.onended = async () => {
        const original = localStreamRef.current?.getVideoTracks()?.[0];
        if (sender && original) {
          try {
            await sender.replaceTrack(original);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          } catch (e) {
            console.warn("Failed to restore camera track:", e);
          }
        }
      };
    } catch (err) {
      console.error("Screen share failed", err);
    }
  };

  // Render the UI
  return (
    <div className="room-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <div>Room: {roomId}</div>
        <div>Time: {formatTime(timer)}</div>
        <button onClick={doExit}><LogOut /></button>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1, padding: '10px' }}>
          {problem && (
            <div>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </div>
          )}
          <Editor
            height="400px"
            language={language}
            value={codeUser1}
            onChange={(value) => {
              setCodeUser1(value);
              sendCodeEdit(value);
            }}
          />
        </div>
        <div style={{ flex: 1, padding: '10px' }}>
          <Editor
            height="400px"
            language={language}
            value={codeUser2}
            options={{ readOnly: true }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
        <button onClick={toggleMic}>{micOn ? <Mic /> : <MicOff />}</button>
        <button onClick={toggleCam}>{camOn ? <Video /> : <VideoOff />}</button>
        <button onClick={handleScreenShare}><ScreenShare /></button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
        <video ref={localVideoRef} autoPlay muted style={{ width: '45%', height: '200px' }} />
        <video ref={remoteVideoRef} autoPlay style={{ width: '45%', height: '200px' }} />
      </div>
    </div>
  );
};

export default RoomPage;

// import { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import socket from "./socket";
// import { Mic, MicOff, Video, VideoOff, ScreenShare, Clock, Play, LogOut } from "lucide-react";
// import Editor from "@monaco-editor/react";
// import axios from "axios";
// import { BASE_URL } from "../api/config";

// const RoomPage = () => {
//   const { roomId } = useParams();
//   const navigate = useNavigate();

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const localStreamRef = useRef(null);

//   const pendingCandidatesRef = useRef([]);
//   const remoteDescSetRef = useRef(false);
//   const peerIdRef = useRef(null);
//   const streamReadyRef = useRef(false);
//   const isBattleActiveRef = useRef(false);

//   const [micOn, setMicOn] = useState(true);
//   const [camOn, setCamOn] = useState(true);
//   const [codeUser1, setCodeUser1] = useState("// Your Code Here");
//   const [codeUser2, setCodeUser2] = useState("// Opponent's Code");
//   const [language, setLanguage] = useState("javascript");
//   const [problem, setProblem] = useState(null);
//   const [timer, setTimer] = useState(15 * 60); // 15 minutes

//   const userId = localStorage.getItem("userId") || "unknown";

//   const config = {
//     iceServers: [
//       { urls: "stun:stun.l.google.com:19302" },
//       {
//         urls: [
//           "turn:openrelay.metered.ca:80",
//           "turn:openrelay.metered.ca:443",
//           "turn:openrelay.metered.ca:443?transport=tcp",
//         ],
//         username: "openrelayproject",
//         credential: "openrelayproject",
//       },
//     ],
//   };

//   const TIMER_KEY = `room-timer-${roomId}`;

//   useEffect(() => {
//     const saved = localStorage.getItem(TIMER_KEY);
//     if (saved && !isNaN(Number(saved))) {
//       setTimer(Number(saved));
//     }
//   }, [roomId]);

//   useEffect(() => {
//     if (timer <= 0) return;
//     const interval = setInterval(() => {
//       setTimer((prev) => {
//         const next = prev <= 1 ? 0 : prev - 1;
//         localStorage.setItem(TIMER_KEY, next);
//         return next;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [timer, TIMER_KEY]);

//   useEffect(() => {
//     if (timer === 0) {
//       localStorage.removeItem(TIMER_KEY);
//       socket.emit("room-finished", { roomId });
//       doExit();
//     }
//   }, [timer]);

//   const formatTime = (seconds) => {
//     const m = String(Math.floor(seconds / 60)).padStart(2, "0");
//     const s = String(seconds % 60).padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   const doExit = () => {
//     navigate("/dashboard");
//   };

//   const logPC = (pc, tag) => {
//     if (!pc) return;
//     console.log(`[PC] ${tag}`, {
//       signalingState: pc.signalingState,
//       iceConnectionState: pc.iceConnectionState,
//       connectionState: pc.connectionState,
//     });
//   };

//   const ensurePeer = () => {
//     if (peerConnectionRef.current) return peerConnectionRef.current;

//     const pc = new RTCPeerConnection(config);
//     peerConnectionRef.current = pc;

//     if (localStreamRef.current) {
//       const tracks = localStreamRef.current.getTracks();
//       tracks.forEach((t) => {
//         try {
//           const existingSender = pc.getSenders().find((s) => s.track && s.track.kind === t.kind);
//           if (existingSender) existingSender.replaceTrack(t);
//           else pc.addTrack(t, localStreamRef.current);
//         } catch (e) {
//           console.warn("track add/replace error:", e);
//         }
//       });
//     }

//     pc.ontrack = (event) => {
//       console.log("[PC] ontrack fired, streams:", event.streams);
//       const stream = (event.streams && event.streams[0]) || null;
//       if (stream) {
//         if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
//           remoteVideoRef.current.srcObject = stream;
//         }
//       } else {
//         const remoteStream = new MediaStream();
//         if (event.track) remoteStream.addTrack(event.track);
//         if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
//       }
//     };

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("webrtc-ice", {
//           candidate: event.candidate,
//           roomId,
//           from: userId,
//           to: peerIdRef.current || null,
//         });
//       }
//     };

//     pc.onconnectionstatechange = () => logPC(pc, "connectionStateChange");
//     pc.oniceconnectionstatechange = () => logPC(pc, "iceConnectionStateChange");

//     return pc;
//   };

//   const drainPendingCandidates = async () => {
//     const pc = peerConnectionRef.current;
//     if (!pc || !remoteDescSetRef.current) return;
//     while (pendingCandidatesRef.current.length) {
//       const c = pendingCandidatesRef.current.shift();
//       try {
//         await pc.addIceCandidate(c);
//       } catch (e) {
//         console.warn("Failed to add buffered ICE candidate:", e);
//       }
//     }
//   };

//   const waitForLocalStream = async () => {
//     if (localStreamRef.current) return;
//     await new Promise((resolve) => {
//       const maxWaitMs = 4000;
//       const started = Date.now();
//       const t = setInterval(() => {
//         if (localStreamRef.current || Date.now() - started > maxWaitMs) {
//           clearInterval(t);
//           resolve();
//         }
//       }, 50);
//     });
//   };

//   const codeDebounceRef = useRef(null);
//   const sendCodeEdit = (code) => {
//     if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
//     codeDebounceRef.current = setTimeout(() => {
//       try {
//         socket.emit("code-edit", { roomId, from: userId, code });
//       } catch (e) {
//         console.warn("code-edit emit failed", e);
//       }
//     }, 200);
//   };

//   useEffect(() => {
//     const handleBattleResult = ({ winner, submissions, message }) => {
//       if (winner) {
//         if (String(winner) === String(userId)) {
//           alert("You win the battle!" + (message ? `\n${message}` : ""));
//         } else {
//           alert("You lost the battle." + (message ? `\n${message}` : ""));
//         }
//         setTimeout(() => navigate("/dashboard"), 2000);
//       }
//     };
//     socket.on("battle-result", handleBattleResult);
//     return () => socket.off("battle-result", handleBattleResult);
//   }, [userId, navigate]);

//   useEffect(() => {
//     const handleJoinAck = (data) => {
//       console.log("join-room ack", data);
//     };

//     const handleRoomState = async (state) => {
//       if (!state) return;
//       if (state?.problem) {
//         if (typeof state.problem === "string" || typeof state.problem === "number") {
//           await fetchProblemById(state.problem);
//         } else if (typeof state.problem === "object") {
//           setProblem(state.problem);
//           const starter =
//             state.problem.starterCode ||
//             state.problem.boiler ||
//             state.problem.boilerplate ||
//             state.problem.template ||
//             "// Your Code Here";
//           setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//           if (socket && roomId) {
//             socket.emit("code-init", { roomId, code: starter });
//           }
//         }
//       }
//       if (state?.codeMap) {
//         const otherId = Object.keys(state.codeMap).find((id) => String(id) !== String(userId));
//         setCodeUser1(state.codeMap[userId] ?? codeUser1);
//         setCodeUser2(otherId ? state.codeMap[otherId] : codeUser2);
//       }
//       if (state?.battleActive) {
//         isBattleActiveRef.current = true;
//       }
//     };

//     const handleCodeEdit = ({ from, code }) => {
//       if (String(from) === String(userId)) return;
//       setCodeUser2(code);
//     };

//     const handleBattleStarted = async ({ starterId, opponentId, problem: p }) => {
//       console.log("battle-started event:", { starterId, opponentId, problem: !!p });
//       if (p) {
//         setProblem(p);
//         const starter = p.starterCode || p.boiler || p.boilerplate || p.template || "";
//         setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//       }

//       const me = userId;
//       const amStarter = String(starterId) === String(me);
//       peerIdRef.current = amStarter ? opponentId : starterId;
//       isBattleActiveRef.current = true;

//       await waitForLocalStream();
//       const pc = ensurePeer();

//       if (amStarter) {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         logPC(pc, "after setLocalDescription(offer)");
//         socket.emit("webrtc-offer", {
//           sdp: offer,
//           roomId,
//           from: me,
//           to: peerIdRef.current,
//         });
//       } else {
//         logPC(pc, "participant waiting for offer");
//       }
//     };

//     const handleOffer = async ({ sdp, from }) => {
//       console.log("webrtc-offer received from:", from);
//       peerIdRef.current = from;
//       await waitForLocalStream();
//       const pc = ensurePeer();
//       try {
//         await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//         remoteDescSetRef.current = true;
//         await drainPendingCandidates();
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit("webrtc-answer", {
//           sdp: answer,
//           roomId,
//           from: userId,
//           to: from,
//         });
//       } catch (e) {
//         console.error("Error handling offer:", e);
//       }
//     };

//     const handleAnswer = async ({ sdp, from }) => {
//       console.log("webrtc-answer received", { from });
//       peerIdRef.current = from || peerIdRef.current;
//       const pc = ensurePeer();
//       try {
//         await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//         remoteDescSetRef.current = true;
//         await drainPendingCandidates();
//       } catch (e) {
//         console.error("Error handling answer:", e);
//       }
//     };

//     const handleIce = async ({ candidate, from }) => {
//       if (String(from) === String(userId)) return;
//       const pc = peerConnectionRef.current;
//       if (!pc) {
//         pendingCandidatesRef.current.push(candidate);
//         return;
//       }
//       try {
//         if (pc.remoteDescription) {
//           await pc.addIceCandidate(candidate);
//         } else {
//           pendingCandidatesRef.current.push(candidate);
//         }
//       } catch (e) {
//         console.warn("addIceCandidate failed:", e);
//         pendingCandidatesRef.current.push(candidate);
//       }
//     };

//     socket.emit("join-room", { roomId, userId });
//     socket.on("join-ack", handleJoinAck);
//     socket.on("room-state", handleRoomState);
//     socket.on("code-edit", handleCodeEdit);
//     socket.on("battle-started", handleBattleStarted);
//     socket.on("webrtc-offer", handleOffer);
//     socket.on("webrtc-answer", handleAnswer);
//     socket.on("webrtc-ice", handleIce);

//     const onSocketConnect = () => {
//       console.log("socket reconnected, re-joining room");
//       try {
//         socket.emit("join-room", { roomId, userId });
//         socket.emit("request-room-state", { roomId });
//       } catch (e) {
//         console.warn("rejoin failed", e);
//       }
//     };
//     socket.on("connect", onSocketConnect);

//     (async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const room = res.data?.room ?? res.data;
//         if (room?.problem) {
//           if (typeof room.problem === "string" || typeof room.problem === "number" || room.problem._id) {
//             await fetchProblemById(room.problem);
//           } else {
//             setProblem(room.problem);
//             const starter =
//               room.problem.starterCode ||
//               room.problem.boiler ||
//               room.problem.boilerplate ||
//               room.problem.template ||
//               "";
//             setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//           }
//         }
//       } catch (err) {
//         console.error("Problem fetch failed", err?.message);
//       }
//     })();

//     try {
//       socket.emit("request-room-state", { roomId });
//     } catch (e) {}

//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } })
//       .then((stream) => {
//         localStreamRef.current = stream;
//         streamReadyRef.current = true;
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//           localVideoRef.current.muted = true;
//         }
//         if (peerConnectionRef.current) {
//           const pc = peerConnectionRef.current;
//           stream.getTracks().forEach((t) => {
//             const existing = pc.getSenders().find((s) => s.track && s.track.kind === t.kind);
//             try {
//               if (existing) existing.replaceTrack(t);
//               else pc.addTrack(t, stream);
//             } catch (e) {
//               console.warn("add/replace track error:", e);
//             }
//           });
//         }
//       })
//       .catch((e) => {
//         console.error("getUserMedia failed:", e);
//         setCamOn(false);
//         setMicOn(false);
//       });

//     const beforeUnload = (e) => {
//       if (isBattleActiveRef.current) {
//         e.preventDefault();
//         e.returnValue = "";
//         return "";
//       }
//       return undefined;
//     };
//     window.addEventListener("beforeunload", beforeUnload);

//     return () => {
//       try {
//         socket.emit("leave-room", { roomId, userId });
//       } catch (err) {}
//       socket.off("join-ack", handleJoinAck);
//       socket.off("room-state", handleRoomState);
//       socket.off("code-edit", handleCodeEdit);
//       socket.off("battle-started", handleBattleStarted);
//       socket.off("webrtc-offer", handleOffer);
//       socket.off("webrtc-answer", handleAnswer);
//       socket.off("webrtc-ice", handleIce);
//       socket.off("connect", onSocketConnect);

//       if (peerConnectionRef.current) {
//         try {
//           peerConnectionRef.current.close();
//         } catch (e) {}
//         peerConnectionRef.current = null;
//       }
//       if (localStreamRef.current) {
//         try {
//           localStreamRef.current.getTracks().forEach((t) => t.stop());
//         } catch (e) {}
//         localStreamRef.current = null;
//       }
//       pendingCandidatesRef.current = [];
//       remoteDescSetRef.current = false;
//       isBattleActiveRef.current = false;
//       window.removeEventListener("beforeunload", beforeUnload);
//     };
//   }, [roomId]);

//   const fetchProblemById = async (prob) => {
//     let pid = prob;
//     if (prob && typeof prob === "object" && prob._id) pid = prob._id;
//     if (!pid) return;
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`${BASE_URL}/problems/${pid}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const p = res.data?.problem ?? res.data;
//       if (p) {
//         setProblem(p);
//         const starter =
//           (p.boilerplateCode && p.boilerplateCode.javascript) ||
//           p.starterCode ||
//           p.boiler ||
//           p.boilerplate ||
//           p.template ||
//           p.defaultCode ||
//           "// Your Code Here";
//         setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//       }
//     } catch (e) {
//       console.error("fetchProblemById failed", e);
//     }
//   };

//   const toggleMic = () => {
//     const ls = localStreamRef.current;
//     if (!ls) return;
//     const audioTracks = ls.getAudioTracks();
//     if (!audioTracks || audioTracks.length === 0) {
//       navigator.mediaDevices
//         .getUserMedia({ audio: true, video: false })
//         .then((s) => {
//           s.getAudioTracks().forEach((t) => {
//             try {
//               localStreamRef.current.addTrack(t);
//             } catch (e) {}
//           });
//           setMicOn(true);
//           const newAudioTrack = localStreamRef.current.getAudioTracks()[0];
//           if (peerConnectionRef.current && newAudioTrack) {
//             const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "audio");
//             try {
//               if (sender) sender.replaceTrack(newAudioTrack);
//               else peerConnectionRef.current.addTrack(newAudioTrack, localStreamRef.current);
//             } catch (e) {
//               console.warn("Failed to attach audio track to peerConnection:", e);
//             }
//           }
//         })
//         .catch((err) => {
//           console.warn("getUserMedia(audio) failed", err);
//         });
//       return;
//     }
//     audioTracks.forEach((t) => (t.enabled = !t.enabled));
//     setMicOn(audioTracks[0].enabled);
//   };

//   const toggleCam = async () => {
//     const ls = localStreamRef.current;
//     const videoTrack = ls?.getVideoTracks()?.[0];

//     if (videoTrack) {
//       try {
//         if (typeof ls.removeTrack === "function") {
//           ls.removeTrack(videoTrack);
//         }
//         videoTrack.stop();
//       } catch (e) {
//         console.warn("Error stopping video track:", e);
//       }

//       try {
//         const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
//         if (sender) {
//           sender.replaceTrack(null);
//         }
//       } catch (e) {}

//       setCamOn(false);
//       if (localVideoRef.current) localVideoRef.current.srcObject = ls;
//       return;
//     }

//     try {
//       const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
//       const newVideoTrack = newStream.getVideoTracks()[0];
//       if (!localStreamRef.current) localStreamRef.current = new MediaStream();
//       try {
//         localStreamRef.current.addTrack(newVideoTrack);
//       } catch (e) {
//         console.warn("addTrack error:", e);
//       }
//       if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

//       const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
//       if (sender) {
//         try {
//           await sender.replaceTrack(newVideoTrack);
//         } catch (e) {
//           console.warn("replaceTrack(newVideoTrack) failed", e);
//         }
//       } else if (peerConnectionRef.current) {
//         try {
//           peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
//         } catch (e) {}
//       }
//       setCamOn(true);
//     } catch (err) {
//       console.error("Re-acquiring camera failed", err);
//     }
//   };

//   const handleScreenShare = async () => {
//     try {
//       const pc = peerConnectionRef.current;
//       if (!pc) return;
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//       const screenTrack = screenStream.getVideoTracks()[0];
//       const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
//       if (sender) {
//         await sender.replaceTrack(screenTrack);
//       } else {
//         pc.addTrack(screenTrack, screenStream);
//       }
//       if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

//       screenTrack.onended = async () => {
//         const original = localStreamRef.current?.getVideoTracks()?.[0];
//         if (sender && original) {
//           try {
//             await sender.replaceTrack(original);
//             if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
//           } catch (e) {}
//         }
//       };
//     } catch (e) {
//       console.error("Screen share failed", e);
//     }
//   };

//   return (
//     <div className="room-page">
//       <div className="video-section">
//         <video ref={localVideoRef} autoPlay muted />
//         <video ref={remoteVideoRef} autoPlay />
//       </div>
//       <div className="timer">{formatTime(timer)}</div>
//       <div className="problem">
//         {problem ? (
//           <>
//             <h3>{problem.title}</h3>
//             <p>{problem.description}</p>
//           </>
//         ) : (
//           "Loading problem..."
//         )}
//       </div>
//       <div className="editors">
//         <Editor
//           height="400px"
//           language={language}
//           value={codeUser1}
//           onChange={(value) => {
//             setCodeUser1(value);
//             sendCodeEdit(value);
//           }}
//         />
//         <Editor
//           height="400px"
//           language={language}
//           value={codeUser2}
//           options={{ readOnly: true }}
//         />
//       </div>
//       <div className="controls">
//         <button onClick={toggleMic}>{micOn ? <Mic /> : <MicOff />}</button>
//         <button onClick={toggleCam}>{camOn ? <Video /> : <VideoOff />}</button>
//         <button onClick={handleScreenShare}><ScreenShare /></button>
//         <button onClick={doExit}><LogOut /></button>
//       </div>
//     </div>
//   );
// };

// export default RoomPage;

//   useEffect(() => {
//     // Handlers
//     const handleJoinAck = (data) => {
//       console.log("join-room ack", data);
//     };

//   const handleRoomState = async (state) => {
//   if (!state) return;

//   // --- Problem loading ---
//   if (state?.problem) {
//     if (typeof state.problem === "string" || typeof state.problem === "number") {
//       await fetchProblemById(state.problem); // fetch + code-init inside
//     } else if (typeof state.problem === "object") {
//       setProblem(state.problem);

//       // Ensure your own editor gets starter code if not set
//       const starter =
//         state.problem.starterCode ||
//         state.problem.boiler ||
//         state.problem.boilerplate ||
//         state.problem.template ||
//         state.problem.defaultCode ||
//         "// Your Code Here";

//       setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));

//       // Emit starter so opponent also gets it
//       if (socket && roomId) {
//         socket.emit("code-init", { roomId, code: starter });
//       }
//     }
//   }
  
//   // --- Existing code map handling ---
//   if (state?.codeMap) {
//     const otherId = Object.keys(state.codeMap).find((id) => String(id) !== String(userId));
//     setCodeUser1(state.codeMap[userId] ?? codeUser1);
//     setCodeUser2(otherId ? state.codeMap[otherId] : codeUser2);
//   }

//   // --- Battle active flag ---
//   if (state?.battleActive) {
//     isBattleActiveRef.current = true;
//   }
// };
//     const handleCodeEdit = ({ from, code }) => {
//       // update opponent's editor (we keep opponent read-only)
//       if (String(from) === String(userId)) return;
//       setCodeUser2(code);
//     };

//     const handleBattleStarted = async ({ starterId, opponentId }) => {

//   // ---------- Main effect: socket + media + problem load ----------
//   useEffect(() => {
//     // Handlers
//     const handleJoinAck = (data) => {
//       console.log("join-room ack", data);
//     };

//     const handleRoomState = async (state) => {
//       // server may provide full problem object or just an id
//       if (!state) return;
//       if (state?.problem) {
//         if (typeof state.problem === "string" || typeof state.problem === "number") {
//           await fetchProblemById(state.problem);
//         } else if (typeof state.problem === "object") {
//           setProblem(state.problem);
//           const starter =
//             state.problem.starterCode ||
//             state.problem.boiler ||
//             state.problem.boilerplate ||
//             state.problem.template ||
//             "";
//           setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//         }
//       }
//       if (state?.codeMap) {
//         const otherId = Object.keys(state.codeMap).find((id) => String(id) !== String(userId));
//         setCodeUser1(state.codeMap[userId] ?? (state.problem?.starterCode || state.problem?.boiler || codeUser1));
//         setCodeUser2(otherId ? state.codeMap[otherId] : state.problem?.starterCode ?? codeUser2);
//       }
//       if (state?.battleActive) {
//         isBattleActiveRef.current = true;
//       }
//     };

//     const handleCodeEdit = ({ from, code }) => {
//       if (String(from) === String(userId)) return;
//       setCodeUser2(code);
//     };

//     // IMPORTANT: listen for problem in battle-started and set editor
//     const handleBattleStarted = async ({ starterId, opponentId, problem: p }) => {
//       console.log("battle-started event:", { starterId, opponentId, problem: !!p });
//       // set problem if provided
//       if (p) {
//         setProblem(p);
//         const starter = p.starterCode || p.boiler || p.boilerplate || p.template || "";
//         setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//       }

//       const me = userId;
//       const amStarter = String(starterId) === String(me);
//       peerIdRef.current = amStarter ? opponentId : starterId;
//       isBattleActiveRef.current = true;


//       await waitForLocalStream();
//       const pc = ensurePeer();

//       if (amStarter) {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         logPC(pc, "after setLocalDescription(offer)");
//         socket.emit("webrtc-offer", {
//           sdp: offer,
//           roomId,
//           from: me,
//           to: peerIdRef.current,
//         });
//       } else {
//         logPC(pc, "participant waiting for offer");
//       }
//     };

//     const handleOffer = async ({ sdp, from }) => {
//       peerIdRef.current = from;
//       await waitForLocalStream();
//       const pc = ensurePeer();
//       await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//       remoteDescSetRef.current = true;
//       await drainPendingCandidates();
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       socket.emit("webrtc-answer", {
//         sdp: answer,
//         roomId,
//         from: userId,
//         to: from,
//       });
//     };

//     const handleAnswer = async ({ sdp, from }) => {
//       peerIdRef.current = from || peerIdRef.current;
//       const pc = ensurePeer();
//       await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//       remoteDescSetRef.current = true;
//       await drainPendingCandidates();
//     };

//     const handleIce = async ({ candidate, from }) => {
//       if (String(from) === String(userId)) return;
//       const pc = peerConnectionRef.current;
//       if (!pc) {
//         pendingCandidatesRef.current.push(candidate);
//         return;
//       }
//       if (pc.remoteDescription) {
//         try {
//           await pc.addIceCandidate(candidate);
//         } catch (e) {
//           console.warn("addIceCandidate failed (late remote desc?):", e);
//           pendingCandidatesRef.current.push(candidate);
//         }
//       } else {
//         pendingCandidatesRef.current.push(candidate);
//       }
//     };

//     // Attach socket listeners
//     socket.emit("join-room", { roomId, userId });
//     socket.on("join-ack", handleJoinAck);
//     socket.on("room-state", handleRoomState);
//     socket.on("code-edit", handleCodeEdit);
//     socket.on("battle-started", handleBattleStarted);
//     socket.on("webrtc-offer", handleOffer);
//     socket.on("webrtc-answer", handleAnswer);
//     socket.on("webrtc-ice", handleIce);

//     // reconnect handler: re-join on socket reconnect
//     const onSocketConnect = () => {
//       console.log("socket reconnected, re-joining room");
//       try {
//         socket.emit("join-room", { roomId, userId });
//         // ask for state snapshot
//         socket.emit("request-room-state", { roomId });
//       } catch (e) {
//         console.warn("rejoin failed", e);
//       }
//     };
//     socket.on("connect", onSocketConnect);

//     // REST: fetch room to get problem id/object (fallback)
//     (async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const room = res.data?.room ?? res.data;
//         if (room?.problem) {
//           // if problem is id, fetch problem detail
//           if (typeof room.problem === "string" || typeof room.problem === "number" || room.problem._id) {
//             await fetchProblemById(room.problem);
//           } else {
//             setProblem(room.problem);
//             const starter =
//               room.problem.starterCode ||
//               room.problem.boiler ||
//               room.problem.boilerplate ||
//               room.problem.template ||
//               "";
//             setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//           }
//         }
//       } catch (err) {
//         console.error("Problem fetch failed", err?.message);
//       }


//       await waitForLocalStream();
//       const pc = ensurePeer();

//       if (amStarter) {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         logPC(pc, "after setLocalDescription(offer)");
//         socket.emit("webrtc-offer", {
//           sdp: offer,
//           roomId,
//           from: me,
//           to: peerIdRef.current,
//         });
//       } else {
//         logPC(pc, "participant waiting for offer");
//       }
//     };

//     const handleOffer = async ({ sdp, from }) => {
//       console.log("webrtc-offer received from:", from);
//       peerIdRef.current = from;
//       await waitForLocalStream();
//       const pc = ensurePeer();
//       try {
//         await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//         remoteDescSetRef.current = true;
//         await drainPendingCandidates();
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit("webrtc-answer", {
//           sdp: answer,
//           roomId,
//           from: userId,
//           to: from,
//         });
//       } catch (e) {
//         console.error("Error handling offer:", e);
//       }
//     };

//     const handleAnswer = async ({ sdp, from }) => {
//       console.log("webrtc-answer received", { from });
//       peerIdRef.current = from || peerIdRef.current;
//       const pc = ensurePeer();
//       try {
//         await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//         remoteDescSetRef.current = true;
//         await drainPendingCandidates();
//       } catch (e) {
//         console.error("Error handling answer:", e);
//       }
//     };

//     const handleIce = async ({ candidate, from }) => {
//       // ignore own candidate if server broadcasts
//       if (String(from) === String(userId)) return;
//       const pc = peerConnectionRef.current;
//       if (!pc) {
//         pendingCandidatesRef.current.push(candidate);
//         return;
//       }
//       try {
//         if (pc.remoteDescription) {
//           await pc.addIceCandidate(candidate);
//         } else {
//           pendingCandidatesRef.current.push(candidate);
//         }
//       } catch (e) {
//         console.warn("addIceCandidate failed (late remote desc?):", e);
//         pendingCandidatesRef.current.push(candidate);
//       }
//     };

//     // Attach socket listeners
//     socket.emit("join-room", { roomId, userId });
//     socket.on("join-ack", handleJoinAck);
//     socket.on("room-state", handleRoomState);
//     socket.on("code-edit", handleCodeEdit);
//     socket.on("battle-started", handleBattleStarted);
//     socket.on("webrtc-offer", handleOffer);
//     socket.on("webrtc-answer", handleAnswer);
//     socket.on("webrtc-ice", handleIce);

//     // reconnect handler: re-join on socket reconnect
//     const onSocketConnect = () => {
//       console.log("socket reconnected, re-joining room");
//       try {
//         socket.emit("join-room", { roomId, userId });
//         socket.emit("request-room-state", { roomId });
//       } catch (e) {
//         console.warn("rejoin failed", e);
//       }
//     };
//     socket.on("connect", onSocketConnect);

//     // REST: fetch room to get problem id/object (fallback)
//     (async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const room = res.data?.room ?? res.data;
//             if (room?.problem) {
//           // If the server returned a populated object, use it directly.
//           if (typeof room.problem === "object" && room.problem.title) {
//             setProblem(room.problem);
//             const starter =
//               room.problem.starterCode ||
//               room.problem.boiler ||
//               room.problem.boilerplate ||
//               room.problem.template ||
//               "";
//             setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//           } else {
//             // room.problem is probably an id string
//             await fetchProblemById(room.problem);
//           }
//         }

//       } catch (err) {
//         console.error("Problem fetch failed", err?.message);
//       }

//     })();

//     // Request code-state from server right after join (server should reply with room-state/codeMap)
//     try {
//       socket.emit("request-room-state", { roomId });
//     } catch (e) {
//       /* ignore */
//     }

//     // Get media with echoCancellation enabled (helps reduce audio doubling)
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: { echoCancellation: true, noiseSuppression: true } })
//       .then((stream) => {

//         // keep a single local stream ref


//         localStreamRef.current = stream;
//         streamReadyRef.current = true;
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//           localVideoRef.current.muted = true; // mute local playback to avoid feedback loops
//         }
//         // If peer connection already exists, ensure senders are updated
//         if (peerConnectionRef.current) {
//           const pc = peerConnectionRef.current;
//           stream.getTracks().forEach((t) => {
//             const existing = pc.getSenders().find((s) => s.track && s.track.kind === t.kind);
//             try {
//               if (existing) existing.replaceTrack(t);
//               else pc.addTrack(t, stream);
//             } catch (e) {
//               console.warn("add/replace track error:", e);
//             }
//           });
//         }
//       })
//       .catch((e) => {
//         console.error("getUserMedia failed:", e);
//         setCamOn(false);
//         setMicOn(false);
//       });

//     // beforeunload to avoid accidental refresh during an active battle
//     const beforeUnload = (e) => {
//       if (isBattleActiveRef.current) {
//         e.preventDefault();
//         e.returnValue = "";
//         return "";
//       }
//       return undefined;
//     };
//     window.addEventListener("beforeunload", beforeUnload);

//     // cleanup
//     return () => {
//       try {
//         socket.emit("leave-room", { roomId, userId });
//       } catch (err) {}
//       socket.off("join-ack", handleJoinAck);
//       socket.off("room-state", handleRoomState);
//       socket.off("code-edit", handleCodeEdit);
//       socket.off("battle-started", handleBattleStarted);
//       socket.off("webrtc-offer", handleOffer);
//       socket.off("webrtc-answer", handleAnswer);
//       socket.off("webrtc-ice", handleIce);
//       socket.off("connect", onSocketConnect);

//       if (peerConnectionRef.current) {
//         try {
//           peerConnectionRef.current.close();
//         } catch (e) {}
//         peerConnectionRef.current = null;
//       }
//       if (localStreamRef.current) {
//         try {
//           localStreamRef.current.getTracks().forEach((t) => t.stop());
//         } catch (e) {}
//         localStreamRef.current = null;
//       }
//       pendingCandidatesRef.current = [];
//       remoteDescSetRef.current = false;
//       isBattleActiveRef.current = false;
//       window.removeEventListener("beforeunload", beforeUnload);
//     };
//     // eslint-disable-next-line
//   }, [roomId]);

//   // ---------- Helpers: fetch problem detail ----------

//   const fetchProblemById = async (prob) => {
//     // prob may be string id or { _id: id }

//     const fetchProblemById = async (prob) => {

//     let pid = prob;
//     if (prob && typeof prob === "object" && prob._id) pid = prob._id;
//     if (!pid) return;
//     try {
//       const token = localStorage.getItem("token");

//       const res = await axios.get(`${BASE_URL}/${pid}`, {
//         headers: { Authorization: ` ` },
//       });
//       const p = res.data?.problem ?? res.data;
//     if (p) {
//       setProblem(p);

//       // check for boilerplateCode first
//       const starter =
//         (p.boilerplateCode && p.boilerplateCode.javascript) ||
//         p.starterCode ||
//         p.boiler ||
//         p.boilerplate ||
//         p.template ||
//         p.defaultCode ||
//         "// Your Code Here";

//       setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));

//       //  // tell the other user about the boilerplate
//       // if (socket && roomId) {
//       //   socket.emit("code-init", { roomId, code: starter });
//       // }
//     }
//   } catch (e) {
//     console.error("fetchProblemById failed", e);
//   }
// };

//       const res = await axios.get(`${BASE_URL}/problems/${pid}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const p = res.data?.problem ?? res.data;
//       if (p) {
//         setProblem(p);
//         const starter =
//           p.starterCode || p.boiler || p.boilerplate || p.template || p.defaultCode || "";
//         setCodeUser1((prev) => (prev === "// Your Code Here" ? starter : prev));
//       }
//     } catch (e) {
//       console.error("fetchProblemById failed", e);
//     }
//   };
  


//   // ---------- Controls ----------
//   const toggleMic = () => {
//     const ls = localStreamRef.current;
//     if (!ls) return;
//     const audioTracks = ls.getAudioTracks();
//     if (!audioTracks || audioTracks.length === 0) {

//       // Try to acquire audio only
//       navigator.mediaDevices
//         .getUserMedia({ audio: true, video: false })
//         .then((s) => {
//           // add to streamRef

//       navigator.mediaDevices
//         .getUserMedia({ audio: true, video: false })
//         .then((s) => {

//           s.getAudioTracks().forEach((t) => {
//             try {
//               localStreamRef.current.addTrack(t);
//             } catch (e) {}
//           });

//           // set UI state


//           setMicOn(true);
//         })
//         .catch((err) => {
//           console.warn("getUserMedia(audio) failed", err);
//         });
//       return;
//     }
//     audioTracks.forEach((t) => (t.enabled = !t.enabled));
//     setMicOn(audioTracks[0].enabled);
//   };
//       const newAudioTrack = localStreamRef.current.getAudioTracks()[0];
//     if (peerConnectionRef.current && newAudioTrack) {
//       const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "audio");
//       try {
//         if (sender) sender.replaceTrack(newAudioTrack);
//         else peerConnectionRef.current.addTrack(newAudioTrack, localStreamRef.current);
//       } catch (e) {
//         console.warn("Failed to attach audio track to peerConnection:", e);
//       }
//     }







//   const toggleCam = async () => {
//     const ls = localStreamRef.current;
//     const videoTrack = ls?.getVideoTracks()?.[0];

//     if (videoTrack) {

//       // Stop and remove track to release camera (LED off)
//       try {
//         // Remove track from MediaStream so localVideo won't show frozen last frame

//       try {

//         if (typeof ls.removeTrack === "function") {
//           ls.removeTrack(videoTrack);
//         }
//         videoTrack.stop();
//       } catch (e) {
//         console.warn("Error stopping video track:", e);
//       }


//       // Replace sender's track with null (so remote stops receiving video)
//       try {
//         const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
//         if (sender) {
//           // Some browsers accept null/undefined to stop; else replace with an empty MediaStreamTrack (rare)

//       try {
//         const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
//         if (sender) {

//           try {
//             sender.replaceTrack(null);
//           } catch (err) {
//             console.warn("replaceTrack(null) failed", err);
//           }
//         }
//       } catch (e) {}

//       setCamOn(false);

//       // update local video element


//       if (localVideoRef.current) localVideoRef.current.srcObject = ls;
//       return;
//     }


//     // Camera is off — re-acquire camera track


//     try {
//       const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
//       const newVideoTrack = newStream.getVideoTracks()[0];
//       if (!localStreamRef.current) localStreamRef.current = new MediaStream();
//       try {
//         localStreamRef.current.addTrack(newVideoTrack);
//       } catch (e) {
//         console.warn("addTrack error:", e);
//       }
//       if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

//       // Replace sender track or add track


//       const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
//       if (sender) {
//         try {
//           await sender.replaceTrack(newVideoTrack);
//         } catch (e) {
//           console.warn("replaceTrack(newVideoTrack) failed", e);
//         }
//       } else if (peerConnectionRef.current) {
//         try {
//           peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
//         } catch (e) {}
//       }
//       setCamOn(true);
//     } catch (err) {
//       console.error("Re-acquiring camera failed", err);
//     }
//   };

//   const handleScreenShare = async () => {
//     try {
//       const pc = peerConnectionRef.current;
//       if (!pc) return;
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//       const screenTrack = screenStream.getVideoTracks()[0];
//       const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
//       if (sender) {
//         await sender.replaceTrack(screenTrack);
//       } else {

//         // fallback: add track
//         pc.addTrack(screenTrack, screenStream);
//       }
//       // Show local preview (optional) by setting local video to screen stream
//       if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

//       screenTrack.onended = async () => {
//         // restore original camera track if present

//         pc.addTrack(screenTrack, screenStream);
//       }
//       if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

//       screenTrack.onended = async () => {

//         const original = localStreamRef.current?.getVideoTracks()?.[0];
//         if (sender && original) {
//           try {
//             await sender.replaceTrack(original);
//             if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
//           } catch (e) {
//             console.warn("Failed to restore original track after screenshare", e);
//           }
//         } else if (localVideoRef.current) {

//           // restore local preview to camera stream if available


//           localVideoRef.current.srcObject = localStreamRef.current;
//         }
//       };
//     } catch (err) {
//       console.error("Screen share error", err);
//     }
//   };
//   const handleExit = async () => {
//   const ok = window.confirm("Leave battle and return to waiting room?");
//   if (!ok) return;
//   await doExit();
// };
//   // Send "leave" and cleanup, then navigate to waiting room
//   const doExit = async () => {
//   try {
//     socket.emit("leave-room", { roomId, userId });
//   } catch (e) {}
//   if (peerConnectionRef.current) {
//     try {
//       peerConnectionRef.current.close();
//     } catch (e) {}
//     peerConnectionRef.current = null;
//   }
//   if (localStreamRef.current) {
//     try {
//       localStreamRef.current.getTracks().forEach((t) => t.stop());
//     } catch (e) {}
//     localStreamRef.current = null;
//   }
//   isBattleActiveRef.current = false;
//   navigate(`/dashboard`);
// };

//   // Editor handlers
//   const onEditorChange = (val) => {
//     const v = val ?? "";
//     setCodeUser1(v);
//     sendCodeEdit(v);
//   };



//   // Send "leave" and cleanup, then navigate to waiting room
//   const handleExit = async () => {
//     const ok = window.confirm("Leave battle and return to waiting room?");
//     if (!ok) return;
//     try {
//       socket.emit("leave-room", { roomId, userId });
//     } catch (e) {}
//     if (peerConnectionRef.current) {
//       try {
//         peerConnectionRef.current.close();
//       } catch (e) {}
//       peerConnectionRef.current = null;
//     }
//     if (localStreamRef.current) {
//       try {
//         localStreamRef.current.getTracks().forEach((t) => t.stop());
//       } catch (e) {}
//       localStreamRef.current = null;
//     }
//     isBattleActiveRef.current = false;
//     navigate(`/waitingroom/${roomId}`);
//   };

//   // Editor handlers
//   const onEditorChange = (val) => {
//     const v = val ?? "";
//     setCodeUser1(v);
//     sendCodeEdit(v);
//   };


//   // Render
//   return (
//     <div className="bg-gradient-to-br from-[#0f0f0f] to-black min-h-screen p-6 text-white space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div className="flex gap-3">
//           <button onClick={toggleMic} className="bg-gray-800 hover:bg-gray-700 p-2 rounded">
//             {micOn ? <Mic /> : <MicOff />}
//           </button>
//           <button onClick={toggleCam} className="bg-gray-800 hover:bg-gray-700 p-2 rounded">
//             {camOn ? <Video /> : <VideoOff />}
//           </button>
//           <button onClick={handleScreenShare} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded">
//             <ScreenShare />
//           </button>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2 text-teal-400 text-xl font-bold">
//             <Clock /> {formatTime(timer)}
//           </div>
//           <button onClick={handleExit} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded flex items-center gap-2">
//             <LogOut size={16} /> Exit
//           </button>
//         </div>
//       </div>

//       {/* Problem */}
//       <div className="bg-zinc-900 rounded-lg p-4 shadow">
//         <h2 className="text-2xl font-bold text-teal-300 mb-2">{problem?.title || "Loading Problem..."}</h2>
//         <p className="whitespace-pre-line text-zinc-300">{problem?.description || "Loading..."}</p>
//         {problem?.examples && (
//           <div className="mt-4 text-sm bg-zinc-800 p-3 rounded">
//             <h4 className="text-purple-400 font-semibold mb-1">Example:</h4>
//             <pre>{problem.examples && problem.examples.map((ex, idx) => (
//   <pre key={idx}>
//     Input: {JSON.stringify(ex.input)}
//     {"\n"}
//     Output: {JSON.stringify(ex.output)}
//   </pre>
// ))}</pre>
//           </div>
//         )}
//       </div>

//       {/* Video */}
//       <div className="flex gap-6 justify-center items-center">
//         <div className="text-center animate-fade-in">
//           <p className="mb-1 text-sm text-zinc-400">You</p>
//           <video ref={localVideoRef} autoPlay muted playsInline className="w-40 h-28 bg-black rounded-xl" />
//         </div>
//         <div className="text-center animate-fade-in">
//           <p className="mb-1 text-sm text-zinc-400">Opponent</p>
//           <video ref={remoteVideoRef} autoPlay playsInline className="w-40 h-28 bg-black rounded-xl" />
//         </div>
//       </div>

//       {/* Editors */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-zinc-900 rounded-lg p-2 shadow">
//           <h3 className="text-cyan-400 font-semibold mb-1">Your Editor</h3>
//           <Editor
//             height="300px"
//             language="javascript"
//             theme="vs-dark"
//             value={codeUser1}
//             onChange={(val) => onEditorChange(val)}
//             options={{ automaticLayout: true }}
//           />
//           <button
//             className="mt-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"

//        onClick={async () => {
//           try {
//             const token = localStorage.getItem("token");
//             const res = await axios.post(
//               `${BASE_URL}/battle/run`,
//               {
//                 user_id: userId,
//                 room_id: roomId,
//                 code: codeUser1,
//                 language,
//               },
//               { headers: { Authorization: `Bearer ${token}` } }
//             );
//             alert(res.data.msg + "\nOutput: " + res.data.actual);
//           } catch (err) {
//             alert("Run failed: " + (err.response?.data?.msg || err.message));
//           }
//         }}
//                   >

//             onClick={() => {
//               console.log("Run pressed - implement run endpoint");
//             }}
//           >

//             <Play size={18} /> Run
//           </button>
//            <button
//             className="mt-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"
//             onClick={async () => {
//   try {
//     const token = localStorage.getItem("token");
//     const res = await axios.post(
//       `${BASE_URL}/battle/submit`,
//       {
//         user_id: userId,
//         room_id: roomId,
//         code: codeUser1,
//         language,
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     alert(res.data.msg + "\nStatus: " + res.data.status);
//   } catch (err) {
//     alert("Submit failed: " + (err.response?.data?.msg || err.message));
//   }
// }} >
//       <Play size={18} /> submit 
//           </button>
          
//         </div>
//         <div className="bg-zinc-900 rounded-lg p-2 shadow">
//           <h3 className="text-fuchsia-400 font-semibold mb-1">Opponent's Editor</h3>
//           <Editor height="300px" language="javascript" theme="vs-dark" value={codeUser2} options={{ readOnly: true, automaticLayout: true }} />
//         </div>
//       </div>
//     </div>
//   );
// };
   

// export default RoomPage;