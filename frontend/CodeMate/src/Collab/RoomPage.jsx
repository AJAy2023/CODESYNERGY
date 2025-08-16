import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "./socket";
import { Mic, MicOff, Video, VideoOff, ScreenShare, Clock, Play } from "lucide-react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { BASE_URL } from "../api/config";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [codeUser1, setCodeUser1] = useState("// Your Code Here");
  const [codeUser2, setCodeUser2] = useState("// Opponent's Code");
  const [problem, setProblem] = useState(null);
  const [timer, setTimer] = useState(15 * 60); // 15 minutes

  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    socket.emit("join-room", { roomId, userId });

    // Fetch problem
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProblem(res.data.room.problem);
      } catch (err) {
        console.error("Problem fetch failed", err.message);
      }
    };
    fetchProblem();

    // Get media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

      socket.on("battle-started", ({ starterId }) => {
      const myUserId = localStorage.getItem("userId");
      console.log("battle-started received:", starterId, "me:", myUserId);

      if (String(starterId) === String(myUserId)) {
        console.log("I am the starter → creating offer");
        startCall(myUserId);
      } else {
        console.log("I am participant → waiting for offer");
      }
    });

    socket.on("webrtc-offer", async ({ sdp, from }) => {
      peerConnectionRef.current = new RTCPeerConnection(config);
      addTracks();

      peerConnectionRef.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        sdp: answer,
        to: from,
        roomId,
      });
    });

    socket.on("webrtc-answer", async ({ sdp }) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      if (candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("ICE candidate error", e);
        }
      }
    });

    return () => {
      socket.emit("leave-room", { roomId, userId });
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId]);

  const addTracks = () => {
    localStreamRef.current.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStreamRef.current);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", {
          candidate: event.candidate,
          roomId,
        });
      }
    };
  };

  const startCall = async (userId) => {
    peerConnectionRef.current = new RTCPeerConnection(config);
    addTracks();

    peerConnectionRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      sdp: offer,
      roomId,
      from: userId,
    });
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()
      .find((track) => track.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()
      .find((track) => track.kind === "video");
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
      screenTrack.onended = () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        if (sender) sender.replaceTrack(originalTrack);
      };
    } catch (err) {
      console.error("Screen share error", err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0f0f0f] to-black min-h-screen p-6 text-white space-y-6">
      {/* Header - Timer and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button onClick={toggleMic} className="bg-gray-800 hover:bg-gray-700 p-2 rounded">
            {micOn ? <Mic /> : <MicOff />}
          </button>
          <button onClick={toggleCam} className="bg-gray-800 hover:bg-gray-700 p-2 rounded">
            {camOn ? <Video /> : <VideoOff />}
          </button>
          <button onClick={handleScreenShare} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded">
            <ScreenShare />
          </button>
        </div>
        <div className="flex items-center gap-2 text-teal-400 text-xl font-bold">
          <Clock /> {formatTime(timer)}
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-zinc-900 rounded-lg p-4 shadow">
        <h2 className="text-2xl font-bold text-teal-300 mb-2">{problem?.title || "Loading Problem..."}</h2>
        <p className="whitespace-pre-line text-zinc-300">{problem?.description || "Loading..."}</p>
        {problem?.examples && (
          <div className="mt-4 text-sm bg-zinc-800 p-3 rounded">
            <h4 className="text-purple-400 font-semibold mb-1">Example:</h4>
            <pre>{problem.examples}</pre>
          </div>
        )}
      </div>

      {/* Video Section - Small and Side-by-Side */}
      <div className="flex gap-6 justify-center items-center">
        <div className="text-center animate-fade-in">
          <p className="mb-1 text-sm text-zinc-400">You</p>
          <video ref={localVideoRef} autoPlay muted className="w-40 h-28 bg-black rounded-xl" />
        </div>
        <div className="text-center animate-fade-in">
          <p className="mb-1 text-sm text-zinc-400">Opponent</p>
          <video ref={remoteVideoRef} autoPlay className="w-40 h-28 bg-black rounded-xl" />
        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-lg p-2 shadow">
          <h3 className="text-cyan-400 font-semibold mb-1">Your Editor</h3>
          <Editor
            height="300px"
            language="javascript"
            theme="vs-dark"
            value={codeUser1}
            onChange={(val) => setCodeUser1(val)}
          />
          <button className="mt-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded flex items-center gap-2">
            <Play size={18} /> Run
          </button>
        </div>
        <div className="bg-zinc-900 rounded-lg p-2 shadow">
          <h3 className="text-fuchsia-400 font-semibold mb-1">Opponent's Editor</h3>
          <Editor
            height="300px"
            language="javascript"
            theme="vs-dark"
            value={codeUser2}
            options={{ readOnly: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
