import { useEffect, useRef, useState } from "react"; 
import { useParams, useNavigate, useLocation } from "react-router-dom"; 
import socket from "./socket"; // Socket.io connection for real-time communication
import { Mic, MicOff, Video, VideoOff, ScreenShare, LogOut, Clock, Code, Swords, User, Play, Sparkles, Terminal, Loader2, Send } from "lucide-react"; // Icons for UI
import Editor from "@monaco-editor/react"; // Monaco code editor
import axios from "axios"; // HTTP client
import { BASE_URL } from "../api/config"; // API base URL

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const localVideoRef = useRef(null); 
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); 

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const peerIdRef = useRef(null);
  const streamReadyRef = useRef(false);
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
  const [problem, setProblem] = useState(location.state?.problem || null);
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

  // Helper to extract boilerplate code from problem
  const extractBoilerplate = (p, lang = "javascript") => {
    if (!p) return "// Your Code Here";
    const bp = p.boilerplateCode || p.starterCode || p.boiler || p.boilerplate || p.template || p.defaultCode;
    if (!bp) return "// Your Code Here";
    if (typeof bp === "string") return bp;
    if (typeof bp.get === "function") return bp.get(lang) || bp.get("javascript") || "// Your Code Here";
    if (typeof bp === "object") return bp[lang] || bp["javascript"] || "// Your Code Here";
    return "// Your Code Here";
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

  // Timer countdown effect - ticks ONLY when problem statement is loaded!
  useEffect(() => {
    if (!problem || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        localStorage.setItem(TIMER_KEY, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, TIMER_KEY, problem]);

  // Update boilerplate when language or problem changes
  useEffect(() => {
    if (!problem) return;
    const starter = extractBoilerplate(problem, language);
    setCodeUser1((prev) => (prev === "// Your Code Here" || !prev ? starter : prev));
  }, [language, problem]);

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
      const targetStream = stream || new MediaStream([event.track].filter(Boolean));

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = targetStream;
        remoteVideoRef.current.play().catch((err) => console.warn("Remote video play error:", err));
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = targetStream;
        remoteAudioRef.current.play().catch((err) => console.warn("Remote audio play error:", err));
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

  // Code Execution states
  const [runningSample, setRunningSample] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showConsole, setShowConsole] = useState(false);
  const [battleWinnerModal, setBattleWinnerModal] = useState(null);
  const [opponentLeftNotice, setOpponentLeftNotice] = useState(null);

  // 1. Run Sample Code (Quick Test Case)
  const handleRunSampleCode = async () => {
    if (runningSample) return;
    setRunningSample(true);
    setShowConsole(true);
    setExecutionResult({ status: "running", msg: "Running sample test case..." });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/battle/run`,
        {
          user_id: userId,
          room_id: roomId,
          code: codeUser1,
          language: language,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;
      if (data.msg === "Run successful") {
        setExecutionResult({
          status: "success",
          msg: "✅ Sample Test Case Passed!",
          output: `Input: ${JSON.stringify(data.input)}\nExpected: ${JSON.stringify(data.expected)}\nActual: ${data.actual}`,
        });
      } else {
        setExecutionResult({
          status: "error",
          msg: data.msg || "Sample Test Case Failed",
          output: data.error || `Input: ${JSON.stringify(data.input)}\nExpected: ${JSON.stringify(data.expected)}\nActual: ${data.actual}`,
        });
      }
    } catch (err) {
      setExecutionResult({
        status: "error",
        msg: err.response?.data?.msg || err.message || "Run failed",
        output: err.response?.data?.error || "Error running code.",
      });
    } finally {
      setRunningSample(false);
    }
  };

  // 2. Submit Final Battle Solution (All Hidden Test Cases + Win Condition)
  const handleSubmitCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConsole(true);
    setExecutionResult({ status: "running", msg: "Evaluating all hidden test cases..." });

    try {
      const token = localStorage.getItem("token");
      let res;
      try {
        res = await axios.post(
          `${BASE_URL}/battle/submit`,
          {
            user_id: userId,
            room_id: roomId,
            code: codeUser1,
            language: language,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        res = await axios.post(
          `${BASE_URL}/submit`,
          {
            userId,
            problemId: problem?._id,
            code: codeUser1,
            language: language,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const data = res.data;
      if (data.user) {
        localStorage.setItem("userData", JSON.stringify(data.user));
      }

      if (data.msg === "All test cases passed!" || data.passed || data.status === "Accepted") {
        setExecutionResult({
          status: "success",
          msg: "🎉 ALL HIDDEN TEST CASES PASSED!",
          output: data.output || "Code passed all test cases. Checking victory status...",
        });
        socket.emit("battle-submitted", { roomId, userId, code: codeUser1 });

        if (data.winner) {
          const isWinner = String(data.winner) === String(userId);
          setBattleWinnerModal({
            isWinner,
            winnerId: data.winner,
            message: isWinner
              ? "🏆 VICTORY! You solved all hidden test cases first and won the battle!"
              : "💔 DEFEATED! Your opponent solved the problem first.",
          });
        }
      } else {
        setExecutionResult({
          status: "error",
          msg: data.msg || data.message || "Hidden test case failed.",
          output: data.failedCase ? JSON.stringify(data.failedCase, null, 2) : (data.output || data.error || "Test case output mismatch."),
        });
      }
    } catch (err) {
      console.error("Submit code error:", err);
      setExecutionResult({
        status: "error",
        msg: err.response?.data?.msg || err.response?.data?.message || err.message || "Execution error.",
        output: err.response?.data?.error || (err.response?.data?.raw ? JSON.stringify(err.response.data.raw, null, 2) : null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle battle result real-time event & show Victory / Defeat Modal
  useEffect(() => {
    const handleBattleResult = ({ winner, submissions, message }) => {
      if (winner) {
        const isWinner = String(winner) === String(userId);
        setBattleWinnerModal({
          isWinner,
          winnerId: winner,
          message: message || (isWinner ? "Congratulations! You submitted the correct solution first." : "Your opponent submitted the correct solution first."),
        });
      }
    };
    socket.on("battle-result", handleBattleResult);
    return () => socket.off("battle-result", handleBattleResult);
  }, [userId]);

  // Main effect for socket and media setup
  useEffect(() => {
    // Socket event handlers
    const handleJoinAck = (data) => {
      console.log("join-room ack", data);
    };

    const checkAndSetWinner = (wId, msg) => {
      if (!wId) return;
      const isWinner = String(wId) === String(userId);
      setBattleWinnerModal({
        isWinner,
        winnerId: wId,
        message: msg || (isWinner ? "🏆 VICTORY! You solved all hidden test cases first and won the battle!" : "💔 DEFEATED! Your opponent solved the problem first."),
      });
    };

    const handleRoomState = async (state) => {
      if (!state) return;

      if (state?.winnerId) {
        checkAndSetWinner(state.winnerId);
      }

      // Load problem
      if (state?.problem) {
        if (typeof state.problem === "string" || typeof state.problem === "number") {
          await fetchProblemById(state.problem);
        } else if (typeof state.problem === "object") {
          setProblem(state.problem);
          const starter = extractBoilerplate(state.problem, language);
          setCodeUser1((prev) => (prev === "// Your Code Here" || !prev ? starter : prev));
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
        const starter = extractBoilerplate(p, language);
        setCodeUser1((prev) => (prev === "// Your Code Here" || !prev ? starter : prev));
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

    const handleUserLeft = ({ userId: leftId, username }) => {
      if (String(leftId) === String(userId)) return;
      setOpponentLeftNotice(`⚠️ ${username || "Opponent"} has left the battle.`);
      setTimeout(() => setOpponentLeftNotice(null), 4000);
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch {}
        peerConnectionRef.current = null;
      }
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    };

    // Attach socket listeners
    socket.emit("join-room", { roomId, userId });
    socket.on("join-ack", handleJoinAck);
    socket.on("room-state", handleRoomState);
    socket.on("room-updated", (data) => {
      if (data?.winnerId) checkAndSetWinner(data.winnerId);
    });
    socket.on("code-edit", handleCodeEdit);
    socket.on("battle-started", handleBattleStarted);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice", handleIce);
    socket.on("user-left", handleUserLeft);
    socket.on("peer-left", handleUserLeft);

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
        if (room?.winnerId) {
          checkAndSetWinner(room.winnerId);
        }
        if (room?.problem) {
          if (typeof room.problem === "object" && room.problem.title) {
            setProblem(room.problem);
            const starter = extractBoilerplate(room.problem, language);
            setCodeUser1((prev) => (prev === "// Your Code Here" || !prev ? starter : prev));
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
        const starter = extractBoilerplate(p, language);
        setCodeUser1((prev) => (prev === "// Your Code Here" || !prev ? starter : prev));
      }
    } catch (e) {
      console.error("fetchProblemById failed", e);
    }
  };

  // Toggle microphone
  const toggleMic = async () => {
    let ls = localStreamRef.current;
    let audioTrack = ls?.getAudioTracks()?.[0];

    // If audio track is missing or stopped, acquire microphone stream from browser
    if (!audioTrack || audioTrack.readyState === "ended") {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        audioTrack = audioStream.getAudioTracks()[0];
        if (!localStreamRef.current) localStreamRef.current = new MediaStream();
        localStreamRef.current.addTrack(audioTrack);
        ls = localStreamRef.current;
      } catch (err) {
        console.error("Acquiring microphone failed:", err);
        setMicOn(false);
        return;
      }
    }

    // Toggle track enabled state
    const nextState = !audioTrack.enabled;
    audioTrack.enabled = nextState;
    setMicOn(nextState);

    // Update WebRTC peer connection audio sender
    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "audio");
      try {
        if (sender) {
          await sender.replaceTrack(audioTrack);
        } else {
          pc.addTrack(audioTrack, ls);
        }
      } catch (e) {
        console.warn("Failed to attach audio track to peerConnection:", e);
      }
    }
  };

  // Toggle camera
  const toggleCam = async () => {
    let ls = localStreamRef.current;
    let videoTrack = ls?.getVideoTracks()?.[0];

    if (camOn && videoTrack) {
      try {
        videoTrack.enabled = false;
        videoTrack.stop();
        if (typeof ls.removeTrack === "function") ls.removeTrack(videoTrack);
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(null);
          } catch (err) {
            console.warn("replaceTrack(null) failed", err);
          }
        }
      } catch (e) {
        console.warn("Error stopping video track:", e);
      }
      setCamOn(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = ls;
      socket.emit("cam-toggled", { roomId, userId, camOn: false });
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      localStreamRef.current.addTrack(newVideoTrack);
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
      socket.emit("cam-toggled", { roomId, userId, camOn: true });
    } catch (err) {
      console.error("Re-acquiring camera failed", err);
      setCamOn(false);
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

  // Render the UI with Dark Glassmorphism Design & Responsive Layout
  return (
    <div className="min-h-screen bg-[#050B16] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {opponentLeftNotice && (
        <div className="bg-amber-500/20 text-amber-300 border-b border-amber-500/40 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{opponentLeftNotice}</span>
          <button onClick={() => setOpponentLeftNotice(null)} className="text-amber-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-[#06b6d4]">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Battle Arena</div>
            <div className="text-xs sm:text-sm font-mono text-slate-300">Room: <span className="text-white font-bold">{roomId}</span></div>
          </div>
        </div>

        {/* Center Control Dock: Timer + Media Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Countdown Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs sm:text-sm shadow-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{problem ? formatTime(timer) : "Waiting for problem..."}</span>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {/* Media & Screen Share Controls */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 p-1 rounded-full shadow-inner">
            <button
              onClick={toggleMic}
              className={`p-1.5 rounded-full transition cursor-pointer ${micOn ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-rose-600/20 text-rose-400 border border-rose-500/40"}`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleCam}
              className={`p-1.5 rounded-full transition cursor-pointer ${camOn ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-rose-600/20 text-rose-400 border border-rose-500/40"}`}
              title={camOn ? "Turn Off Camera" : "Turn On Camera"}
            >
              {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={handleScreenShare}
              className="p-1.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 transition cursor-pointer"
              title="Share Screen"
            >
              <ScreenShare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={doExit}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-semibold text-xs transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Battle</span>
        </button>
      </header>

      {/* Main Grid Workbench */}
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden">
        {/* Left Panel: Problem Statement & Video Feeds */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-none lg:max-h-[calc(100vh-90px)] shadow-xl">
          <div className="space-y-4">
            {problem ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase">
                    {problem.difficulty || "Medium"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {problem._id ? String(problem._id).substring(0, 8) : "—"}</span>
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3">
                  {problem.title}
                </h2>
                <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                  {problem.description || "No description available."}
                </div>

                {problem.examples && problem.examples.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Examples</h4>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs font-mono space-y-1">
                        <div><span className="text-slate-400">Input:</span> <span className="text-white">{ex.input}</span></div>
                        <div><span className="text-slate-400">Output:</span> <span className="text-emerald-400">{ex.output}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 py-10">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm">Loading Problem Statement...</p>
              </div>
            )}
          </div>

          {/* Live Video Cameras Section (Placed on Left Side directly below problem statement) */}
          <div className="mt-5 pt-4 border-t border-white/10 shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              <span>Live Battle Cameras</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Local Video */}
              <div className="h-28 rounded-xl overflow-hidden border border-cyan-500/40 bg-zinc-950 relative shadow-inner">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] text-cyan-300 font-mono font-bold">You</span>
              </div>
              {/* Remote Video & Dedicated Audio */}
              <div className="h-28 rounded-xl overflow-hidden border border-purple-500/40 bg-zinc-950 relative shadow-inner">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] text-purple-300 font-mono font-bold">Opponent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Single Code Editor & Execution Controls */}
        <div className="lg:col-span-8 flex flex-col flex-1 h-full max-h-none lg:max-h-[calc(100vh-90px)]">
          {/* Your Editor */}
          <div className="bg-zinc-900/60 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 flex flex-col flex-1 shadow-xl overflow-hidden min-h-[420px] lg:min-h-0">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Your Code Workbench</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase bg-black/40 px-2 py-0.5 rounded border border-white/10">{language}</span>
                {/* Run Sample Code Button */}
                <button
                  onClick={handleRunSampleCode}
                  disabled={runningSample || submitting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold text-xs border border-white/10 shadow transition cursor-pointer disabled:opacity-60"
                  title="Run sample test case"
                >
                  {runningSample ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />}
                  <span>{runningSample ? "Testing..." : "Run Code"}</span>
                </button>
                {/* Submit Solution Button */}
                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || runningSample}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-400 hover:opacity-90 text-black font-bold text-xs shadow transition cursor-pointer disabled:opacity-60"
                  title="Submit solution for evaluation"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{submitting ? "Evaluating..." : "Submit Solution"}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-white/10 min-h-[300px]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={codeUser1}
                onChange={(value) => {
                  setCodeUser1(value || "");
                  sendCodeEdit(value || "");
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Collapsible Execution Output Console Drawer */}
            {showConsole && (
              <div className="mt-2.5 p-3 rounded-xl bg-black/70 border border-white/10 text-xs font-mono shrink-0 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-bold flex items-center gap-1.5 ${executionResult?.status === 'success' ? 'text-emerald-400' : executionResult?.status === 'error' ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {(executionResult?.status === 'running') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {executionResult?.msg || "Console Output"}
                  </span>
                  <button onClick={() => setShowConsole(false)} className="text-slate-400 hover:text-white text-[10px] uppercase font-bold cursor-pointer">Close</button>
                </div>
                {executionResult?.output && (
                  <pre className="text-slate-300 bg-zinc-950/90 p-2 rounded border border-white/10 overflow-x-auto text-[11px] font-mono whitespace-pre-wrap">
                    {executionResult.output}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Victory 🎉 / Defeat 💔 Modal Overlay */}
      {battleWinnerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl text-center space-y-5 ${battleWinnerModal.isWinner ? 'bg-gradient-to-b from-emerald-950/80 to-zinc-950 border-emerald-500/40' : 'bg-gradient-to-b from-rose-950/80 to-zinc-950 border-rose-500/40'}`}>
            <div className="text-6xl animate-bounce">
              {battleWinnerModal.isWinner ? "🏆" : "💔"}
            </div>

            <div className="space-y-2">
              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-wider ${battleWinnerModal.isWinner ? 'bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400' : 'text-rose-400'}`}>
                {battleWinnerModal.isWinner ? "VICTORY!" : "DEFEAT"}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {battleWinnerModal.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-slate-400 space-y-1">
              <div>Winner ID: <span className="text-white font-bold">{battleWinnerModal.winnerId}</span></div>
              <div>Room Code: <span className="text-cyan-400 font-bold">{roomId}</span></div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className={`w-full py-3 rounded-xl font-bold text-sm transition cursor-pointer shadow-lg ${battleWinnerModal.isWinner ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-black hover:opacity-90' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
